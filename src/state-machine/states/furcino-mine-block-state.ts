import { StateBehavior } from 'mineflayer-statemachine';
import { Bot } from 'mineflayer';

import { Targets } from '../data/data';

export class BehaviorFurcinoMineBlock implements StateBehavior {
    stateName: string = 'furcinoMineBlock';
    active: boolean = false;
    targets: Targets;
    bot: Bot;
    /**
     * The list of block ids to search for.
     */
    blocks: number[] = [];
    /**
     * The maximum distance away to look for the block.
     */
    maxDistance = 10;
    forceTransition: boolean = false;

    constructor(bot: Bot, targets: Targets) {
        this.targets = targets;
        this.bot = bot;
    }

    /**
     * Called each tick to update this behavior.
     */
    async update() {
    }
    
    /**
     * Called when the bot enters this behavior state.
     */
    async onStateEntered() {
        this.targets.forceTransition = false;

        this.chopWoodUntilFinished();
    }
    
    /**
     * Called when the bot leaves this behavior state.
     */
    onStateExited() {
    }

    matchesBlock(block: any) {
        if (this.blocks.indexOf(block.type) === -1)
            return false;
        return true;
    }

    async chopWoodUntilFinished() {
        const block: any = this.bot.findBlock({
            point: this.bot.entity.position,
            matching: (block: any) => this.matchesBlock(block),
            maxDistance: this.maxDistance
        });

        if (block && block.position) {
        await this.bot.lookAt(block.position);
            if (this.bot.canDigBlock(block)) {
                await this.bot.dig(block, true);
            }
        }

        this.targets.forceTransition = true;
    }
    
}
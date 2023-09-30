import { StateBehavior } from 'mineflayer-statemachine';
import { Bot } from 'mineflayer';
import { Vec3 } from "vec3";

import { Targets } from '../data/data';

export class BehaviorFurcinoFindBlock implements StateBehavior {
    stateName: string = 'furcinoFindBlock';
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
    maxDistance = 128;

    constructor(bot: Bot, targets: Targets) {
        this.targets = targets;
        this.bot = bot;
    }

    /**
     * Called each tick to update this behavior.
     */
    update(): void {
    }
    
    /**
     * Called when the bot enters this behavior state.
     */
    onStateEntered() {
        this.targets.unreachableTargets = this.targets.unreachableTargets.filter(ut => ut.distanceTo(this.bot.entity.position) <= 100);
        this.targets.forceTransition = false;

        const block: any = this.bot.findBlock({
            matching: (block: any) => this.matchesBlock(block),
            maxDistance: this.maxDistance
        });

        if (block && block.position) {
            this.targets.targetFound = true;
            this.targets.position = block.position;
        } else {
            this.targets.targetFound = false;
            this.targets.position = undefined;
        }
    }
    
    /**
     * Called when the bot leaves this behavior state.
     */
    onStateExited() {
    }

    matchesBlock(block: any) {
        if (this.blocks.indexOf(block.type) === -1)
            return false;

        if (block && block.position && this.targets.unreachableTargets.find((ut: Vec3) => ut.equals(block.position)))
            return false;
            
        return true;
    }
}
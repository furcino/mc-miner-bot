import { IndexedData } from "minecraft-data";
import { Bot, FindBlockOptions } from "mineflayer";
import { BehaviorIdle, NestedStateMachine, StateBehavior, StateTransition } from "mineflayer-statemachine";
import { Targets, getBlockIdsForNames, nonPlacableBlocks } from "../data/data";
import { Vec3 } from "vec3";

export class BehaviorFurcinoCraftPickaxe implements StateBehavior {
    stateName: string = 'craftingPickaxe';
    active: boolean = false;
    targets: Targets;
    bot: Bot;
    mcData: IndexedData;

    constructor(bot: Bot, targets: Targets, mcData: IndexedData) {
        this.targets = targets;
        this.bot = bot;
        this.mcData = mcData;
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
        this.craftPickaxe().then(crafted => {
            this.bot.chat('I have my pickaxe!');
        }).catch((err) => {
            console.log(err);
        })
    }
    
    /**
     * Called when the bot leaves this behavior state.
     */
    onStateExited() {
    }

    async craftPickaxe(): Promise<void> {
        if (this.bot.inventory.count(this.mcData.itemsByName['oak_planks'].id, null) < 24) {
            const recipe = this.bot.recipesFor(this.mcData.itemsByName['oak_planks'].id, 24, null, null)[0];
            await this.bot.craft(recipe, 24);
            console.log('made planks: ' + this.bot.inventory.count(this.mcData.itemsByName['oak_planks'].id, null));
        }
        if (this.bot.inventory.count(this.mcData.itemsByName['stick'].id, null) < 12) {
            const recipe = this.bot.recipesFor(this.mcData.itemsByName['stick'].id, 8, null, null)[0];
            await this.bot.craft(recipe, 12);
            console.log('made sticks: ' + this.bot.inventory.count(this.mcData.itemsByName['stick'].id, null));
        }
        if (this.bot.inventory.count(this.mcData.itemsByName['crafting_table'].id, null) < 3) {
            const recipe = this.bot.recipesFor(this.mcData.itemsByName['crafting_table'].id, 3, null, null)[0];
            await this.bot.craft(recipe, 3);
            console.log('made crafting tables:' + this.bot.inventory.count(this.mcData.itemsByName['crafting_table'].id, null));
        }

        if (this.bot.inventory.count(this.mcData.itemsByName['wooden_pickaxe'].id, null) < 2) {
            let cTable = await this.placeCraftingTable();
            if (cTable == null) {
                throw new Error('Could not place Crafting table!');
            }
            const recipe = this.bot.recipesFor(this.mcData.itemsByName['wooden_pickaxe'].id, 1, null, cTable)[0];
            await this.bot.craft(recipe, 2, cTable);
            console.log('made a pickaxe');
        }
        
        const pickaxe = this.bot.inventory.findInventoryItem(this.mcData.itemsByName['wooden_pickaxe'].id, null, false);
        if (pickaxe != null) {
            await this.bot.equip(pickaxe, "hand");
        } else {
            throw Error('No pickaxe found to equip.');
        }

        return;
    }

    async placeCraftingTable(): Promise<any> {
        console.log('searching for existing crafting tables with id ' + this.mcData.blocksByName['crafting_table'].id);
        let table = this.bot.findBlock({
            matching: this.mcData.blocksByName['crafting_table'].id,
            maxDistance: 5,
        } as FindBlockOptions);

        if (table) {
            console.log('returning existing crafting table coordinates');
            return table;
        }

        let block = findBlockToPlaceStuffOn(this.bot, this.mcData);

        if (block != null) {
            this.bot.lookAt(block?.position!, true);

            const cTable = this.bot.inventory.findInventoryItem(this.mcData.itemsByName['crafting_table'].id, null, false);
            if (cTable != null) {
                await this.bot.equip(cTable, "hand");

                console.log('placing crafting table')

                await this.bot.placeBlock(block, new Vec3(0, 1, 0));

                console.log('returning new crafting table coordinates');

                return this.bot.blockAt(block.position.offset(0, 1, 0));
            }
        }

        return null;
    }
}

export function craftPickaxeMachine(bot: Bot, targets: Targets, mcData: IndexedData): NestedStateMachine {
    
    const idleState = new BehaviorIdle();
    const craftPickaxe = new BehaviorFurcinoCraftPickaxe(bot, targets, mcData);

    const transitions = [

        new StateTransition({ // look for wood
            name: 'startCraftingPickaxe',
            parent: idleState,
            child: craftPickaxe,
            shouldTransition: () => true,
        }),

    ]

    return new NestedStateMachine(transitions, idleState);
}

export function findBlockToPlaceStuffOn(bot: Bot, mcData: IndexedData): any {
    let distance = 5; 
    for (let x = -distance; x <= distance; x++) {
        for (let y = -distance; y <= distance; y++) {
            for (let z = -distance; z <= distance; z++) {
                const block = bot.blockAt(addVectors(bot.entity.position, new Vec3(x, y, z)));
                if (block &&
                    block.position.distanceTo(bot.entity.position) < 4 &&
                    block.position.distanceTo(bot.entity.position) >= 2 &&
                    getBlockIdsForNames(nonPlacableBlocks, mcData).find((id) => id === block.type) === undefined && 
                    bot.blockAt(block.position.offset(0, 1, 0))?.type === mcData.blocksByName['air'].id) {
                    console.log('found placable block of type ' + mcData.blocksArray[block.type].name)
                    console.log(bot.entity.position);
                    console.log(block.position);
                    return bot.blockAt(block.position);
                }
            }
        }
    }
    
    return null;
}

export function addVectors(v1:Vec3, v2:Vec3) {
    return new Vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}
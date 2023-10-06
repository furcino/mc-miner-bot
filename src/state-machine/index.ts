import {
    globalSettings,
    StateTransition,
    BotStateMachine,
    EntityFilters,
    BehaviorIdle,
    NestedStateMachine, 
    StateMachineWebserver,
} from 'mineflayer-statemachine';
import { Bot } from 'mineflayer';
import { IndexedData, Item } from 'minecraft-data';
import { Targets } from './data/data';
import { collectWoodMachine } from './state-machines/collect-wood-machine';
import { craftPickaxeMachine } from './state-machines/craft-pickaxe-machine';

export class StateMachineWrapper {

    private mcData: IndexedData;
    
    private idleState: BehaviorIdle;

    private collectWood: NestedStateMachine;
    private craftPickaxe: NestedStateMachine;

    private entityFilters: any;
    private transitions: StateTransition[];
    private targets: Targets;
    private stateMachine: BotStateMachine;
    

    constructor(bot: Bot, mcData: IndexedData) {
        globalSettings.debugMode = true;
        this.mcData = mcData;
        this.targets = {
            unreachableTargets: [],
        };
        this.idleState = new BehaviorIdle();
        this.entityFilters = EntityFilters();
        this.collectWood = collectWoodMachine(bot, this.targets, this.mcData);
        this.craftPickaxe = craftPickaxeMachine(bot, this.targets, this.mcData);

        this.transitions = [
            // This transitions from the idleState to the lookAtPlayersState when
            // someone says hi in chat.
            new StateTransition({
                parent: this.idleState,
                child: this.collectWood,
                shouldTransition: () => {
                    return true;
                },
                onTransition: () => {
                    bot.chat("I ma going to garther some wood!");
                }
            }),

            new StateTransition({
                parent: this.collectWood,
                child: this.craftPickaxe,
                shouldTransition: () => {
                    const logs = bot.inventory.findInventoryItem(mcData.itemsByName['oak_log'].id, null, false)?.count || 0;
                    const planks = bot.inventory.findInventoryItem(mcData.itemsByName['oak_planks'].id, null, false)?.count || 0;
                    const sticks = bot.inventory.findInventoryItem(mcData.itemsByName['stick'].id, null, false)?.count || 0;
                    const craftingTable = bot.inventory.findInventoryItem(mcData.itemsByName['crafting_table'].id, null, false)?.count || 0;
                    if (logs > 10 || (planks >= 6 && sticks >= 4 && craftingTable >= 1)) {
                        return true;
                    }
                    return false;
                },
                onTransition: () => {
                    bot.chat("I am going to craft a pickaxe!");
                }
            }),

            new StateTransition({
                parent: this.craftPickaxe,
                child: this.idleState,
                shouldTransition: () => {
                    const pickaxe = bot.inventory.findInventoryItem(mcData.itemsByName['wooden_pickaxe'].id, null, false)?.count || 0;
                    if (pickaxe > 0) {
                        // return true;
                    }
                    return false;
                },
                onTransition: () => {
                    bot.chat("I am going to chill.");
                }
            }),

        ];

        bot.on("chat", (username: string, message: string) => {
            /*
            if (message === "start")
                this.transitions[0].trigger();

            if (message === "bye")
                this.transitions[2].trigger();

            if (message === "come")
                this.transitions[2].trigger();
            */
        });


        // Now we just wrap our transition list in a nested state machine layer. We want the bot
        // to start on the getClosestPlayer state, so we'll specify that here.
        const rootLayer = new NestedStateMachine(this.transitions, this.idleState);

        // We can start our state machine simply by creating a new instance.
        this.stateMachine = new BotStateMachine(bot, rootLayer);
        const webserver = new StateMachineWebserver(bot, this.stateMachine)
        webserver.startServer();
    }

}
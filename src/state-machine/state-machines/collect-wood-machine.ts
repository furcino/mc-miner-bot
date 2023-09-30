import { Bot } from "mineflayer";
import { BehaviorIdle, NestedStateMachine, StateTransition } from "mineflayer-statemachine";
import { Targets, getBlockIdsForNames, woodBlocks } from "../data/data";
import { BehaviorFurcinoFindBlock } from "../states/furcino-find-block-state";
import { IndexedData } from "minecraft-data";
import { BehaviorFurcinoMoveTo } from "../states/furcino-move-to-state";
import { BehaviorFurcinoMineBlock } from "../states/furcino-mine-block-state";

export function collectWoodMachine(bot: Bot, targets: Targets, mcData: IndexedData): NestedStateMachine {
    

    const idleState = new BehaviorIdle();
    const findWood = new BehaviorFurcinoFindBlock(bot, targets);
    findWood.blocks = getBlockIdsForNames(woodBlocks, mcData);
    const moveToWood = new BehaviorFurcinoMoveTo(bot, targets);
    const chopWood = new BehaviorFurcinoMineBlock(bot, targets);
    chopWood.blocks = getBlockIdsForNames(woodBlocks, mcData);

    const transitions = [

        new StateTransition({ // look for wood
            name: 'startLookingForWood',
            parent: idleState,
            child: findWood,
            shouldTransition: () => true,
        }),

        new StateTransition({ // move to wood
            name: 'moveWhenDoneLooking',
            parent: findWood,
            child: moveToWood,
            shouldTransition: () => true,
        }),

        new StateTransition({ // if bot can not move, try to chop wood
            name: 'tryToChopWoodWhenStuck',
            parent: moveToWood,
            child: chopWood,
            shouldTransition: () => targets.forceTransition === true,
            onTransition: () => {
                targets.targetFound = false;
                targets.position = undefined;
            }
        }),

        new StateTransition({ // when close enough, chop wood
            name: 'tryToChopWoodWhenCloseToIt',
            parent: moveToWood,
            child: chopWood,
            shouldTransition: () => {
                if (targets && targets.position && bot && bot.entity) {
                    return targets?.position?.xzDistanceTo(bot?.entity?.position) <= 1 && targets?.position?.distanceTo(bot?.entity?.position) <= 8;
                }
                return false;
            }
        }),

        new StateTransition({ // find new wood
            name: 'findOtherWoodWhenDoneChopping',
            parent: chopWood,
            child: findWood,
            shouldTransition: () => targets.forceTransition === true,
        }),
    ]

    return new NestedStateMachine(transitions, idleState);
} 
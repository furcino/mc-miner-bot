import { Entity } from "prismarine-entity";
import { StateMachineTargets } from "mineflayer-statemachine";
import { Vec3 } from "vec3";
import { Player } from "mineflayer";
import { IndexedData } from "minecraft-data";

export class Targets implements StateMachineTargets {
    targetFound?: boolean = false;
    unreachableTargets: Vec3[] = [];
    distance?: number = 0;
    forceTransition?: boolean = false;
    
    entity?: Entity;
    position?: Vec3;
    item?: any;
    player?: Player;
    blockFace?: Vec3;
    entities?: Entity[];
    positions?: Vec3[];
    items?: any[];
    players?: Player[];
}

export const woodBlocks = [
    'oak_log',
    'spruce_log',
    'birch_log',
    'jungle_log',
    'acacia_log',
    'dark_oak_log',
];

export const nonPlacableBlocks = [
    'water',
    'air',
    'lava',
    'crafting_table',
]

export function getBlockIdsForNames(names: string[], mcData: IndexedData): number[] {
    return names.map(item => mcData.blocksByName[item].id)
}
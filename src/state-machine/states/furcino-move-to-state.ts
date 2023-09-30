import { StateBehavior } from 'mineflayer-statemachine';

import { Bot } from 'mineflayer';
import { globalSettings } from 'mineflayer-statemachine';
import { goals, Movements } from 'mineflayer-pathfinder';
import { IndexedData } from 'minecraft-data';

import { Targets } from '../data/data';

export class BehaviorFurcinoMoveTo implements StateBehavior {

    stateName: string = 'furcinoMoveTo';
    active: boolean = false;
    targets: Targets;
    bot: Bot;
    distance: number = 0;
    lastMoveToPosition: any;
    lastCheckedBotPosition: any;
    tickCounter: number =  0;
    hardResetCounter: number = 0;
    forceTransition: boolean = false;

    constructor(bot: Bot, targets: Targets) {
        this.targets = targets;
        this.bot = bot;
    }

    /**
     * Called each tick to update this behavior.
     */
    update(): void {
        if (this.lastCheckedBotPosition && this.bot.entity.position.xyDistanceTo(this.lastCheckedBotPosition) <= 0.5) {
            this.hardResetCounter++;
        } else {
            this.hardResetCounter = 0;
        }

        if (this.lastCheckedBotPosition && this.bot.entity.position.xyDistanceTo(this.lastCheckedBotPosition) === 0 && !this.bot.pathfinder.isMining() && !this.bot.pathfinder.isBuilding()) {
            this.tickCounter++;
        } else if (this.bot.entity.position) {
            this.tickCounter = 0;
            this.lastCheckedBotPosition = { x: this.bot.entity.position.x, y: this.bot.entity.position.y, z: this.bot.entity.position.z };
        }

        if (this.tickCounter > 50 || this.hardResetCounter > 500) {
            console.log('[Move] move forcing transition')
            console.log(this.targets.unreachableTargets);
            if (this.targets.position) {
                this.targets.unreachableTargets.push(this.targets.position);
            }
            this.targets.forceTransition = true;
        }
    }
    
    /**
     * Called when the bot enters this behavior state.
     */
    onStateEntered() {
        if (this.targets.targetFound === false) {
            this.targets.position = this.bot.entity.position;
            this.targets!.position!.x += 50;
        }

        this.tickCounter = 0;
        this.hardResetCounter = 0;
        this.targets.forceTransition = false;

        if (this.targets && this.targets.position) {
            this.lastMoveToPosition = { x: this.targets.position.x, y: this.targets.position.y, z: this.targets.position.z };
        }

        if (this.targets && this.targets.distance) {
            this.distance = this.targets.distance;
        }

        this.startMoving();
    }
    
    /**
     * Called when the bot leaves this behavior state.
     */
    onStateExited() {
        this.stopMoving();
    }

    /**
     * Cancels the current path finding operation.
     */
    stopMoving() {
        this.tickCounter = 0;
        // @ts-ignore
        const pathfinder = this.bot.pathfinder;
        pathfinder.setGoal(null);
    }
    
    /**
     * Starts a new path finding operation.
     */
    startMoving() {
        const position = this.targets.position;

        if (!position) {
            if (globalSettings.debugMode) {
                console.log("[MoveTo] Target not defined. Skipping.");
            }
            return;
        }

        if (globalSettings.debugMode) {
            console.log("[MoveTo] Moving from " + this.bot.entity.position + " to " + position);
        }
        
        const pathfinder = this.bot.pathfinder;
        let goal;

        if (this.distance === 0)
            goal = new goals.GoalBlock(position.x, position.y, position.z);
        else
            goal = new goals.GoalNear(position.x, position.y, position.z, this.distance);
            
        pathfinder.setMovements(new Movements(this.bot));
        pathfinder.goto(goal).catch(() => {
            console.log('[Move] can not reach goal');
            if (this.targets.position) {
                this.targets.unreachableTargets.push(this.targets.position);
            }
        })

    }
    
    /**
     * Stops and restarts this movement behavior. Does nothing if
     * this behavior is not active.
     */
    restart() {
        if (!this.active)
            return;
        this.stopMoving();
        this.startMoving();
    }

    /**
     * Checks if the bot has finished moving or not.
     */
    isFinished() {
        // @ts-ignore
        const pathfinder = this.bot.pathfinder;
        return !pathfinder.isMoving();
    }
    
    /**
     * Gets the distance to the target position.
     *
     * @returns The distance, or 0 if no target position is assigned.
     */
    distanceToTarget(position: any) {
        if (!position)
            return 0;
        return this.bot.entity.position.distanceTo(position);
    }
}
import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import { } from "../../utility/creep-extension";
import { GameManager } from "../../utility/game-manager";
import { ArmyManager } from "../../utility/army-manager";
import { StateMachine } from "../state-machine";
import { StateMachineUnit } from "../state-machine-unit";

export class AlphaSpawnAndSwamp extends StateMachine {
    static #stateName = { IDLE: "idle", SPAWNING: "spawning" };
    #states = {
        [AlphaSpawnAndSwamp.#stateName.IDLE]: {
            update: (context) => { },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWNING, condition: () => ArmyManager.armyCount < 3 }
            ]
        },
        [AlphaSpawnAndSwamp.#stateName.SPAWNING]: {
            update: (context) => {
                ArmyManager.addArmy([
                    new Withdrawer(),
                    new Withdrawer(),
                ]);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => ArmyManager.armyCount > 3 }
            ]
        },
    };

    constructor() {
        super();
        Object.keys(this.#states).forEach(name => this.addState(name, this.#states[name]));
        this.start(AlphaSpawnAndSwamp.#stateName.IDLE);
    }
}

export class Withdrawer extends StateMachineUnit {
    static #stateName = { IDLE: "idle" };
    #states = {
        [Withdrawer.#stateName.IDLE]: {
            update: (context) => { },
            transitions: []
        }
    };

    constructor() {
        super([constants.MOVE, constants.CARRY]);
        Object.keys(this.#states).forEach(name => this.addState(name, this.#states[name]));
        this.start(Withdrawer.#stateName.IDLE);
    }
}

// export class AlphaSpawnAndSwamp {
//     withDrawerCreated = false;
//     withdrawer = [constants.MOVE, constants.MOVE, constants.MOVE, constants.CARRY, constants.CARRY, constants.CARRY, constants.CARRY];
//     melee = [constants.MOVE, constants.MOVE, constants.MOVE, constants.ATTACK, constants.ATTACK, constants.ATTACK, constants.ATTACK];
//     spawnOffsetY = [5, -5];
//     spawnOffsetIndex = 0;

//     createArmy() {
//         if (!this.withDrawerCreated) {
//             ArmyManager.addArmy(new Army({
//                 armyBodies: [
//                     new Unit(1, this.withdrawer)
//                 ],
//                 strategy: this.energyStrategy
//             }));
//             this.withDrawerCreated = true;
//         }

//         const spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(sp => sp.my);
//         while (ArmyManager.armyCount < 5) {
//             ArmyManager.addArmy(new Army({
//                 armyBodies: [
//                     new Unit(4, this.melee)
//                 ],
//                 state: { idlePosition: { x: spawn.x, y: spawn.y + this.spawnOffsetY[this.spawnOffsetIndex] } },
//                 strategy: this.meleeStrategy
//             }));
//             this.spawnOffsetIndex = (this.spawnOffsetIndex + 1) % this.spawnOffsetY.length;
//         }
//     }

//     energyStrategy(creeps, state, metaData) {
//         creeps.forEach(creep => {
//             if (creep.store.getFreeCapacity(constants.RESOURCE_ENERGY) > 0) {
//                 if (creep["bodyPartCount"](constants.WORK)) {
//                     const source = creep["getNearestSource"]();
//                     if (source && utils.getRange(creep, source) <= 5) {
//                         if (creep.harvest(source) !== constants.OK) {
//                             creep.moveTo(source);
//                             state[creep.id] = "harvesting";
//                             return;
//                         }
//                     }
//                 }
//                 const container = creep["getNearestContainer"]();
//                 if (container && utils.getRange(creep, container) <= 5) {
//                     if (creep.withdraw(container, constants.RESOURCE_ENERGY) !== constants.OK) {
//                         creep.moveTo(container);
//                         state[creep.id] = "withdrawing";
//                         return;
//                     }
//                 }
//             }

//             if (creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0) {
//                 const spawn = GameManager.mySpawn;
//                 if (spawn && creep.transfer(spawn, constants.RESOURCE_ENERGY) !== constants.OK) {
//                     creep.moveTo(spawn);
//                     state[creep.id] = "moving to " + spawn.x + "/" + spawn.y;
//                 }
//             } else {
//                 state[creep.id] = "idle";
//             }
//         });
//     }

//     meleeStrategy(creeps, state, metaData) {
//         if (!state.assaultMode && metaData.completed) {
//             let distance = 0;
//             let maxDistance = 0;
//             for (let creep of creeps) {
//                 distance = utils.getRange(creep, state.idlePosition);
//                 if (distance > maxDistance) {
//                     maxDistance = distance;
//                 }
//             }
//             state.assaultMode = maxDistance < 2;
//         }

//         const enemySpawn = GameManager.enemySpawn;
//         creeps.forEach(creep => {
//             if (state.assaultMode && enemySpawn && creep.attack(enemySpawn) === constants.OK) {
//                 state[creep.id] = "attacking spawn " + enemySpawn.id;
//                 return;
//             }

//             let distance;
//             const enemy = creep["getNearestCreep"](GameManager.enemies);
//             if (enemy) {
//                 distance = utils.getRange(creep, enemy);
//                 if (creep.attack(enemy) === constants.OK) {
//                     state[creep.id] = "attacking enemy " + enemy.id;
//                     return;
//                 }
//             }

//             if (distance && distance <= 7) {
//                 creep.moveTo(enemy);
//                 state[creep.id] = "moving to enemy at " + enemy.x + "/" + enemy.y;
//             } else if (state.assaultMode) {
//                 creep.moveTo(enemySpawn);
//                 state[creep.id] = "moving to spawn at " + enemySpawn.x + "/" + enemySpawn.y;
//             } else {
//                 creep.moveTo(state.idlePosition);
//                 state[creep.id] = "moving to " + state.idlePosition.x + "/" + state.idlePosition.y;
//             }
//         });
//     }
// }
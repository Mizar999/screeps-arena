import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import * as pathFinder from "game/path-finder";
import { } from "../../utility/creep-extension";
import { GameManager } from "../../utility/game-manager";
import { ArmyManager } from "../../utility/army-manager";
import { StateMachine } from "../state-machine";
import { StateMachineUnit } from "../state-machine-unit";

export class AlphaSpawnAndSwamp extends StateMachine {
    #gatheringPointOffsetY = [5, -5];
    #gatheringPointOffsetYIndex = 0;

    static #stateName = {
        SPAWN_ENERGY_COLLECTOR: "spawnEnergyCollector",
        SPAWN_MELEE_ATTACKER: "spawnMeleeAttacker",
        IDLE: "idle",
    };

    #states = [
        {
            name: AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR,
            update: (context) => {
                ArmyManager.addArmy([
                    new Withdrawer(),
                ]);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_MELEE_ATTACKER, condition: () => ArmyManager.armyCount >= 1 && ArmyManager.armyCount < 5 },
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => ArmyManager.armyCount >= 5 },
            ]
        },
        {
            name: AlphaSpawnAndSwamp.#stateName.SPAWN_MELEE_ATTACKER,
            update: (context) => {
                const spawn = GameManager.mySpawn;
                const gatheringPoint = { x: spawn.x, y: spawn.y + this.#gatheringPointOffsetY[this.#gatheringPointOffsetYIndex] };
                this.#gatheringPointOffsetYIndex = (this.#gatheringPointOffsetYIndex + 1) % this.#gatheringPointOffsetY.length;

                ArmyManager.addArmy([
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                ]);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR, condition: () => ArmyManager.armyCount < 1 },
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => ArmyManager.armyCount >= 5 },
            ]
        },
        {
            name: AlphaSpawnAndSwamp.#stateName.IDLE,
            update: (context) => { },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR, condition: () => ArmyManager.armyCount < 1 },
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_MELEE_ATTACKER, condition: () => ArmyManager.armyCount < 5 },
            ]
        },
    ];

    constructor() {
        super();
        this.addStates(this.#states);
        this.start(AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR);
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context) {
        super.update(context);
        if (this.debug) {
            GameManager.addMessage(this._currentState.name, GameManager.mySpawn);
        }
    }

    static armyHasGathered(context, gatheringPoint, gatheringRange) {
        if (context.completed) {
            let maxDistance = -1;
            let distance = 0;
            for (let creep of context.armyCreeps) {
                distance = utils.getRange(creep, gatheringPoint);
                if (distance >= gatheringRange) {
                    return false;
                }
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            }
            return maxDistance > 0 && maxDistance < gatheringRange;
        }
        return false;
    }
}

export class Withdrawer extends StateMachineUnit {
    #fleePosition;
    #enemiesInRange;
    static #minRange = 4;

    static #stateName = {
        COLLECT_ENERGY: "collectEnergy",
        TRANSFER_ENERGY: "transferEnergy",
        FLEE: "flee",
    };

    #states = [
        {
            name: Withdrawer.#stateName.COLLECT_ENERGY,
            update: (context) => {
                if (!this._creep) {
                    if (context.creep) {
                        this._creep = context.creep;
                    } else {
                        return;
                    }
                }

                const container = utils.findClosestByPath(GameManager.mySpawn, GameManager.containers, { maxCost: 300 });
                if (container) {
                    if (this._creep.withdraw(container, constants.RESOURCE_ENERGY) !== constants.OK) {
                        this._creep.moveTo(container);
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this._creep && this._creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 },
            ]
        },
        {
            name: Withdrawer.#stateName.TRANSFER_ENERGY,
            update: (context) => {
                const spawn = GameManager.mySpawn;
                if (spawn) {
                    if (this._creep.transfer(spawn, constants.RESOURCE_ENERGY) !== constants.OK) {
                        this._creep.moveTo(spawn);
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.COLLECT_ENERGY, condition: () => this._creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) <= 0 },
            ]
        },
        {
            name: Withdrawer.#stateName.FLEE,
            update: (context) => {
                if (this.#enemiesInRange.length) {
                    const searchResult = pathFinder.searchPath(this._creep, this.#enemiesInRange, { flee: true });
                    if (!searchResult.incomplete && searchResult.path.length) {
                        this.#fleePosition = searchResult.path[0];
                        this._creep.moveTo(this.#fleePosition);
                    }
                }
            },
            exit: () => {
                this.#fleePosition = undefined;
            },
            transitions: [
                { nextState: Withdrawer.#stateName.COLLECT_ENERGY, condition: () => this._creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) <= 0 && !this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this._creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 && !this.#findEnemiesInRange() },
            ]
        },
    ];

    constructor() {
        super([constants.MOVE, constants.MOVE, constants.MOVE, constants.CARRY, constants.CARRY, constants.CARRY, constants.CARRY]);
        this.addStates(this.#states);
        this.start(Withdrawer.#stateName.COLLECT_ENERGY);
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context) {
        super.update(context);
        if (this.debug && this._creep) {
            GameManager.addMessage(this._creep.id + ": " + this._currentState.name, this._creep);
        }
    }

    #findEnemiesInRange() {
        if (this._creep) {
            this.#enemiesInRange = utils.findInRange(this._creep, GameManager.enemies, Withdrawer.#minRange).map(enemy => { return { pos: { x: enemy.x, y: enemy.y }, range: Withdrawer.#minRange } });
            return this.#enemiesInRange && this.#enemiesInRange.length;
        }
        return false;
    }
}

export class MeleeAttacker extends StateMachineUnit {
    #gatheringPoint;
    #attackTarget;
    #hasGathered = false;
    static #gatheringRange = 2;
    static #attackRange = 4;

    static #stateName = {
        GATHERING: "gathering",
        ATTACK_OBJECTIVE: "attackObjective",
        ATTACK_ENEMY: "attackEnemy",
    };

    #states = [
        {
            name: MeleeAttacker.#stateName.GATHERING,
            enter: () => {
                if (!this.#gatheringPoint) {
                    const spawn = GameManager.mySpawn;
                    this.#gatheringPoint = { x: spawn.x, y: spawn.y + 5 };
                }
            },
            update: (context) => {
                if (!this._creep) {
                    if (context.creep) {
                        this._creep = context.creep;
                    } else {
                        return;
                    }
                }

                if (this._creep) {
                    this._creep.moveTo(this.#gatheringPoint);
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#findAttackTarget() },
                {
                    nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
                    condition: (context) => {
                        this.#hasGathered = AlphaSpawnAndSwamp.armyHasGathered(context, this.#gatheringPoint, MeleeAttacker.#gatheringRange);
                        return this.#hasGathered;
                    }
                },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
            update: (context) => {
                const enemySpawn = GameManager.enemySpawn;
                if (this._creep.attack(enemySpawn) !== constants.OK) {
                    this._creep.moveTo(enemySpawn);
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#findAttackTarget() },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_ENEMY,
            update: (context) => {
                if (this.#attackTarget) {
                    if (this._creep.attack(this.#attackTarget.enemy) !== constants.OK) {
                        this._creep.moveTo(this.#attackTarget.enemy);
                    }
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE, condition: () => this.#hasGathered && !this.#findAttackTarget() },
                { nextState: MeleeAttacker.#stateName.GATHERING, condition: () => !this.#hasGathered && !this.#findAttackTarget() },
            ]
        },
    ];

    /**
     * @param {prototypes.Position} gatheringPoint 
     */
    constructor(gatheringPoint) {
        super([constants.TOUGH, constants.TOUGH, constants.TOUGH, constants.TOUGH, constants.MOVE, constants.MOVE, constants.MOVE, constants.ATTACK, constants.ATTACK, constants.ATTACK]);
        this.#gatheringPoint = gatheringPoint;

        this.addStates(this.#states);
        this.start(MeleeAttacker.#stateName.GATHERING);
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context) {
        super.update(context);
        if (this.debug && this._creep) {
            GameManager.addMessage(this._creep.id + ": " + this._currentState.name, this._creep);
        }
    }

    #findAttackTarget() {
        if (this._creep) {
            this.#attackTarget = GameManager.getEnemyWithRange(this._creep);
            return this.#attackTarget.enemy && this.#attackTarget.range <= MeleeAttacker.#attackRange;
        }
        return false;
    }
}
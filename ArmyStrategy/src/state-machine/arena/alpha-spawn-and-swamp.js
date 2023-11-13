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
}

export class Withdrawer extends StateMachineUnit {
    /** @type {prototypes.Creep} */ #creep;
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
                this.#creep = context.creep;
                const container = utils.findClosestByPath(GameManager.mySpawn, GameManager.containers, { maxCost: 300 });
                if (this.#creep) {
                    if (container) {
                        if (this.#creep.withdraw(container, constants.RESOURCE_ENERGY) !== constants.OK) {
                            this.#creep.moveTo(container);
                        }
                    }
                }

            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this.#creep && this.#creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 },
            ]
        },
        {
            name: Withdrawer.#stateName.TRANSFER_ENERGY,
            update: (context) => {
                this.#creep = context.creep;
                const spawn = GameManager.mySpawn;
                if (this.#creep) {
                    if (spawn) {
                        if (this.#creep.transfer(spawn, constants.RESOURCE_ENERGY) !== constants.OK) {
                            this.#creep.moveTo(spawn);
                        }
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.COLLECT_ENERGY, condition: () => this.#creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) <= 0 },
            ]
        },
        {
            name: Withdrawer.#stateName.FLEE,
            update: (context) => {
                this.#creep = context.creep;
                if (this.#creep && this.#enemiesInRange.length) {
                    const searchResult = pathFinder.searchPath(this.#creep, this.#enemiesInRange, { flee: true });
                    if (!searchResult.incomplete && searchResult.path.length) {
                        this.#fleePosition = searchResult.path[0];
                        this.#creep.moveTo(this.#fleePosition);
                    }
                }
            },
            exit: () => {
                this.#fleePosition = undefined;
            },
            transitions: [
                { nextState: Withdrawer.#stateName.COLLECT_ENERGY, condition: () => this.#creep && this.#creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) <= 0 && !this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this.#creep && this.#creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 && !this.#findEnemiesInRange() },
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
        if (this.debug && this.#creep) {
            GameManager.addMessage(this.#creep.id + ": " + this._currentState.name, this.#creep);
        }
    }

    #findEnemiesInRange() {
        if (this.#creep) {
            this.#enemiesInRange = utils.findInRange(this.#creep, GameManager.enemies, Withdrawer.#minRange).map(enemy => { return { pos: { x: enemy.x, y: enemy.y }, range: Withdrawer.#minRange } });
            return this.#enemiesInRange && this.#enemiesInRange.length;
        }
        return false;
    }
}

export class MeleeAttacker extends StateMachineUnit {
    /** @type {prototypes.Creep} */ #creep;
    #gatheringPoint;
    #attackTarget;
    #hasGathered = false;
    static #gatheringRange = 4;
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
                this.#creep = context.creep;
                if (this.#creep) {
                    this.#creep.moveTo(this.#gatheringPoint);
                    if (context.completed) {
                        this.#hasGathered = this.#armyHasGathered(context);
                    }
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#findAttackTarget() },
                { nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE, condition: () => this.#hasGathered },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
            update: (context) => {
                const enemySpawn = GameManager.enemySpawn;
                if (this.#creep && this.#creep.attack(enemySpawn) !== constants.OK) {
                    this.#creep.moveTo(enemySpawn);
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#findAttackTarget() },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_ENEMY,
            update: (context) => {
                if (this.#creep && this.#attackTarget) {
                    if (this.#creep.attack(this.#attackTarget.enemy) !== constants.OK) {
                        this.#creep.moveTo(this.#attackTarget.enemy);
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
        if (this.debug && this.#creep) {
            GameManager.addMessage(this.#creep.id + ": " + this._currentState.name, this.#creep);
        }
    }

    #armyHasGathered(context) {
        let maxDistance = -1;
        if (context.completed) {
            let distance = 0;
            for (let creep of context.armyCreeps) {
                distance = utils.getRange(creep, this.#gatheringPoint);
                if (distance >= MeleeAttacker.#gatheringRange) {
                    return false;
                }
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            }
        }
        return maxDistance > 0 && maxDistance < MeleeAttacker.#gatheringRange;
    }

    #findAttackTarget() {
        if (this.#creep) {
            this.#attackTarget = GameManager.getEnemyWithRange(this.#creep);
            return this.#attackTarget.enemy && this.#attackTarget.range <= MeleeAttacker.#attackRange;
        }
        return false;
    }
}
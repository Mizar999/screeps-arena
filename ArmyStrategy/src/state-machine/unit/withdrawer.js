import * as constants from "game/constants";
import * as pathFinder from "game/path-finder";
import { GameManager } from "../../utility/game-manager";
import { StateMachineUnit } from "../state-machine-unit";

export class Withdrawer extends StateMachineUnit {
    #enemiesInRange;
    static #fleeRange = 5;
    static #containerRange = 50;

    static #stateName = {
        SET_CREEP: "setCreep",
        COLLECT_ENERGY: "collectEnergy",
        TRANSFER_ENERGY: "transferEnergy",
        FLEE: "flee",
    };

    #states = [
        {
            name: Withdrawer.#stateName.SET_CREEP,
            update: (context) => { },
            transitions: [
                {
                    nextState: Withdrawer.#stateName.COLLECT_ENERGY,
                    condition: (context) => {
                        if (context.creep) {
                            this._creep = context.creep;
                        }
                        return this._creep !== undefined;
                    }
                },
            ]
        },
        {
            name: Withdrawer.#stateName.COLLECT_ENERGY,
            update: (context) => {
                const result = GameManager.getPositionsWithRange(GameManager.mySpawn, GameManager.containers);
                if (result.target && result.range <= Withdrawer.#containerRange) {
                    if (this._creep.withdraw(result.target, constants.RESOURCE_ENERGY) !== constants.OK) {
                        this._creep.moveTo(result.target);
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this._creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 },
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
                        this._creep.moveTo(searchResult.path[0]);
                    }
                }
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
        this.start(Withdrawer.#stateName.SET_CREEP);
    }

    #findEnemiesInRange() {
        this.#enemiesInRange = GameManager.findCreepsInRange(this._creep, GameManager.enemies, Withdrawer.#fleeRange);
        return this.#enemiesInRange.length > 0;
    }
}
import * as constants from "game/constants";
import * as pathFinder from "game/path-finder";
import { } from "../../utility/creep-extension";
import { GameManager } from "../../utility/game-manager";
import { StateMachineUnit } from "../state-machine-unit";

export class Withdrawer extends StateMachineUnit {
    #enemiesInRange;
    static #fleeRange = 5;
    static #containerRange = 50;

    static #stateName = {
        COLLECT_ENERGY: "collectEnergy",
        TRANSFER_ENERGY: "transferEnergy",
        FLEE: "flee",
    };

    #states = [
        {
            name: Withdrawer.#stateName.COLLECT_ENERGY,
            isInitialState: true,
            update: (context) => {
                const result = GameManager.getPositionsWithRange(GameManager.mySpawn, GameManager.containers);
                if (result.target && result.range <= Withdrawer.#containerRange) {
                    if (this.creep.withdraw(result.target, constants.RESOURCE_ENERGY) !== constants.OK) {
                        this.creep.moveTo(result.target);
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this.creep.store && this.creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 },
            ]
        },
        {
            name: Withdrawer.#stateName.TRANSFER_ENERGY,
            update: (context) => {
                const spawn = GameManager.mySpawn;
                if (spawn) {
                    if (this.creep.transfer(spawn, constants.RESOURCE_ENERGY) !== constants.OK) {
                        this.creep.moveTo(spawn);
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.FLEE, condition: () => this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.COLLECT_ENERGY, condition: () => this.creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) <= 0 },
            ]
        },
        {
            name: Withdrawer.#stateName.FLEE,
            update: (context) => {
                if (this.#enemiesInRange.length) {
                    const searchResult = pathFinder.searchPath(this.creep, this.#enemiesInRange, { costMatrix: GameManager.dangerMatrix, flee: true });
                    if (!searchResult.incomplete && searchResult.path.length) {
                        this.creep.moveTo(searchResult.path[0]);
                    }
                }
            },
            transitions: [
                { nextState: Withdrawer.#stateName.COLLECT_ENERGY, condition: () => this.creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) <= 0 && !this.#findEnemiesInRange() },
                { nextState: Withdrawer.#stateName.TRANSFER_ENERGY, condition: () => this.creep.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0 && !this.#findEnemiesInRange() },
            ]
        },
    ];

    constructor() {
        super();
        this.addStates(this.#states);
    }

    #findEnemiesInRange() {
        this.#enemiesInRange = GameManager.findCreepsInRange(this.creep, GameManager.enemies, Withdrawer.#fleeRange);
        return this.#enemiesInRange.length > 0;
    }
}
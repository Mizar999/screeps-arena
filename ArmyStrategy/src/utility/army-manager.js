import { GameManager } from "./game-manager";
import { StateMachineUnit } from "../state-machine/state-machine-unit";
import { } from "./creep-extension";
import * as prototypes from "game/prototypes";

export class ArmyManager {
    /** @type {Object.<number, {unitsToSpawn: StateMachineUnit[], max: number, created: number, completed: boolean, destroyed: boolean}>} */
    static #armies = {};
    static #nextId = 0;
    static debug = true;

    /**
     * @param {StateMachineUnit[]} unitsToSpawn All units that form an army
     * @returns {number} New army identifier
     */
    static addArmy(unitsToSpawn) {
        const id = this.#nextId++;
        this.#armies[id] = {
            unitsToSpawn: unitsToSpawn,
            max: unitsToSpawn.length,
            created: 0,
            completed: false,
            destroyed: false
        };
        return id;
    }

    static addCreepsAsArmy() {
        // TODO add already existing creeps to an army
    }

    /**
     * @returns {void}
     */
    static spawn() {
        // TODO support multiple spawn structures
        const spawn = GameManager.mySpawn;
        if (spawn && !spawn.spawning) {
            for (let id of Object.keys(this.#armies).filter(id => this.#armies[id].unitsToSpawn.length > 0)) {
                const unitsToSpawn = this.#armies[id].unitsToSpawn;
                const creep = spawn.spawnCreep(unitsToSpawn[0].parts).object;
                if (creep) {
                    creep["data"] = { army: id, stateMachine: unitsToSpawn.shift() };
                    this.#armies[id].created++;
                }
                return;
            }
        }
    }

    static update() {
        const creeps = GameManager.myCreeps;
        let /** @type {prototypes.Creep[]} */ tempUnits;
        let /** @type {boolean} */ isSpawning;
        for (let id of Object.keys(this.#armies)) {
            isSpawning = false;
            tempUnits = creeps.reduce((prev, curr) => {
                if (curr["data"].army === id) {
                    if (curr.spawning) {
                        isSpawning = true;
                    } else {
                        prev.push(curr);
                    }
                }
                return prev;
            }, []);

            const armyData = this.#armies[id];
            if (!armyData.completed && !isSpawning) {
                armyData.completed = armyData.unitsToSpawn.length === 0;
            }
            if (armyData.completed) {
                armyData.destroyed = tempUnits.length <= 0;
            }

            // TODO no need for repair?
            // if (tempUnits.length && !armyData.destroyed) {
            //     const unitIds = tempUnits.map(unit => unit.id);
            //     let int;
            //     Object.keys(armyData.army.state).forEach(key => {
            //         int = parseInt(key);
            //         if (!isNaN(int) && !unitIds.includes(int)) {
            //             delete armyData.army.state[key];
            //         }
            //     });
            // }

            const metaData = { creep: undefined, armyCreeps: tempUnits, completed: armyData.completed, destroyed: armyData.destroyed, created: armyData.created, max: armyData.max, alive: tempUnits.length };
            tempUnits.forEach(unit => {
                metaData.creep = unit;
                unit["data"].stateMachine.update(metaData)
            });
            if (this.debug) {
                // this.#printDebug(id, armyData.army.state, metaData); // TODO repair
            }
        }
    }

    static cleanup() {
        const deleteIds = [];
        for (let id of Object.keys(this.#armies)) {
            if (this.#armies[id].destroyed) {
                deleteIds.push(id);
            }
        }

        for (let id of deleteIds) {
            delete this.#armies[id];
        }
    }

    static get armyCount() {
        return Object.keys(this.#armies).length;
    }

    /**
     * @param {number} id 
     * @returns {boolean}
     */
    static armyExists(id) {
        return id in this.#armies;
    }
}
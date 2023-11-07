import { GameManager } from "./game-manager";
import { } from "./creep-extension";

export class ArmyManager {
    static #armies = {};
    static #nextId = 0;
    static debug = true;

    static addArmy(units = []) {
        const id = this.#nextId++;
        this.#armies[id] = {
            units: units,
            max: units.length,
            created: 0,
            completed: false,
            destroyed: false
        };
        return id;
    }

    static addCreepsAsArmy() {
        // TODO add already existing creeps to an army
    }

    static spawn() {
        // TODO support multiple spawn strcutures
        const spawn = GameManager.mySpawn;
        if (spawn && !spawn.spawning) {
            for (let id of Object.keys(this.#armies).filter(id => !this.#armies[id].units.length)) {
                const units = this.#armies[id].units;
                const creep = spawn.spawnCreep(units[0].parts).object;
                if (creep) {
                    creep["data"] = { army: id, stateMachine: units.shift().stateMachine };
                    this.#armies[id].armyData.created++;
                }
                return;
            }
        }
    }

    static applyStrategies() {
        const creeps = GameManager.myCreeps;
        let tempUnits;
        let isSpawning;
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
                armyData.completed = armyData.units.length === 0;
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

            const metaData = { completed: armyData.completed, destroyed: armyData.destroyed, created: armyData.created, max: armyData.max, alive: tempUnits.length, units: tempUnits };
            tempUnits.forEach(unit => unit["data"].stateMachine.update(metaData));
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

    static armyExists(id) {
        return id in this.#armies;
    }

    // TODO remove me
    // static #getMissingBody(id) {
    //     const armyData = this.#armies[id];
    //     const units = GameManager.myCreeps.filter(creep => creep["data"].army === id);
    //     if (units.length < armyData.army.armySize()) {
    //         let unitCount = 0;
    //         for (let armyBody of armyData.army.armyBodies) {
    //             unitCount += armyBody.count;
    //             if (armyData.created < unitCount) {
    //                 return armyBody.parts;
    //             }
    //         }
    //     }
    //     return undefined;
    // }

    // TODO no need for repair
    // static #printDebug(id, state, metaData) {
    //     let metaMessage = "";
    //     if (metaData.destroyed) {
    //         metaMessage += "destroyed";
    //     } else {
    //         metaMessage += metaData.alive + "/" + metaData.max;
    //         if (metaData.created < metaData.max) {
    //             metaMessage += " [" + (metaData.max - metaData.created) + " spawning]";
    //         }
    //     }
    //     console.log(id + ":", metaMessage, state);
    // }
}
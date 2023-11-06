import { Army } from "./army";
import { GameManager } from "./game-manager";
import { Data } from "./data";

export class ArmyManager {
    static #armies = {};
    static nextId = 0;
    static debug = true;

    static addArmy(armyData) {
        this.#armies[this.nextId++] = {
            army: new Army(armyData),
            created: 0,
            completed: false,
            destroyed: false
        };
    }

    static addCreepsAsArmy() {
        // TODO add already existing creeps to an army
    }

    static spawn() {
        const spawn = GameManager.mySpawn;
        if (spawn && !spawn.spawning) {
            let missingBody;
            for (let id of Object.keys(this.#armies).filter(id => !this.#armies[id].completed)) {
                missingBody = this.#getMissingBody(id);
                if (missingBody !== undefined) {
                    const creep = spawn.spawnCreep(missingBody).object;
                    if (creep) {
                        creep["data"] = new Data({ army: id });
                        const armyData = this.#armies[id];
                        armyData.created++;
                    }
                    return;
                }
            }
        }
    }

    static applyStrategies() {
        const creeps = GameManager.myCreeps;
        let units;
        let isSpawning;
        for (let id of Object.keys(this.#armies)) {
            isSpawning = false;
            units = creeps.reduce((prev, curr) => {
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
                armyData.completed = armyData.created >= armyData.army.armySize()
            }
            if (armyData.completed) {
                armyData.destroyed = units.length <= 0;
            }

            const metaData = { completed: armyData.completed, destroyed: armyData.destroyed, created: armyData.created, max: armyData.army.armySize(), alive: units.length };
            // Shallow copy of metaData because of following printDebug function
            armyData.army.strategy(units, armyData.army.state, { ...metaData });
            if (this.debug) {
                this.#printDebug(id, armyData.army.state, metaData);
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

    static #getMissingBody(id) {
        const armyData = this.#armies[id];
        const units = GameManager.myCreeps.filter(creep => creep["data"].army === id);
        if (units.length < armyData.army.armySize()) {
            let unitCount = 0;
            for (let armyBody of armyData.army.armyBodies) {
                unitCount += armyBody.count;
                if (armyData.created < unitCount) {
                    return armyBody.parts;
                }
            }
        }
        return undefined;
    }

    static #printDebug(id, state, metaData) {
        let metaMessage = "";
        if (metaData.destroyed) {
            metaMessage += "destroyed";
        } else {
            metaMessage += metaData.alive + "/" + metaData.max;
            if (metaData.created < metaData.max) {
                metaMessage += " [" + (metaData.max - metaData.created) + " spawning]";
            }
        }
        console.log(id + ":", metaMessage, state);
    }
}
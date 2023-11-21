import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import * as visual from "game/visual";
import * as pathFinder from "game/path-finder";
import { StateMachineUnit } from "../state-machine/state-machine-unit";

export class GameManager {
    static #visual = new visual.Visual(0, true);
    /** @type {{message: string, position: prototypes.Position}[]} */ static #messages = [];
    static #visualStyle = {
        font: 0.25,
        opacity: 0.6,
        stroke: "#000000"
    };

    /** @type {prototypes.Creep[]} */ static myCreeps;
    /** @type {prototypes.Creep[]} */ static myDamagedCreeps;
    /** @type {prototypes.StructureSpawn} */ static mySpawn;
    /** @type {prototypes.Creep[]} */ static enemies;
    /** @type {prototypes.StructureSpawn} */ static enemySpawn;
    /** @type {prototypes.StructureContainer[]} */ static containers;
    /** @type {prototypes.Source[]} */ static sources;
    /** @type {pathFinder.CostMatrix} */ static enemyPositionMatrix;
    /** @type {pathFinder.CostMatrix} */ static dangerMatrix;
    /** @type {{[key: number]: prototypes.Creep[]}} */ static armies;

    /** @type {{[key: number]: {parts: string[], action: (creep) => {} }[]}} */ static #unitsToSpawn = {};
    static #nextId = 0;

    static updateCache() {
        this.myCreeps = [];
        this.myDamagedCreeps = [];
        this.enemies = [];
        this.containers = [];
        this.sources = [];
        this.enemyPositionMatrix = new pathFinder.CostMatrix();
        this.dangerMatrix = new pathFinder.CostMatrix();
        this.armies = {};

        utils.getObjectsByPrototype(prototypes.Creep).forEach(creep => {
            if (creep.my) {
                this.myCreeps.push(creep);
                if (creep.hits < creep.hitsMax) {
                    this.myDamagedCreeps.push(creep);
                }

                if (creep["data"] && creep["data"].army) {
                    if (!(creep["data"].army in this.armies)) {
                        this.armies[creep["data"].army] = [];
                    }
                    this.armies[creep["data"].army].push(creep);
                }
            } else if (!creep.spawning) {
                this.enemies.push(creep);
                this.enemyPositionMatrix.set(creep.x, creep.y, 255);

                if (creep["bodyPartCount"](constants.RANGED_ATTACK)) {
                    for (let x = creep.x - 3; x <= creep.x + 3; ++x) {
                        if (x >= 0 && x <= 100) {
                            for (let y = creep.y - 3; y <= creep.y + 3; ++y) {
                                if (y >= 0 && y <= 100) {
                                    this.dangerMatrix.set(x, y, x === creep.x && y === creep.y ? 255 : 250);
                                }
                            }
                        }
                    }
                } else {
                    this.dangerMatrix.set(creep.x, creep.y, 255);
                }
            }
        });

        this.containers = utils.getObjectsByPrototype(prototypes.StructureContainer).filter(container => container.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0);
        this.sources = utils.getObjectsByPrototype(prototypes.Source).filter(source => source.energy > 0);

        utils.getObjectsByPrototype(prototypes.StructureSpawn).forEach(spawn => {
            if (spawn.my) {
                this.mySpawn = spawn;
            } else {
                this.enemySpawn = spawn;
            }
        });

        const creepDefender = utils.findClosestByRange(GameManager.mySpawn, GameManager.myCreeps.filter(creep => !creep.spawning && (creep["bodyPartCount"](constants.RANGED_ATTACK) || creep["bodyPartCount"](constants.ATTACK))));
        GameManager.myCreeps.forEach(creep => {
            creep["data"] = { ...creep["data"], ...GameManager.getPositionsWithRange(creep, GameManager.enemies) };
            creep["data"].defendPosition = creepDefender && creep.id === creepDefender.id ? { x: GameManager.mySpawn.x, y: GameManager.mySpawn.y } : undefined;
        });
    }

    /**
     * @param {prototypes.Position} fromPos 
     * @param {(prototypes.Creep|prototypes.StructureContainer|prototypes.Source)[]} positions 
     * @returns {{target: any, range: number}}
     */
    static getPositionsWithRange(fromPos, positions) {
        const result = { target: utils.findClosestByRange(fromPos, positions), range: -1 };
        if (result.target) {
            result.range = utils.getRange(fromPos, result.target);
        }
        return result;
    }

    /**
     * @param {prototypes.Position} position 
     * @param {prototypes.Creep[]} creeps 
     * @param {number} range 
     * @returns {{pos: {x:number, y:number}, range: number}[]}
     */
    static findCreepsInRange(position, creeps, range) {
        return utils.findInRange(position, creeps, range).map(creep => { return { pos: creep, range: range } });
    }

    static addArmyToSpawn(army) {
        GameManager.#unitsToSpawn[GameManager.#nextId++] = army;
    }

    static spawn() {
        if (!GameManager.mySpawn.spawning) {
            const id = Object.keys(this.#unitsToSpawn).find(id => this.#unitsToSpawn[id].length);
            if (id !== undefined) {
                const creep = GameManager.mySpawn.spawnCreep(this.#unitsToSpawn[id][0].parts).object;
                if (creep) {
                    creep["data"] = { army: id, action: this.#unitsToSpawn[id].shift().action };
                    creep["data"].action(creep);
                }
            }
        }
    }

    static action() {
        this.myCreeps.forEach(creep => {
            if (creep["data"].action) {
                creep["data"].action();
            }
        });
    }

    static get armyCount() {
        return Object.keys(this.armies).length;
    }

    static armyUnitsCount(creep) {
        return this.armies[creep["data"].army].length;
    }

    static armyHasGathered(creep, gatheringPoint, gatheringRange) {
        const armyId = creep["data"].army;
        if (this.armyCompleted(creep)) {
            let maxDistance = -1;
            let distance = 0;
            for (let armyCreep of this.armies[armyId]) {
                distance = utils.getRange(armyCreep, gatheringPoint);
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

    static armyCompleted(creep) {
        const armyId = creep["data"].army;
        return this.#unitsToSpawn[armyId].length === 0 && armyId in this.armies;
    }

    static addMessage(message, position) {
        this.#messages.push({ message: message, position: { x: position.x, y: position.y - 0.5 } });
    }

    static drawMessages() {
        this.#visual.clear();
        this.#messages.forEach(message => this.#visual.text(
            message.message,
            message.position,
            this.#visualStyle
        ));
        this.#messages = [];
    }
}
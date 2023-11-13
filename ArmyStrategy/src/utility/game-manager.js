import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import * as visual from "game/visual";

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

    static updateCache() {
        this.myCreeps = [];
        this.myDamagedCreeps = [];
        this.enemies = [];
        this.containers = [];
        this.sources = [];

        utils.getObjectsByPrototype(prototypes.Creep).forEach(creep => {
            if (creep.my) {
                this.myCreeps.push(creep);
                if (creep.hits < creep.hitsMax) {
                    this.myDamagedCreeps.push(creep);
                }
            } else {
                this.enemies.push(creep);
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
    }

    static getCreeps(filter) {
        return utils.getObjectsByPrototype(prototypes.Creep).filter(filter);
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
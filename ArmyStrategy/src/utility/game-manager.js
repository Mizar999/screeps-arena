import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";

export class GameManager {
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

    static getEnemyWithRange(creep) {
        const result = { enemy: utils.findClosestByRange(creep, GameManager.enemies), range: -1 };
        if (result.enemy) {
            result.range = utils.getRange(creep, result.enemy);
        }
        return result;
    }
}
import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";

export class GameManager {
    /** @type {prototypes.Creep[]} */ static myCreeps;
    static myDamagedCreeps;
    static mySpawn;
    static enemies;
    static enemySpawn;
    static containes;
    static sources;

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
}
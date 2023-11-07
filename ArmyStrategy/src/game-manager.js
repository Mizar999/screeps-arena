import * as utils from "game/utils";
import * as prototypes from "game/prototypes";

export class GameManager {
    static myCreeps;
    static myDamagedCreeps;
    static mySpawn;
    static enemies;
    static enemySpawn;

    static updateCache() {
        this.myCreeps = [];
        this.myDamagedCreeps = [];
        this.enemies = [];
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
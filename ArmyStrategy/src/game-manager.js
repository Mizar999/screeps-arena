import * as utils from "game/utils";
import * as prototypes from "game/prototypes";

export class GameManager {
    static myCreeps;
    static mySpawn;
    static enemies;
    static enemySpawn;

    static updateCache() {
        this.myCreeps = [];
        this.enemies = [];
        utils.getObjectsByPrototype(prototypes.Creep).forEach(creep => {
            if (creep.my) {
                this.myCreeps.push(creep);
            } else {
                this.enemies.push(creep);
            }
        });

        utils.getObjectsByPrototype(prototypes.StructureSpawn).forEach(spawn => {
            if(spawn.my) {
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
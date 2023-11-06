import * as utils from "game/utils";
import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import { Data } from "./data";

prototypes.Creep.prototype["bodyPartCount"] = function (type) {
    let count = 0;
    this.body.forEach(part => {
        if (part.type === type) {
            ++count;
        }
    });
    return count;
}

prototypes.Creep.prototype["getNearestCreep"] = function (creeps) {
    return utils.findClosestByPath(this, creeps);
}

prototypes.Creep.prototype["getNearestSource"] = function () {
    const energy = utils.getObjectsByPrototype(prototypes.Source).filter(source => source.energy > 0);
    return utils.findClosestByPath(this, energy);
}

prototypes.Creep.prototype["getNearestContainer"] = function () {
    const energy = utils.getObjectsByPrototype(prototypes.StructureContainer).filter(container => container.store.getUsedCapacity(constants.RESOURCE_ENERGY) > 0);
    return utils.findClosestByPath(this, energy);
}

prototypes.Creep.prototype["data"] = undefined;
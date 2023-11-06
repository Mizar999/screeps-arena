import { ArmyBody } from "./army-body";

export class Army {
    constructor(data) {
        /** @type {ArmyBody[]} */ this.armyBodies = data.armyBodies || []
        this.state = data.state || {};
        this.strategy = data.strategy || undefined;
    }

    armySize() {
        let size = 0;
        for (let body of this.armyBodies) {
            size += body.count;
        }
        return size;
    }
}
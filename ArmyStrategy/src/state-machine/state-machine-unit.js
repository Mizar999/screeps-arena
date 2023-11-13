import * as prototypes from "game/prototypes";
import { GameManager } from "../utility/game-manager";
import { StateMachine } from "./state-machine";

export class StateMachineUnit extends StateMachine {
    /** @type {prototypes.Creep} */ _creep;

    constructor(parts = []) {
        super();
        this.parts = parts;
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context) {
        super.update(context);
        if (this.debug && this._creep) {
            let hitsPercent = 0;
            if (this._creep.hitsMax > 0) {
                hitsPercent = Math.round(this._creep.hits * 100 / this._creep.hitsMax);
            }
            GameManager.addMessage(this._creep.id + ": " + this._currentState.name + " | " + hitsPercent + "%", this._creep);
        }
    }
}
import * as prototypes from "game/prototypes";
import { GameManager } from "../utility/game-manager";
import { StateMachine } from "./state-machine";

export class StateMachineUnit extends StateMachine {
    /** @type {prototypes.Creep} */ creep;

    constructor() {
        super();
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context) {
        super.update(context);
        if (this.debug && this.creep && this.creep.exists) {
            let hitsPercent = 0;
            if (this.creep.hitsMax > 0) {
                hitsPercent = Math.round(this.creep.hits * 100 / this.creep.hitsMax);
            }
            GameManager.addMessage(this.creep.id + ": " + this._currentState.name + " | " + hitsPercent + "%", this.creep);
        }
    }

    /**
     * @param {StateMachineUnit} stateMachineUnit 
     * @returns 
     */
    static getAction(stateMachineUnit) {
        const stateMachine = stateMachineUnit;
        return function (creep) {
            if (!stateMachine.creep) {
                stateMachine.creep = creep;
                stateMachine.start();
            }
            stateMachine.update();
        }
    }
}
import * as prototypes from "game/prototypes";
import { StateMachine } from "./state-machine";

export class StateMachineUnit extends StateMachine {
    /** @type {prototypes.Creep} */ _creep;

    constructor(parts = []) {
        super();
        this.parts = parts;
    }
}
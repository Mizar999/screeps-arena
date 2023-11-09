import { StateMachine } from "./state-machine";

export class StateMachineUnit extends StateMachine {
    constructor(parts = []) {
        super();
        this.parts = parts;
    }
}
const { StateMachine } = require("./state-machine");

export class StateMachineUnit extends StateMachine {
    constructor(parts = []) {
        super();
        this.parts = parts;
    }
}
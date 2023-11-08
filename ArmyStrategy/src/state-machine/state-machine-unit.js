const { StateMachine } = require("./state-machine");

export class StateMachineUnit extends StateMachine {
    constructor(states, startState, parts = []) {
        super(states, startState);
        this.parts = parts;
    }
}
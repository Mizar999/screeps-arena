export class StateMachine {
    constructor(states, startState, context = {}) {
        this.context = context;
        this.states = { ...states };
        this.currentState = this.states[startState];
        this.currentState.enter(this.context);
    }

    update(args = {}) {
        const nextState = this.currentState.update(this.context, args);
        if (nextState && nextState in this.states) {
            this.currentState = this.states[nextState];
            this.currentState.enter(this.context);
        }
    }
}
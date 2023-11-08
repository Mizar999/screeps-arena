/**
 * @typedef {Object} State
 * @property {() => void} enter
 * @property {(context: Object) => void} tick
 * @property {() => void} exit
 * @property {{condition: () => boolean, nextState: string}[]} transitions
 */

export class StateMachine {
    #states;
    #currentState;
    /**
     * @param {Object.<string, State>} states All possible states of this state machine
     * @param {string} startState Initial state
     */
    constructor(states, startState) {
        this.#states = states;
        this.#currentState = this.#states[startState];
        this.#currentState.enter();
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context = {}) {
        this.#checkTransition();
        this.#currentState.tick(context);
    }

    #checkTransition() {
        for (let transition of this.#currentState.transitions) {
            if (transition.condition()) {
                this.#currentState.exit();
                this.#currentState = this.#states[transition.nextState];
                this.#currentState.enter();
                return;
            }
        }
    }
}
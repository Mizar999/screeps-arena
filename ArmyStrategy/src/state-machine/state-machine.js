/**
 * @typedef {Object} State An object representing the state
 * @property {string} State.name The name of the state
 * @property {() => void} [State.enter] Initializes the state after transitioning to it
 * @property {(context: Object) => void} State.update Processes the state logic on every update
 * @property {() => void} [State.exit] Gets called before transitioning away from this state
 * @property {{nextState: string, condition: () => boolean}[]} State.transitions Defines all possible transitions for this state and their corresponding conditions
 */

export class StateMachine {
    #states;
    /** @type {State} */ #currentState;

    constructor(debug = true) {
        this.debug = debug;
        this.#states = {};
    }

    /**
     * @param {State|State[]} states An object representing a state or an array of states
     */
    addStates(states) {
        if(states.constructor === "Array") {
            states.forEach(state => this.#states[state.name] = state);
        } else {
            this.#states[states.name] = states;
        }
    }

    /**
     * @param {string} initialState Name of the initial state
     */
    start(initialState) {
        if (this.debug) {
            console.log("starting", this.constructor.name, "in state", initialState);
        }
        this.#currentState = this.#states[initialState];
        if (typeof this.#currentState.enter === "function") {
            this.#currentState.enter();
        }
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context = {}) {
        this.#checkTransition();
        this.#currentState.update(context);
    }

    #checkTransition() {
        for (let transition of this.#currentState.transitions) {
            if (transition.condition()) {
                if (this.debug) {
                    console.log(this.constructor.name, "transitions from", this.#currentState.name, "to", transition.nextState);
                }

                if (typeof this.#currentState.exit === "function") {
                    this.#currentState.exit();
                }

                this.#currentState = this.#states[transition.nextState];
                if (typeof this.#currentState.enter === "function") {
                    this.#currentState.enter();
                }
                return;
            }
        }
    }
}
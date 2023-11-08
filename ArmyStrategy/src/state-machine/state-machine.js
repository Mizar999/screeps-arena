/**
 * @typedef {Object} State An object representing the state
 * @property {() => void} [state.enter] Initializes the state after transitioning to it
 * @property {(context: Object) => void} state.update Processes the state logic on every update
 * @property {() => void} [state.exit] Gets called before transitioning away from this state
 * @property {{nextState: string, condition: () => boolean}[]} state.transitions Defines all possible transitions for this state and their corresponding conditions
 */

export class StateMachine {
    #states;
    /** @type {State} */ #currentState;
    /** @type {string} */ #currentStateName;

    constructor(debug = true) {
        this.debug = debug;
        this.#states = {};
    }

    /**
     * @param {string} name Name of the state
     * @param {State} state An object representing the state
     */
    addState(name, state) {
        this.#states[name] = state;
    }

    /**
     * @param {string} initialState Name of the initial state
     */
    start(initialState) {
        if (this.debug) {
            console.log("starting", this.constructor.name, "in state", initialState);
        }
        this.#currentState = this.#states[initialState];
        this.#currentState.enter();
        this.#currentStateName = initialState;
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
                    console.log(this.constructor.name, "transitions from", this.#currentStateName, "to", transition.nextState);
                }

                if (typeof this.#currentState.exit === "function") {
                    this.#currentState.exit();
                }

                this.#currentState = this.#states[transition.nextState];
                this.#currentStateName = transition.nextState;
                if (typeof this.#currentState.enter === "function") {
                    this.#currentState.enter();
                }
                return;
            }
        }
    }
}
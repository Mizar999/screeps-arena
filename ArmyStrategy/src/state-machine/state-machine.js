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
    /** @type {State} */ _currentState;

    constructor(debug = true) {
        this.debug = debug;
        this.#states = {};
    }

    /**
     * @param {(State | State[])} states An object representing a state or an array of states
     */
    addStates(states) {
        if (Array.isArray(states)) {
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
        this._currentState = this.#states[initialState];
        if (typeof this._currentState.enter === "function") {
            this._currentState.enter();
        }
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context = {}) {
        this.#checkTransition();
        this._currentState.update(context);
    }

    #checkTransition() {
        for (let transition of this._currentState.transitions) {
            if (transition.condition()) {
                if (this.debug) {
                    console.log(this.constructor.name, "transitions from", this._currentState.name, "to", transition.nextState);
                }

                if (typeof this._currentState.exit === "function") {
                    this._currentState.exit();
                }

                this._currentState = this.#states[transition.nextState];
                if (typeof this._currentState.enter === "function") {
                    this._currentState.enter();
                }
                return;
            }
        }
    }
}
import * as constants from "game/constants";
import { } from "../../utility/creep-extension";
import { GameManager } from "../../utility/game-manager";
import { StateMachine } from "../state-machine";
import { StateMachineUnit } from "../state-machine-unit";
import { Withdrawer } from "../unit/withdrawer";
import { MeleeAttacker } from "../unit/melee-attacker";

export class AlphaSpawnAndSwamp extends StateMachine {
    static #withdrawerParts = [
        constants.MOVE, constants.MOVE, constants.MOVE,
        constants.CARRY, constants.CARRY, constants.CARRY, constants.CARRY
    ];
    static #meleeAttackerParts = [
        constants.TOUGH, constants.TOUGH, constants.TOUGH, constants.TOUGH,
        constants.MOVE, constants.MOVE, constants.MOVE, constants.MOVE, constants.MOVE, constants.MOVE,
        constants.ATTACK, constants.ATTACK, constants.ATTACK
    ];
    #gatheringPointOffsetY = [3, -3];
    #gatheringPointOffsetYIndex = 0;

    static #stateName = {
        SPAWN_ENERGY_COLLECTOR: "spawnEnergyCollector",
        SPAWN_ATTACKERS: "spawnAttackers",
        IDLE: "idle",
    };

    #states = [
        {
            name: AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR,
            isInitialState: true,
            update: (context) => {
                GameManager.addArmyToSpawn([{ parts: AlphaSpawnAndSwamp.#withdrawerParts, action: StateMachineUnit.getAction(new Withdrawer()) }]);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_ATTACKERS, condition: () => GameManager.armyCount >= 1 },
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => GameManager.armyCount >= 5 },
            ]
        },
        {
            name: AlphaSpawnAndSwamp.#stateName.SPAWN_ATTACKERS,
            update: (context) => {
                const spawn = GameManager.mySpawn;
                const gatheringPoint = { x: spawn.x, y: spawn.y + this.#gatheringPointOffsetY[this.#gatheringPointOffsetYIndex] };
                this.#gatheringPointOffsetYIndex = (this.#gatheringPointOffsetYIndex + 1) % this.#gatheringPointOffsetY.length;

                let count = 4;
                const attackers = [];
                while (count-- > 0) {
                    attackers.push({ parts: AlphaSpawnAndSwamp.#meleeAttackerParts, action: StateMachineUnit.getAction(new MeleeAttacker(gatheringPoint)) });
                }
                GameManager.addArmyToSpawn(attackers);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => GameManager.armyCount >= 12 },
            ]
        },
        {
            name: AlphaSpawnAndSwamp.#stateName.IDLE,
            update: (context) => { },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_ATTACKERS, condition: () => GameManager.armyCount < 6 },
            ]
        },
    ];

    constructor() {
        super();
        this.addStates(this.#states);
        this.start();
    }

    /**
     * @param {Object} [context] Optional object representing a context
     */
    update(context) {
        super.update(context);
        if (this.debug) {
            GameManager.addMessage(this._currentState.name, GameManager.mySpawn);
        }
    }
}
import { } from "../../utility/creep-extension";
import { GameManager } from "../../utility/game-manager";
import { ArmyManager } from "../../utility/army-manager";
import { StateMachine } from "../state-machine";
import { Withdrawer } from "../unit/withdrawer";
import { MeleeAttacker } from "../unit/MeleeAttacker";

export class AlphaSpawnAndSwamp extends StateMachine {
    #gatheringPointOffsetY = [5, -5];
    #gatheringPointOffsetYIndex = 0;

    static #stateName = {
        SPAWN_ENERGY_COLLECTOR: "spawnEnergyCollector",
        SPAWN_MELEE_ATTACKER: "spawnMeleeAttacker",
        IDLE: "idle",
    };

    #states = [
        {
            name: AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR,
            update: (context) => {
                ArmyManager.addArmy([
                    new Withdrawer(),
                ]);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_MELEE_ATTACKER, condition: () => ArmyManager.armyCount >= 1 && ArmyManager.armyCount < 5 },
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => ArmyManager.armyCount >= 5 },
            ]
        },
        {
            name: AlphaSpawnAndSwamp.#stateName.SPAWN_MELEE_ATTACKER,
            update: (context) => {
                const spawn = GameManager.mySpawn;
                const gatheringPoint = { x: spawn.x, y: spawn.y + this.#gatheringPointOffsetY[this.#gatheringPointOffsetYIndex] };
                this.#gatheringPointOffsetYIndex = (this.#gatheringPointOffsetYIndex + 1) % this.#gatheringPointOffsetY.length;

                ArmyManager.addArmy([
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                    new MeleeAttacker(gatheringPoint),
                ]);
            },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.IDLE, condition: () => ArmyManager.armyCount >= 5 },
            ]
        },
        {
            name: AlphaSpawnAndSwamp.#stateName.IDLE,
            update: (context) => { },
            transitions: [
                { nextState: AlphaSpawnAndSwamp.#stateName.SPAWN_MELEE_ATTACKER, condition: () => ArmyManager.armyCount < 5 },
            ]
        },
    ];

    constructor() {
        super();
        this.addStates(this.#states);
        this.start(AlphaSpawnAndSwamp.#stateName.SPAWN_ENERGY_COLLECTOR);
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
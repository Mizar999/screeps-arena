import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import { } from "../../utility/creep-extension";
import { GameManager } from "../../utility/game-manager";
import { StateMachineUnit } from "../state-machine-unit";

export class MeleeAttacker extends StateMachineUnit {
    #gatheringPoint;
    #hasGathered = false;
    static #distance = 3;
    static #gatheringDistance = 2;

    static #stateName = {
        GATHERING: "gathering",
        ATTACK_OBJECTIVE: "attackObjective",
        ATTACK_ENEMY: "attackEnemy",
    };

    #states = [
        {
            name: MeleeAttacker.#stateName.GATHERING,
            isInitialState: true,
            enter: () => {
                if (!this.#gatheringPoint) {
                    this.#gatheringPoint = { x: GameManager.mySpawn.x, y: GameManager.mySpawn.y + 3 };
                }
            },
            update: (context) => {
                this.creep.moveTo(this.#gatheringPoint);
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#hasValidAttackTarget() },
                {
                    nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
                    condition: (context) => {
                        this.#hasGathered = GameManager.armyHasGathered(this.creep, this.#gatheringPoint, MeleeAttacker.#gatheringDistance);
                        return this.#hasGathered;
                    }
                },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
            update: (context) => {
                const enemySpawn = GameManager.enemySpawn;
                if (this.creep.attack(enemySpawn) !== constants.OK) {
                    this.creep.moveTo(enemySpawn);
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#hasValidAttackTarget() },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_ENEMY,
            update: (context) => {
                if (this.creep["data"].validTarget) {
                    if (this.creep.attack(this.creep["data"].target) !== constants.OK) {
                        this.creep.moveTo(this.creep["data"].target);
                    }
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE, condition: () => this.#hasGathered && !this.#hasValidAttackTarget() },
                { nextState: MeleeAttacker.#stateName.GATHERING, condition: () => !this.#hasGathered && !this.creep["data"].validTarget },
            ]
        },
    ];

    constructor(gatheringPoint = undefined) {
        super();
        this.#gatheringPoint = gatheringPoint;
        this.addStates(this.#states);
    }

    #hasValidAttackTarget() {
        this.creep["data"].validTarget = this.creep["bodyPartCount"](constants.ATTACK) > 0 && this.creep["data"].range >= 0 && this.creep["data"].range <= MeleeAttacker.#distance;
        return this.creep["data"].validTarget;
    }
}
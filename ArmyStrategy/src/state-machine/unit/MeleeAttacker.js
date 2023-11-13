import * as prototypes from "game/prototypes";
import * as constants from "game/constants";
import { ArmyManager } from "../../utility/army-manager";
import { GameManager } from "../../utility/game-manager";
import { StateMachineUnit } from "../state-machine-unit";

export class MeleeAttacker extends StateMachineUnit {
    #gatheringPoint;
    #attackTarget;
    #hasGathered = false;
    static #gatheringRange = 2;
    static #attackRange = 4;

    static #stateName = {
        SET_CREEP: "setCreep",
        GATHERING: "gathering",
        ATTACK_OBJECTIVE: "attackObjective",
        ATTACK_ENEMY: "attackEnemy",
    };

    #states = [
        {
            name: MeleeAttacker.#stateName.SET_CREEP,
            update: (context) => { },
            transitions: [
                {
                    nextState: MeleeAttacker.#stateName.GATHERING,
                    condition: (context) => {
                        if (context.creep) {
                            this._creep = context.creep;
                        }
                        return this._creep !== undefined;
                    }
                },
            ]
        },
        {
            name: MeleeAttacker.#stateName.GATHERING,
            enter: () => {
                if (!this.#gatheringPoint) {
                    const spawn = GameManager.mySpawn;
                    this.#gatheringPoint = { x: spawn.x, y: spawn.y + 5 };
                }
            },
            update: (context) => {
                this._creep.moveTo(this.#gatheringPoint);
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#findAttackTarget() },
                {
                    nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
                    condition: (context) => {
                        this.#hasGathered = ArmyManager.armyHasGathered(context, this.#gatheringPoint, MeleeAttacker.#gatheringRange);
                        return this.#hasGathered;
                    }
                },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_OBJECTIVE,
            update: (context) => {
                const enemySpawn = GameManager.enemySpawn;
                if (this._creep.attack(enemySpawn) !== constants.OK) {
                    this._creep.moveTo(enemySpawn);
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_ENEMY, condition: () => this.#findAttackTarget() },
            ]
        },
        {
            name: MeleeAttacker.#stateName.ATTACK_ENEMY,
            update: (context) => {
                if (this.#attackTarget) {
                    if (this._creep.attack(this.#attackTarget.target) !== constants.OK) {
                        this._creep.moveTo(this.#attackTarget.target);
                    }
                }
            },
            transitions: [
                { nextState: MeleeAttacker.#stateName.ATTACK_OBJECTIVE, condition: () => this.#hasGathered && !this.#findAttackTarget() },
                { nextState: MeleeAttacker.#stateName.GATHERING, condition: () => !this.#hasGathered && !this.#findAttackTarget() },
            ]
        },
    ];

    /**
     * @param {prototypes.Position} gatheringPoint 
     */
    constructor(gatheringPoint) {
        super([constants.TOUGH, constants.TOUGH, constants.TOUGH, constants.TOUGH, constants.MOVE, constants.MOVE, constants.MOVE, constants.ATTACK, constants.ATTACK, constants.ATTACK]);
        this.#gatheringPoint = gatheringPoint;

        this.addStates(this.#states);
        this.start(MeleeAttacker.#stateName.SET_CREEP);
    }

    #findAttackTarget() {
        this.#attackTarget = GameManager.getPositionsWithRange(this._creep, GameManager.enemies);
        return this.#attackTarget.target && this.#attackTarget.range <= MeleeAttacker.#attackRange;
    }
}
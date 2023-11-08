import * as game from "game";
import { StateMachine } from "./state-machine";
import { AlphaSpawnAndSwamp } from "./arena/alpha-spawn-and-swamp";

export class ArenaStrategyFactory {
    /**
     * @return {StateMachine}
     */
    static getStateMachine() {
        try {
            //@ts-ignore
            const arenaName = game.arenaInfo.name;
            console.log(arenaName);

            switch (arenaName) {
                case "Spawn and Swamp":
                    return new AlphaSpawnAndSwamp();
            }
        } catch (e) {
            console.log(e);
        }

        // TODO Implement a default state machine strategy
        return new AlphaSpawnAndSwamp();
    }
}
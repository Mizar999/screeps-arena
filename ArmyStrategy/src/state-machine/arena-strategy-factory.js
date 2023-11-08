import * as game from "game";
import { StateMachine } from "./state-machine";

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
                // TODO implement me
                case "Spawn and Swamp":
                    break;
            }
        } catch (e) {
            console.log(e);
        }
        // TODO Implement default strategy
        return undefined;
    }
}
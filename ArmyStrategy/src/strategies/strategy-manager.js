import * as game from "game";
import { AlphaSpawnAndSwamp } from "./alpha-spawn-and-swamp";

export class StrategyManager {
    static getStrategy() {
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
        // TODO Implement default strategy
        return new AlphaSpawnAndSwamp();
    }
}
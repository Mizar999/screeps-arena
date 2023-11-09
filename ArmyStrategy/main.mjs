import { GameManager } from "./src/utility/game-manager";
import { ArmyManager } from "./src/utility/army-manager";
import { ArenaStrategyFactory } from "./src/state-machine/arena-strategy-factory";
import { StateMachine } from "./src/state-machine/state-machine";

let /** @type {StateMachine} */ arenaStrategyMachine;
export function loop() {
    GameManager.updateCache();
    if (!arenaStrategyMachine) {
        arenaStrategyMachine = ArenaStrategyFactory.getStateMachine();
    }

    try { ArmyManager.cleanup(); } catch (e) { console.log(e); }

    try { arenaStrategyMachine.update() } catch (e) { console.log(e); }
    try { ArmyManager.update(); } catch (e) { console.log(e); }
    try { ArmyManager.spawn(); } catch (e) { console.log(e); }
}
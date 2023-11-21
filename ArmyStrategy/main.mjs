import { GameManager } from "./src/utility/game-manager";
import { ArenaStrategyFactory } from "./src/state-machine/arena-strategy-factory";
import { StateMachine } from "./src/state-machine/state-machine";

let /** @type {StateMachine} */ arenaStrategyMachine;
export function loop() {
    GameManager.updateCache();
    if (!arenaStrategyMachine) {
        arenaStrategyMachine = ArenaStrategyFactory.getStateMachine();
    }
    try { arenaStrategyMachine.update() } catch (e) { console.log(e); }

    try { GameManager.action() } catch (e) { console.log(e); }
    GameManager.drawMessages();
    GameManager.spawn();
}
import { GameManager } from "./src/utility/game-manager";
import { ArmyManager } from "./src/utility/army-manager";
import { ArenaStrategyFactory } from "./src/state-machine/arena-strategy-factory";
import { StateMachine } from "./src/state-machine/state-machine";

let /** @type {StateMachine} */ machine;
export function loop() {
    GameManager.updateCache();
    if (!machine) {
        machine = ArenaStrategyFactory.getStateMachine();
    }

    try { ArmyManager.cleanup(); } catch (e) { console.log(e); }

    try { machine.update() } catch (e) { console.log(e); }
    try { ArmyManager.applyStrategies(); } catch (e) { console.log(e); }
    try { ArmyManager.spawn(); } catch (e) { console.log(e); }
}
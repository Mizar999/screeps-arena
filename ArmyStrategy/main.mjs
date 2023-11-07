import { GameManager } from "./src/game-manager";
import { ArmyManager } from "./src/army-manager";
import { StrategyManager } from "./src/strategies/strategy-manager";
import { StateMachine } from "./src/state-machine";

let machine;
export function loop() {
    GameManager.updateCache();
    if (!machine) {
        machine = new StateMachine({
            spawn: {
                enter: function (context) {

                },
                update: function (context) {

                }
            }
        }, "spawn");
    }

    try { ArmyManager.cleanup(); } catch (e) { console.log(e); }

    try { machine.createArmy(); } catch (e) { console.log(e); }
    try { ArmyManager.applyStrategies(); } catch (e) { console.log(e); }
    try { ArmyManager.spawn(); } catch (e) { console.log(e); }
}
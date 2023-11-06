import { GameManager } from "./src/game-manager";
import { ArmyManager } from "./src/army-manager";
import { StrategyManager } from "./src/strategies/strategy-manager";

let strategy;
export function loop() {
    GameManager.updateCache();

    if (!strategy) {
        strategy = StrategyManager.getStrategy();
    }
    try { strategy.createArmy(); } catch (e) { console.log(e); }

    try { ArmyManager.cleanup(); } catch (e) { console.log(e); }
    try { ArmyManager.applyStrategies(); } catch (e) { console.log(e); }
    try { ArmyManager.spawn(); } catch (e) { console.log(e); }
}
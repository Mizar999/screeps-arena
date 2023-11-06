export class ArmyBody {
    constructor(count, parts) {
        this.count = count === undefined ? 0 : count;
        this.parts = parts || [];
    }
}
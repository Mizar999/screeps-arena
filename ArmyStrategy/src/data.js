export class Data {
    constructor(data) {
        if (!data) {
            data = {};
        }

        this.army = data.army || 0;
    }
}
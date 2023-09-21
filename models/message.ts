export class Message {
    constructor(
        public latitude: number,
        public longitude: number,
        public temperature: number,
        public humidity: number,
        public battery: number,
    ) { }

    static fromObject(object: any): Message {
        return new Message(
            object.lat,
            object.long,
            object.temperature,
            object.humidity,
            object.battery,
        );
    }
}
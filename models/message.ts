export class Message {
    constructor(
        public deviceId: string,
        public cummulativeEnergyKwh: number,
        public boxStatus: string,
        public latitude: number,
        public longitude: number,
        public timestamp: number,
    ) { }

    static fromObject(object: any): Message {
        return new Message(
            object.device_id,
            object.cumm_energy_kwh,
            object.box_status,
            object.lat,
            object.lng,
            object.timestamp
        );
    }
}
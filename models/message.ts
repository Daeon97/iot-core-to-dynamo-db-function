export class Message {
    constructor(
        public deviceId: string,
        public cummulativeEnergyKwh: number,
        public boxStatus: string,
    ) { }

    static fromObject(object: any): Message {
        return new Message(
            object.device_id,
            object.cumm_energy_kwh,
            object.box_status,
        );
    }
}
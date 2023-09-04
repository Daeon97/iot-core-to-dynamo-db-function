import { IoTEvent } from 'aws-lambda';
import { DynamoDBDelegate as DBDelegate } from './dynamo-db-delegate';
import { Message } from '../models/message';

export class IoTCoreDelegate {
    constructor() { }

    public async processMessages(event: IoTEvent): Promise<void> {

        const message: Message | null = this.computeMessage(event);

        if (message) {
            const dbDelegate = new DBDelegate();
            await dbDelegate.storeDataToDatabase(message);
        }

        return;
    }

    private computeMessage(event: IoTEvent): Message | null {
        

        let message: Message | null;

        try {
            const eventString: string = JSON.stringify(event);
            const eventObject: any = JSON.parse(eventString);

            message = Message.fromObject(eventObject);
        } catch (_) {
            message = null;
        }

        return message;
    }
}
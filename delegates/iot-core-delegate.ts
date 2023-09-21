import { IoTEvent } from 'aws-lambda';
import { DynamoDBDelegate as DBDelegate } from './dynamo-db-delegate';
import { Message } from '../models/message';

export class IoTCoreDelegate {
    constructor(private readonly event: IoTEvent) { }

    public async processMessages(): Promise<void> {
        const message: Message | null = this.computeMessage();

        if (message) {
            const dbDelegate: DBDelegate = new DBDelegate(message);
            await dbDelegate.storeDataToDatabase();
        }

        return;
    }

    private computeMessage(): Message | null {
        let message: Message | null = null;

        try {
            const eventString: string = JSON.stringify(this.event);
            const eventObject: any = JSON.parse(eventString);

            message = Message.fromObject(eventObject);
        } catch (_) {
            message = null;
        }

        return message;
    }
}
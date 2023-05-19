import { IoTEvent } from 'aws-lambda';
import { DynamoDBDelegate as DBDelegate } from './dynamo-db-delegate';
import { Message } from '../models/message';

export class IoTCoreDelegate {
    constructor() { }

    public async processMessages(event: IoTEvent): Promise<void> {
        console.log("IoTCoreDelegate: ", "processMessages called");

        let message: Message | null = this.computeMessage(event);

        if (message) {
            console.info(
                "IoTCoreDelegate: ",
                "processMessages: ",
                "if message block: ",
                `message is ${JSON.parse(JSON.stringify(message))}`
            );

            const dbDelegate = new DBDelegate();
            await dbDelegate.storeDataToDatabase(message);
        }

        return;
    }

    private computeMessage(event: IoTEvent): Message | null {
        console.log("IoTCoreDelegate: ", "computeMessage called");

        let message: Message | null;

        try {
            const eventString: string = JSON.stringify(event);
            const eventObject: any = JSON.parse(eventString);

            message = Message.fromObject(eventObject);

            console.info(
                "IoTCoreDelegate: ",
                "computeMessage: ",
                "try block: ",
                `eventString is ${eventString}, eventObject is ${eventObject}, message is ${message}`
            );
        } catch (_) {
            message = null;

            console.error(
                "IoTCoreDelegate: ",
                "computeMessage: ",
                "catch block: ",
                `message is ${message}`
            );
        }

        return message;
    }
}
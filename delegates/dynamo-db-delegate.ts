import { DynamoDB as DB } from "aws-sdk";
import { Message } from '../models/message';

export class DynamoDBDelegate {
    constructor(private message: Message) { }

    public storeDataToDatabase(): void {
        const {
            nodeId,
            latitude,
            longitude,
            batteryLevel
        } = this.message;

        // const db = new DB();
        // const availableTables = db.listTables();

    }
}
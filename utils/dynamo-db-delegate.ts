import { DynamoDB as DB } from "aws-sdk";

export class DynamoDBDelegate {
    constructor(private database: DB) {}

    public storeDataToDatabase(): void {}
}
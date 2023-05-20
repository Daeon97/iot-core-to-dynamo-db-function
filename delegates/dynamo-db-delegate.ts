import { AWSError, DynamoDB as DB } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Message } from '../models/message';

export class DynamoDBDelegate {
    constructor() { }

    public async storeDataToDatabase(message: Message): Promise<void> {
        console.log("DynamoDBDelegate: ", "storeDataToDatabase called");

        const tableName: string = "NimTrack";

        const db: DB = new DB();

        await this.createTableIfNotExist({ tableName, db });

        await this.putOrUpdateItem({ tableName, db, message });

        return;
    }

    private async createTableIfNotExist({ tableName, db }: { tableName: string; db: DB }): Promise<void> {
        console.log("DynamoDBDelegate: ", "createTableIfNotExist called");

        const describeTable: PromiseResult<DB.DescribeTableOutput, AWSError> = await db.describeTable({ TableName: tableName }, async (err, data) => {
            if (err) {
                console.info(
                    "DynamoDBDelegate: ",
                    "createTableIfNotExist: ",
                    "db.describeTable: ",
                    "if err block: ",
                    `err is ${JSON.parse(JSON.stringify(err))}`,
                    `data is ${JSON.parse(JSON.stringify(data))}`
                );

                await this.createTable({ tableName, db });
            } else {
                console.info(
                    "DynamoDBDelegate: ",
                    "createTableIfNotExist: ",
                    "db.describeTable: ",
                    "else block: ",
                    `err is ${JSON.parse(JSON.stringify(err))}`,
                    `data is ${JSON.parse(JSON.stringify(data))}`
                );
            }
        }).promise();

        await db.waitFor("tableExists", { TableName: tableName }).promise();

        console.info(
            "DynamoDBDelegate: ",
            "createTableIfNotExist: ",
            `table status is ${describeTable.Table?.TableStatus}`
        );

        return;
    }

    private createTable({ tableName, db }: { tableName: string; db: DB }): Promise<PromiseResult<DB.CreateTableOutput, AWSError>> {
        console.log("DynamoDBDelegate: ", "createTable called");

        return db.createTable({
            TableName: tableName,
            AttributeDefinitions: [
                {
                    AttributeName: "id",
                    AttributeType: "N"
                },
                {
                    AttributeName: "name",
                    AttributeType: "S"
                },
                {
                    AttributeName: "data",
                    AttributeType: "L"
                }
            ], KeySchema: [
                {
                    AttributeName: "id",
                    KeyType: "HASH"
                },
                {
                    AttributeName: "name",
                    KeyType: "RANGE"
                },
                {
                    AttributeName: "data",
                    KeyType: "RANGE"
                }
            ]
        }).promise();
    }

    private async putOrUpdateItem({ tableName, db, message }: { tableName: string; db: DB; message: Message }): Promise<void> {
        console.log("DynamoDBDelegate: ", "putOrUpdateItem called");

        const getItem: PromiseResult<DB.GetItemOutput, AWSError> = await db.getItem({
            TableName: tableName,
            Key: {
                "id": {
                    N: `${message.nodeId}`
                }
            }
        }).promise();

        if (getItem.Item) {
            console.info(
                "DynamoDBDelegate: ",
                "putOrUpdateItem: ",
                "db.describeTable: ",
                "if block: ",
                `item is ${JSON.parse(JSON.stringify(getItem.Item))}`
            );

            await this.updateItem({ tableName, db, message });
        } else {
            console.info(
                "DynamoDBDelegate: ",
                "putOrUpdateItem: ",
                "db.describeTable: ",
                "else block: ",
                `item is ${JSON.parse(JSON.stringify(getItem.Item))}`
            );

            await this.putItem({ tableName, db, message });
        }

        return;
    }

    private updateItem({ tableName, db, message }: { tableName: string; db: DB; message: Message }): Promise<PromiseResult<DB.UpdateItemOutput, AWSError>> {
        console.log("DynamoDBDelegate: ", "updateItem called");

        return db.updateItem({
            TableName: tableName,
            Key: {
                "id": {
                    N: `${message.nodeId}`
                }
            },
            ExpressionAttributeNames: {
                "#d": "data"
            },
            ExpressionAttributeValues: {
                ":d": {
                    M: {
                        "lat_lng": {
                            L: [
                                {
                                    N: `${message.latitude}`,
                                },
                                {
                                    N: `${message.longitude}`
                                }
                            ]
                        },
                        "battery_level": {
                            N: `${message.batteryLevel}`
                        }
                    }
                }
            },
            UpdateExpression: "ADD #d = :d"
        }).promise();
    }

    private putItem({ tableName, db, message }: { tableName: string; db: DB; message: Message }): Promise<PromiseResult<DB.PutItemOutput, AWSError>> {
        console.log("DynamoDBDelegate: ", "putItem called");

        return db.putItem({
            TableName: tableName,
            Item: {
                "id": {
                    N: `${message.nodeId}`
                },
                "name": {
                    S: ""
                },
                "data": {
                    L: [
                        {
                            M: {
                                "lat_lng": {
                                    L: [
                                        {
                                            N: `${message.latitude}`,
                                        },
                                        {
                                            N: `${message.longitude}`
                                        }
                                    ]
                                },
                                "battery_level": {
                                    N: `${message.batteryLevel}`
                                }
                            }
                        }
                    ]
                }
            }
        }).promise();
    }
}
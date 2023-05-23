import { AWSError, DynamoDB as DB } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { encodeBase32 } from 'geohashing';
import { Message } from '../models/message';

export class DynamoDBDelegate {
    constructor() { }

    public async storeDataToDatabase(message: Message): Promise<void> {
        console.log("DynamoDBDelegate: ", "storeDataToDatabase called");

        const tableName: string = "iot-core-to-dynamo-db-function-NimTrack-LO5XF2CCGVSZ";

        const db: DB = new DB();

        /*
        ** createTableIfNotExist is kindda redundant since the table is
        ** automatically provisioned as soon as the function is deployed
        ** the first time but will nonetheless leave it here
        */
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
                    `err is ${JSON.stringify(err)}`,
                    `, data is ${JSON.stringify(data)}`
                );

                await this.createTable({ tableName, db });
            } else {
                console.info(
                    "DynamoDBDelegate: ",
                    "createTableIfNotExist: ",
                    "db.describeTable: ",
                    "else block: ",
                    `err is ${JSON.stringify(err)}`,
                    `, data is ${JSON.stringify(data)}`
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
                }
            ], KeySchema: [
                {
                    AttributeName: "id",
                    KeyType: "HASH"
                },
                {
                    AttributeName: "name",
                    KeyType: "RANGE"
                }
            ]
        }).promise();
    }

    private async putOrUpdateItem({ tableName, db, message }: { tableName: string; db: DB; message: Message }): Promise<void> {
        console.log("DynamoDBDelegate: ", "putOrUpdateItem called");

        try {
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
                    "getItem.Item: ",
                    "try block: ",
                    "if block: ",
                    `item is ${JSON.stringify(getItem.Item)}`
                );

                await this.updateItem({ tableName, db, message });
            } else {
                console.info(
                    "DynamoDBDelegate: ",
                    "putOrUpdateItem: ",
                    "getItem.Item: ",
                    "try block: ",
                    "else block: ",
                    `item is ${JSON.stringify(getItem.Item)}`
                );

                await this.putItem({ tableName, db, message });
            }
        } catch (err) {
            console.info(
                "DynamoDBDelegate: ",
                "putOrUpdateItem: ",
                "catch block: ",
                `error is ${JSON.stringify(err)}`
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
                    ...this.computeDataItem({ message })
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
                    S: `${message.nodeId}`
                },
                "data": {
                    L: [
                        {
                            ...this.computeDataItem({ message })
                        }
                    ]
                }
            }
        }).promise();
    }

    private computeDataItem({ message }: { message: Message }): {
        M: {
            timestamp: {
                N: string;
            };
            coordinates: {
                M: {
                    hash: {
                        S: string;
                    };
                    lat_lng: {
                        L: {
                            N: string;
                        }[];
                    };
                };
            };
            battery_level: {
                N: string;
            };
        };
    } {
        console.log("DynamoDBDelegate: ", "computeDataItem called");

        return {
            M: {
                "timestamp": {
                    N: `${this.computeUnixTimestamp()}`
                },
                "coordinates": {
                    M: {
                        "hash": {
                            S: `${this.computeGeohash({
                                latitude: message.latitude,
                                longitude: message.longitude
                            })}`
                        },
                        "lat_lng": {
                            L: [
                                {
                                    N: `${message.latitude}`,
                                },
                                {
                                    N: `${message.longitude}`
                                }
                            ]
                        }
                    }
                },
                "battery_level": {
                    N: `${message.batteryLevel}`
                }
            }
        };
    }

    private computeGeohash({ latitude, longitude }: { latitude: number, longitude: number }): string {
        console.log("DynamoDBDelegate: ", "computeGeohash called");

        const hash: string = encodeBase32(latitude, longitude, 9);
        console.info(
            "DynamoDBDelegate: ",
            "computeGeohash: ",
            `provided latitude is ${latitude}`,
            `, provided longitude is ${longitude}`,
            `, computed geohash is ${hash}`
        );

        return hash;
    }

    private computeUnixTimestamp(): number {
        console.log("DynamoDBDelegate: ", "computeUnixTimestamp called");

        const date: Date = new Date();
        const unixTimestamp: number = Math.floor(date.getTime() / 1000);

        console.info(
            "DynamoDBDelegate: ",
            "computeUnixTimestamp: ",
            `date is ${date}`,
            `, unix timestamp is ${unixTimestamp}`
        );

        return unixTimestamp;
    }
}
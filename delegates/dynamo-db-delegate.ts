import { AWSError, DynamoDB as DB } from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';
import { encodeBase32 } from 'geohashing';
import { Message } from '../models/message';

export class DynamoDBDelegate {
    constructor() { }

    public async storeDataToDatabase(message: Message): Promise<void> {
        const tableName: string = "iot-core-to-dynamo-db-function-NimTrack-1880A47TAKPHB";

        const db: DB = new DB();

        await this.putOrUpdateItem({ tableName, db, message });

        return;
    }

    private async putOrUpdateItem({ tableName, db, message }: { tableName: string; db: DB; message: Message }): Promise<void> {
        const getItem: PromiseResult<DB.GetItemOutput, AWSError> = await db.getItem({
            TableName: tableName,
            Key: {
                "id": {
                    N: `${message.nodeId}`
                }
            }
        }).promise();

        if (getItem.$response.data && getItem.Item) {
            await this.updateItem({ tableName, db, attributeMap: getItem.Item, message });

        } else {
            await this.putItem({ tableName, db, message });
        }

        return;
    }

    private updateItem({ tableName, db, attributeMap, message }: { tableName: string; db: DB; attributeMap: DB.AttributeMap, message: Message }): Promise<PromiseResult<DB.UpdateItemOutput, AWSError>> {
        const item: { [key: string]: any } = Converter.unmarshall(attributeMap);
        const data: [{ [key: string]: any }] = item.data;
        const nextIndex: number = data.length;

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
                ":d": this.computeDataItem({ message })
            },
            UpdateExpression: `SET #d[${nextIndex}] = :d`
        }).promise();
    }

    private putItem({ tableName, db, message }: { tableName: string; db: DB; message: Message }): Promise<PromiseResult<DB.PutItemOutput, AWSError>> {
        return db.putItem({
            TableName: tableName,
            Item: {
                "id": {
                    N: `${message.nodeId}`
                },
                "data": {
                    L: [
                        this.computeDataItem({ message })
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
        const hash: string = encodeBase32(latitude, longitude, 9);
        
        return hash;
    }

    private computeUnixTimestamp(): number {
        const date: Date = new Date();
        const unixTimestamp: number = date.getTime();

        return unixTimestamp;
    }
}
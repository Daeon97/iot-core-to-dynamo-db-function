import { AWSError, DynamoDB as DB } from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';
import { encodeBase32 } from 'geohashing';
import { Message } from '../models/message';

export class DynamoDBDelegate {
    constructor(private readonly message: Message) { }

    public async storeDataToDatabase(): Promise<void> {
        const tableName: string = "iot-core-to-dynamo-db-function-for-efotainer-Efotainer-1VEDNASSC1ZTF";

        const db: DB = new DB();

        await this.maybePutItem({ tableName, db });

        return;
    }

    private async maybePutItem({ tableName, db }: { tableName: string; db: DB }): Promise<void | PromiseResult<DB.PutItemOutput, AWSError>> {
        const getLastItem: PromiseResult<DB.QueryOutput, AWSError> = await db.query({
            TableName: tableName,
            ConsistentRead: true,
            ScanIndexForward: false,
            ExpressionAttributeNames: {
                "#N": "Name",
                "#T": "Timestamp"
            },
            ExpressionAttributeValues: {
                ":n": {
                    "S": "Efotainer"
                }
            },
            ProjectionExpression: "#N, #T",
            KeyConditionExpression: "#N = :n",
            Limit: 1
        }).promise();

        if (getLastItem.$response.data) {
            const databaseItems: DB.ItemList | undefined = getLastItem.Items;

            let items: { [key: string]: any }[] = [];

            databaseItems?.forEach(attributeMap => {
                const item: { [key: string]: any } = Converter.unmarshall(attributeMap);
                items.push(item);
            });

            if (!databaseItems || databaseItems.length === 0 || ((items.at(0)?.Timestamp - this.unixTimestamp) > 5 * 60 * 1000)) {
                await this.putItem({ tableName, db });
            }
        }

        return;
    }

    private async putItem({ tableName, db }: { tableName: string; db: DB }): Promise<PromiseResult<DB.PutItemOutput, AWSError>> {
        return db.putItem({
            TableName: tableName,
            Item: {
                "Name": {
                    S: "Efotainer"
                },
                "Timestamp": {
                    N: `${this.unixTimestamp}`
                },
                "Coordinates": {
                    M: {
                        "Hash": {
                            S: `${this.computeGeohash({
                                latitude: this.message.latitude,
                                longitude: this.message.longitude
                            })}`
                        },
                        "Position": {
                            L: [
                                {
                                    N: `${this.message.latitude}`,
                                },
                                {
                                    N: `${this.message.longitude}`
                                }
                            ]
                        }
                    }
                },
                "Temperature": {
                    N: `${this.message.temperature}`
                },
                "Humidity": {
                    N: `${this.message.humidity}`
                },
                "Battery": {
                    N: `${this.message.battery}`
                }
            }
        }).promise();
    }

    private computeGeohash({ latitude, longitude }: { latitude: number, longitude: number }): string {
        const hash: string = encodeBase32(latitude, longitude, 9);

        return hash;
    }

    private get unixTimestamp(): number {
        const date: Date = new Date();
        const timestamp: number = date.getTime();

        return timestamp;
    }
}
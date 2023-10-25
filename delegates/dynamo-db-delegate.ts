import { AWSError, DynamoDB as DB } from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Message } from '../models/message';

export class DynamoDBDelegate {
    constructor(private readonly message: Message) { }

    public async storeDataToDatabase(): Promise<void> {
        const tableName: string = "iot-core-to-dynamo-db-function-for-vectar-clean-energy-VectarCleanEnergy-14JT144FQWD4Q";

        const db: DB = new DB();

        await this.putItem({ tableName, db });

        return;
    }

    private async putItem({ tableName, db }: { tableName: string; db: DB }): Promise<PromiseResult<DB.PutItemOutput, AWSError>> {
        const currentEnergyKwh: number = await this.computeCurrentEnergyKwh({ tableName, db });

        return db.putItem({
            TableName: tableName,
            Item: {
                "DeviceId": {
                    S: `${this.message.deviceId}`
                },
                "BoxStatus": {
                    S: `${this.message.boxStatus}`
                },
                "CurrentEnergyKwh": {
                    N: `${currentEnergyKwh}`
                },
                "CummulativeEnergyKwh": {
                    N: `${this.message.cummulativeEnergyKwh}`
                },
                "Timestamp": {
                    N: `${this.unixTimestamp}`
                }
            }
        }).promise();
    }

    private async computeCurrentEnergyKwh({ tableName, db }: { tableName: string; db: DB }): Promise<number> {
        let currentEnergyKwh: number = 0;

        const getLastItem: PromiseResult<DB.QueryOutput, AWSError> = await db.query({
            TableName: tableName,
            ConsistentRead: true,
            ScanIndexForward: false,
            ExpressionAttributeNames: {
                "#D": "DeviceId",
                "#C": "CummulativeEnergyKwh"
            },
            ExpressionAttributeValues: {
                ":d": {
                    "S": "0001"
                }
            },
            ProjectionExpression: "#D, #C",
            KeyConditionExpression: "#D = :d",
            Limit: 1
        }).promise();

        if (getLastItem.$response.data) {
            const databaseItems: DB.ItemList | undefined = getLastItem.Items;

            if (databaseItems && databaseItems.length > 0) {
                const lastItem: { [key: string]: any } = Converter.unmarshall(databaseItems.at(0)!);

                currentEnergyKwh = this.message.cummulativeEnergyKwh - (lastItem.CummulativeEnergyKwh as number);
            } else {
                currentEnergyKwh = this.message.cummulativeEnergyKwh;
            }
        }

        return currentEnergyKwh;
    }

    private get unixTimestamp(): number {
        const date: Date = new Date();
        const timestamp: number = date.getTime();

        return timestamp;
    }
}
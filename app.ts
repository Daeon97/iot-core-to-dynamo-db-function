import { IoTHandler } from 'aws-lambda';
import { IoTEvents } from 'aws-sdk';

export const lambdaHandler: IoTHandler = (event, context) => {
    console.log(`event => ${JSON.stringify(event)}, context => ${JSON.stringify(context)}`);
};
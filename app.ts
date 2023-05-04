import { Handler, IoTHandler } from 'aws-lambda';
import { IoTEvents } from 'aws-sdk';

export const lambdaHandler: IoTHandler = (event, context, _) => {
    console.log(`event => ${event}, context => ${context}`);
};
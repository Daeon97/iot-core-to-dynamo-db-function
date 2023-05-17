import { IoTHandler } from 'aws-lambda';
import { IoTCoreDelegate } from './delegates/iot-core-delegate';

export const lambdaHandler: IoTHandler = (event) => {
    const iotCoreDelegate = new IoTCoreDelegate();
    iotCoreDelegate.processMessages(event);
};
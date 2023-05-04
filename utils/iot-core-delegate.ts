// import { Iot as IoT }  from 'aws-sdk';
import { BadMessageFormatException } from './exception';
import { DynamoDBDelegate as DBDelegate } from './dynamo-db-delegate';

enum IoTMessageFormat { Json, PlainText };

export class IotCoreDelegate {
    constructor(private payload: any) {}

    /**
     * checkAndEnsureCorrectMessageFormat checks and ensures
     * that the message is in the desired format. To avoid
     * using try/catch statements in this codebase, this function
     * returns a [BadMessageFormatException] if the message is not
     * in the desired format or [true] if it is in the desired format
     */
    private checkAndEnsureCorrectMessageFormat(format: IoTMessageFormat): boolean | BadMessageFormatException {
        let isCorrectFormat: boolean;
        try {
            switch (format) {
                case IoTMessageFormat.PlainText:
                    return new BadMessageFormatException("IoTMessageFormat.PlainText has not yet been implemented. Please use IoTMessageFormat.Json instead");
                case IoTMessageFormat.Json:
                    isCorrectFormat = true;
                    break;
            }
            return isCorrectFormat;
        } catch (_) {
            return new BadMessageFormatException();
        }
    }

    /**
     * processMessagesFromTopic reads messages from a topic and
     * checks and ensures that the message is in the desired format
     * before extracting each data from the message and storing the
     * extracted data to Dynamo DB. If [checkAndEnsureCorrectMessageFormat]
     * returns a [BadMessageFormatException] the message is ignored
     */
    public processMessagesFromTopic(topic: string, format: IoTMessageFormat = IoTMessageFormat.Json): void {
        const correctMessageFormat = this.checkAndEnsureCorrectMessageFormat(format);

        if(correctMessageFormat === true) {
            //.
        } else if(correctMessageFormat instanceof BadMessageFormatException) {
            //.
        }
    }
}
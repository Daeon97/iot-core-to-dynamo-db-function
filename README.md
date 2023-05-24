### IotCoreToDynamoDbFunction
A simple AWS Lambda function that moves data from AWS IoT Core to AWS Dynamo DB.
This function uses a nested approach to store data in Dynamo DB, which may not be
sufficient when the nest becomes too large as the system scales as this will exceed
the maximum Dynamo DB item size limit of 400KB. A spawn, inspired by this shortcoming
which can be found at https://github.com/Daeon97/iot-core-to-dynamo-db-function-2
tries to use a more flattened approach to store data in Dynamo DB
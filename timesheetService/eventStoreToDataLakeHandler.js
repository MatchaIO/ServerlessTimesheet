"use strict";
var AWS = require("aws-sdk");
let firehose = new AWS.Firehose({ apiVersion: "2015-08-04" });
var parse = AWS.DynamoDB.Converter.output;
AWS.config.setPromisesDependency(require("q").Promise);

module.exports.handler = (event, context, callback) => {
  console.log({ "message": "Recieved records", "event": event });
  let mapped_records = event.Records.map(parseToOriginalEvent).map(serialiseForFirehose);
  console.log("Records to be sent: " + mapped_records.join(""));

  let params = createPutRecordsBatchParams(mapped_records);
  firehose.putRecordBatch(params)
    .promise()
    .then((data) => {
      console.log({ "message": "putRecordBatch success:", "data": data });
      callback(null, `Successfully processed ${event.Records.length} records.`);
    })
    .catch((error) => {
      console.error({ "message": "putRecordBatch failure:", "exception": error, "stack": error.stack });
      callback(error);
    })
    .done();
};

function parseToOriginalEvent(dynamoDbStreamRecord) {
  let record = parse({ "M": dynamoDbStreamRecord.dynamodb.NewImage });//Convert the DynamoDb NewImage stream record to a useable JSON object that represents what we actually wanterd to persist
  let businessEventAsObject = JSON.parse(record.event);
  let sourceLambdaEventAsObject = JSON.parse(record.eventsMetadata.sourceLambdaEvent);
  record.event = businessEventAsObject;
  record.eventsMetadata.sourceLambdaEvent = sourceLambdaEventAsObject;
  return record;
}
function serialiseForFirehose(record) {
  return { "Data": JSON.stringify(record).replace(/(?:\r\n|\r|\n)/g, "\\n") + "\\n" };
}
function createPutRecordsBatchParams(mapped_records){
  return {
    DeliveryStreamName: `${process.env.SERVICE}-firehose`,
    Records: mapped_records
  };
}
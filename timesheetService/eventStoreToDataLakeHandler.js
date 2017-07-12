"use strict";
var AWS = require("aws-sdk");
let firehose = new AWS.Firehose({ apiVersion: "2015-08-04" });
var parse = AWS.DynamoDB.Converter.output;
AWS.config.setPromisesDependency(require("q").Promise);

module.exports.handler = (event, context, callback) => {
  console.log({ "message": "Recieved records", "event": event });
  let json_records = event.Records.map(parseToOriginalEvent).map(serialiseForFirehose);
  console.log("Records to be sent: " + JSON.stringify(json_records.join("")));
  let mapped_records = json_records.map(mapForFirehose);

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
  record.event = businessEventAsObject;  
  return record;
}
function serialiseForFirehose(record) {
  return JSON.stringify(record).replace(/(?:\r\n|\r|\n)/g, "\\n") + "\n";
}
function mapForFirehose(flattenedJson) {
  return { "Data": flattenedJson };
}
function createPutRecordsBatchParams(mapped_records){
  return {
    DeliveryStreamName: `${process.env.SERVICE}-firehose`,
    Records: mapped_records
  };
}
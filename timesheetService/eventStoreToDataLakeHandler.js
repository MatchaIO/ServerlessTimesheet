"use strict";
var AWS = require("aws-sdk");
let firehose = new AWS.Firehose({ apiVersion: "2015-08-04" });
AWS.config.setPromisesDependency(require("q").Promise);

module.exports.handler = (event, context, callback) => {
  let json_records = event.Records.map(function (rec) { return JSON.stringify(rec["dynamodb"]).replace(/(?:\r\n|\r|\n)/g, "\\n") + "\\n"; });
  let mapped_records = json_records.map(function (rec) { return { "Data": rec }; });
  console.log("Records to be sent: " + json_records.join(""));

  let params = {
    DeliveryStreamName: `${process.env.SERVICE}-firehose`,
    Records: mapped_records
  };
  firehose.putRecordBatch(params)
    .promise()
    .then((data) => {
      console.log("putRecordBatch success:");
      console.log(data);
      callback(null, `Successfully processed ${event.Records.length} records.`);
    })
    .catch((error) => {
      console.error("putRecordBatch success:");
      console.error(err, err.stack);
      callback(err);
    })
    .done();
};
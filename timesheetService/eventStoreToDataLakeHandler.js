"use strict";
var AWS = require('aws-sdk');
console.log('Loading function');
let firehose = new AWS.Firehose({
    apiVersion: '2015-08-04',
});
let tableName = "Timesheets";

exports.handler = (event, context, callback) => {
    let json_records = event.Records.map(function(rec) { return JSON.stringify(rec['dynamodb']).replace(/(?:\r\n|\r|\n)/g, '\\n') + '\\n'; });
    let mapped_records = json_records.map(function(rec){ return {'Data': rec }; });
    console.log('Records to be sent: ' + json_records.join(''));

    let params = {
      DeliveryStreamName:  "${tableName}-firehose",
      Records: mapped_records
    };
    firehose.putRecordBatch(params, function(err, data) {
      if (err) {
        console.error(err, err.stack);
      }
      else{
        console.log("putRecordBatch success:");  
        console.log(data);
      }
    });
    callback(null, 'Successfully processed ${event.Records.length} records.');
};
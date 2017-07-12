"use strict";
var AWS = require("aws-sdk");
console.log("Loading function");
let sns = new AWS.SNS({ apiVersion: "2010-03-31" });
let topicArn = null;

`${process.env.SERVICE}-firehose`,

module.exports.handler = (event, context, callback) => {
  setTopicArn(context);
  let json_records = event.Records.map(function (rec) { 
    let record = rec["dynamodb"];
    if(record.hasOwnProperty("eventsMetadata") && record.eventsMetadata.hasOwnProperty("sourceLambdaEvent")){
      delete record.eventsMetadata.sourceLambdaEvent;//We really dont (or at least should not) care about this in downstream handlers and its just message bloat
    }    
    return JSON.stringify(record);
  });  
  console.log("Records to be published: " + json_records.join(""));

  for (var json_record in json_records) {
    let params = {
      Message: json_record,      
      TopicArn: topicArn
    };

    sns.publish(params, function(err, data) {
      if (err) {
        console.error("sns.publish failed:");
        console.error(err, err.stack);
        callback(err); 
        return;
      }
      else {
        console.log("sns.publish success:");
        console.log(data);
      }
    });
  }

  callback(null, `Successfully processed ${event.Records.length} records.`); //TODO Callback for failed attempt!!!
};

function setTopicArn(context){
  if(topicArn === null){
    let accountId = context.invokedFunctionArn.split(":")[4];
    topicArn = `arn:aws:sns:${process.env.REGION}:${accountId}:${process.env.SERVICE}-sns-topic`;
  }
}
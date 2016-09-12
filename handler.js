'use strict';
var uuid = require('node-uuid');
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.createTimesheet = (event, context, callback) => {
  var timesheetCreated = {
    "id": uuid.v1(),
    "eventId": 1,
    "eventsMetadata": {
      "aggregateType": "Timesheet",
      "eventType": "TimesheetCreated",
      "timestamp": new Date(),
      "sourceLambdaEvent": JSON.stringify(event)
    },
    "event" : event.body
  };
  try{
    var dbRecord = { Item: timesheetCreated, TableName: "Timesheets"};
    dynamodb.put(dbRecord, (err, data) => {
        if (err) {
            console.error("Unable to save timesheet . Error JSON:", JSON.stringify(err));
            callback(new Error('[422] Unprocessable Entity - ' + JSON.stringify(dbRecord) + ' - error: ' + JSON.stringify(err)));
        } else {
            console.log("Created Timesheet. JSON:", JSON.stringify(data));
            var response = { message: 'Created Timesheet', timesheetId: timesheetCreated.id , data: data};
            callback(null, response)
        }
    });
  }
  catch(ex){
    callback(ex);
  }  
};
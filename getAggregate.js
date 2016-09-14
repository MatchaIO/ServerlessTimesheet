"use strict";
let AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-2"
});
//https://blogs.aws.amazon.com/javascript/post/Tx3BZ2DC4XARUGG/Support-for-Promises-in-the-SDK
AWS.config.setPromisesDependency(require('Q').Promise)

let Timesheet = require('./TimesheetAggregate');

let docClient = new AWS.DynamoDB.DocumentClient();
console.log("Querying for aggregate.");
// let timesheetId = "c799d740-78e9-11e6-95b0-31eed3ff8b95";
let timesheetId = "c799d740-78e9-11e6-95b0-";
let params = getParametersFor("Timesheets", timesheetId)
let timesheet = new Timesheet(timesheetId);
// docClient.query(params, function(err, data) {
    // if (err) {
        // console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    // } else {        
        // data.Items.forEach(function(item) {
          // timesheet._applyEvent(item)          
        // });
        // console.log(timesheet)
    // }
// });

docClient.query(params).promise()
         .then((data)=> {
            if(!(data && data.Items) || data.Items.length == 0) {
              throw new AggregateNotFoundException("Timesheets", timesheetId);
            }
            data.Items.forEach(function(item) {
              timesheet._applyEvent(item)          
            });
            console.log(timesheet)
          })
          .catch((error) => {
            console.error("Unable to query. Error: " + error, JSON.stringify(error, null, 2));
          })
          .done();

function AggregateNotFoundException(tableName, id) {
   this.tableName = tableName;
   this.id = id;
   this.toString = () => {
      return "Can not find aggregate from table '" + this.tableName + "' with id '" + this.id +"'.";
   };
}
function getParametersFor(tableName, id){
  // we could pass in the aggregate here and get the table name (aggregateInstance.constructor.name +'s') and id (aggregateInstance.id)
  return {
    TableName : tableName,
    KeyConditionExpression: "id = :v_id",
    ExpressionAttributeValues: { ":v_id": id }
  };
}


"use strict";
var AWS = require("aws-sdk");
var validate = require("validate.js");
AWS.config.update({
  region: "ap-southeast-2"
});
const SEED_VERSION = 0;
class AggregateBase{
  constructor(uuid) {
    this.id = uuid;
    this.version = SEED_VERSION;
    this._uncommittedEvents = [];
    this._routeEvents = {};//Must be overridden in inherited classes
  };
  }
}
var Timesheet = function(uuid){
  var self = this;
  
  self.id = uuid;
  self.version = SEED_VERSION;
  self._uncommittedEvents = [];
  _routeEvents = {
    "TimesheetCreated": function(timesheetCreated){} 
  };
  
  self._applyEvent = function(record){
    var route = _routeEvents[record.eventsMetadata.eventType];
    route(record.event);
    ++ self.version;
  }
  self._raiseEvent = function(event){
    var mappedEvent = {
      "id": event.id,
      "eventId": event.eventId,
      "eventsMetadata": {
        "aggregateType": "Timesheet",
        "eventType": event.eventType,
        "timestamp": new Date(),
        "sourceLambdaEvent": event.sourceLambdaEvent
      },
      "event" : event.event
    };    
    self._applyEvent(mappedEvent);
    self._uncommittedEvents.push(mappedEvent);
  }
  self.create = function(timesheetCreatedPayload){
    if (self.version != SEED_VERSION) throw new InvalidOperationException("Create can only be executed as the first action.");
    var timesheetCreatedEvent = {
      "id": uuid.v1(),
      "eventId": 1,
      "eventType": "TimesheetCreated",
      "sourceLambdaEvent": JSON.stringify(timesheetCreatedPayload),
      "event" : timesheetCreatedPayload.body
    };
    self._raiseEvent(timesheetCreatedEvent);
  }
}

let docClient = new AWS.DynamoDB.DocumentClient();
console.log(docClient);
console.log("Querying for aggregate.");
var timesheetId = "c799d740-78e9-11e6-95b0-31eed3ff8b95";
var params = {
    TableName : "Timesheets",
    KeyConditionExpression: "id = :v_id",
    ExpressionAttributeValues: {
        ":v_id":timesheetId
    }
};
docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        data.Items.forEach(function(item) {
          console.log("-------------------------");
          console.log(item);            
        });
    }
});

function InvalidOperationException(value) {
   this.value = value;
   this.message = "does not conform to the expected format for a zip code";
   this.toString = function() {
      return this.value + this.message;
   };
}



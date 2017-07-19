"use strict";
let AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
//https://blogs.aws.amazon.com/javascript/post/Tx3BZ2DC4XARUGG/Support-for-Promises-in-the-SDK
AWS.config.setPromisesDependency(require("q").Promise);

//The aggregate here is the newly constructed aggregate (ie new MyAggregate("myId")) with no events passed thru it.
function hydrateAggregate(aggregate){
  let docClient = new AWS.DynamoDB.DocumentClient();
  let params = getParametersFor(aggregate);
  return docClient.query(params).promise()
          .then((data)=> {
            if(!(data && data.Items) || data.Items.length == 0) {
              throw new AggregateNotFoundException(aggregate);
            }
            data.Items.forEach(function(item) {
              aggregate._applyEvent(item);          
            });
            return aggregate;
          })
          .catch((error) => {
            console.error("Unable to query. Error: " + error, JSON.stringify(error, null, 2));
            throw error;
          });
}
function saveAggregate(aggregateInstance){
  let tableName = getTableName();
  var params = { RequestItems: { } };
  params.RequestItems[tableName]= aggregateInstance._uncommittedEvents.map((e)=> { return { PutRequest: { Item: e } }; });
  let docClient = new AWS.DynamoDB.DocumentClient();
  return docClient.batchWrite(params)
    .promise()
    .then((data)=>{
      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property
      if(!isEmpty(data.UnprocessedItems)){
        console.error("All events were not saved", data, aggregateInstance);
        throw new Error("Save failed for aggregate: " + JSON.stringify(aggregateInstance));
      }
      return aggregateInstance;
    })
    .catch((err)=>{
      console.error(err);
      throw new Error("Save failed for aggregate: " + JSON.stringify(aggregateInstance));
    });  
}
function getParametersFor(aggregateInstance){
  return {
    TableName : getTableName(), 
    KeyConditionExpression: "id = :v_id",
    ExpressionAttributeValues: { ":v_id": aggregateInstance.id }
  };
}
function getTableName(){
  return `${process.env.SERVICE}-table`;  //Tightly coupled to the 'AWS::DynamoDB::Table' name in the Cloudformation resource section
}
function isEmpty(map) {
  for(var key in map) {
    return !map.hasOwnProperty(key);
  }
  return true;
}

const SEED_VERSION = 0;
class AggregateBase {  
  constructor(uuid) {
    if (!uuid)
      throw new InvalidOperationException("An Id must be supplied and should be a UUID.");
    this.id = uuid;
    this.version = this.SEED_VERSION;
    this._uncommittedEvents = [];
    this._routeEvents = {}; //Must be overridden in inherited classes
  }
  get aggregateType() {
    throw "Not Implemented";
  }
  get SEED_VERSION() {
    return SEED_VERSION;//const
  }

  _applyEvent(record) {
    let route = this._routeEvents[record.eventsMetadata.eventType];
    console.log({method: "_applyEvent", eventType: record.eventsMetadata.eventType, route: route.name, prototype: this.constructor.name}); 
    route(record.event);
    ++this.version; //Should equal this event's id
  }
  _raiseEvent(event) {
    let timestamp = Date.now(); //milliseconds elapsed since 1 January 1970 00:00:00 UTC
        
    let mappedEvent = {
      "id" : event.id,
      "timestamp" : timestamp,
      "eventId" : event.eventId,
      "eventsMetadata" : {
        "aggregateType" : this.aggregateType,
        "eventType" : event.eventType,
        "timestamp" : timestamp,
        "sourceLambdaEvent" : JSON.stringify(event.sourceLambdaEvent), // Can not save as a map as it has empty strings in the object, which DyDB is not keen on
      },
      "event" : JSON.stringify(event.event) // Can not save as a map as it has empty strings in the object, which DyDB is not keen on
    };
    this._applyEvent(mappedEvent);
    this._uncommittedEvents.push(mappedEvent);
  }
}
class InvalidOperationException extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidOperationException";
  }
}
class AggregateNotFoundException extends Error {
  constructor(aggregateInstance) {
    let tableName = getTableName();
    let id = aggregateInstance.id;
    let message = `Can not find aggregate from table ${tableName}' with id '${id}'.`;
    super(message);
    this.name = "AggregateNotFoundException";
  }
}
module.exports = {
  hydrateAggregate : hydrateAggregate,
  saveAggregate: saveAggregate,
  AggregateBase: AggregateBase,
  InvalidOperationException: InvalidOperationException
};
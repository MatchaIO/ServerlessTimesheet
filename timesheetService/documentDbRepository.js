"use strict";
let AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-2"
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
  let tableName = getTableName(aggregateInstance);
  var params = { RequestItems: { } };
  params.RequestItems[tableName]= aggregateInstance._uncommittedEvents.map((e)=> { return { PutRequest: { Item: e } }; });
  let docClient = new AWS.DynamoDB.DocumentClient();
  return docClient.batchWrite(params)
    .promise()
    .then((unprocessedEvents)=>{
      if(unprocessedEvents.length != 0){
        console.error("All events were not saved", unprocessedEvents, aggregateInstance);
        throw new Error("Save failed for aggregate: " + JSON.stringify(aggregateInstance));
      }
      return aggregateInstance;
    });  
}

function AggregateNotFoundException(aggregateInstance) {
  this.tableName = getTableName(aggregateInstance);
  this.id = aggregateInstance.id;
  this.toString = () => {
    return "Can not find aggregate from table '" + this.tableName + "' with id '" + this.id +"'.";
  };
}
function getParametersFor(aggregateInstance){
  return {
    TableName : getTableName(aggregateInstance), 
    KeyConditionExpression: "id = :v_id",
    ExpressionAttributeValues: { ":v_id": aggregateInstance.id }
  };
}
function getTableName(aggregateInstance){
  return  aggregateInstance.constructor.name + "s";//Table name is pluralised, but it certainly does not have to be
}

module.exports = {
  hydrateAggregate : hydrateAggregate,
  saveAggregate: saveAggregate
};


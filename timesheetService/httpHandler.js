"use strict";
var uuid = require("uuid");
let Timesheet = require("./TimesheetAggregate");
let repository = require("./eventStore");
let Q = require("q");

module.exports.createTimesheet = (event, context, callback) => {
  Q.fcall(function () {
    let newTimesheet = new Timesheet(uuid.v4());
    newTimesheet.create(event);
    return newTimesheet;
  })
  .then(repository.saveAggregate)
  .then((savedTimesheet) => {
    callback(null, createCreatedResponse(savedTimesheet));
  })
  .catch((error) => {
    console.error(error);
    console.error("Unable to save timesheet . Error JSON:", JSON.stringify(error));
    callback(new Error("[422] Unprocessable Entity - " + JSON.stringify(event) + " - error: " + JSON.stringify(error)));
  })
  .done();
};

module.exports.updateTimesheet = (event, context, callback) => {
  let timesheetId = event.pathParameters.id;
  repository.hydrateAggregate(new Timesheet(timesheetId))
          .then((timesheet)=> {
            timesheet.update(event);
            repository.saveAggregate(timesheet)
              .then((unprocessedEntities)=> {
                if(unprocessedEntities.length !=0)
                  console.error({"unprocessedEntities" :unprocessedEntities}); //Um what to do here?
                console.log("Timesheet updated. JSON:", JSON.stringify(timesheet));
                callback(null, createUpdatedResponse(timesheet));
              })
              .catch((error) => {
                console.error(error);
                console.error("Unable to save timesheet . Error JSON:", JSON.stringify(error));
                callback(new Error("[422] Unprocessable Entity - " + JSON.stringify(event) + " - error: " + JSON.stringify(error)));
              });
          })
          .catch((error) => {
            console.error(error);
            console.error("Unable to retrieve timesheet . Error JSON:", JSON.stringify(error));
            callback(new Error("[404] Entity Not found - " + JSON.stringify(event) + " - error: " + JSON.stringify(error)));
          })
          .done();  
};

module.exports.submitTimesheet = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let timesheetId = event.pathParameters.id;
  repository.hydrateAggregate(new Timesheet(timesheetId))
          .then((timesheet)=> {
            timesheet.submit(event);
            repository.saveAggregate(timesheet)
              .then((unprocessedEntities)=> {
                if(unprocessedEntities.length !=0)
                  console.error({"unprocessedEntities" :unprocessedEntities}); //Um what to do here?
                callback(null, createSubmittedResponse(timesheet));
              })
              .catch((error) => {
                console.error(error);
                console.error("Unable to save timesheet . Error JSON:", JSON.stringify(error));
                callback(new Error("[422] Unprocessable Entity - " + JSON.stringify(event) + " - error: " + JSON.stringify(error)));
              });
          })
          .catch((error) => {
            console.error(error);
            console.error("Unable to retrieve timesheet . Error JSON:", JSON.stringify(error));
            callback(new Error("[404] Entity Not found - " + JSON.stringify(event) + " - error: " + JSON.stringify(error)));
          })
          .done();  
};

function createCreatedResponse(aggregate){
  console.log("Created " + aggregate.aggregateType + ". JSON:", JSON.stringify(aggregate));
  return {
    statusCode: 200,
    body: toCleanJson({ message: "Created " + aggregate.aggregateType, Id: aggregate.id , data: aggregate})
  };
}
function createUpdatedResponse(aggregate){
  console.log("Updated " + aggregate.aggregateType + ". JSON:", JSON.stringify(aggregate));
  return {
    statusCode: 200,
    body: toCleanJson({ message: "Updated " + aggregate.aggregateType, Id: aggregate.id , data: aggregate})
  };
}
function createSubmittedResponse(aggregate){
  console.log(`Submitted ${aggregate.aggregateType} : ${aggregate.id}. JSON: ${JSON.stringify(aggregate)}`);
  return {
    statusCode: 200,
    body: toCleanJson({ message: "Submitted " + aggregate.aggregateType, Id: aggregate.id , data: aggregate})
  };
}

function toCleanJson(object){
    return JSON.stringify(object, replacer);
}
  function replacer(key,value)
{
    if (key.startsWith("_")) return undefined;
    else return value;
}
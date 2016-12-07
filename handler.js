"use strict";
var uuid = require("node-uuid");
let Timesheet = require("./TimesheetAggregate");
let repository = require("./documentDbRepository");
let Q = require("q");

module.exports.createTimesheet = (event, context, callback) => {
  Q.fcall(function () {
    let newTimesheet = new Timesheet(uuid.v1());
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
  let timesheetId = event.path.id;
  repository.hydrateAggregate(new Timesheet(timesheetId))
          .then((timesheet)=> {
            timesheet.update(event);
            repository.saveAggregate(timesheet)
              .then((unprocessedEntities)=> {
                if(unprocessedEntities.length !=0)
                  console.error({"unprocessedEntities" :unprocessedEntities}); //Um what to do here?
                console.log("Timesheet updated. JSON:", JSON.stringify(timesheet));
                let response = { message: "Timesheet Updated", timesheetId: timesheet.id , data: timesheet};
                callback(null, response);
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
          });  
};

module.exports.submitTimesheet = (event, context, callback) => {
  let timesheetId = event.path.id;
  repository.hydrateAggregate(new Timesheet(timesheetId))
          .then((timesheet)=> {
            timesheet.submit(event);
            repository.saveAggregate(timesheet)
              .then((unprocessedEntities)=> {
                if(unprocessedEntities.length !=0)
                  console.error({"unprocessedEntities" :unprocessedEntities}); //Um what to do here?
                console.log("Timesheet submitted. JSON:", JSON.stringify(timesheet));
                let response = { message: "Timesheet Sumitted", timesheetId: timesheet.id , data: timesheet};
                callback(null, response);
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
          });  
};

function createCreatedResponse(aggregate){
  console.log("Created " + aggregate.aggregateType + ". JSON:", JSON.stringify(aggregate));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Created " + aggregate.aggregateType, Id: aggregate.id , data: aggregate})
  };
}
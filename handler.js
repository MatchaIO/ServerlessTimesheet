'use strict';
var uuid = require('node-uuid');
let Timesheet = require('./TimesheetAggregate');
let repository = require('./documentDbRepository');

module.exports.createTimesheet = (event, context, callback) => {
  var newTimesheet = new Timesheet(uuid.v1());
  newTimesheet.create(event);
  repository.saveAggregate(newTimesheet)
    .then((unprocessedEntities)=> {
      console.log("Created Timesheet. JSON:", JSON.stringify(newTimesheet));
      var response = { message: 'Created Timesheet', timesheetId: newTimesheet.id , data: newTimesheet};
      callback(null, response)
    })
    .catch((error) => {
      console.error(error);
      console.error("Unable to save timesheet . Error JSON:", JSON.stringify(error));
      callback(new Error('[422] Unprocessable Entity - ' + JSON.stringify(event) + ' - error: ' + JSON.stringify(error)));
    })
    .done();
};
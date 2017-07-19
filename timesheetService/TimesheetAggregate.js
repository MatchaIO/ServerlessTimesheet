"use strict";

var AggregateBase = require("./eventStore").AggregateBase;

class Timesheet extends AggregateBase {
  /* BEGIN command handlers - these take in request and raise events */
  create(createTimesheetPayload) {
    if (!this.isUninitialisedAggregate)
      throw new InvalidOperationException("Create can only be executed as the first action.");
    super._raiseEvent("TimesheetCreated", JSON.parse(createTimesheetPayload.body), createTimesheetPayload);
  }
  update(updateTimesheetPayload) {
    if (this.isUninitialisedAggregate)
      throw new InvalidOperationException("Can not update an uninitialised Aggregate, update can not be executed as the first action.");
    if(this.isSubmitted)
      throw new InvalidOperationException("Can not update a submitted timesheet.");
    super._raiseEvent("TimesheetUpdated", JSON.parse(updateTimesheetPayload.body), updateTimesheetPayload);
  }
  submit(submitTimesheetPayload){
    if (this.isUninitialisedAggregate)
      throw new InvalidOperationException("Can not submit an uninitialised Aggregate, submit can not be executed as the first action.");
    if(this.isSubmitted)
      throw new InvalidOperationException("Can not submit a timesheet that is already submitted.");
    super._raiseEvent("TimesheetSubmitted", JSON.parse(submitTimesheetPayload.body), submitTimesheetPayload);
  }
  /* END command handlers */
  
  /* eslint-disable  no-unused-vars */
  handleTimesheetCreated(timesheetCreated){}
  handleTimesheetUpdated(timesheetUpdated){}
  handleTimesheetSubmitted(timesheetUpdated){
    this.isSubmitted = true;
  }
  /* eslint-enable  no-unused-vars */

  constructor(uuid) {
    super(uuid);
    this._routeEvents = {
      //TODO - if i dont wrap the instance function below, 'this' is undefined in the execution of the method (?!). I probably need an ES6 adult to help here
      "TimesheetCreated" : (e) => { this.handleTimesheetCreated(e); },
      "TimesheetUpdated" : (e) => { this.handleTimesheetUpdated(e); },
      "TimesheetSubmitted" : (e) => { this.handleTimesheetSubmitted(e); } ,
    };
    this.isSubmitted = false;
  }
}

module.exports = Timesheet;
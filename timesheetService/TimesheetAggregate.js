"use strict";

var AggregateBase = require("./eventStore").AggregateBase;

class Timesheet extends AggregateBase {
  get aggregateType() {
    return "Timesheet";
  }

  create(createTimesheetPayload) {
    if (this.version != this.SEED_VERSION)
      throw new InvalidOperationException("Create can only be executed as the first action.");
    let timesheetCreatedEvent = {
      "id" : this.id,
      "eventId" : 1,
      "eventType" : "TimesheetCreated",
      "sourceLambdaEvent" : createTimesheetPayload,
      "event" : JSON.parse(createTimesheetPayload.body) 
    };
    super._raiseEvent(timesheetCreatedEvent);
  }
  update(updateTimesheetPayload) {
    if (this.version == this.SEED_VERSION)
      throw new InvalidOperationException("Can not update an uninitialised Aggregate, update can not be executed as the first action.");
    if(this.isSubmitted)
      throw new InvalidOperationException("Can not update a submitted timesheet.");
    let timesheetUpdatedEvent = {
      "id" : this.id,
      "eventId" : this.version + 1,
      "eventType" : "TimesheetUpdated",
      "sourceLambdaEvent" : updateTimesheetPayload,
      "event" : JSON.parse(updateTimesheetPayload.body)
    };
    super._raiseEvent(timesheetUpdatedEvent);
  }
  submit(submitTimesheetPayload){
    if (this.version == this.SEED_VERSION)
      throw new InvalidOperationException("Can not submit an uninitialised Aggregate, submit can not be executed as the first action.");
    if(this.isSubmitted)
      throw new InvalidOperationException("Can not submit a timesheet that is already submitted.");
    let submitTimesheetEvent = {
      "id" : this.id,
      "eventId" : this.version + 1,
      "eventType" : "TimesheetSubmitted",
      "sourceLambdaEvent" : submitTimesheetPayload,
      "event" : JSON.parse(submitTimesheetPayload.body)
    };
    super._raiseEvent(submitTimesheetEvent);
  }
 
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
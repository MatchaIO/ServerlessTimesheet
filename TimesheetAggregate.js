"use strict";
const SEED_VERSION = 0;

class AggregateBase {
  constructor(uuid) {
    this.id = uuid;
    this.version = SEED_VERSION;
    this._uncommittedEvents = [];
    this._routeEvents = {}; //Must be overridden in inherited classes
  }
  get aggregateType() {
    throw "Not Implemented"
  }
  _applyEvent(record) {
    var route = this._routeEvents[record.eventsMetadata.eventType];
    console.log({eventType: record.eventsMetadata.eventType, route: route}); 
    route(record.event);
    ++this.version;
  }
  _raiseEvent(event) {
    var mappedEvent = {
      "id" : event.id,
      "eventId" : event.eventId,
      "eventsMetadata" : {
        "aggregateType" : this.aggregateType,
        "eventType" : event.eventType,
        "timestamp" : Date.now(), //milliseconds elapsed since 1 January 1970 00:00:00 UTC
        "sourceLambdaEvent" : event.sourceLambdaEvent
      },
      "event" : event.event
    };
    this._applyEvent(mappedEvent);
    this._uncommittedEvents.push(mappedEvent);
  }
}

class Timesheet extends AggregateBase {
  get aggregateType() {
    return "Timesheet";
  }

  create(createTimesheetPayload) {
    if (this.version != SEED_VERSION)
      throw new InvalidOperationException("Create can only be executed as the first action.");
    var timesheetCreatedEvent = {
      "id" : this.id,
      "eventId" : 1,
      "eventType" : "TimesheetCreated",
      "sourceLambdaEvent" : JSON.stringify(createTimesheetPayload),
      "event" : createTimesheetPayload.body
    };
    super._raiseEvent(timesheetCreatedEvent);
  }
  update(updateTimesheetPayload) {
    if (this.version == SEED_VERSION)
      throw new InvalidOperationException("Can not update an uninitialised Aggregate, update can not be executed as the first action.");
    if(this.isSubmitted)
      throw new InvalidOperationException("Can not update a submitted timesheet.");
    var timesheetUpdatedEvent = {
      "id" : this.id,
      "eventId" : this.version + 1,
      "eventType" : "TimesheetUpdated",
      "sourceLambdaEvent" : JSON.stringify(updateTimesheetPayload),
      "event" : updateTimesheetPayload.body
    };
    super._raiseEvent(timesheetUpdatedEvent);
  }
  submit(submitTimesheetPayload){
    if (this.version == SEED_VERSION)
      throw new InvalidOperationException("Can not submit an uninitialised Aggregate, submit can not be executed as the first action.");
    if(this.isSubmitted)
      throw new InvalidOperationException("Can not submit a timesheet that is already submitted.");
    var submitTimesheetEvent = {
      "id" : this.id,
      "eventId" : this.version + 1,
      "eventType" : "TimesheetSubmitted",
      "sourceLambdaEvent" : JSON.stringify(submitTimesheetPayload),
      "event" : submitTimesheetPayload.body
    };
    super._raiseEvent(submitTimesheetEvent);
  }
  handleTimesheetCreated(timesheetCreated){}
  handleTimesheetUpdated(timesheetUpdated){}
  handleTimesheetSubmitted(timesheetUpdated){
    this.isSubmitted = true;
  }
  constructor(uuid) {
    super(uuid);
    var self = this;
    this._routeEvents = {
      //TODO - if i dont wrap the instance function below, 'this' is undefined in the execution of the method (?!). I probably need an ES6 adult to help here
      "TimesheetCreated" : (e) => { this.handleTimesheetCreated(e); },
      "TimesheetUpdated" : (e) => { this.handleTimesheetUpdated(e); },
      "TimesheetSubmitted" : (e) => { this.handleTimesheetSubmitted(e); } ,
    };
    this.isSubmitted = false;
  }
}
class InvalidOperationException {
  constrcutor(message){
   this.message = message;
   this.toString = function() {
      return "InvalidOperationException:" + this.message;
   };
  }
}
module.exports = Timesheet;
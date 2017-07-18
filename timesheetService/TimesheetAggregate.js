"use strict";
const SEED_VERSION = 0;

class AggregateBase {
  constructor(uuid) {
    if (!uuid)
      throw new InvalidOperationException("An Id must be supplied and should be a UUID.");
    this.id = uuid;
    this.version = SEED_VERSION;
    this._uncommittedEvents = [];
    this._routeEvents = {}; //Must be overridden in inherited classes
  }
  get aggregateType() {
    throw "Not Implemented";
  }

  _applyEvent(record) {
    let route = this._routeEvents[record.eventsMetadata.eventType];
    console.log({eventType: record.eventsMetadata.eventType, route: route}); 
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

class Timesheet extends AggregateBase {
  get aggregateType() {
    return "Timesheet";
  }

  create(createTimesheetPayload) {
    if (this.version != SEED_VERSION)
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
    if (this.version == SEED_VERSION)
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
    if (this.version == SEED_VERSION)
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
class InvalidOperationException {
  constructor(message){
    this.message = message;
    this.toString = function() {
      return "InvalidOperationException:" + this.message;
    };
  }
}
module.exports = {
  Timesheet:Timesheet,
  AggregateBase: AggregateBase,
  InvalidOperationException: InvalidOperationException  
};
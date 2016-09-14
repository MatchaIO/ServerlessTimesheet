"use strict";
var uuid = require('node-uuid');
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
        "timestamp" : new Date(),
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

  create(timesheetCreatedPayload) {
    if (this.version != SEED_VERSION)
      throw new InvalidOperationException("Create can only be executed as the first action.");
    var timesheetCreatedEvent = {
      "id" : uuid.v1(),
      "eventId" : 1,
      "eventType" : "TimesheetCreated",
      "sourceLambdaEvent" : JSON.stringify(timesheetCreatedPayload),
      "event" : timesheetCreatedPayload.body
    };
    super._raiseEvent(timesheetCreatedEvent);
  }
  handleTimesheetCreated(timesheetCreated){
    this.isSubmitted = false;
  }
  constructor(uuid) {
    super(uuid);
    var self = this;
    this._routeEvents = {
      //TODO - if i dont wrap the instance function below, 'this' is undefined in the execution of the method (?!). I probably need an ES6 adult to help here
      "TimesheetCreated" : (e) => this.handleTimesheetCreated(e) 
    };
    this.isSubmitted = false;
  }
}
module.exports = Timesheet
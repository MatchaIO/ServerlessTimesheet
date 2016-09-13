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
  constructor(uuid) {
    super(uuid);
    super._routeEvents = {
      "TimesheetCreated" : function (timesheetCreated) {}
    };
  }
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
}

var t = new Timesheet("magicguid123455");
t.create({ 
  "body":{
    "shifts" : [{
        "name" : "Monday",
        "startDateTime" : "2016-09-05T09:00:00+08:00",
        "endDateTime" : "2016-09-05T17:00:00+08:00",
        "breaks" : [3600000]
      }, {
        "name" : "Tuesday",
        "startDateTime" : "2016-09-06T09:00:00+08:00",
        "endDateTime" : "2016-09-06T17:00:00+08:00",
        "breaks" : [3600000]
      }, {
        "name" : "Wednesday",
        "startDateTime" : "2016-09-07T09:00:00+08:00",
        "endDateTime" : "2016-09-07T17:00:00+08:00",
        "breaks" : [3600000]
      }, {
        "name" : "Thursday",
        "startDateTime" : "2016-09-08T09:00:00+08:00",
        "endDateTime" : "2016-09-08T17:00:00+08:00",
        "breaks" : [3600000]
      }, {
        "name" : "Friday",
        "startDateTime" : "2016-09-09T09:00:00+08:00",
        "endDateTime" : "2016-09-09T16:00:00+08:00",
        "breaks" : [3600000],
        "notes" : {
          "text" : "Left early for a beer",
          //"isPrivate" : true
        }
      }
    ],
    "notes" : {
      "text" : "Remind the boss to approve",
      //"isPrivate" : true
    }
  }
})
console.log(t)
"use strict";
var uuid = require('node-uuid');
var Timesheet = require('../TimesheetAggregate');
var assert = require('assert');
describe('Timesheet', function() {
  describe('create', function() {
    it('raise a timesheetCreatedEvent', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      let cmd = create_createTimesheetCommand();
      t.create(cmd);
      assert(t._uncommittedEvents.length == 1, "expected a sinlge uncommited event");
      let createdEvent = t._uncommittedEvents[0];
      assert.deepEqual(cmd.body, createdEvent.event)
      assert.equal(createdEvent.id,  tsId);
      assert.equal(createdEvent.eventId,  1);
      assert.equal(createdEvent.eventsMetadata.eventType,  "TimesheetCreated");
      assert.equal(createdEvent.eventsMetadata.aggregateType,  "Timesheet");
    });
  });

  function create_createTimesheetCommand(){
    return { 
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
              "isPrivate" : true
            }
          }
        ],
        "notes" : {
          "text" : "Remind the boss to approve",
          "isPrivate" : true
        }
      }
    }
  }
});
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
    it('cannot send create command more than once', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      t.create(create_createTimesheetCommand());
      assert.throws(
        () => {
           t.create(create_createTimesheetCommand());
        },
        "InvalidOperationException: Create can only be executed as the first action."
      );
    });
  });
  describe('update', function() {
    it('raise a timesheetUpdatedEvent', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      t.create(create_createTimesheetCommand());
      let cmd = create_updateTimesheetCommand();
      t.update(cmd);
      assert(t._uncommittedEvents.length == 2, "expected 2 uncommited events");
      let updatedEvent = t._uncommittedEvents[1];
      assert.deepEqual(cmd.body, updatedEvent.event)
      assert.equal(updatedEvent.id,  tsId);
      assert.equal(updatedEvent.eventId,  2);
      assert.equal(updatedEvent.eventsMetadata.eventType,  "TimesheetUpdated");
      assert.equal(updatedEvent.eventsMetadata.aggregateType,  "Timesheet");
    });
    it('cannot send update command as first command', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      assert.throws(
        () => {
           t.update(create_updateTimesheetCommand());
        },
        "InvalidOperationException: Can not update an uninitialised Aggregate, update can not be executed as the first action."
      );
    });
  });
  describe('submit', function() {
    it('submit a timesheetSubmittedEvent', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      t.create(create_createTimesheetCommand());
      let cmd = (create_submitTimesheetCommand());
      t.submit(cmd);
      assert(t._uncommittedEvents.length == 2, "expected 2 uncommited events");
      let submittedEvent = t._uncommittedEvents[1];
      assert.deepEqual(cmd.body, submittedEvent.event)
      assert.equal(submittedEvent.id,  tsId);
      assert.equal(submittedEvent.eventId,  2);
      assert.equal(submittedEvent.eventsMetadata.eventType,  "TimesheetSubmitted");
      assert.equal(submittedEvent.eventsMetadata.aggregateType,  "Timesheet");
    });
    it('submit an timesheetSubmittedEvent to an updated timesheet', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      t.create(create_createTimesheetCommand());
      t.update(create_updateTimesheetCommand());
      let cmd = (create_submitTimesheetCommand());
      t.submit(cmd);
      assert(t._uncommittedEvents.length == 3, "expected 3 uncommited events");
      let submittedEvent = t._uncommittedEvents[2];
      assert.deepEqual(cmd.body, submittedEvent.event)
      assert.equal(submittedEvent.id,  tsId);
      assert.equal(submittedEvent.eventId,  3);
      assert.equal(submittedEvent.eventsMetadata.eventType,  "TimesheetSubmitted");
      assert.equal(submittedEvent.eventsMetadata.aggregateType,  "Timesheet");
    });
    it('cannot send submit command as first command', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      assert.throws(
        () => {
           t.update(create_submitTimesheetCommand());
        },
        "InvalidOperationException: Can not submit an uninitialised Aggregate, submit can not be executed as the first action."
      );
    });
    it('cannot send submit command to a suubmitted timesheet', function() {
      let tsId = uuid.v1();
      let t = new Timesheet(tsId);
      t.create(create_createTimesheetCommand());
      t.submit(create_submitTimesheetCommand());     
      assert.throws(
        () => {
           t.update(create_submitTimesheetCommand());
        },
        "InvalidOperationException: Can not submit a timesheet that is already submitted."
      );
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
    };
  }
  
  function create_updateTimesheetCommand(){
    return { 
      "body":{
        "shifts" : [{
            "name" : "Monday",
            "startDateTime" : "2016-09-05T10:00:00+08:00",
            "endDateTime" : "2016-09-05T18:00:00+08:00",
            "breaks" : [3600000]
          }, {
            "name" : "Tuesday",
            "startDateTime" : "2016-09-06T10:00:00+08:00",
            "endDateTime" : "2016-09-06T18:00:00+08:00",
            "breaks" : [3600000]
          }, {
            "name" : "Wednesday",
            "startDateTime" : "2016-09-07T10:00:00+08:00",
            "endDateTime" : "2016-09-07T18:00:00+08:00",
            "breaks" : [3600000]
          }, {
            "name" : "Thursday",
            "startDateTime" : "2016-09-08T10:00:00+08:00",
            "endDateTime" : "2016-09-08T18:00:00+08:00",
            "breaks" : [3600000]
          }, {
            "name" : "Friday",
            "startDateTime" : "2016-09-09T07:00:00+08:00",
            "endDateTime" : "2016-09-09T15:00:00+08:00",
            "breaks" : [3600000],
            "notes" : {
              "text" : "Left early for training",
              "isPrivate" : true
            }
          }
        ],
        "notes" : {
          "text" : "Remind payroll to transfer funds to new account",
          "isPrivate" : true
        }
      }
    };
  }
  function create_submitTimesheetCommand(){
    return { "body":{} };
  }
});
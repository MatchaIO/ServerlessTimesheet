"use strict";
var uuid = require('node-uuid');
let Timesheet = require('./TimesheetAggregate');
let repository = require('./documentDbRepository');

var t = new Timesheet(uuid.v1());
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
          "isPrivate" : true
        }
      }
    ],
    "notes" : {
      "text" : "Remind the boss to approve",
      "isPrivate" : true
    }
  }
})
console.log(t)

repository.saveAggregate(t)
  .then(()=> {
  
    console.log("timesheet saved");
    
    repository.hydrateAggregate(new Timesheet(t.id))
          .then((a)=> {
            console.log("Aggregate hydrated:"); 
            console.log(a)
          });    
  })
  .catch((error) => {
    console.error("Unable to save. Error: " + error, JSON.stringify(error, null, 2));
  })
  .done();

  
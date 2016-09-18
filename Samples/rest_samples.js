"use strict";
var Client = require('node-rest-client').Client;
var client = new Client();
let timesheetRoot = "https://05atesx4h2.execute-api.ap-southeast-2.amazonaws.com/dev/"
client.post(
    timesheetRoot + "timesheet", 
    {
        data: { body: create_createTimesheetCommand() },
        headers: { "Content-Type": "application/json" }
    },
    (data, response) => {
        console.log({createResponse:data});
        client.put(
            timesheetRoot + "timesheet/" + data.timesheetId, 
            {
                data: { body: create_updateTimesheetCommand() },
                headers: { "Content-Type": "application/json" }
            },
            (data, response) => {
                console.log({updateResponse:data});
                client.post(
                    timesheetRoot + "timesheet/" + data.timesheetId + "/submit", 
                    {
                        data: { body: create_submitTimesheetCommand() },
                        headers: { "Content-Type": "application/json" }
                    },
                    (data, response) => 
                    {
                        console.log({updateResponse:data});
                        console.log("===DONE===");
                    });
                });
    });


function create_createTimesheetCommand(){
    return {
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
    };
  }
  
  function create_updateTimesheetCommand(){
    return {
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
    };
  }
  function create_submitTimesheetCommand(){
    return { };
  }
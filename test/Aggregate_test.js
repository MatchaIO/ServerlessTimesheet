"use strict";
var uuid = require("node-uuid");
var AggregateBase = require("../timesheetService/TimesheetAggregate").AggregateBase;
var assert = require("assert");

describe("Unimplemented Aggregate", function() {  
    it("required an Id on construction", function() {
      assert.throws(() => new AggregateBase(), "InvalidOperationException: An Id must be supplied and should be a UUID");
      assert.throws(() => new AggregateBase(null), "InvalidOperationException: An Id must be supplied and should be a UUID");
      assert.doesNotThrow(() => new AggregateBase(uuid.v1()));
  });
});
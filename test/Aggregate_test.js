"use strict";
var assert = require("chai").assert;
var uuid = require("node-uuid");
var AggregateBase = require("../timesheetService/eventStore").AggregateBase;
var InvalidOperationException = require("../timesheetService/eventStore").InvalidOperationException;

describe("Unimplemented Aggregate", function() {  
  it("required an Id on construction", function() {
    assert.throws(() => new AggregateBase(), InvalidOperationException, "An Id must be supplied and should be a UUID");
    assert.throws(() => new AggregateBase(null), InvalidOperationException, "An Id must be supplied and should be a UUID");
    assert.doesNotThrow(() => new AggregateBase(uuid.v1()));
  });
  it("throws on get aggregateType", function() {
    assert.throws(() => new AggregateBase(), InvalidOperationException, "An Id must be supplied and should be a UUID");
    assert.throws(() => new AggregateBase(null), InvalidOperationException, "An Id must be supplied and should be a UUID");
    assert.doesNotThrow(() => new AggregateBase(uuid.v1()));
  });  
});
describe("Dummy Aggregate", function() {  
  describe("on constrction", function() {  
    let sut,id; 
    before(function() {      
      id = uuid.v1();
      sut = new Dummy(id);  
    });
    it("has an id", function() {     
      assert.isNotNull(sut.id);
      assert.equal(sut.id, id);
    });
    it("has a version of 0", function() {     
      assert.equal(sut.version, 0);
    });
  });
    
  describe("on sending intial command", function() {  
    var sut, id, createPayload, startTime;
    
    before(function() { 
      startTime = Date.now();
      id = uuid.v1();
      sut = new Dummy(id);
      createPayload = { "body": JSON.stringify({ "alpha": uuid.v1() }) };
      sut.create(createPayload);  
    });
    
    it("raises the passed in event", function() {     
      assert.deepEqual([createPayload], sut._uncommittedEvents.map((e)=> JSON.parse(e.eventsMetadata.sourceLambdaEvent)));
      assert.deepEqual([createPayload.body], sut._uncommittedEvents.map((e)=> e.event));
    });
    it("sets the version to 1", function() {
      assert.equal(sut.version, 1);
    });
    it("raises an event that meets the event store contract", function() {  
      let e = sut._uncommittedEvents[0];
      let currentTime = Date.now();
      assert.equal(e.id, id);
      assert.isAtLeast(e.timestamp, startTime);
      assert.isAtMost(e.timestamp, currentTime);
      assert.equal(e.eventId, 1);
      assert.equal(e.eventsMetadata.aggregateType, sut.aggregateType);
      assert.exists(e.eventsMetadata.eventType);
      assert.equal(e.eventsMetadata.aggregateType, sut.aggregateType);
      assert.equal(e.eventsMetadata.sourceLambdaEvent, JSON.stringify(createPayload));
      assert.isString(e.event);
      assert.equal(e.event, createPayload.body);
    });
  });
});
  
class Dummy extends AggregateBase {
  get aggregateType() {
    return "Dummy";
  }

  create(createPayload) {
    if (this.version != this.SEED_VERSION)
      throw new InvalidOperationException("Create can only be executed as the first action.");
    let createdEvent = {
      "id" : this.id,
      "eventId" : 1,
      "eventType" : "DummyCreated",
      "sourceLambdaEvent" : createPayload,
      "event" : JSON.parse(createPayload.body) 
    };
    super._raiseEvent(createdEvent);
  }
  update(updatePayload) {
    if (this.version == this.SEED_VERSION)
      throw new InvalidOperationException("Can not update an uninitialised Aggregate, update can not be executed as the first action.");
    let updatedEvent = {
      "id" : this.id,
      "eventId" : this.version + 1,
      "eventType" : "DummyUpdated",
      "sourceLambdaEvent" : updatePayload,
      "event" : JSON.parse(updatePayload.body)
    };
    super._raiseEvent(updatedEvent);
  }
 
  /* eslint-disable  no-unused-vars */
  handleCreated(createdEvent){}
  handleUpdated(updatedEvent){}
  /* eslint-enable  no-unused-vars */

  constructor(uuid) {
    super(uuid);
    this._routeEvents = {
      //TODO - if i dont wrap the instance function below, 'this' is undefined in the execution of the method (?!). I probably need an ES6 adult to help here
      "DummyCreated" : (e) => { this.handleCreated(e); },
      "DummyUpdated" : (e) => { this.handleUpdated(e); },
    };
  }
}

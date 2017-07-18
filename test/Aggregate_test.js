"use strict";
var uuid = require("node-uuid");
var AggregateBase = require("../timesheetService/TimesheetAggregate").AggregateBase;
var InvalidOperationException = require("../timesheetService/TimesheetAggregate").InvalidOperationException;
var assert = require("assert");

describe("Unimplemented Aggregate", function() {  
  it("required an Id on construction", function() {
    assert.throws(() => new AggregateBase(), "InvalidOperationException: An Id must be supplied and should be a UUID");
    assert.throws(() => new AggregateBase(null), "InvalidOperationException: An Id must be supplied and should be a UUID");
    assert.doesNotThrow(() => new AggregateBase(uuid.v1()));
  });
  it("throws on get aggregateType", function() {
    assert.throws(() => new AggregateBase(), "InvalidOperationException: An Id must be supplied and should be a UUID");
    assert.throws(() => new AggregateBase(null), "InvalidOperationException: An Id must be supplied and should be a UUID");
    assert.doesNotThrow(() => new AggregateBase(uuid.v1()));
  });  
});
describe("Dummy Aggregate", function() {  
    
  describe("on constrction", function() {  
    let sut,id; 
    before(function() {      
      id = uuid.v1();
      sut= new Dummy(id);  
    });
    it("has an id", function() {     
      assert.equal(sut.id, id);
    });
    it("has a version of 0", function() {     
      assert.equal(sut.version, 0);
    });
  });
    
  describe("on sending intial command", function() {  
    var sut, createPayload;
    
    before(function() {      
      sut = new Dummy(uuid.v1());
      createPayload = { "body": JSON.stringify({ "alpha": uuid.v1() }) };
      sut.create(createPayload);  
    });
    
    it("raises an event", function() {     
      assert.deepEqual([createPayload], sut._uncommittedEvents.map((e)=> JSON.parse(e.eventsMetadata.sourceLambdaEvent)));
      assert.deepEqual([createPayload.body], sut._uncommittedEvents.map((e)=> e.event));
      assert.equal(1, sut.version);
    });
    it("sets the version to 1", function() {
      assert.equal(sut.version, 1);
    });
  });
});

const SEED_VERSION = 0;
  
class Dummy extends AggregateBase {
  get aggregateType() {
    return "Dummy";
  }

  create(createPayload) {
    if (this.version != SEED_VERSION)
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
    if (this.version == SEED_VERSION)
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

var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;
var Match = CandyWrapper.Match;
var Trigger = CandyWrapper.Trigger;
var Filter = CandyWrapper.Filter;
var Operation = CandyWrapper.Operation;
var ExpectError = CandyWrapper.ExpectError;
var Sandbox = CandyWrapper.Sandbox;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("operation", function() {
    it("doesn't allow cross-access", function() {
        var w = new Wrapper();
        var r = new Operation(w, {});

        assert.throws(function() {
            r.setVal = "set";
        }, Error, "ERROR: attempting to set setVal on FUNCTION. Only available on PROPERTY.");

        assert.throws(function() {
            let ret = r.setVal;
            return ret; // make linter happy
        }, Error, "ERROR: attempting to get setVal on FUNCTION. Only available on PROPERTY.");
    });

    it("constructor throws on bad args", function() {
        var w = new Wrapper();

        assert.throws(function() {
            new Operation();
        }, TypeError, "Operation constructor: expected 'wrapper' argument to be of type Wrapper");

        assert.throws(function() {
            new Operation(w);
        }, TypeError, "Operation constructor: expected desc to be of type Object");
    });
});
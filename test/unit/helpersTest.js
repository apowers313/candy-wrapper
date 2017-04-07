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

describe("helpers", function() {
    it("_propOnly throws", function() {
        var w = new Wrapper();

        assert.throws(function() {
            w._propOnly("test");
        }, Error, "test is only supported for PROPERTY wrappers");
    });

    it("_funcOnly throws", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        assert.throws(function() {
            w._funcOnly("test");
        }, Error, "test is only supported for FUNCTION wrappers");
    });
});
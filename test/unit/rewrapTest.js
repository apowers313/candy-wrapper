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

describe("rewrap", function() {
    it("returns same function", function() {
        var testFunc = function sillyName(a, b, c) {
            a = b = c; // make linter happy
        };
        testFunc = new Wrapper(testFunc);
        assert.isTrue(Wrapper.isWrapper(testFunc));
        testFunc.hiddenKey = "shhh";

        // rewrap the function
        var rewrappedTestFunc;
        assert.doesNotThrow(function() {
            rewrappedTestFunc = new Wrapper(testFunc);
        });

        assert.strictEqual(rewrappedTestFunc.hiddenKey, "shhh");
        assert.strictEqual(testFunc.chainable, rewrappedTestFunc);
        assert.isTrue(Wrapper.isWrapper(rewrappedTestFunc));
        assert.strictEqual(testFunc, rewrappedTestFunc);
    });

    it("can rewrap method", function() {
        var called = false;
        var testObj = {
            goBowling: function() {
                called = true;
            }
        };

        new Wrapper(testObj, "goBowling");
        assert.isFalse(called);
        testObj.goBowling();
        assert.isTrue(called);
        testObj.goBowling.hiddenKey = "shhh";

        new Wrapper(testObj, "goBowling");
        called = false;
        assert.isFalse(called);
        testObj.goBowling();
        assert.isTrue(called);
        assert.strictEqual(testObj.goBowling.hiddenKey, "shhh");
    });

    it("can rewrap property", function() {
        var testObj = {
            beer: "yummy"
        };

        var w1 = new Wrapper(testObj, "beer");
        var w2 = new Wrapper(testObj, "beer");
        assert.strictEqual(w1, w2);
        assert.strictEqual(w1.wrapped, w2.wrapped);
    });

    it("can config to throw error on rewrap", function() {
        var testFunc = function sillyName(a, b, c) {
            a = b = c; // make linter happy
        };

        testFunc = new Wrapper(testFunc);
        testFunc.hiddenKey = "shhh";

        // shouldn't throw by default
        assert.doesNotThrow(function() {
            new Wrapper(testFunc);
        }, Error, "Function or property already wrapped: rewrapping not allowed.");

        // throws
        testFunc.configAllowRewrap(false);
        assert.throws(function() {
            new Wrapper(testFunc);
        });

        // doesn't throw
        testFunc.configAllowRewrap(true);
        assert.doesNotThrow(function() {
            new Wrapper(testFunc);
        });

        // test args
        assert.throws(function() {
            testFunc.configAllowRewrap([1, 2, 3]);
        }, TypeError, "configAllowRewrap: expected a single argument of type Boolean");
    });
});

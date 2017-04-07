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

describe("sandbox", function() {
    it("can create sandbox", function() {
        new Sandbox();
    });

    it("can add wrappers to Sandbox", function() {
        var sb = new Sandbox();
        var testFunc = function() {};
        var testObj = {
            beer: "yummy",
            goBowling: function() {}
        };

        // empty wrapper
        var w1 = sb.newWrapper();
        assert.isTrue(Wrapper.isWrapper(w1));

        // function
        testFunc = sb.newWrapper(testFunc);
        assert.isTrue(Wrapper.isWrapper(testFunc));

        // method
        var w2 = sb.newWrapper(testObj, "goBowling");
        assert.isTrue(Wrapper.isWrapper(testObj, "goBowling"));

        // property
        sb.newWrapper(testObj, "beer");
        assert.isTrue(Wrapper.isWrapper(testObj, "beer"));

        assert.instanceOf(sb.wrapperList, Set);
        assert.strictEqual(sb.wrapperList.size, 4);

        sb.destroy();

        assert.throws(function() {
            w1();
        }, Error, "Calling Wrapper after it has been unwrapped");
        assert.isTrue(w1.unwrapped);
        assert.isTrue(testFunc.unwrapped);
        assert.isTrue(w2.unwrapped);
        assert.isNull(Wrapper.getWrapperFromProperty(testObj, "beer"));
    });

    it("can add wrapped object to Sandbox", function() {
        var testObj = {
            beer: "yummy",
            goBowling: function bowl(a, b, c, d) {
                a = b = c = d; // make linter happy
            },
            notWrapped: true,
            goFishing: function fish(a, b, c) {
                a = b = c;
            },
            rabbitHole: {
                deep: {
                    deeper: {
                        deepest: {
                            location: "wonderland",
                            eatMe: function() {
                                this.check1 = true;
                            },
                            drinkMe: function() {
                                this.check2 = true;
                            }
                        }
                    }
                }
            }
        };

        var sb = new Sandbox();
        sb.newWrapper(testObj);

        assert.isTrue(Wrapper.isWrapper(testObj, "beer"));
        assert.isTrue(Wrapper.isWrapper(testObj, "goBowling"));
        assert.isTrue(Wrapper.isWrapper(testObj, "notWrapped"));
        assert.isTrue(Wrapper.isWrapper(testObj, "goFishing"));
        assert.isTrue(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "location"));
        assert.isTrue(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "eatMe"));
        assert.isTrue(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "drinkMe"));

        assert.instanceOf(sb.wrapperList, Set);
        assert.strictEqual(sb.wrapperList.size, 7);
    });

    it("has singleton methods", function() {
        var sb1 = Sandbox.singletonStart();
        var sb2 = Sandbox.singletonGetCurrent();

        // start returns the current singleton
        assert.strictEqual(sb1, sb2);

        // can't do multiple starts
        assert.throws(function() {
            Sandbox.singletonStart();
        }, Error, "Sandbox.singletonStart: already started");

        // end kills wrappers
        var w = sb1.newWrapper();
        assert.isTrue(Wrapper.isWrapper(w));
        Sandbox.singletonEnd();
        assert.isTrue(w.unwrapped);

        // no current
        assert.throws(function() {
            Sandbox.singletonGetCurrent();
        }, Error, "Sandbox.singletonGetCurrent: not started yet");

        // can't end without start
        assert.throws(function() {
            Sandbox.singletonEnd();
        }, Error, "Sandbox.singletonEnd: not started yet");
    });

    it("can test", function() {
        function mochaIt(str, fn) {
            fn.call({
                context: "mocha"
            });
        }

        var w;
        mochaIt("test", Sandbox.test(function() {
            assert.strictEqual(this.context, "mocha");
            assert.isObject(this.sandbox);
            w = this.sandbox.newWrapper();
        }));

        assert.isTrue(w.unwrapped);
    });

    it("test works with done()", function() {
        var called = false;

        function mochaDone() {
            called = true;
        }

        function mochaIt(str, fn) {
            fn.call({
                context: "mocha"
            }, mochaDone);
        }

        mochaIt("test", Sandbox.test(function(mochaDone) {
            mochaDone();
        }));

        assert.isTrue(called);
    });

    it("real sandbox test", Sandbox.test(function() {
        assert.isObject(this.sandbox);
        var w = this.sandbox.newWrapper();
        assert.isTrue(Wrapper.isWrapper(w));
    }));

    it("real sandbox test with done()", Sandbox.testAsync(function(done) {
        assert.isObject(this.sandbox);
        var w = this.sandbox.newWrapper();
        assert.isTrue(Wrapper.isWrapper(w));
        done();
    }));
});

var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("unwrap", function() {
    it("throws with bad args", function() {
        assert.throws(function() {
            Wrapper.unwrap();
        }, TypeError, /Wrapper.unwrap: unexpected arguments: /);
    });

    it("won't unwrap non-wrapper", function() {
        var testObj = {
            beer: "yummy"
        };
        assert.throws(function() {
            Wrapper.unwrap(testObj, "beer");
        }, TypeError, "Wrapper.unwrap: attempting to unwrap non-wrapper");
    });

    it("function", function() {
        var testFunc = function pudding(a, b, c) {
            a = b = c; // make linter happy
        };
        assert.isFalse(Wrapper.isWrapper(testFunc));
        testFunc = new Wrapper(testFunc);
        assert.isTrue(Wrapper.isWrapper(testFunc));

        var w = testFunc;
        testFunc = testFunc.configUnwrap();
        assert.isFalse(Wrapper.isWrapper(testFunc));
        assert.isFunction(testFunc);
        assert.strictEqual(testFunc.name, "pudding");
        assert.strictEqual(testFunc.length, 3);
        assert.throws(function() {
            w();
        }, Error, "Calling Wrapper after it has been unwrapped");
    });

    it("function", function() {
        function pudding(a, b, c) {
            a = b = c; // make linter happy
        }
        var called = false;
        var stupid = function bad(a, b) {
            a = b; // make linter happy
            called = true;
        };
        var testObj = {
            test: pudding
        };

        // assert.isFalse(Wrapper.isWrapper(testFunc));
        var testFunc = new Wrapper(testObj, "test", stupid);
        assert.isTrue(Wrapper.isWrapper(testFunc));

        assert.isFalse(called);
        testFunc();
        assert.isTrue(called);

        var w = testFunc;
        testFunc = testFunc.configUnwrap();
        assert.isFalse(Wrapper.isWrapper(testFunc));
        assert.isFunction(testFunc);
        assert.strictEqual(testFunc.name, "pudding");
        assert.strictEqual(testFunc.length, 3);
        assert.throws(function() {
            w();
        }, Error, "Calling Wrapper after it has been unwrapped");
    });

    it("method", function() {
        var testObj = {
            goBowling: function bowl(a, b, c, d) {
                a = b = c = d; // make linter happy
            }
        };
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));
        var w = new Wrapper(testObj, "goBowling");
        assert.isTrue(Wrapper.isWrapper(testObj, "goBowling"));
        w.configUnwrap();
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));
        assert.isFunction(testObj.goBowling);
        assert.strictEqual(testObj.goBowling.name, "bowl");
        assert.strictEqual(testObj.goBowling.length, 4);
    });

    it("property", function() {
        var testObj = {
            beer: "yummy"
        };
        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        var w = new Wrapper(testObj, "beer");
        assert.isTrue(Wrapper.isWrapper(testObj, "beer"));
        testObj.beer = "gone";
        w.configUnwrap();
        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        assert.strictEqual(testObj.beer, "gone");
    });

    it("function via static", function() {
        var testFunc = function pudding(a, b, c) {
            a = b = c; // make linter happy
        };
        assert.isFalse(Wrapper.isWrapper(testFunc));
        testFunc = new Wrapper(testFunc);
        assert.isTrue(Wrapper.isWrapper(testFunc));
        testFunc = Wrapper.unwrap(testFunc);
        assert.isFalse(Wrapper.isWrapper(testFunc));
        assert.isFunction(testFunc);
        assert.strictEqual(testFunc.name, "pudding");
        assert.strictEqual(testFunc.length, 3);
    });

    it("method via static", function() {
        var testObj = {
            goBowling: function bowl(a, b, c, d) {
                a = b = c = d; // make linter happy
            }
        };
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));
        new Wrapper(testObj, "goBowling");
        assert.isTrue(Wrapper.isWrapper(testObj, "goBowling"));
        Wrapper.unwrap(testObj, "goBowling");
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));
        assert.isFunction(testObj.goBowling);
        assert.strictEqual(testObj.goBowling.name, "bowl");
        assert.strictEqual(testObj.goBowling.length, 4);
    });

    it("property via static", function() {
        var testObj = {
            beer: "yummy"
        };
        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        new Wrapper(testObj, "beer");
        assert.isTrue(Wrapper.isWrapper(testObj, "beer"));
        testObj.beer = "gone";
        Wrapper.unwrap(testObj, "beer");
        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        assert.strictEqual(testObj.beer, "gone");
    });

    it("object via static", function() {
        var testObj = {
            beer: "yummy",
            goBowling: function bowl(a, b, c, d) {
                a = b = c = d; // make linter happy
            }
        };

        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));

        new Wrapper(testObj);
        assert.isTrue(Wrapper.isWrapper(testObj, "beer"));
        assert.isTrue(Wrapper.isWrapper(testObj, "goBowling"));

        testObj.beer = "gone";
        Wrapper.unwrap(testObj);
        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        assert.strictEqual(testObj.beer, "gone");
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));
        assert.isFunction(testObj.goBowling);
        assert.strictEqual(testObj.goBowling.name, "bowl");
        assert.strictEqual(testObj.goBowling.length, 4);
    });

    it("mixed object via static", function() {
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

        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));

        new Wrapper(testObj, "beer");
        new Wrapper(testObj, "goBowling");
        new Wrapper(testObj.rabbitHole.deep.deeper.deepest, "location");
        new Wrapper(testObj.rabbitHole.deep.deeper.deepest, "eatMe");
        assert.isTrue(Wrapper.isWrapper(testObj, "beer"));
        assert.isTrue(Wrapper.isWrapper(testObj, "goBowling"));
        assert.isTrue(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "location"));
        assert.isTrue(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "eatMe"));
        assert.isFalse(Wrapper.isWrapper(testObj, "notWrapped"));
        assert.isFalse(Wrapper.isWrapper(testObj, "goFishing"));
        assert.isFalse(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "drinkMe"));

        testObj.beer = "gone";
        Wrapper.unwrap(testObj);
        assert.isFalse(Wrapper.isWrapper(testObj, "beer"));
        assert.strictEqual(testObj.beer, "gone");
        assert.isFalse(Wrapper.isWrapper(testObj, "notWrapped"));
        assert.strictEqual(testObj.notWrapped, true);
        assert.isFalse(Wrapper.isWrapper(testObj, "goBowling"));
        assert.isFalse(Wrapper.isWrapper(testObj, "goFishing"));
        assert.isFunction(testObj.goBowling);
        assert.strictEqual(testObj.goBowling.name, "bowl");
        assert.strictEqual(testObj.goBowling.length, 4);
        assert.isFunction(testObj.goFishing);
        assert.strictEqual(testObj.goFishing.name, "fish");
        assert.strictEqual(testObj.goFishing.length, 3);
        assert.strictEqual(testObj.rabbitHole.deep.deeper.deepest.location, "wonderland");
        assert.isFalse(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "location"));
        assert.isFunction(testObj.rabbitHole.deep.deeper.deepest.eatMe);
        assert.isFalse(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "eatMe"));
        assert.isFunction(testObj.rabbitHole.deep.deeper.deepest.drinkMe);
        assert.isFalse(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "drinkMe"));
    });
});

var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;
var ExpectError = CandyWrapper.ExpectError;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("create wrapper", function() {
    it("can create an empty wrapper", function() {
        var w = new Wrapper();
        assert.instanceOf(w, Function);
        w();
    });

    it("can wrap a function", function() {
        var called = false;

        function testFunc() {
            called = true;
        }
        var ret = new Wrapper(testFunc);
        assert.instanceOf(ret, Function);
        assert.strictEqual(ret.type, "function");
        ret();
        assert.strictEqual(called, true, "expected wrapped function to get called");
    });

    it("can wrap a method", function() {
        var testObj = {
            goBowling: function() {}
        };
        var w = new Wrapper(testObj, "goBowling");
        assert.instanceOf(w, Function);
        assert.instanceOf(w, Wrapper);
        assert.strictEqual(w.type, "function");
    });

    it("can wrap an property", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");
        assert.instanceOf(w, Function);
        assert.instanceOf(w, Wrapper);
        assert.strictEqual(w.type, "property");
        assert.strictEqual(w.propValue, "yummy");
        testObj.beer = "all gone";
        assert.strictEqual(w.propValue, "all gone");
        var ret = testObj.beer;
        assert.strictEqual(ret, "all gone");
    });

    it("can wrap an object", function() {
        var testObj = {
            beer: "yummy",
            check: false,
            goBowling: function() {
                this.check = true;
            }
        };
        new Wrapper(testObj);
        assert.strictEqual(testObj.beer, "yummy");
        assert.strictEqual(testObj.check, false);
        assert.instanceOf(testObj.goBowling, Function);
        testObj.goBowling();
        assert.strictEqual(testObj.check, true);
        assert.isOk(testObj.check);
        assert.isOk(Wrapper.isWrapper(testObj, "beer"));
        assert.isOk(Wrapper.isWrapper(testObj, "check"));
        assert.isOk(Wrapper.isWrapper(testObj, "goBowling"));
        // TODO: does check get called?
    });

    it("can wrap a nested object", function() {
        var testObj = {
            rabbitHole: {
                deep: {
                    deeper: {
                        deepest: {
                            location: "wonderland",
                            check1: false,
                            check2: false,
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
        new Wrapper(testObj);
        assert.strictEqual(testObj.rabbitHole.deep.deeper.deepest.location, "wonderland");
        assert.strictEqual(testObj.rabbitHole.deep.deeper.deepest.check1, false);
        assert.strictEqual(testObj.rabbitHole.deep.deeper.deepest.check2, false);
        assert.instanceOf(testObj.rabbitHole.deep.deeper.deepest.eatMe, Function);
        assert.instanceOf(testObj.rabbitHole.deep.deeper.deepest.drinkMe, Function);
        testObj.rabbitHole.deep.deeper.deepest.eatMe();
        testObj.rabbitHole.deep.deeper.deepest.drinkMe();
        assert.strictEqual(testObj.rabbitHole.deep.deeper.deepest.check1, true);
        assert.strictEqual(testObj.rabbitHole.deep.deeper.deepest.check2, true);
        assert.isOk(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "location"));
        assert.isOk(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "check1"));
        assert.isOk(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "check2"));
        assert.isOk(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "eatMe"));
        assert.isOk(Wrapper.isWrapper(testObj.rabbitHole.deep.deeper.deepest, "drinkMe"));
    });

    it("can wrap objects in an array", function() {
        var testObj = {
            locationList: [{
                locationNo: 1,
                name: "home"
            }, {
                locationNo: 2,
                name: "store",
                gps: {
                    lat: 123,
                    long: 456
                }
            }]
        };
        new Wrapper(testObj);
        assert.isOk(Wrapper.isWrapper(testObj.locationList[0], "locationNo"));
        assert.isOk(Wrapper.isWrapper(testObj.locationList[0], "name"));
        assert.isOk(Wrapper.isWrapper(testObj.locationList[1], "locationNo"));
        assert.isOk(Wrapper.isWrapper(testObj.locationList[1], "name"));
        assert.isOk(Wrapper.isWrapper(testObj.locationList[1].gps, "lat"));
        assert.isOk(Wrapper.isWrapper(testObj.locationList[1].gps, "long"));
    });

    it("can wrap array of objects", function() {
        var testArr = [{
            locationNo: 1,
            name: "home"
        }, {
            locationNo: 2,
            name: "store",
            gps: {
                lat: 123,
                long: 456
            }
        }];
        new Wrapper(testArr);
        assert.isOk(Wrapper.isWrapper(testArr[0], "locationNo"));
        assert.isOk(Wrapper.isWrapper(testArr[0], "name"));
        assert.isOk(Wrapper.isWrapper(testArr[1], "locationNo"));
        assert.isOk(Wrapper.isWrapper(testArr[1], "name"));
        assert.isOk(Wrapper.isWrapper(testArr[1].gps, "lat"));
        assert.isOk(Wrapper.isWrapper(testArr[1].gps, "long"));
    });

    it("can wrap values of an array", function() {
        var testArr = [1, "string", true];
        new Wrapper(testArr);
        assert.isOk(Wrapper.isWrapper(testArr, "0"));
        assert.isOk(Wrapper.isWrapper(testArr, "1"));
        assert.isOk(Wrapper.isWrapper(testArr, "2"));
    });

    it("can wrap a method with a custom function", function() {
        var called = false;

        function testFunc() {
            called = true;
        }
        var testObj = {
            goBowling: function() {}
        };
        var ret = new Wrapper(testObj, "goBowling", testFunc);
        assert.instanceOf(ret, Function);
        assert.strictEqual(ret.type, "function");
        ret();
        assert.strictEqual(called, true, "expected wrapped function to get called");
    });

    it("can wrap an property with a custom function", function() {
        var testObj = {
            beer: "yummy"
        };

        var called = false;
        var setVal = null;

        function testFunc(type, sv) {
            called = true;
            setVal = sv;
            return "gulp";
        }

        new Wrapper(testObj, "beer", testFunc);
        var ret = testObj.beer;
        assert.strictEqual(ret, "gulp");
        assert.isUndefined(setVal);
        assert.isOk(called);

        testObj.beer = "gone";
        assert.strictEqual(setVal, "gone");
    });

    it("throws error when called with bad arguments", function() {
        assert.throws(function() {
            new Wrapper("foo");
        }, TypeError, /Wrapper: bad arguments/);
        assert.throws(function() {
            new Wrapper(true);
        }, TypeError, /Wrapper: bad arguments/);
        assert.throws(function() {
            new Wrapper(null);
        }, TypeError, /Wrapper: bad arguments/);
    });

    it("mirrors defineProperty values", function() {
        var testObj = {};
        Object.defineProperty(testObj, "notWritable", {
            writable: false,
            value: 42,
            configurable: true,
            enumerable: true
        });
        Object.defineProperty(testObj, "notConfigurable", {
            writable: true,
            value: 43,
            configurable: false,
            enumerable: true
        });
        Object.defineProperty(testObj, "notEnumerable", {
            writable: true,
            value: 44,
            configurable: true,
            enumerable: false
        });
        Object.defineProperty(testObj, "allGood", {
            writable: true,
            value: 45,
            configurable: true,
            enumerable: true
        });

        var desc;
        // not writable
        new Wrapper(testObj, "notWritable");
        assert.isTrue(Wrapper.isWrapper(testObj, "notWritable"));
        desc = Object.getOwnPropertyDescriptor(testObj, "notWritable");
        assert.strictEqual(testObj.notWritable, 42);
        assert.isUndefined(desc.writable);
        assert.isTrue(desc.configurable);
        assert.isTrue(desc.enumerable);

        // not configurable
        assert.throws(function() {
            new Wrapper(testObj, "notConfigurable");
        }, Error, "new Wrapper: can't wrap non-configurable property: 'notConfigurable'");

        // not enumerable
        new Wrapper(testObj, "notEnumerable");
        assert.isTrue(Wrapper.isWrapper(testObj, "notEnumerable"));
        desc = Object.getOwnPropertyDescriptor(testObj, "notEnumerable");
        assert.strictEqual(testObj.notEnumerable, 44);
        assert.isUndefined(desc.writable);
        assert.isTrue(desc.configurable);
        assert.isFalse(desc.enumerable);

        // all good
        new Wrapper(testObj, "allGood");
        assert.isTrue(Wrapper.isWrapper(testObj, "allGood"));
        desc = Object.getOwnPropertyDescriptor(testObj, "allGood");
        assert.strictEqual(testObj.allGood, 45);
        assert.isUndefined(desc.writable);
        assert.isTrue(desc.configurable);
        assert.isTrue(desc.enumerable);
    });

    it("works with setters and getters", function() {
        function iThrow() { // the new Apple blanket!
            throw new Error("testing: rubber baby buggy bumpers");
        }

        function returnFuzzyBeachBall() {
            return "fuzzy beach ball";
        }
        var testObj = {};
        Object.defineProperty(testObj, "setThrows", {
            configurable: true,
            enumerable: true,
            set: iThrow
        });
        Object.defineProperty(testObj, "getBeachBall", {
            configurable: true,
            enumerable: true,
            get: returnFuzzyBeachBall
        });
        Object.defineProperty(testObj, "setterAndGetter", {
            configurable: true,
            enumerable: true,
            set: iThrow,
            get: returnFuzzyBeachBall
        });
        Object.defineProperty(testObj, "noSetterGetter", {
            configurable: true,
            enumerable: true
        });

        // wrap everything
        new Wrapper(testObj);
        assert.isTrue(Wrapper.isWrapper(testObj, "setThrows"));
        assert.isTrue(Wrapper.isWrapper(testObj, "getBeachBall"));
        assert.isTrue(Wrapper.isWrapper(testObj, "setterAndGetter"));
        assert.isTrue(Wrapper.isWrapper(testObj, "noSetterGetter"));

        var ret;
        // set
        assert.throws(function() {
            testObj.setThrows = 42;
        }, Error, "testing: rubber baby buggy bumpers");
        ret = testObj.noSetterGetter;
        assert.isUndefined(ret);

        // get
        ret = testObj.getBeachBall;
        assert.strictEqual(ret, "fuzzy beach ball");
        assert.doesNotThrow(function() {
            testObj.getBeachBall = 42;
        });
        ret = testObj.getBeachBall;
        assert.strictEqual(ret, "fuzzy beach ball");

        // set and get
        assert.throws(function() {
            testObj.setterAndGetter = 42;
        }, Error, "testing: rubber baby buggy bumpers");
        ret = testObj.setterAndGetter;
        assert.strictEqual(ret, "fuzzy beach ball");

        // neither
        ret = testObj.noSetterGetter;
        assert.isUndefined(ret);
        assert.doesNotThrow(function() {
            testObj.noSetterGetter = 42;
        });
        ret = testObj.noSetterGetter;
        assert.strictEqual(ret, 42);
    });

    it("mirrors function name nad argument length", function() {
        function pudding(a, b, c) {
            a = b = c; // keep linter happy
        }

        function schmoo() {}
        var testFunc1 = function() {};
        var testFunc2 = function(a, b, c, d, e, f) {
            a = b = c = d = e = f; // keep linter happy
        };

        var w = new Wrapper(pudding);
        assert.strictEqual(w.name, "pudding");
        assert.strictEqual(w.length, 3);

        w = new Wrapper(schmoo);
        assert.strictEqual(w.name, "schmoo");
        assert.strictEqual(w.length, 0);

        w = new Wrapper(testFunc1);
        // NOTE: FF and IE don't infer function names like Chrome does
        // assert.strictEqual(w.name, "testFunc1");
        assert.strictEqual(w.length, 0);

        w = new Wrapper(testFunc2);
        // NOTE: FF and IE don't infer function names like Chrome does
        // assert.strictEqual(w.name, "testFunc2");
        assert.strictEqual(w.length, 6);

        w = new Wrapper(function() {});
        assert.strictEqual(w.name, "");
        assert.strictEqual(w.length, 0);

        w = new Wrapper(new Function()); // jshint ignore:line
        assert.strictEqual(w.name, "anonymous");
        assert.strictEqual(w.length, 0);
    });

    it("throws on undefined property or method", function() {
        var testObj = {};

        assert.throws(function() {
            new Wrapper(testObj, "beer");
        }, TypeError, "Wrapper constructor: expected 'beer' to exist on object");
    });

    describe("static", function() {
        it("can identify a wrapper", function() {
            var w = new Wrapper();

            // wrapped function
            var fn = function() {};
            assert.isOk(Wrapper.isWrapper(w), "exepcted a wrapper");
            assert.isNotOk(Wrapper.isWrapper(fn), "exepcted not a wrapper");

            // wrapped method
            var testObj = {
                goBowling: function() {},
                notBowling: function() {}
            };
            w = new Wrapper(testObj, "goBowling");
            assert.isOk(Wrapper.isWrapper(testObj, "goBowling"), "exepcted a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testObj, "notBowling"), "exepcted not a wrapper");

            // wrapped property
            var testProps = {
                iAmWrapped: "whee",
                iAmSam: "SAM.",
                deeperDownTheHole: {
                    name: "Alice"
                },
                groceryList: ["egg", "ham", "green"]
            };
            w = new Wrapper(testProps, "iAmWrapped");
            assert.isOk(Wrapper.isWrapper(testProps, "iAmWrapped"), "exepcted a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testProps, "iAmSam"), "exepcted not a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testProps, "deeperDownTheHole"), "exepcted not a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testProps, "groceryList"), "exepcted not a wrapper");

            // non-existant property
            assert.isNotOk(Wrapper.isWrapper(testProps, "missing"), "exepcted not a wrapper");

            var ret = Wrapper.isWrapper("foo");
            assert.isFalse(ret);

            ret = Wrapper.isWrapper();
            assert.isFalse(ret);
        });

        it("can get a Wrapper from a property", function() {
            var testObj = {
                beer: "yummy",
                goBowling: function() {},
                down: {},
                arr: []
            };
            Object.defineProperty(testObj, "setter", {
                set: function() {}
            });
            assert.throws(function() {
                Wrapper.getWrapperFromProperty();
            }, TypeError, "getWrapperFromProperty; exepcted 'obj' argument to be Object");

            assert.throws(function() {
                Wrapper.getWrapperFromProperty({});
            }, TypeError, "getWrapperFromProperty: expected 'key' argument to be String");

            // fail, property not defined on ojbect
            var ret;
            ret = Wrapper.getWrapperFromProperty({}, "foo");
            assert.isNull(ret);

            // fail, not wrapped
            ret = Wrapper.getWrapperFromProperty(testObj, "beer");
            assert.isNull(ret);

            // fail, not wrapped
            ret = Wrapper.getWrapperFromProperty(testObj, "goBowling");
            assert.isNull(ret);

            // fail, not wrapped
            ret = Wrapper.getWrapperFromProperty(testObj, "down");
            assert.isNull(ret);

            // fail, not wrapped
            ret = Wrapper.getWrapperFromProperty(testObj, "arr");
            assert.isNull(ret);

            // fail, not wrapped
            ret = Wrapper.getWrapperFromProperty(testObj, "setter");
            assert.isNull(ret);

            // pass
            new Wrapper(testObj, "beer");
            ret = Wrapper.getWrapperFromProperty(testObj, "beer");
            assert.isOk(Wrapper.isWrapper(ret));
        });
    });

    describe("config", function() {
        it("to throw on expect", function() {
            var w = new Wrapper();

            w("beer");

            // should not throw by default
            assert.doesNotThrow(function() {
                w.historyList.filterFirst().expectCallArgs("wine");
            });
            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, "1 expectation(s) failed:\n          expectCallArgs: expectation failed for: wine\n");

            // configure to throw
            w.configExpectThrows(true);
            assert.throws(function() {
                w.historyList.filterFirst().expectCallArgs("wine");
            }, ExpectError, "expectCallArgs: expectation failed for: wine");
            assert.doesNotThrow(function() {
                w.expectReportAllFailures(true);
            });

            // configure to not throw
            w.configExpectThrows(false);
            assert.doesNotThrow(function() {
                w.historyList.filterFirst().expectCallArgs("wine");
            });
            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, "1 expectation(s) failed:\n          expectCallArgs: expectation failed for: wine\n");

            assert.throws(function() {
                w.configExpectThrows();
            }, TypeError, "configExpectThrows: expected a single argument of type Boolean");

        });

        it("to not throw on trigger expect", function() {
            var w = new Wrapper();

            w.triggerAlways()
                .expectCallArgs("beer");

            // expect should throw by default
            assert.throws(function() {
                w("wine");
            }, ExpectError, "expectCallArgs: expectation failed for: beer");

            // turn off throwing on trigger expects
            w.configExpectThrowsOnTrigger(false);
            assert.doesNotThrow(function() {
                w("wine");
            }, ExpectError, "expectCallArgs: expectation failed for: beer");
            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, "1 expectation(s) failed:\n          expectCallArgs: expectation failed for: beer\n");

            // turn off throwing on trigger expects
            w.configExpectThrowsOnTrigger(true);
            assert.throws(function() {
                w("wine");
            }, ExpectError, "expectCallArgs: expectation failed for: beer");

            assert.throws(function() {
                w.configExpectThrowsOnTrigger();
            }, TypeError, "configExpectThrowsOnTrigger: expected a single argument of type Boolean");
        });

        it("to not call wrapped function", function() {
            var called = false;
            var testFunc = function() {
                called = true;
            };

            testFunc = new Wrapper(testFunc);

            // doesn't get called
            testFunc.configCallUnderlying(false);
            assert.isFalse(called);
            testFunc();
            assert.isFalse(called);

            // gets called
            called = false;
            testFunc.configCallUnderlying(true);
            assert.isFalse(called);
            testFunc();
            assert.isTrue(called);

            assert.throws(function() {
                testFunc.configCallUnderlying();
            }, TypeError, "configCallUnderlying: expected a single argument of type Boolean");

            assert.throws(function() {
                testFunc.configCallUnderlying("foo");
            }, TypeError, "configCallUnderlying: expected a single argument of type Boolean");

        });
    });
});
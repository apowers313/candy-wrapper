var chai = chai || depends("chai");
var CandyWrapper = CandyWrapper || depends("../candy-wrapper.js");

function depends(mod) {
    if (typeof module === "object" &&
        typeof require === "function") {
        console.log(`Loading module: ${mod} ...`);
        return require(mod);
    }
}

// IIFE for clean namespace
(function() {
    var assert = assert || chai.assert;
    var Wrapper = CandyWrapper.Wrapper;
    var Match = CandyWrapper.Match;
    var Trigger = CandyWrapper.Trigger;
    var SingleCall = CandyWrapper.SingleCall;

    describe("requested new feature list", function() {
        it("can detect when a function has been invoked with 'new()'"); // Proxy.handler.construct()?
        it("can wrap a function generator");
        it("can add new / custom expect... or action... methods");
        it("can match by type");
        it("has a Spy class");
        it("has a Stub class");
        it("has a Mock class");
    });

    describe("create wrapper", function() {
        it("can create an empty wrapper", function() {
            var w = new Wrapper();
            assert.isFunction(w);
            w();
        });

        it("can wrap a function", function() {
            var called = false;

            function testFunc() {
                called = true;
            }
            var ret = new Wrapper(testFunc);
            assert.isFunction(ret);
            assert.strictEqual(ret.type, "function");
            ret();
            assert.strictEqual(called, true, "expected wrapped function to get called");
        });

        it("can wrap a method", function() {
            var testObj = {
                goBowling: function() {}
            };
            var w = new Wrapper(testObj, "goBowling");
            assert.isFunction(w);
            assert.instanceOf(w, Wrapper);
            assert.strictEqual(w.type, "function");
        });

        it("can wrap an attribute", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");
            assert.isFunction(w);
            assert.instanceOf(w, Wrapper);
            assert.strictEqual(w.type, "attribute");
            assert.strictEqual(w.attrValue, "yummy");
            testObj.beer = "all gone";
            assert.strictEqual(w.attrValue, "all gone");
            var ret = testObj.beer;
            assert.strictEqual(ret, "all gone");
        });

        it("can wrap an object");
        it("can wrap a nested object");

        it("can wrap a method with a custom function", function() {
            var called = false;

            function testFunc() {
                called = true;
            }
            var testObj = {
                goBowling: function() {}
            };
            var ret = new Wrapper(testObj, "goBowling", testFunc);
            assert.isFunction(ret);
            assert.strictEqual(ret.type, "function");
            ret();
            assert.strictEqual(called, true, "expected wrapped function to get called");
        });

        it("can wrap an attribute with a custom function", function() {
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
                var w = new Wrapper("foo");
            }, TypeError, /Wrapper: bad arguments/);
            assert.throws(function() {
                var w = new Wrapper(true);
            }, TypeError, /Wrapper: bad arguments/);
            assert.throws(function() {
                var w = new Wrapper(null);
            }, TypeError, /Wrapper: bad arguments/);
        });
        it("mirrors defineProperty values");
        it("mirrors function name, argument length, and argument list");
    });

    describe("helpers", function() {
        it("_attrOnly throws", function() {
            var w = new Wrapper();

            assert.throws(function() {
                w._attrOnly("test");
            }, Error, "test is only supported for ATTRIBUTE wrappers");
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

        it("_Count with bad args", function() {
            var w = new Wrapper();

            assert.throws(function() {
                w._Count();
            }, TypeError, "_Count: expected 'name' to be string");

            assert.throws(function() {
                w._Count("name");
            }, TypeError, "name: expected 'arr' to be of type Array");

            assert.throws(function() {
                w._Count("name", []);
            }, TypeError, "name: expected 'count' to be of type Number");
        });

        it("_CountRange with bad args", function() {
            var w = new Wrapper();

            assert.throws(function() {
                w._CountRange();
            }, TypeError, "_CountRange: expected 'name' to be string");

            assert.throws(function() {
                w._CountRange("name");
            }, TypeError, "name: expected 'arr' to be of type Array");

            assert.throws(function() {
                w._CountRange("name", []);
            }, TypeError, "name: expected 'min' to be of type Number");

            assert.throws(function() {
                w._CountRange("name", [], 1);
            }, TypeError, "name: expected 'max' to be of type Number");
        });

        it("_CountMin with bad args", function() {
            var w = new Wrapper();

            assert.throws(function() {
                w._CountMin();
            }, TypeError, "_CountMin: expected 'name' to be string");

            assert.throws(function() {
                w._CountMin("name");
            }, TypeError, "name: expected 'arr' to be of type Array");

            assert.throws(function() {
                w._CountMin("name", []);
            }, TypeError, "name: expected 'min' to be of type Number");
        });

        it("_CountMax with bad args", function() {
            var w = new Wrapper();

            assert.throws(function() {
                w._CountMax();
            }, TypeError, "_CountMax: expected 'name' to be string");

            assert.throws(function() {
                w._CountMax("name");
            }, TypeError, "name: expected 'arr' to be of type Array");

            assert.throws(function() {
                w._CountMax("name", []);
            }, TypeError, "name: expected 'max' to be of type Number");
        });
    });

    describe("config", function() {
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

            // wrapped attribute
            var testAttrs = {
                iAmWrapped: "whee",
                iAmSam: "SAM.",
                deeperDownTheHole: {
                    name: "Alice"
                },
                groceryList: ["egg", "ham", "green"]
            };
            w = new Wrapper(testAttrs, "iAmWrapped");
            assert.isOk(Wrapper.isWrapper(testAttrs, "iAmWrapped"), "exepcted a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testAttrs, "iAmSam"), "exepcted not a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testAttrs, "deeperDownTheHole"), "exepcted not a wrapper");
            assert.isNotOk(Wrapper.isWrapper(testAttrs, "groceryList"), "exepcted not a wrapper");

            assert.throws(function() {
                Wrapper.isWrapper();
            }, TypeError, "isWrapper: unsupported arguments");
        });
        it("can restore wrapped function");
        it("can reset wrapper");
    });

    describe("filter", function() {
        it("can get by call number", function() {
            var ret;
            var w = new Wrapper();
            assert.throws(function() {
                w.filterOneByCallNumber(0);
            }, RangeError);
            w();
            w();
            w();
            ret = w.filterOneByCallNumber(0);
            assert.instanceOf(ret, SingleCall);
            w.filterOneByCallNumber(1);
            w.filterOneByCallNumber(2);
            assert.throws(function() {
                w.filterOneByCallNumber(3);
            }, RangeError);
            w();
            ret = w.filterOneByCallNumber(3);
            assert.instanceOf(ret, SingleCall);
        });

        it("can select only attribute gets", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");

            // initial
            var getList, setList;
            assert.isArray(w.touchList);
            assert.strictEqual(w.touchList.length, 0);
            getList = w.touchList.filterAttrGet();
            setList = w.touchList.filterAttrSet();
            assert.isArray(getList);
            assert.strictEqual(getList.length, 0);
            assert.isArray(setList);
            assert.strictEqual(setList.length, 0);

            // set #1
            testObj.beer = "gone";
            assert.strictEqual(w.touchList.length, 1);
            getList = w.touchList.filterAttrGet();
            setList = w.touchList.filterAttrSet();
            assert.isArray(getList);
            assert.strictEqual(getList.length, 0);
            assert.isArray(setList);
            assert.strictEqual(setList.length, 1);
            assert.strictEqual(setList[0].type, "set");
            assert.strictEqual(setList[0].setVal, "gone");
            assert.strictEqual(setList[0].retVal, "gone");
            assert.isUndefined(setList[0].exception);

            // get #1
            var ret = testObj.beer;
            assert.strictEqual(ret, "gone");
            assert.strictEqual(w.touchList.length, 2);
            getList = w.touchList.filterAttrGet();
            setList = w.touchList.filterAttrSet();
            assert.isArray(getList);
            assert.strictEqual(getList.length, 1);
            assert.isArray(setList);
            assert.strictEqual(setList.length, 1);
            assert.strictEqual(getList[0].type, "get");
            assert.isUndefined(getList[0].setVal);
            assert.strictEqual(getList[0].retVal, "gone");
            assert.isUndefined(getList[0].exception);

            // set #2
            testObj.beer = "more";
            assert.strictEqual(w.touchList.length, 3);
            getList = w.touchList.filterAttrGet();
            setList = w.touchList.filterAttrSet();
            assert.isArray(getList);
            assert.strictEqual(getList.length, 1);
            assert.isArray(setList);
            assert.strictEqual(setList.length, 2);
            assert.strictEqual(setList[1].type, "set");
            assert.strictEqual(setList[1].setVal, "more");
            assert.strictEqual(setList[1].retVal, "more");
            assert.isUndefined(setList[1].exception);

            // get #2
            ret = testObj.beer;
            assert.strictEqual(ret, "more");
            assert.strictEqual(w.touchList.length, 4);
            getList = w.touchList.filterAttrGet();
            setList = w.touchList.filterAttrSet();
            assert.isArray(getList);
            assert.strictEqual(getList.length, 2);
            assert.isArray(setList);
            assert.strictEqual(setList.length, 2);
            assert.strictEqual(getList[1].type, "get");
            assert.isUndefined(getList[1].setVal);
            assert.strictEqual(getList[1].retVal, "more");
            assert.isUndefined(getList[1].exception);
        });

        it("can filter function calls by argument list", function() {
            var w = new Wrapper();
            w("beer");
            w("wine");
            w("beer");
            w(1, 2, 3);
            w("beer", "wine", "martini");
            w("martini");
            assert.isArray(w.callList);
            assert.strictEqual(w.callList.length, 6);

            // match by "beer" args
            var list;
            list = w.callList.filterCallByArgs("beer");
            assert.strictEqual(list.length, 2);
            assert.deepEqual(list[0].argList, ["beer"]);
            assert.deepEqual(list[1].argList, ["beer"]);

            // match by 1, 2, 3 args
            list = w.callList.filterCallByArgs(1, 2, 3);
            assert.strictEqual(list.length, 1);
            assert.deepEqual(list[0].argList, [1, 2, 3]);

            // match by "beer", "wine", "martini" args
            list = w.callList.filterCallByArgs("beer", "wine", "martini");
            assert.strictEqual(list.length, 1);
            assert.deepEqual(list[0].argList, ["beer", "wine", "martini"]);

            // non-match
            list = w.callList.filterCallByArgs("nothing");
            assert.strictEqual(list.length, 0);
        });

        it("can filter function calls by return value", function() {
            var count = 0;
            var testFunc = function() {
                count++;
                switch (count) {
                    case 1:
                        return "beer";
                    case 2:
                        return {
                            a: 1
                        };
                    case 3:
                        return "beer";
                    case 4:
                        return [1, 2, 3];
                    case 5:
                        return "wine";
                }
            };
            testFunc = new Wrapper(testFunc);
            testFunc();
            testFunc();
            testFunc();
            testFunc();
            testFunc();

            assert.isArray(testFunc.callList);
            assert.strictEqual(testFunc.callList.length, 5);

            // match by "beer" return value
            var list;
            list = testFunc.callList.filterByReturn("beer");
            assert.strictEqual(list.length, 2);
            assert.deepEqual(list[0].retVal, "beer");
            assert.deepEqual(list[1].retVal, "beer");

            // match by {a: 1} return value
            list = testFunc.callList.filterByReturn({
                a: 1
            });
            assert.strictEqual(list.length, 1);
            assert.deepEqual(list[0].retVal, {
                a: 1
            });

            // non-match
            list = testFunc.callList.filterByReturn(false);
            assert.strictEqual(list.length, 0);
        });

        it("can filter function calls by context", function() {
            var w = new Wrapper();
            w.call({
                prop: "beer"
            });
            w.call({
                test: [1, 2, 3]
            });
            w.call({
                prop: "beer"
            });

            assert.isArray(w.callList);
            assert.strictEqual(w.callList.length, 3);

            // match context by {prop: "beer"}
            var list;
            list = w.callList.filterCallByContext({
                prop: "beer"
            });
            assert.strictEqual(list.length, 2);
            assert.deepEqual(list[0].thisArg, {
                prop: "beer"
            });
            assert.deepEqual(list[1].thisArg, {
                prop: "beer"
            });

            // match context by {test: [1, 2, 3]}
            list = w.callList.filterCallByContext({
                test: [1, 2, 3]
            });
            assert.strictEqual(list.length, 1);
            assert.deepEqual(list[0].thisArg, {
                test: [1, 2, 3]
            });

            // non-match
            list = w.callList.filterCallByContext({
                val: false
            });
            assert.strictEqual(list.length, 0);
        });

        it("can filter function calls by exception", function() {
            var count = 0;
            var testFunc = function() {
                count++;
                switch (count) {
                    case 1:
                        throw new Error("out of beer");
                    case 2:
                        throw new TypeError("wine");
                    case 3:
                        throw new Error("out of beer");
                    case 4:
                        throw new RangeError("missed target");
                    case 5:
                        throw new Error("out of beer");
                }
            };
            testFunc = new Wrapper(testFunc);
            try {
                testFunc();
            } catch (e) {}
            try {
                testFunc();
            } catch (e) {}
            try {
                testFunc();
            } catch (e) {}
            try {
                testFunc();
            } catch (e) {}
            try {
                testFunc();
            } catch (e) {}

            assert.isArray(testFunc.callList);
            assert.strictEqual(testFunc.callList.length, 5);

            // filter by "out of beer" exceptions
            var list;
            list = testFunc.callList.filterByException(new Error("out of beer"));
            assert.strictEqual(list.length, 3);
            assert.strictEqual(list[0].exception.name, "Error");
            assert.strictEqual(list[0].exception.message, "out of beer");
            assert.strictEqual(list[1].exception.name, "Error");
            assert.strictEqual(list[1].exception.message, "out of beer");
            assert.strictEqual(list[2].exception.name, "Error");
            assert.strictEqual(list[2].exception.message, "out of beer");

            // non-match
            list = testFunc.callList.filterByException(new Error("wine")); // XXX: wrong error type
            assert.strictEqual(list.length, 0);
        });


        it("can filter set touches by set value", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");

            testObj.beer = "good";
            testObj.beer = "yummy";
            testObj.beer = "good";
            testObj.beer = [1, 2, 3];

            assert.isArray(w.touchList);
            assert.strictEqual(w.touchList.length, 4);

            // match set value by "good"
            var list;
            list = w.touchList.filterAttrSetByVal("good");
            assert.strictEqual(list.length, 2);
            assert.strictEqual(list[0].setVal, "good");
            assert.strictEqual(list[1].setVal, "good");

            // non-match
            list = w.touchList.filterAttrSetByVal("nothing");
            assert.strictEqual(list.length, 0);
        });

        it("throws when filtering attributes by call filters");
        it("throws when filtering calls by attribute filters");

        it("can chain filters", function() {
            var count = 0;
            var testFunc = function() {
                count++;
                switch (count) {
                    case 1:
                        return "beer";
                    case 2:
                        return {
                            a: 1
                        };
                    case 3:
                        return "beer";
                    case 4:
                        return [1, 2, 3];
                    case 5:
                        return "beer";
                }
            };
            testFunc = new Wrapper(testFunc);
            testFunc("yum");
            testFunc("two");
            testFunc("yum");
            testFunc("yum");
            testFunc("five");

            assert.isArray(testFunc.callList);
            assert.strictEqual(testFunc.callList.length, 5);
            var list = testFunc.callList.filterCallByArgs("yum")
                .filterByReturn("beer");
            assert.isArray(list);
            assert.strictEqual(list.length, 2);
            assert.strictEqual(list[0].retVal, "beer");
            assert.deepEqual(list[0].argList, ["yum"]);
            assert.strictEqual(list[1].retVal, "beer");
            assert.deepEqual(list[1].argList, ["yum"]);
        });

        it("throws on bad args", function() {
            var w = new Wrapper();
            w();

            assert.throws(function() {
                w.callList.filterCallByContext();
            }, TypeError, "filterCallByContext: expected one argument");

            assert.throws(function() {
                w.callList.filterByException();
            }, TypeError, "filterByException: expected one argument");

            assert.throws(function() {
                w.callList.filterByReturn();
            }, TypeError, "filterByReturn: expected one argument");

            var testObj = {
                beer: "yummy"
            };
            w = new Wrapper(testObj, "beer");
            testObj.beer = "gulp";
            assert.throws(function() {
                w.touchList.filterAttrSetByVal();
            }, TypeError, "filterAttrSetByVal: expected one argument");
        });
    });

    describe("get from filter", function() {
        it("can get all arguments", function() {
            var w = new Wrapper();
            w("beer");
            w("wine");
            w("beer");
            w([1, 2, 3]);
            w("beer", "wine", "martini");
            w("martini");

            assert.isArray(w.callList);
            assert.strictEqual(w.callList.length, 6);
            var list = w.callList.getAllCallArgs();
            assert.isArray(list);
            assert.strictEqual(list.length, 6);
            assert.deepEqual(list[0], ["beer"]);
            assert.deepEqual(list[1], ["wine"]);
            assert.deepEqual(list[2], ["beer"]);
            assert.deepEqual(list[3], [
                [1, 2, 3]
            ]);
            assert.deepEqual(list[4], ["beer", "wine", "martini"]);
            assert.deepEqual(list[5], ["martini"]);
        });

        it("get get all this values", function() {
            var w = new Wrapper();
            w.call({
                prop: "beer"
            });
            w.call({
                test: [1, 2, 3]
            });
            w.call({
                prop: "beer"
            });

            assert.isArray(w.callList);
            assert.strictEqual(w.callList.length, 3);
            var list = w.callList.getAllCallContexts();
            assert.isArray(list);
            assert.strictEqual(list.length, 3);
            assert.deepEqual(list[0], {
                prop: "beer"
            });
            assert.deepEqual(list[1], {
                test: [1, 2, 3]
            });
            assert.deepEqual(list[2], {
                prop: "beer"
            });
        });

        it("can get all return values with a function", function() {
            var count = 0;
            var testFunc = function() {
                count++;
                switch (count) {
                    case 1:
                        return "beer";
                    case 2:
                        return {
                            a: 1
                        };
                    case 3:
                        return "beer";
                    case 4:
                        return [1, 2, 3];
                    case 5:
                        return "wine";
                }
            };
            testFunc = new Wrapper(testFunc);
            testFunc();
            testFunc();
            testFunc();
            testFunc();
            testFunc();

            assert.isArray(testFunc.callList);
            assert.strictEqual(testFunc.callList.length, 5);
            var list = testFunc.callList.getAllReturns();
            assert.isArray(list);
            assert.strictEqual(list.length, 5);
            assert.deepEqual(list[0], "beer");
            assert.deepEqual(list[1], {
                a: 1
            });
            assert.deepEqual(list[2], "beer");
            assert.deepEqual(list[3], [1, 2, 3]);
            assert.deepEqual(list[4], "wine");
        });

        it("can get all return values with an attribute");
        it("can get all exceptions with a function");
        it("can get all exceptions with an attribute");
        it("can get all set values");
    });

    describe("expect", function() {
        it("call count", function() {
            var w = new Wrapper();
            assert.isNotOk(w.expectCallCount(1), "expected call count to be zero");
            assert.isOk(w.expectCallCount(0), "expected call count to be zero");
            w();
            assert.isOk(w.expectCallCount(1), "expected call count to be one");
            w();
            assert.isOk(w.expectCallCount(2), "expected call count to be two");
        });

        it("call range", function() {
            var w = new Wrapper();
            assert.isOk(w.expectCallCountRange(0, 1), "expected call count range between 0 and 1 to be okay");
            assert.isOk(w.expectCallCountRange(0, 5), "expected call count range between 0 and 5 to be okay");
            assert.isNotOk(w.expectCallCountRange(1, 5), "expected call count range between 1 and 5 to not be okay");
            w();
            assert.isOk(w.expectCallCountRange(1, 5), "expected call count range between 1 and 5 to be okay");
            w();
            w();
            assert.isOk(w.expectCallCountRange(1, 5), "expected call count range between 1 and 5 to be okay");
            assert.isNotOk(w.expectCallCountRange(0, 2), "expected call count range between 0 and 2 to not be okay");
        });

        it("call min", function() {
            var w = new Wrapper();
            w();
            w();
            assert.isOk(w.expectCallCountMin(1), "called at least once");
            assert.isOk(w.expectCallCountMin(2), "called at least twice");
            assert.isNotOk(w.expectCallCountMin(3), "called at least three times");
        });

        it("call max", function() {
            var w = new Wrapper();
            w();
            w();
            assert.isNotOk(w.expectCallCountMax(1), "called at most once");
            assert.isOk(w.expectCallCountMax(2), "called at most twice");
            assert.isOk(w.expectCallCountMax(3), "called at most three times");
        });

        it("call args", function() {
            var w = new Wrapper();
            w();
            assert.isOk(w.filterOneByCallNumber(0).expectCallArgs());
            assert.isNotOk(w.filterOneByCallNumber(0).expectCallArgs("foo"));
            w("beer");
            assert.isOk(w.filterOneByCallNumber(1).expectCallArgs("beer"));
            assert.isNotOk(w.filterOneByCallNumber(1).expectCallArgs("foo"));
            w(true);
            assert.isOk(w.filterOneByCallNumber(2).expectCallArgs(true));
            assert.isNotOk(w.filterOneByCallNumber(2).expectCallArgs("foo"));
            w(false);
            assert.isOk(w.filterOneByCallNumber(3).expectCallArgs(false));
            assert.isNotOk(w.filterOneByCallNumber(3).expectCallArgs("foo"));
            // w({});
            // assert.isOk (w.filterOneByCallNumber(4).expectCallArgs({}));
            // assert.isNotOk (w.filterOneByCallNumber(4).expectCallArgs("foo"));
            // w([]);
            // assert.isOk (w.filterOneByCallNumber(5).expectCallArgs([]));
            // assert.isNotOk (w.filterOneByCallNumber(5).expectCallArgs("foo"));
        });

        it("call args deep equal");
        // object, array, array buffer
        it("check bad arguments to functions");
        it("throws TypeError if expectCallCount called with bad arg", function() {
            var w = new Wrapper();
            w();
            assert.throws(function() {
                w.expectCallCount("foo");
            }, TypeError);
        });
        it("throws TypeError if expectCallCountRange called with bad min");
        it("throws TypeError if expectCallCountRange called with bad max");
        it("throws TypeError if expectCallCountMin called with bad min");
        it("throws TypeError if expectCallCountMax called with bad max");
    });

    describe("aliases", function() {
        it("includes expectCallOnce", function() {
            var w = new Wrapper();
            w();
            assert.isOk(w.expectCallOnce(), "only called once");
            w();
            assert.isNotOk(w.expectCallOnce(), "called more than once");
        });

        it("includes expectCallTwice", function() {
            var w = new Wrapper();
            w();
            assert.isNotOk(w.expectCallTwice(), "called twice");
            w();
            assert.isOk(w.expectCallTwice(), "called twice");
            w();
            assert.isNotOk(w.expectCallTwice(), "called twice");
        });

        it("includes expectCallThrice", function() {
            var w = new Wrapper();
            w();
            assert.isNotOk(w.expectCallThrice(), "called thrice");
            w();
            assert.isNotOk(w.expectCallThrice(), "called thrice");
            w();
            assert.isOk(w.expectCallThrice(), "called thrice");
            w();
            assert.isNotOk(w.expectCallThrice(), "called thrice");
        });
    });

    describe("trigger", function() {
        it("can be created", function() {
            var w = new Wrapper();
            var ret = w.triggerAlways();
            assert.instanceOf(ret, Trigger);
        });

        it("can spoof a call return value", function() {
            var w = new Wrapper();
            var ret = w.triggerAlways().actionReturn({
                foo: "bar"
            });
            assert.instanceOf(ret, Trigger);
            ret = w();
            assert.deepEqual(ret, {
                foo: "bar"
            });
        });

        it("can spoof an attribute return value", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");
            var ret = w.triggerAlways().actionReturn("all gone");
            assert.instanceOf(ret, Trigger);
            ret = testObj.beer;
            assert.strictEqual(ret, "all gone");
            // XXX: intresting -- this doesn't actually get the return value of the setter... it gets "more"
            // ret = (testObj.beer = "more");
            testObj.beer = "more";
            assert.strictEqual(w.attrValue, "more");
            ret = testObj.beer;
            assert.strictEqual(ret, "all gone");
        });
    });

    describe("match", function() {
        it("throws with no args", function() {
            assert.throws(function() {
                new Match();
            }, TypeError, "Match: requires a value or type to match");
        });

        it("can get type of number", function() {
            var m = new Match({
                value: 5
            });
            var type = m.getType(5);
            assert.strictEqual(type.name, "number");
        });

        it("can diff numbers", function() {
            var m = new Match({
                value: 5
            });
            var ret = m.diff(m.value, 5);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);

            ret = m.diff(m.value, 3);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: 5,
                dst: 3
            }]);

            ret = m.diff(m.value, 0);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: 5,
                dst: 0
            }]);
        });

        it("can compare numbers", function() {
            var m = new Match({
                value: 5
            });
            assert.isOk(m.compare(5));
            assert.isNotOk(m.compare(42));
            assert.isNotOk(m.compare(0));
        });

        it("can diff number arrays", function() {
            var m = new Match({
                value: [1, 2, 3]
            });

            var ret;
            ret = m.diff(m.value, [1, 2, 3]);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            ret = m.diff(m.value, [1, 2]);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                key: 2,
                src: 3,
                dst: undefined
            }]);

            // ret = m.diff(m.value, [1, 2, 3, 4]);
            // assert.isArray(ret);
            // assert.strictEqual(ret.length, 1);
            // assert.deepEqual(ret, [{
            //     key: 3,
            //     src: undefined,
            //     dst: 4
            // }]);
        });

        it("can compare number arrays", function() {
            var m = new Match({
                value: [1, 2, 3]
            });
            assert.isOk(m.compare([1, 2, 3]));
            assert.isNotOk(m.compare([4, 5, 6]));
            assert.isNotOk(m.compare([1, 2, 3, 4]));
            assert.isNotOk(m.compare([1, 2]));
        });

        it("can diff two strings", function() {
            var m = new Match({
                value: "beer"
            });

            var ret;
            ret = m.diff(m.value, "beer");
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            ret = m.diff(m.value, "wine");
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: "beer",
                dst: "wine"
            }]);

            ret = m.diff(m.value, "");
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: "beer",
                dst: ""
            }]);
        });

        it("can diff two simple objects", function() {
            var m = new Match({
                value: {
                    foo: "bar",
                    idx: 5
                }
            });

            // same
            var ret;
            ret = m.diff(m.value, {
                foo: "bar",
                idx: 5
            });
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            // same empty
            ret = m.diff({}, {});
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);


            // changed value
            ret = m.diff(m.value, {
                foo: 1,
                idx: 5
            });
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                key: "foo",
                src: "bar",
                dst: 1
            }]);

            // missing key
            ret = m.diff(m.value, {
                foo: "bar"
            });
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                key: "idx",
                src: 5,
                dst: undefined
            }]);

            // added key
            ret = m.diff(m.value, {
                foo: "bar",
                idx: 5,
                beer: "yum"
            });
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                key: "beer",
                src: undefined,
                dst: "yum"
            }]);
        });

        it("can compare null", function() {
            var m = new Match({
                value: null
            });
            assert.isOk(m.compare(null));
            assert.isNotOk(m.compare(undefined));
            assert.isNotOk(m.compare(""));
        });

        it("can compare boolean", function() {
            var m = new Match({
                value: true
            });
            assert.isOk(m.compare(true));
            assert.isNotOk(m.compare(false));

            m = new Match({
                value: false
            });
            assert.isOk(m.compare(false));
            assert.isNotOk(m.compare(true));
        });

        it("can get type of date", function() {
            var now = new Date();
            var m = new Match({
                value: now
            });

            var matcher = m.getType(now);
            assert.isObject(matcher);
            assert.isOk(m.isMatcher(matcher));
            assert.strictEqual(matcher.name, "date");
        });

        it("can diff dates", function() {
            var date1 = new Date();
            var date2 = new Date(0);
            var m = new Match({
                value: date1
            });

            // same
            var ret;
            ret = m.diff(m.value, date1);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            // different
            ret = m.diff(m.value, date2);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: date1,
                dst: date2
            }]);
        });

        it("can diff regexps", function() {
            var m = new Match({
                value: /a/
            });

            // same
            var ret;
            ret = m.diff(m.value, /a/);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            // different
            ret = m.diff(m.value, /b/);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: "/a/",
                dst: "/b/"
            }]);
        });

        it("can diff errors", function() {
            var m = new Match({
                value: new Error("this is a new error")
            });

            // same
            var ret;
            ret = m.diff(m.value, new Error("this is a new error"));
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            // different type
            ret = m.diff(m.value, new Error("different error message"));
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                key: "message",
                src: "this is a new error",
                dst: "different error message"
            }]);

            // different message
            ret = m.diff(m.value, new TypeError("this is a new error"));
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                key: "name",
                src: "Error",
                dst: "TypeError"
            }]);

            // completely different
            ret = m.diff(m.value, new RangeError("blurp"));
            assert.isArray(ret);
            assert.strictEqual(ret.length, 2);
            assert.deepEqual(ret, [{
                key: "name",
                src: "Error",
                dst: "RangeError"
            }, {
                key: "message",
                src: "this is a new error",
                dst: "blurp"
            }]);
        });

        it("can diff single invocations", function() {
            // constructor(thisArg, argList, retVal, exception)
            var si = new SingleCall({}, [1, 2, 3]);
            var m = new Match({
                value: si
            });

            // same
            var ret;
            var si2 = new SingleCall({}, [1, 2, 3]);
            ret = m.diff(m.value, si2);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);
        });

        it("can diff undefined", function() {
            var m = Match.Value(undefined);

            // matches
            var ret;
            ret = m.diff(m.value, undefined);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            // doesn't match
            ret = m.diff(m.value, "bob");
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: undefined,
                dst: "bob"
            }]);
        });

        it.only("can diff null", function() {
            var m = Match.Value(null);

            // matches
            var ret;
            ret = m.diff(m.value, null);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);

            // doesn't match
            ret = m.diff(m.value, "bob");
            assert.isArray(ret);
            assert.strictEqual(ret.length, 1);
            assert.deepEqual(ret, [{
                src: null,
                dst: "bob"
            }]);
        });

        it("can diff two complex objects");
        it("can diff two complex arrays");
        it("can convert a diff to a string");

        it("cannot extend an existing name", function() {
            var m = Match.Value("10");

            // missing name
            assert.throws(function() {
                m.extend();
            }, TypeError, "Match.extend: 'name' should be string");

            // duplicate name
            assert.throws(function() {
                m.extend("string");
            }, TypeError, "Match.extend: 'string' already exists");
        });
    });
})();
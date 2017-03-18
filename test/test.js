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
    var SingleInvocation = CandyWrapper.SingleInvocation;

    describe("requested new feature list", function() {
        it("can detect when a function has been invoked with 'new()'");
    });

    describe("create wrapper", function() {
        it("can create an empty wrapper", function() {
            var ret = new Wrapper();
            assert.isFunction(ret);
            ret();
        });

        it("can wrap a function", function() {
            var called = false;

            function testFunc() {
                called = true;
            }
            var ret = new Wrapper(testFunc);
            assert.isFunction(ret);
            ret();
            assert.strictEqual(called, true, "expected wrapped function to get called");
        });

        it("can wrap a method");
        it("can wrap an attribute");
        it("can wrap an object");
        it("can wrap a method with a custom function");
        it("can wrap an attribute with a custom function");
        it("mirrors defineProperty values");
        it("mirrors function name, argument length, and argument list");
    });

    describe("config", function() {
        it("can restore wrapped function");
        it("can reset wrapper");
    });

    describe("select", function() {
        it("can get by call number", function() {
            var ret;
            var w = new Wrapper();
            assert.throws(function() {
                w.selectOneByCallNumber(0);
            }, RangeError);
            w();
            w();
            w();
            ret = w.selectOneByCallNumber(0);
            assert.instanceOf(ret, SingleInvocation);
            w.selectOneByCallNumber(1);
            w.selectOneByCallNumber(2);
            assert.throws(function() {
                w.selectOneByCallNumber(3);
            }, RangeError);
            w();
            ret = w.selectOneByCallNumber(3);
            assert.instanceOf(ret, SingleInvocation);
        });
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

        it.skip("call args", function() {
            var w = new Wrapper();
            w();
            assert.isOk(w.selectOneByCallNumber(0).expectCallArgs());
            assert.isNotOk(w.selectOneByCallNumber(0).expectCallArgs("foo"));
            w("beer");
            assert.isOk(w.selectOneByCallNumber(1).expectCallArgs("beer"));
            assert.isNotOk(w.selectOneByCallNumber(1).expectCallArgs("foo"));
            w(true);
            assert.isOk(w.selectOneByCallNumber(2).expectCallArgs(true));
            assert.isNotOk(w.selectOneByCallNumber(2).expectCallArgs("foo"));
            w(false);
            assert.isOk(w.selectOneByCallNumber(3).expectCallArgs(false));
            assert.isNotOk(w.selectOneByCallNumber(3).expectCallArgs("foo"));
            // w({});
            // assert.isOk (w.selectOneByCallNumber(4).expectCallArgs({}));
            // assert.isNotOk (w.selectOneByCallNumber(4).expectCallArgs("foo"));
            // w([]);
            // assert.isOk (w.selectOneByCallNumber(5).expectCallArgs([]));
            // assert.isNotOk (w.selectOneByCallNumber(5).expectCallArgs("foo"));
        });

        it("call args deep equal");
        // object, array, array buffer
        it("check bad arguments to functions");
    });

    describe("trigger", function() {
        it("can be created", function() {
            var w = new Wrapper();
            var ret = w.triggerAlways();
            assert.instanceOf(ret, Trigger);
        });

        it("can spoof a return value", function() {
            var w = new Wrapper();
            console.log ("--- SETUP --- ");
            var ret = w.triggerAlways().actionReturn({foo: "bar"});
            assert.instanceOf(ret, Trigger);
            console.log ("--- RUN ---");
            ret = w();
            assert.deepEqual(ret, {foo: "bar"});
        });
    });

    describe("match", function() {
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

        it("can diff single invocations", function() {
            // constructor(thisArg, argList, retVal, exception)
            var si = new SingleInvocation({}, [1, 2, 3]);
            var m = new Match({
                value: si
            });

            // same
            var ret;
            var si2 = new SingleInvocation({}, [1, 2, 3]);
            ret = m.diff(m.value, si2);
            console.log("ret", ret);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 0);
            assert.deepEqual(ret, []);
        });

        it("can diff two complex objects");
        it("can diff two complex arrays");
    });
})();
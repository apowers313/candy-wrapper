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

describe("match", function() {
    it("throws with no args", function() {
        assert.throws(function() {
            new Match();
        }, TypeError, "Match: requires a value or type to match");
    });

    it("can get type of number", function() {
        var type = Match.getType(5);
        assert.strictEqual(type.name, "number");
    });

    it("can diff numbers", function() {
        var m = new Match({
            value: 5
        });
        var ret = Match.diff(m.value, 5);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);

        ret = Match.diff(m.value, 3);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            src: 5,
            dst: 3
        }]);

        ret = Match.diff(m.value, 0);
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
        ret = Match.diff(m.value, [1, 2, 3]);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        ret = Match.diff(m.value, [1, 2]);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            key: "[2]",
            src: 3,
            dst: undefined
        }]);

        // ret = Match.diff(m.value, [1, 2, 3, 4]);
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
        ret = Match.diff(m.value, "beer");
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        ret = Match.diff(m.value, "wine");
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            src: "beer",
            dst: "wine"
        }]);

        ret = Match.diff(m.value, "");
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
        ret = Match.diff(m.value, {
            foo: "bar",
            idx: 5
        });
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // same empty
        ret = Match.diff({}, {});
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // changed foo value to 1
        ret = Match.diff(m.value, {
            foo: 1,
            idx: 5
        });
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            key: ".foo",
            src: "bar",
            dst: 1
        }]);

        // missing key
        ret = Match.diff(m.value, {
            foo: "bar"
        });
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            key: ".idx",
            src: 5,
            dst: undefined
        }]);

        // added key
        ret = Match.diff(m.value, {
            foo: "bar",
            idx: 5,
            beer: "yum"
        });
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            key: ".beer",
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

        var matcher = Match.getType(now);
        assert.isObject(matcher);
        assert.isOk(Match.isMatcher(matcher));
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
        ret = Match.diff(m.value, date1);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // different
        ret = Match.diff(m.value, date2);
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
        ret = Match.diff(m.value, /a/);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // different
        ret = Match.diff(m.value, /b/);
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
        ret = Match.diff(m.value, new Error("this is a new error"));
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // different type
        ret = Match.diff(m.value, new Error("different error message"));
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            key: "message",
            src: "this is a new error",
            dst: "different error message"
        }]);

        // different message
        ret = Match.diff(m.value, new TypeError("this is a new error"));
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            key: "name",
            src: "Error",
            dst: "TypeError"
        }]);

        // completely different
        ret = Match.diff(m.value, new RangeError("blurp"));
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

    it("can diff undefined", function() {
        var m = Match.value(undefined);

        // matches
        var ret;
        ret = Match.diff(m.value, undefined);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // doesn't match
        ret = Match.diff(m.value, "bob");
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            src: undefined,
            dst: "bob"
        }]);
    });

    it("can diff null", function() {
        var m = Match.value(null);

        // matches
        var ret;
        ret = Match.diff(m.value, null);
        assert.isArray(ret);
        assert.strictEqual(ret.length, 0);
        assert.deepEqual(ret, []);

        // doesn't match
        ret = Match.diff(m.value, "bob");
        assert.isArray(ret);
        assert.strictEqual(ret.length, 1);
        assert.deepEqual(ret, [{
            src: null,
            dst: "bob"
        }]);
    });

    it("can diff two complex objects");
    it("can diff two complex arrays");

    it("cannot a new type of an existing name", function() {

        // missing name
        assert.throws(function() {
            Match.addType();
        }, TypeError, "Match.addType: 'name' should be string");

        // duplicate name
        assert.throws(function() {
            Match.addType("string");
        }, TypeError, "Match.addType: 'string' already exists");
    });

    it("can convert a diff to an array of strings", function() {
        var msgList;
        var diff;

        // same diff
        diff = Match.diff("foo", "foo");
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, []);

        // simple string diff
        diff = Match.diff("foo", "bar");
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, ["Expected: 'foo'; Got: 'bar'"]);

        // simple number diff
        diff = Match.diff(3, 5);
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, ["Expected: '3'; Got: '5'"]);

        // array diff
        diff = Match.diff([1, 2, 3], [1, 2, 4]);
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, ["At [2]: Expected: '3'; Got: '4'"]);

        diff = Match.diff([1, 2, 3, 4], [1, 2, 4]);
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, [
            "At [2]: Expected: '3'; Got: '4'",
            "At [3]: Expected: '4'; Got: 'undefined'"
        ]);

        // object diff
        diff = Match.diff({
            foo: "bar",
            idx: 1
        }, {
            foo: null,
            idx: 1
        });
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, ["At .foo: Expected: 'bar'; Got: 'null'"]);

        // deep object diff
        var obj1 = {
            rabbitHole: {
                deep: {
                    deeper: {
                        location: "wonderland"
                    }
                }
            }
        };
        var obj2 = {
            rabbitHole: {
                deep: {
                    deeper: {
                        location: "home"
                    }
                }
            }
        };
        diff = Match.diff(obj1, obj2);
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, ["At .rabbitHole.deep.deeper.location: Expected: 'wonderland'; Got: 'home'"]);

        // array of objects
        var arr1 = [{}, {
            beer: "yum"
        }, {
            going: {
                down: "elevator"
            }
        }, 42];
        var arr2 = [{}, {
            beer: "yum"
        }, {
            going: {
                down: "escalator"
            }
        }, 42];
        diff = Match.diff(arr1, arr2);
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, ["At [2].going.down: Expected: 'elevator'; Got: 'escalator'"]);

        // multiple differences
        obj1.list = arr1;
        obj2.list = arr2;
        diff = Match.diff(obj1, obj2);
        msgList = diff.toStringArray();
        assert.deepEqual(msgList, [
            "At .rabbitHole.deep.deeper.location: Expected: 'wonderland'; Got: 'home'",
            "At .list[2].going.down: Expected: 'elevator'; Got: 'escalator'"
        ]);
    });

    describe("match type", function() {
        it("throws errors on bad args", function() {
            assert.throws(function() {
                Match.type();
            }, TypeError, "Match constructor: expected type name to be of type String");

            assert.throws(function() {
                Match.type(123);
            }, TypeError, "Match constructor: expected type name to be of type String");

            assert.throws(function() {
                Match.type("foo");
            }, TypeError, "Match constructor: type 'foo' hasn't be registered");
        });

        it("can match number type", function() {
            var m = Match.type("number");

            // match
            assert.isTrue(m.compare(3));

            // non-match
            assert.isFalse(m.compare("foo"));
        });

        it("can match array type", function() {
            var m = Match.type("array");

            // match
            assert.isTrue(m.compare([]));
            assert.isTrue(m.compare([1, 2, 3]));

            // non-match
            assert.isFalse(m.compare({}));
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare(undefined));
        });

        it("can match object type", function() {
            var m = Match.type("object");

            // match
            assert.isTrue(m.compare({}));
            assert.isTrue(m.compare({
                a: 1
            }));
            assert.isTrue(m.compare(new Error()));
            assert.isTrue(m.compare([]));
            assert.isTrue(m.compare(new Date()));

            // non-match
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare(undefined));
            assert.isFalse(m.compare("foo"));
        });

        it("can match string type", function() {
            var m = Match.type("string");

            // match
            assert.isTrue(m.compare(""));
            assert.isTrue(m.compare("foo"));

            // non-match
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare(undefined));
            assert.isFalse(m.compare([]));
        });

        it("can match null type", function() {
            var m = Match.type("null");

            // match
            assert.isTrue(m.compare(null));

            // non-match
            assert.isFalse(m.compare(undefined));
            assert.isFalse(m.compare([]));
            assert.isFalse(m.compare(new Error()));
            assert.isFalse(m.compare(""));
        });

        it("can match boolean type", function() {
            var m = Match.type("boolean");

            // match
            assert.isTrue(m.compare(true));
            assert.isTrue(m.compare(false));

            // non-match
            assert.isFalse(m.compare(undefined));
            assert.isFalse(m.compare([]));
            assert.isFalse(m.compare(new Error()));
            assert.isFalse(m.compare(""));
        });

        it("can match undefined type", function() {
            var m = Match.type("undefined");

            // match
            assert.isTrue(m.compare(undefined));

            // non-match
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare([]));
            assert.isFalse(m.compare(new Error()));
            assert.isFalse(m.compare(""));
        });

        it("can match date type", function() {
            var m = Match.type("date");

            // match
            assert.isTrue(m.compare(new Date()));

            // non-match
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare([]));
            assert.isFalse(m.compare(new Error()));
            assert.isFalse(m.compare(""));
        });

        it("can match regexp type", function() {
            var m = Match.type("regexp");

            // match
            assert.isTrue(m.compare(/a/));
            assert.isTrue(m.compare(new RegExp("b")));

            // non-match
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare([]));
            assert.isFalse(m.compare(new Error()));
            assert.isFalse(m.compare(""));
            assert.isFalse(m.compare({}));
        });

        it("can match error type", function() {
            var m = Match.type("error");

            // match
            assert.isTrue(m.compare(new Error()));
            assert.isTrue(m.compare(new TypeError("b")));
            assert.isTrue(m.compare(new RangeError("foo")));

            // non-match
            assert.isFalse(m.compare(undefined));
            assert.isFalse(m.compare(null));
            assert.isFalse(m.compare([]));
            assert.isFalse(m.compare(""));
            assert.isFalse(m.compare({}));
        });

        it("can match values by type", function() {
            var m1 = Match.type("object");
            var m2 = Match.value(m1);
            assert.strictEqual(m1, m2);
        });
    });
    describe("type matching", function() {
        // filter
        // trigger
        // expect

        it("filters return values by type", function() {
            var w = new Wrapper();

            w.triggerOnCallNumber(0)
                .actionReturn("beer");
            w.triggerOnCallNumber(1)
                .actionReturn(undefined);
            w.triggerOnCallNumber(2)
                .actionReturn(42);
            w.triggerOnCallNumber(3)
                .actionReturn("wine");
            w.triggerOnCallNumber(4)
                .actionReturn(777);
            w.triggerOnCallNumber(5)
                .actionReturn(undefined);

            w();
            w();
            w();
            w();
            w();
            w();

            assert.strictEqual(w.historyList.length, 6);

            var list;
            // strings
            // list = w.historyList.filterByReturn(Match.type("string"));
            // assert.strictEqual(list.length, 2);
            // assert.strictEqual(list[0].retVal, "beer");
            // assert.strictEqual(list[1].retVal, "wine");

            // undefined
            list = w.historyList.filterByReturn(Match.type("undefined"));
            assert.strictEqual(list.length, 2);
            assert.strictEqual(list[0].retVal, undefined);
            assert.strictEqual(list[1].retVal, undefined);

            // numbers
            list = w.historyList.filterByReturn(Match.type("number"));
            assert.strictEqual(list.length, 2);
            assert.strictEqual(list[0].retVal, 42);
            assert.strictEqual(list[1].retVal, 777);
        });

        it("filters arguments by type", function() {
            var w = new Wrapper();

            w("drink", "beer");
            w("fun", true);
            w("fun", false);
            w([1, 2, 3], null, undefined);
            w("test", {});
            w(false);

            assert.strictEqual(w.historyList.length, 6);

            var list;
            list = w.historyList.filterByCallArgs(Match.type("boolean"));
            assert.strictEqual(list.length, 1);

            list = w.historyList.filterByCallArgs(Match.type("string"), Match.type("string"));
            assert.strictEqual(list.length, 1);

            list = w.historyList.filterByCallArgs(Match.type("string"), Match.type("boolean"));
            assert.strictEqual(list.length, 2);
        });
    });
});
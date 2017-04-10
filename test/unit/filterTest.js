var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;
var Filter = CandyWrapper.Filter;
var Operation = CandyWrapper.Operation;
var ExpectError = CandyWrapper.ExpectError;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("filter", function() {
    it("constructor throws on bad args", function() {
        assert.throws(function() {
            new Filter();
        }, TypeError, "Filter constructor: expected first argument to be of type Wrapper");
    });

    it("can get by call number", function() {
        var ret;
        var w = new Wrapper();
        assert.throws(function() {
            w.historyList.filterByNumber(0);
        }, RangeError);
        w();
        w();
        w();
        ret = w.historyList.filterByNumber(0);
        assert.instanceOf(ret, Operation);
        w.historyList.filterByNumber(1);
        w.historyList.filterByNumber(2);
        assert.throws(function() {
            w.historyList.filterByNumber(3);
        }, RangeError);
        w();
        ret = w.historyList.filterByNumber(3);
        assert.instanceOf(ret, Operation);
    });

    it("can select only property gets", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        // initial
        var getList, setList;
        assert.isArray(w.historyList);
        assert.strictEqual(w.historyList.length, 0);
        getList = w.historyList.filterPropGet();
        setList = w.historyList.filterPropSet();
        assert.isArray(getList);
        assert.strictEqual(getList.length, 0);
        assert.isArray(setList);
        assert.strictEqual(setList.length, 0);

        // set #1
        testObj.beer = "gone";
        assert.strictEqual(w.historyList.length, 1);
        getList = w.historyList.filterPropGet();
        setList = w.historyList.filterPropSet();
        assert.isArray(getList);
        assert.strictEqual(getList.length, 0);
        assert.isArray(setList);
        assert.strictEqual(setList.length, 1);
        assert.strictEqual(setList[0].getOrSet, "set");
        assert.strictEqual(setList[0].setVal, "gone");
        assert.strictEqual(setList[0].retVal, "gone");
        assert.isNull(setList[0].exception);

        // get #1
        var ret = testObj.beer;
        assert.strictEqual(ret, "gone");
        assert.strictEqual(w.historyList.length, 2);
        getList = w.historyList.filterPropGet();
        setList = w.historyList.filterPropSet();
        assert.isArray(getList);
        assert.strictEqual(getList.length, 1);
        assert.isArray(setList);
        assert.strictEqual(setList.length, 1);
        assert.strictEqual(getList[0].getOrSet, "get");
        assert.isUndefined(getList[0].setVal);
        assert.strictEqual(getList[0].retVal, "gone");
        assert.isNull(getList[0].exception);

        // set #2
        testObj.beer = "more";
        assert.strictEqual(w.historyList.length, 3);
        getList = w.historyList.filterPropGet();
        setList = w.historyList.filterPropSet();
        assert.isArray(getList);
        assert.strictEqual(getList.length, 1);
        assert.isArray(setList);
        assert.strictEqual(setList.length, 2);
        assert.strictEqual(setList[1].getOrSet, "set");
        assert.strictEqual(setList[1].setVal, "more");
        assert.strictEqual(setList[1].retVal, "more");
        assert.isNull(setList[1].exception);

        // get #2
        ret = testObj.beer;
        assert.strictEqual(ret, "more");
        assert.strictEqual(w.historyList.length, 4);
        getList = w.historyList.filterPropGet();
        setList = w.historyList.filterPropSet();
        assert.isArray(getList);
        assert.strictEqual(getList.length, 2);
        assert.isArray(setList);
        assert.strictEqual(setList.length, 2);
        assert.strictEqual(getList[1].getOrSet, "get");
        assert.isUndefined(getList[1].setVal);
        assert.strictEqual(getList[1].retVal, "more");
        assert.isNull(getList[1].exception);
    });

    it("can filter function calls by argument list", function() {
        var w = new Wrapper();
        w("beer");
        w("wine");
        w("beer");
        w(1, 2, 3);
        w("beer", "wine", "martini");
        w("martini");
        assert.isArray(w.historyList);
        assert.strictEqual(w.historyList.length, 6);

        // match by "beer" args
        var list;
        list = w.historyList.filterByCallArgs("beer");
        assert.strictEqual(list.length, 2);
        assert.deepEqual(list[0].argList, ["beer"]);
        assert.deepEqual(list[1].argList, ["beer"]);

        // match by 1, 2, 3 args
        list = w.historyList.filterByCallArgs(1, 2, 3);
        assert.strictEqual(list.length, 1);
        assert.deepEqual(list[0].argList, [1, 2, 3]);

        // match by "beer", "wine", "martini" args
        list = w.historyList.filterByCallArgs("beer", "wine", "martini");
        assert.strictEqual(list.length, 1);
        assert.deepEqual(list[0].argList, ["beer", "wine", "martini"]);

        // non-match
        list = w.historyList.filterByCallArgs("nothing");
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

        assert.isArray(testFunc.historyList);
        assert.strictEqual(testFunc.historyList.length, 5);

        // match by "beer" return value
        var list;
        list = testFunc.historyList.filterByReturn("beer");
        assert.strictEqual(list.length, 2);
        assert.deepEqual(list[0].retVal, "beer");
        assert.deepEqual(list[1].retVal, "beer");

        // match by {a: 1} return value
        list = testFunc.historyList.filterByReturn({
            a: 1
        });
        assert.strictEqual(list.length, 1);
        assert.deepEqual(list[0].retVal, {
            a: 1
        });

        // non-match
        list = testFunc.historyList.filterByReturn(false);
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

        assert.isArray(w.historyList);
        assert.strictEqual(w.historyList.length, 3);

        // match context by {prop: "beer"}
        var list;
        list = w.historyList.filterByCallContext({
            prop: "beer"
        });
        assert.strictEqual(list.length, 2);
        assert.deepEqual(list[0].context, {
            prop: "beer"
        });
        assert.deepEqual(list[1].context, {
            prop: "beer"
        });

        // match context by {test: [1, 2, 3]}
        list = w.historyList.filterByCallContext({
            test: [1, 2, 3]
        });
        assert.strictEqual(list.length, 1);
        assert.deepEqual(list[0].context, {
            test: [1, 2, 3]
        });

        // non-match
        list = w.historyList.filterByCallContext({
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
                case 6:
                    return;
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
        try {
            testFunc();
        } catch (e) {}

        assert.isArray(testFunc.historyList);
        assert.strictEqual(testFunc.historyList.length, 6);

        // filter by "out of beer" exceptions
        var list;
        list = testFunc.historyList.filterByException(new Error("out of beer"));
        assert.strictEqual(list.length, 3);
        assert.strictEqual(list[0].exception.name, "Error");
        assert.strictEqual(list[0].exception.message, "out of beer");
        assert.strictEqual(list[1].exception.name, "Error");
        assert.strictEqual(list[1].exception.message, "out of beer");
        assert.strictEqual(list[2].exception.name, "Error");
        assert.strictEqual(list[2].exception.message, "out of beer");

        // non-error
        list = testFunc.historyList.filterByException(null);
        assert.isNull(list[0].exception);

        // non-match
        list = testFunc.historyList.filterByException(new Error("wine")); // XXX: wrong error type
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

        assert.isArray(w.historyList);
        assert.strictEqual(w.historyList.length, 4);

        // match set value by "good"
        var list;
        list = w.historyList.filterPropSetByVal("good");
        assert.strictEqual(list.length, 2);
        assert.strictEqual(list[0].setVal, "good");
        assert.strictEqual(list[1].setVal, "good");

        // non-match
        list = w.historyList.filterPropSetByVal("nothing");
        assert.strictEqual(list.length, 0);
    });

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

        assert.isArray(testFunc.historyList);
        assert.strictEqual(testFunc.historyList.length, 5);
        var list = testFunc.historyList.filterByCallArgs("yum")
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
            w.historyList.filterByCallContext();
        }, TypeError, "filterByCallContext: expected a single argument of any type");

        assert.throws(function() {
            w.historyList.filterByException();
        }, TypeError, "filterByException: expected a single argument of type Error");

        // assert.throws(function() {
        //     w.historyList.filterByReturn();
        // }, TypeError, "filterByReturn: expected one argument");

        var testObj = {
            beer: "yummy"
        };
        w = new Wrapper(testObj, "beer");
        testObj.beer = "gulp";
        assert.throws(function() {
            w.historyList.filterPropSetByVal();
        }, TypeError, "filterPropSetByVal: expected a single argument of any type");
    });

    it("can get only value", function() {
        var w = new Wrapper();

        // no values
        assert.throws(function() {
            w.historyList.filterOnly();
        }, TypeError, "filterOnly: expected exactly one value");

        // one value
        w();
        assert.doesNotThrow(function() {
            w.historyList.filterOnly();
        }, TypeError, "filterOnly: expected exactly one value");

        // two values
        w();
        assert.throws(function() {
            w.historyList.filterOnly();
        }, TypeError, "filterOnly: expected exactly one value");
    });

    it("can filter by number", function() {
        var w = new Wrapper();

        // missing arg
        assert.throws(function() {
            w.historyList.filterByNumber();
        }, TypeError, "filterByNumber: expected a single argument of type Number");
        // arg wrong type
        assert.throws(function() {
            w.historyList.filterByNumber("foo");
        }, TypeError, "filterByNumber: expected a single argument of type Number");

        // nothing to get
        assert.throws(function() {
            w.historyList.filterByNumber(1);
        }, RangeError, "filterByNumber: empty list");

        w("beer");
        // only 0, can't get 1
        assert.throws(function() {
            w.historyList.filterByNumber(1);
        }, RangeError, "filterByNumber: 'num' out of bounds");
        // no negative indexes please
        assert.throws(function() {
            w.historyList.filterByNumber(-1);
        }, RangeError, "filterByNumber: 'num' out of bounds");

        // success
        var ret = w.historyList.filterByNumber(0);
        assert.instanceOf(ret, Operation);
    });

    it("can filter first", function() {
        var w = new Wrapper();

        // empty list
        assert.throws(function() {
            w.historyList.filterFirst();
        }, RangeError, "empty list");

        w("beer");
        var ret = w.historyList.filterFirst();
        assert.instanceOf(ret, Operation);
        assert.deepEqual(ret.argList, ["beer"]);

        w("wine");
        ret = w.historyList.filterFirst();
        assert.instanceOf(ret, Operation);
        assert.deepEqual(ret.argList, ["beer"]);
    });

    it("can filter last", function() {
        var w = new Wrapper();

        // empty list
        assert.throws(function() {
            w.historyList.filterLast();
        }, RangeError, "filterlast: empty list");

        w("beer");
        var ret = w.historyList.filterLast();
        assert.instanceOf(ret, Operation);
        assert.deepEqual(ret.argList, ["beer"]);

        w("wine");
        ret = w.historyList.filterLast();
        assert.instanceOf(ret, Operation);
        assert.deepEqual(ret.argList, ["wine"]);
    });

    it("is chainable", function() {
        var w = new Wrapper();

        w.triggerOnCallNumber(0)
            .actionReturn(true);
        w.triggerOnCallNumber(1)
            .actionReturn(false);
        w.triggerOnCallNumber(2)
            .actionReturn(true);
        w.triggerOnCallNumber(3)
            .actionReturn(false);
        w.triggerOnCallNumber(4)
            .actionReturn(true);
        w.triggerOnCallNumber(5)
            .actionReturn(false);

        w("beer");
        w("beer");
        w("wine");
        w("wine");
        w("beer");
        w("beer");

        var beerList, trueList, exceptionList;
        // get all calls with argument === beer
        beerList = w.historyList.filterByCallArgs("beer");
        assert.strictEqual(beerList.length, 4);

        // get all return values === true
        trueList = beerList.filterByReturn(true);
        assert.strictEqual(trueList.length, 2);

        // get all non-exceptions
        exceptionList = trueList.filterByException(null);
        assert.strictEqual(exceptionList.length, 2);

        // get all exceptions
        exceptionList = trueList.filterByException(new Error("foo"));
        assert.strictEqual(exceptionList.length, 0);
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

            assert.isArray(w.historyList);
            assert.strictEqual(w.historyList.length, 6);
            var list = w.historyList.getAllCallArgs();
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

        it("get all this values", function() {
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

            assert.isArray(w.historyList);
            assert.strictEqual(w.historyList.length, 3);
            var list = w.historyList.getAllCallContexts();
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

        it("get all exceptions", function() {
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

            assert.isArray(testFunc.historyList);
            assert.strictEqual(testFunc.historyList.length, 5);
            var list = testFunc.historyList.getAllExceptions();
            assert.isArray(list);
            assert.strictEqual(list.length, 5);
            assert.strictEqual(list[0].name, "Error");
            assert.strictEqual(list[0].message, "out of beer");
            assert.strictEqual(list[1].name, "TypeError");
            assert.strictEqual(list[1].message, "wine");
            assert.strictEqual(list[2].name, "Error");
            assert.strictEqual(list[2].message, "out of beer");
            assert.strictEqual(list[3].name, "RangeError");
            assert.strictEqual(list[3].message, "missed target");
            assert.strictEqual(list[4].name, "Error");
            assert.strictEqual(list[4].message, "out of beer");
        });

        it("can get all set vals", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");

            testObj.beer = "good";
            testObj.beer = "yummy";
            testObj.beer = "good";
            testObj.beer = [1, 2, 3];

            assert.isArray(w.historyList);
            assert.strictEqual(w.historyList.length, 4);

            var list = w.historyList.getAllSetVals();
            assert.isArray(list);
            assert.strictEqual(list.length, 4);
            assert.strictEqual(list[0], "good");
            assert.strictEqual(list[1], "yummy");
            assert.strictEqual(list[2], "good");
            assert.deepEqual(list[3], [1, 2, 3]);
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

            assert.isArray(testFunc.historyList);
            assert.strictEqual(testFunc.historyList.length, 5);
            var list = testFunc.historyList.getAllReturns();
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

        it("get can act on chained filter", function() {
            var w = new Wrapper();

            w.triggerOnCallNumber(0)
                .actionReturn(true);
            w.triggerOnCallNumber(1)
                .actionReturn(false);
            w.triggerOnCallNumber(2)
                .actionReturn(true);
            w.triggerOnCallNumber(3)
                .actionReturn(false);
            w.triggerOnCallNumber(4)
                .actionReturn(true);
            w.triggerOnCallNumber(5)
                .actionReturn(false);

            w("beer");
            w("beer");
            w("wine");
            w("wine");
            w("beer");
            w("beer");

            // get all calls with argument === beer
            // var beerList = w.historyList.filterByCallArgs("beer");
            // assert.strictEqual(beerList.length, 4);
            // var beerRets = beerList.getAllReturns();
            // assert.strictEqual(beerRets.length, 4);

            // get all return values === true
            var trueList = w.historyList.filterByReturn(true);
            assert.strictEqual(trueList.length, 3);
            var trueArgs = trueList.getAllCallArgs();
            assert.strictEqual(trueArgs.length, 3);

            // get all non-exceptions
            var exceptionList = trueList.filterByException(null);
            assert.strictEqual(exceptionList.length, 3);

            // get all exceptions
            exceptionList = trueList.filterByException(new Error("foo"));
            assert.strictEqual(exceptionList.length, 0);
        });

        it("throws when filtering propertys by call filters");
        it("throws when filtering calls by property filters");
        it("can filter property by number");
        it("can get all return values with an property");
        it("can get all exceptions with a function");
        it("can get all exceptions with an property");
        it("can get all set values");
    });
    describe("expect on filter", function() {
        it("call count", function() {
            var w = new Wrapper();

            assert.isTrue(w.historyList.expectCount(0));
            assert.isFalse(w.historyList.expectCount(1));
            w();
            assert.isFalse(w.historyList.expectCount(0));
            assert.isTrue(w.historyList.expectCount(1));
            assert.isFalse(w.historyList.expectCount(2));
            w();
            assert.isFalse(w.historyList.expectCount(0));
            assert.isFalse(w.historyList.expectCount(1));
            assert.isTrue(w.historyList.expectCount(2));

            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, /(5 expectation.*)/gm);

            assert.throws(function() {
                w.historyList.expectCount();
            }, TypeError, "expectCount: expected a single argument of type Number");

            assert.throws(function() {
                w.historyList.expectCount("foo");
            }, TypeError, "expectCount: expected a single argument of type Number");
        });

        it("call min", function() {
            var w = new Wrapper();

            assert.isTrue(w.historyList.expectCountMin(0));
            assert.isFalse(w.historyList.expectCountMin(1));
            assert.isFalse(w.historyList.expectCountMin(2));
            w();
            assert.isTrue(w.historyList.expectCountMin(0));
            assert.isTrue(w.historyList.expectCountMin(1));
            assert.isFalse(w.historyList.expectCountMin(2));
            w();
            assert.isTrue(w.historyList.expectCountMin(0));
            assert.isTrue(w.historyList.expectCountMin(1));
            assert.isTrue(w.historyList.expectCountMin(2));
            assert.isFalse(w.historyList.expectCountMin(3));

            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, /(4 expectation.*)/gm);

            assert.throws(function() {
                w.historyList.expectCountMin();
            }, TypeError, "expectCountMin: expected a single argument of type Number");
        });

        it("call max", function() {
            var w = new Wrapper();

            assert.isTrue(w.historyList.expectCountMax(0));
            assert.isTrue(w.historyList.expectCountMax(1));
            assert.isTrue(w.historyList.expectCountMax(2));
            w();
            assert.isFalse(w.historyList.expectCountMax(0));
            assert.isTrue(w.historyList.expectCountMax(1));
            assert.isTrue(w.historyList.expectCountMax(2));
            w();
            assert.isFalse(w.historyList.expectCountMax(0));
            assert.isFalse(w.historyList.expectCountMax(1));
            assert.isTrue(w.historyList.expectCountMax(2));
            assert.isTrue(w.historyList.expectCountMax(3));

            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, /(3 expectation.*)/gm);

            assert.throws(function() {
                w.historyList.expectCountMax();
            }, TypeError, "expectCountMax: expected a single argument of type Number");
        });

        it("call range", function() {
            var w = new Wrapper();

            assert.isTrue(w.historyList.expectCountRange(0, 1));
            assert.isFalse(w.historyList.expectCountRange(1, 2));
            assert.isTrue(w.historyList.expectCountRange(0, 2));
            w();
            assert.isTrue(w.historyList.expectCountRange(0, 1));
            assert.isTrue(w.historyList.expectCountRange(1, 2));
            assert.isFalse(w.historyList.expectCountRange(2, 4));
            w();
            assert.isTrue(w.historyList.expectCountRange(0, 2));
            assert.isTrue(w.historyList.expectCountRange(1, 2));
            assert.isTrue(w.historyList.expectCountRange(2, 3));
            assert.isTrue(w.historyList.expectCountRange(2, 4));
            assert.isFalse(w.historyList.expectCountRange(0, 1));
            assert.isFalse(w.historyList.expectCountRange(3, 5));

            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, /(4 expectation.*)/gm);

            assert.throws(function() {
                w.historyList.expectCountRange();
            }, TypeError, "expectCountRange: expected 'min' to be of type Number");

            assert.throws(function() {
                w.historyList.expectCountRange(1);
            }, TypeError, "expectCountRange: expected 'max' to be of type Number");

            assert.throws(function() {
                w.historyList.expectCountRange(1, "foo");
            }, TypeError, "expectCountRange: expected 'max' to be of type Number");

            assert.throws(function() {
                w.historyList.expectCountRange("foo", 1);
            }, TypeError, "expectCountRange: expected 'min' to be of type Number");
        });

        it("call args", function() {
            var w = new Wrapper();
            w();
            assert.isOk(w.historyList.filterByNumber(0).expectCallArgs());
            assert.isNotOk(w.historyList.filterByNumber(0).expectCallArgs("foo"));
            w("beer");
            assert.isOk(w.historyList.filterByNumber(1).expectCallArgs("beer"));
            assert.isNotOk(w.historyList.filterByNumber(1).expectCallArgs("foo"));
            w(true);
            assert.isOk(w.historyList.filterByNumber(2).expectCallArgs(true));
            assert.isNotOk(w.historyList.filterByNumber(2).expectCallArgs("foo"));
            w(false);
            assert.isOk(w.historyList.filterByNumber(3).expectCallArgs(false));
            assert.isNotOk(w.historyList.filterByNumber(3).expectCallArgs("foo"));
            w({});
            assert.isOk(w.historyList.filterByNumber(4).expectCallArgs({}));
            assert.isNotOk(w.historyList.filterByNumber(4).expectCallArgs("foo"));
            w([]);
            assert.isOk(w.historyList.filterByNumber(5).expectCallArgs([]));
            assert.isNotOk(w.historyList.filterByNumber(5).expectCallArgs("foo"));
        });

        it("does args", function() {
            var testFunc = function() {
                return "beer";
            };
            testFunc = new Wrapper(testFunc);
            testFunc();

            // passed expect
            var ret = testFunc.historyList
                .filterFirst()
                .expectReturn("beer");
            assert.isBoolean(ret);
            assert.isOk(ret);

            // failed expect
            ret = testFunc.historyList
                .filterFirst()
                .expectReturn("wine");
            assert.isBoolean(ret);
            assert.isNotOk(ret);
        });

        it("call context", function() {
            var w = new Wrapper();

            // pass
            w.call({
                beer: "yummy"
            });
            assert.isOk(w.historyList.filterByNumber(0).expectCallContext({
                beer: "yummy"
            }));
            assert.isNotOk(w.historyList.filterByNumber(0).expectCallContext({
                wine: "empty"
            }));
            w.call(null);
            assert.isOk(w.historyList.filterByNumber(1).expectCallContext(null));
            assert.isNotOk(w.historyList.filterByNumber(1).expectCallContext({
                wine: "empty"
            }));
        });

        it("call return", function() {
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
                        return [1, 2, 3];
                }
            };
            testFunc = new Wrapper(testFunc);

            var ret;
            ret = testFunc();
            assert.isOk(testFunc.historyList.filterByNumber(0).expectReturn("beer"));
            assert.isNotOk(testFunc.historyList.filterByNumber(0).expectReturn({
                wine: "empty"
            }));
            ret = testFunc();
            assert.isOk(testFunc.historyList.filterByNumber(1).expectReturn({
                a: 1
            }));
            assert.isNotOk(testFunc.historyList.filterByNumber(1).expectReturn({
                wine: "empty"
            }));
            ret = testFunc();
            assert.isOk(testFunc.historyList.filterByNumber(2).expectReturn([1, 2, 3]));
            assert.isNotOk(testFunc.historyList.filterByNumber(2).expectReturn([]));
        });

        it("property return", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");
            w.triggerOnGetNumber(0)
                .actionReturn("beer");
            w.triggerOnGetNumber(1)
                .actionReturn({
                    a: 1
                });
            w.triggerOnGetNumber(2)
                .actionReturn([1, 2, 3]);

            var ret;
            ret = testObj.beer;
            assert.isOk(w.historyList.filterByNumber(0).expectReturn("beer"));
            assert.isNotOk(w.historyList.filterByNumber(0).expectReturn({
                wine: "empty"
            }));

            testObj.beer = "stuff";

            ret = testObj.beer;
            assert.isOk(w.historyList.filterByNumber(2).expectReturn({
                a: 1
            }));
            assert.isNotOk(w.historyList.filterByNumber(2).expectReturn({
                wine: "empty"
            }));

            ret = testObj.beer;
            assert.isOk(w.historyList.filterByNumber(3).expectReturn([1, 2, 3]));
            assert.isNotOk(w.historyList.filterByNumber(3).expectReturn([]));
        });

        it("property exception", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");
            w.triggerOnGetNumber(0)
                .actionThrowException(new Error("one"));
            w.triggerOnGetNumber(1)
                .actionThrowException(new TypeError("two"));
            w.triggerOnGetNumber(2)
                .actionThrowException(new RangeError("three"));
            w.triggerOnGetNumber(3)
                .actionThrowException(null);

            var ret;

            // first get
            assert.throws(function() {
                ret = testObj.beer;
            }, Error, "one");
            assert.isOk(w.historyList.filterByNumber(0).expectException(new Error("one")));
            assert.isNotOk(w.historyList.filterByNumber(0).expectException(new TypeError("beer")));

            // second get
            assert.throws(function() {
                ret = testObj.beer;
            }, TypeError, "two");
            assert.isOk(w.historyList.filterByNumber(1).expectException(new TypeError("two")));
            assert.isNotOk(w.historyList.filterByNumber(1).expectException(new Error("one")));

            // third get
            assert.throws(function() {
                ret = testObj.beer;
            }, RangeError, "three");
            assert.isOk(w.historyList.filterByNumber(2).expectException(new RangeError("three")));
            assert.isNotOk(w.historyList.filterByNumber(2).expectException(new TypeError("beer")));

            // fourth get
            assert.doesNotThrow(function() {
                ret = testObj.beer;
            });
            assert.isOk(w.historyList.filterByNumber(3).expectException(null));
            assert.isNotOk(w.historyList.filterByNumber(3).expectException(new TypeError("beer")));
        });

        it("function exception", function() {
            var w = new Wrapper();
            w.triggerOnCallNumber(0)
                .actionThrowException(new Error("one"));
            w.triggerOnCallNumber(1)
                .actionThrowException(new TypeError("two"));
            w.triggerOnCallNumber(2)
                .actionThrowException(new RangeError("three"));
            w.triggerOnCallNumber(3)
                .actionThrowException(null);

            // first call
            assert.throws(function() {
                w();
            }, Error, "one");
            assert.isOk(w.historyList.filterByNumber(0).expectException(new Error("one")));
            assert.isNotOk(w.historyList.filterByNumber(0).expectException(new TypeError("beer")));

            // second call
            assert.throws(function() {
                w();
            }, TypeError, "two");
            assert.isOk(w.historyList.filterByNumber(1).expectException(new TypeError("two")));
            assert.isNotOk(w.historyList.filterByNumber(1).expectException(new Error("one")));

            // third call
            assert.throws(function() {
                w();
            }, RangeError, "three");
            assert.isOk(w.historyList.filterByNumber(2).expectException(new RangeError("three")));
            assert.isNotOk(w.historyList.filterByNumber(2).expectException(new TypeError("beer")));

            // fourth call
            assert.doesNotThrow(function() {
                w();
            });
            assert.isOk(w.historyList.filterByNumber(3).expectException(null));
            assert.isNotOk(w.historyList.filterByNumber(3).expectException(new TypeError("beer")));

            // clear exception
            var testFunc = function() {
                throw new Error("shouldn't error");
            };
            testFunc = new Wrapper(testFunc);
            testFunc.triggerAlways()
                .actionThrowException(null);
            assert.doesNotThrow(function() {
                testFunc();
            });
        });

        it("property set val", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");

            // pass
            testObj.beer = "gone";
            var ret = w.historyList
                .filterFirst()
                .expectSetVal("gone");
            assert.isTrue(ret);

            // fail
            ret = w.historyList
                .filterFirst()
                .expectSetVal("wine");
            assert.isFalse(ret);
        });

        it("does exception", function() {
            var testFunc = function() {
                throw new Error("test");
            };
            testFunc = new Wrapper(testFunc);

            try {
                testFunc();
            } catch (e) {}

            // passed expect
            var ret = testFunc.historyList
                .filterFirst()
                .expectException(new Error("test"));
            assert.isTrue(ret);

            // failed expect
            ret = testFunc.historyList
                .filterFirst()
                .expectException(new TypeError("beer"));
            assert.isFalse(ret);

            // no exception
            var w = new Wrapper();
            w();
            ret = w.historyList
                .filterFirst()
                .expectException(null);
            w.expectReportAllFailures(true);
            assert.isTrue(ret);
        });

        it("call custom", function() {
            var testFunc = function() {
                return "beer";
            };
            testFunc = new Wrapper(testFunc);

            // pass
            var ret;
            ret = testFunc("drink");
            assert.strictEqual(ret, "beer");
            ret = testFunc.historyList
                .filterFirst()
                .expectCustom(function(curr) {
                    assert.strictEqual(curr.retVal, "beer");
                    assert.deepEqual(curr.argList, ["drink"]);
                    return null;
                });
            assert.isBoolean(ret);
            assert.isOk(ret);

            // fail
            ret = testFunc.historyList
                .filterFirst()
                .expectCustom(function() {
                    return "error message";
                });
            assert.isBoolean(ret);
            assert.isNotOk(ret);

            assert.throws(function() {
                testFunc.historyList
                    .filterFirst()
                    .expectCustom();
            }, TypeError, "expected the first argument to be of type Function");
        });

        it("property custom", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");

            // pass
            var ret;
            ret = testObj.beer;
            assert.strictEqual(ret, "yummy");
            ret = w.historyList
                .filterFirst()
                .expectCustom(function(curr) {
                    assert.strictEqual(curr.retVal, "yummy");
                    return null;
                });
            assert.isBoolean(ret);
            assert.isOk(ret);

            // fail
            ret = w.historyList
                .filterFirst()
                .expectCustom(function() {
                    return "error mesage";
                });
            assert.isBoolean(ret);
            assert.isNotOk(ret);
        });

        it("throws TypeError if expectCallCount called with bad arg", function() {
            var w = new Wrapper();
            w();
            assert.throws(function() {
                w.expectCallCount("foo");
            }, TypeError);
        });

        it("validates exepctations", function() {
            var testFunc = function() {
                return "beer";
            };
            testFunc = new Wrapper(testFunc);
            testFunc("drink up!");

            var ret;
            // console.log ("historyList", testFunc.historyList[0]);
            ret = testFunc.historyList
                .filterFirst()
                .expectCallArgs("drink up!");
            assert.strictEqual(ret, true);
            ret = testFunc.historyList
                .filterFirst()
                .expectReturn("beer");
            assert.strictEqual(ret, true);

            // pass
            ret = testFunc.expectReportAllFailures();
            assert.strictEqual(ret, true);
            assert.strictEqual(testFunc.expectErrorList.length, 0);

            // pass and clear
            ret = testFunc.expectReportAllFailures(true);
            assert.strictEqual(ret, true);
            assert.strictEqual(testFunc.expectErrorList.length, 0);

            // fail return
            testFunc("drink up!");
            ret = testFunc.historyList
                .filterFirst()
                .expectCallArgs("drink up!");
            assert.strictEqual(ret, true);
            ret = testFunc.historyList
                .filterFirst()
                .expectReturn("wine");
            assert.strictEqual(ret, false);
            assert.strictEqual(testFunc.expectErrorList.length, 1);
            assert.throws(function() {
                testFunc.expectReportAllFailures();
            }, ExpectError, /1 expectation\(s\) failed:\n.*/);

            // fail return again and clear expectation results
            assert.throws(function() {
                testFunc.expectReportAllFailures(true);
            }, ExpectError, /1 expectation\(s\) failed:\n.*/);

            // pass, list is empty now
            ret = testFunc.expectReportAllFailures();
            assert.strictEqual(ret, true);

            // fail args
            testFunc("drink up!");
            ret = testFunc.historyList
                .filterFirst()
                .expectCallArgs("party down!");
            assert.strictEqual(ret, false);
            ret = testFunc.historyList
                .filterFirst()
                .expectReturn("beer");
            assert.strictEqual(ret, true);
            assert.strictEqual(testFunc.expectErrorList.length, 1);
            assert.throws(function() {
                testFunc.expectReportAllFailures(true);
            }, ExpectError, /1 expectation\(s\) failed:\n.*/);

            // fail args and return
            testFunc("drink up!");
            ret = testFunc.historyList
                .filterFirst()
                .expectCallArgs("party down!");
            assert.strictEqual(ret, false);
            ret = testFunc.historyList
                .filterFirst()
                .expectReturn("wine");
            assert.strictEqual(ret, false);
            assert.strictEqual(testFunc.expectErrorList.length, 2);
            assert.throws(function() {
                testFunc.expectReportAllFailures();
            }, ExpectError, /2 expectation\(s\) failed:\n.*/);
        });

        it("expect all", function() {
            var w = new Wrapper();

            w("beer");
            w("beer");
            w("beer");

            // pass
            var ret;
            ret = w.historyList.expectAll().expectCallArgs("beer");
            assert.isTrue(ret);
            assert.doesNotThrow(function() {
                w.expectReportAllFailures();
            });

            // fail
            w("wine");
            w("wine");
            ret = w.historyList.expectAll().expectCallArgs("beer");
            assert.isFalse(ret);
            assert.throws(function() {
                w.expectReportAllFailures();
            }, ExpectError, new RegExp(
                "1 expectation\\(s\\) failed:\n" +
                " +expectAll: all expectations should have passed, but 2 failed\n" +
                " +expectCallArgs: expectation failed for: beer\n" +
                " +At \\[0\\]: Expected: 'beer'; Got: 'wine'\n" +
                " +expectCallArgs: expectation failed for: beer\n" +
                " +At \\[0\\]: Expected: 'beer'; Got: 'wine'\n",
                "g"));
        });

        it("expect some", function() {
            var w = new Wrapper();

            w("wine");
            w("wine");
            w("wine");

            // fail
            var ret;
            ret = w.historyList.expectSome().expectCallArgs("beer");
            assert.isFalse(ret);
            assert.throws(function() {
                w.expectReportAllFailures(true);
            }, ExpectError, new RegExp(
                "1 expectation\\(s\\) failed:\n" +
                " +expectSome: at least one expectation should have passed, but none did\n",
                "g"));

            // pass
            w("beer");
            w("wine");
            ret = w.historyList.expectSome().expectCallArgs("beer");
            assert.isTrue(ret);
            assert.doesNotThrow(function() {
                w.expectReportAllFailures();
            });
        });

        it("expect none", function() {
            var w = new Wrapper();

            w("wine");
            w("wine");
            w("wine");

            // pass
            var ret;
            ret = w.historyList.expectNone().expectCallArgs("beer");
            assert.isTrue(ret);
            assert.doesNotThrow(function() {
                w.expectReportAllFailures();
            });

            // fail
            w("beer");
            ret = w.historyList.expectNone().expectCallArgs("beer");
            assert.isFalse(ret);
            assert.throws(function() {
                w.expectReportAllFailures();
            }, ExpectError, new RegExp(
                "1 expectation\\(s\\) failed:\n" +
                " +expectNone: no expectations should have passed, but 1 passed\n",
                "g"));
        });

        it("clears expectation messages");
        it("validate and clears");

        it("call args deep equal");
        // object, array, array buffer
        it("check bad arguments to functions");
        it("throws TypeError if expectCallCountRange called with bad min");
        it("throws TypeError if expectCallCountRange called with bad max");
        it("throws TypeError if expectCallCountMin called with bad min");
        it("throws TypeError if expectCallCountMax called with bad max");
    });
});
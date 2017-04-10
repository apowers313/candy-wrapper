var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;
var Trigger = CandyWrapper.Trigger;
var ExpectError = CandyWrapper.ExpectError;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("trigger", function() {
    it("can be created", function() {
        var w = new Wrapper();
        var ret = w.triggerAlways();
        assert.instanceOf(ret, Trigger);
    });

    it("throws on bad args", function() {
        assert.throws(function() {
            new Trigger();
        }, TypeError, "Trigger constructor: expected first argument to be of type Wrapper");

        assert.throws(function() {
            var w = new Wrapper();
            new Trigger(w);
        }, TypeError, "Trigger constructor: expected second argument to be of type Function");

    });

    it("_action", function() {
        var w = new Wrapper();
        var t = new Trigger(w, function() {});

        assert.throws(function() {
            t._action();
        }, TypeError, "_action: expected 'name' argument");

        assert.throws(function() {
            t._action("name", "both");
        }, TypeError, "_action: expected 'timing' argument");

        assert.throws(function() {
            t._action("name", "both", "timing");
        }, TypeError, "_action: expected 'validateFn' argument");

        assert.throws(function() {
            t._action("name", "both", "timing", function() {});
        }, TypeError, "_action: expected function argument");
    });

    it("_expect", function() {
        var w = new Wrapper();
        var t = new Trigger(w, function() {});

        assert.throws(function() {
            t._expect();
        }, TypeError, "_expect: expected 'name' argument");

        assert.throws(function() {
            t._expect("name", "both");
        }, TypeError, "_expect: expected 'timing' argument");

        assert.throws(function() {
            t._expect("name", "both", "timing");
        }, TypeError, "_expect: expected 'validateFn' argument");

        assert.throws(function() {
            t._expect("name", "both", "timing", function() {});
        }, TypeError, "_expect: expected function argument");
    });

    it("can trigger on args", function() {
        var w = new Wrapper();

        w.triggerOnCallArgs("beer")
            .actionReturn("yum!");
        w.triggerOnCallArgs("water")
            .actionReturn("refreshing!");
        w.triggerOnCallArgs()
            .actionReturn("all gone");

        // triggers
        var ret;
        ret = w("beer");
        assert.strictEqual(ret, "yum!");
        ret = w("water");
        assert.strictEqual(ret, "refreshing!");
        ret = w("beer");
        assert.strictEqual(ret, "yum!");
        ret = w();
        assert.strictEqual(ret, "all gone");

        // trigger
        ret = w("nothing");
        assert.isUndefined(ret);
    });

    it("can trigger on context", function() {
        var w = new Wrapper();

        w.triggerOnCallContext({
                special: true
            })
            .actionReturn("I feel special");

        // trigger
        var ret;
        ret = w.call({
            special: true
        });
        assert.strictEqual(ret, "I feel special");

        // no trigger
        ret = w.call({});
        assert.isUndefined(ret);
    });

    it("can trigger on call number", function() {
        var w = new Wrapper();

        w.triggerOnCallNumber(1)
            .actionReturn("boo!");

        var ret;
        ret = w();
        assert.isUndefined(ret);

        ret = w();
        assert.strictEqual(ret, "boo!");

        ret = w();
        assert.isUndefined(ret);
    });

    it("can trigger on exception", function() {
        var count = 0;
        var testFunc = function() {
            count++;
            switch (count) {
                case 1:
                    return;
                case 2:
                    throw new TypeError("wine");
                case 3:
                    return;
            }
        };

        // trigger on exception
        testFunc = new Wrapper(testFunc);
        var run = false;
        testFunc.triggerOnException(new TypeError("wine"))
            .actionCustom(function foo() {
                run = true;
            });

        // first call, no exception
        run = false;
        assert.doesNotThrow(function() {
            testFunc();
        });
        assert.isFalse(run);

        // second call, exception
        run = false;
        assert.throws(function() {
            testFunc();
        }, TypeError, "wine");
        assert.isTrue(run);

        // third call, no exception
        run = false;
        assert.doesNotThrow(function() {
            testFunc();
        });
        assert.isFalse(run);
    });

    it("can trigger when no exception", function() {
        var count = 0;
        var testFunc = function() {
            count++;
            switch (count) {
                case 1:
                    return;
                case 2:
                    throw new TypeError("wine");
                case 3:
                    return;
            }
        };

        // trigger on no exception
        var run = false;
        count = 0;
        testFunc = new Wrapper(testFunc);
        testFunc.triggerOnException(null)
            .actionCustom(function foo(curr) {
                if (!curr.postCall) return;
                run = true;
            });

        // first call, no exception
        run = false;
        assert.doesNotThrow(function() {
            testFunc();
        });
        assert.isTrue(run);

        // second call, exception
        run = false;
        assert.throws(function() {
            testFunc();
        }, TypeError, "wine");
        assert.isFalse(run);

        // third call, no exception
        run = false;
        assert.doesNotThrow(function() {
            testFunc();
        });
        assert.isTrue(run);
    });

    it("can trigger on return", function() {
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
            }
        };
        testFunc = new Wrapper(testFunc);

        var run;
        testFunc.triggerOnReturn("beer")
            .actionCustom(function foo() {
                run = true;
            });

        run = false;
        testFunc();
        assert.isOk(run);

        run = false;
        testFunc();
        assert.isNotOk(run);

        run = false;
        testFunc();
        assert.isOk(run);

        run = false;
        testFunc();
        assert.isNotOk(run);
    });

    it("can trigger on custom function", function() {
        var count = 0;

        function custom() {
            count++;
            if (!(count % 4)) { // runs every 4th time
                return true;
            }
            return false;
        }
        var w = new Wrapper();

        w.triggerOnCustom(custom)
            .actionReturn("boom");

        var ret;
        ret = w();
        assert.isUndefined(ret);

        ret = w();
        assert.strictEqual(ret, "boom");

        ret = w();
        assert.isUndefined(ret);

        ret = w();
        assert.strictEqual(ret, "boom");
    });

    it("can trigger on set", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnSet()
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        assert.throws(function() {
            testObj.beer = "more?";
        }, Error, "surprise!");

        assert.doesNotThrow(function(ret) {
            ret = testObj.beer;
        });
    });

    it("can trigger on get", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnGet()
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        assert.doesNotThrow(function() {
            testObj.beer = "more?";
        });

        assert.throws(function(ret) {
            ret = testObj.beer;
        }, Error, "surprise!");
    });

    it("can trigger on set value", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnSetVal("boo")
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        assert.doesNotThrow(function() {
            testObj.beer = "more?";
        });

        assert.throws(function() {
            testObj.beer = "boo";
        }, Error, "surprise!");
    });

    it("can trigger on set number", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnSetNumber(1)
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        assert.doesNotThrow(function() {
            testObj.beer = "boo";
        });

        var ret = testObj.beer;
        ret = ret; // make linter happy

        assert.throws(function() {
            testObj.beer = "boo";
        }, Error, "surprise!");

        assert.doesNotThrow(function() {
            testObj.beer = "bar";
        });
    });

    it("can trigger on get number", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnGetNumber(1)
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        var ret;

        assert.doesNotThrow(function() {
            ret = testObj.beer;
        });

        assert.throws(function() {
            ret = testObj.beer;
        }, Error, "surprise!");

        assert.doesNotThrow(function() {
            ret = testObj.beer;
        });
    });

    it("can trigger on touch number", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnTouchNumber(1)
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        var ret;
        assert.doesNotThrow(function() {
            ret = testObj.beer;
        });
        assert.throws(function() {
            testObj.beer = "boo";
        }, Error, "surprise!");
        assert.doesNotThrow(function() {
            testObj.beer = "boo";
        });
    });

    it("can manage multiple triggers simultaneously", function() {
        var w = new Wrapper();
        w.triggerAlways()
            .actionReturn("yup");
        w.triggerOnCallNumber(1)
            .actionCustom(function(curr) {
                curr.exception = new Error("surprise!");
            });

        var ret;
        ret = w();
        assert.strictEqual(ret, "yup");

        assert.throws(function() {
            w();
        }, Error, "surprise!");

        ret = w();
        assert.strictEqual(ret, "yup");
    });

    it("can manage multiple triggers simultaneously 2", function() {
        var testObj = {
            beer: "yummy"
        };
        var w = new Wrapper(testObj, "beer");

        w.triggerOnTouchNumber(1)
            .actionCustom(function(single) {
                single.exception = new Error("surprise!");
            });
        w.triggerOnTouchNumber(3)
            .actionCustom(function(single) {
                single.exception = new Error("boo!");
            });

        var ret;
        assert.doesNotThrow(function() {
            ret = testObj.beer;
        });
        assert.throws(function() {
            testObj.beer = "boo";
        }, Error, "surprise!");
        assert.doesNotThrow(function() {
            testObj.beer = "boo";
        });
        assert.throws(function() {
            testObj.beer = "boo";
        }, Error, "boo");
    });

    describe("expect on trigger", function() {
        it("does args", function() {
            var w = new Wrapper();

            w.triggerAlways()
                .expectCallArgs("beer");

            // pass
            assert.doesNotThrow(function() {
                w("beer");
            });

            // fail
            assert.throws(function() {
                w("foo");
            });
        });

        it("does return", function() {
            var testFunc = function() {
                return "beer";
            };

            // pass
            testFunc = new Wrapper(testFunc);
            testFunc.triggerAlways()
                .expectReturn("beer");
            assert.doesNotThrow(function() {
                testFunc();
            });

            // fail
            testFunc = new Wrapper(testFunc);
            testFunc.triggerAlways()
                .expectReturn("wine");
            assert.throws(function() {
                testFunc();
            }, ExpectError);
        });

        it("does context", function() {
            // pass
            var w = new Wrapper();
            w.triggerAlways()
                .expectCallContext({
                    location: "home"
                });
            assert.doesNotThrow(function() {
                w.call({
                    location: "home"
                });
            });

            // pass
            new Wrapper();
            w.triggerAlways()
                .expectCallContext({
                    location: "home"
                });
            assert.throws(function() {
                w.call({
                    location: "store"
                });
            }, ExpectError);
        });

        it("does exception", function() {
            var testFunc = function() {
                throw new Error("fridge empty");
            };

            // pass
            testFunc = new Wrapper(testFunc);
            testFunc.triggerAlways()
                .expectException(new Error("fridge empty"));
            assert.throws(function() {
                testFunc();
            }, Error, "fridge empty");

            // fail
            testFunc = new Wrapper(testFunc);
            testFunc.triggerAlways()
                .expectException(new TypeError("yogurt"));
            assert.throws(function() {
                testFunc();
            }, ExpectError);
        });

        it("does setval", function() {
            var testObj = {
                beer: "yummy"
            };

            // pass
            var w = new Wrapper(testObj, "beer");
            w.triggerAlways()
                .expectSetVal(42);
            assert.doesNotThrow(function() {
                testObj.beer = 42;
            });

            // fail
            assert.throws(function() {
                testObj.beer = 666;
            }, ExpectError);
        });

        it("does custom", function() {
            var w = new Wrapper();

            // pass
            var check = false;
            w.triggerAlways()
                .expectCustom(function(curr) {
                    check = true;
                    assert.isObject(curr);
                    assert.isOk(Wrapper.isWrapper(curr.wrapper));
                    return null;
                });
            assert.doesNotThrow(function() {
                w();
            });
            assert.isOk(check);

            // pass
            check = false;
            w.triggerAlways()
                .expectCustom(function(curr) {
                    check = true;
                    assert.isObject(curr);
                    assert.isOk(Wrapper.isWrapper(curr.wrapper));
                    return "error message";
                });
            assert.throws(function() {
                w();
            }, ExpectError);
            assert.isOk(check);
        });

        it("is chainable");
    });
    describe("trigger action", function() {
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

            assert.throws(function() {
                w.triggerAlways().actionReturn();
            }, TypeError, "expected a single argument of any type");
        });

        it("can spoof an property return value", function() {
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
            assert.strictEqual(w.propValue, "more");
            ret = testObj.beer;
            assert.strictEqual(ret, "all gone");
        });

        it("can return from args", function() {
            var w = new Wrapper();
            w.triggerAlways()
                .actionReturnFromArg(0);

            var ret;
            ret = w("beer");
            assert.strictEqual(ret, "beer");
            ret = w("foo");
            assert.strictEqual(ret, "foo");
            ret = w();
            assert.isUndefined(ret);

            w = new Wrapper();
            w.triggerAlways()
                .actionReturnFromArg(1);

            ret = w(1, 2);
            assert.strictEqual(ret, 2);
            ret = w("beer", "wine");
            assert.strictEqual(ret, "wine");

            assert.throws(function() {
                w.triggerAlways()
                    .actionReturnFromArg("foo");
            }, TypeError, "expected a single argument of type Number");

            assert.throws(function() {
                w.triggerAlways()
                    .actionReturnFromArg();
            }, TypeError, "expected a single argument of type Number");

            assert.throws(function() {
                w.triggerAlways()
                    .actionSetVal(42);
            }, Error, "actionSetVal is only supported for PROPERTY wrappers");
        });

        it("can return context", function() {
            var w = new Wrapper();
            var ctx = {
                beer: "yummy"
            };

            w.triggerAlways()
                .actionReturnContext();

            var ret;
            ret = w.call(ctx);
            assert.deepEqual(ret, ctx);

            assert.throws(function() {
                w.triggerAlways()
                    .actionReturnContext("foo");
            }, TypeError, "didn't expect any args");
        });

        it("can return from context", function() {
            var w = new Wrapper();
            var ctx = {
                beer: "yummy"
            };

            w.triggerAlways()
                .actionReturnFromContext("beer");

            var ret;
            ret = w.call(ctx);
            assert.strictEqual(ret, "yummy");

            assert.throws(function() {
                w.triggerAlways()
                    .actionReturnFromContext();
            }, TypeError, "expected a single argument of type String");
        });

        it("can throw error", function() {
            var w = new Wrapper();

            w.triggerAlways()
                .actionThrowException(new TypeError("supersonic boom"));

            // throw the requested error
            assert.throws(function() {
                w();
            }, TypeError, "supersonic boom");

            // throw a real error
            w = new Wrapper();

            assert.throws(function() {
                w.triggerAlways()
                    .actionThrowException("not an error");
            }, TypeError, "actionThrowException: expected a single argument of type Error");
        });

        it("can setval", function() {
            var testObj = {
                beer: "yummy"
            };
            var w = new Wrapper(testObj, "beer");

            w.triggerAlways()
                .actionSetVal("more!");

            // no set, unchanged value
            var ret;
            ret = testObj.beer;
            assert.strictEqual(ret, "yummy");

            // set has replaced value
            testObj.beer = "foo";
            ret = testObj.beer;
            assert.strictEqual(ret, "more!");

            assert.throws(function() {
                w.triggerAlways()
                    .actionSetVal();
            }, TypeError, "expected a single argument of any type");

            assert.throws(function() {
                w.triggerAlways()
                    .actionReturnContext();
            }, Error, "actionReturnContext is only supported for FUNCTION wrappers");
        });

        it("can return a resolved promise", function() {
            var testFunc = function() {
                return "sleepy";
            };
            testFunc = new Wrapper(testFunc);

            testFunc.triggerAlways()
                .actionReturnResolvedPromise();

            var ret1 = testFunc();
            assert.instanceOf(ret1, Promise);

            testFunc.triggerAlways()
                .actionReturnResolvedPromise("foo");

            var ret2 = testFunc();
            assert.instanceOf(ret2, Promise);

            assert.throws(function() {
                testFunc.triggerAlways()
                    .actionReturnResolvedPromise(1, 2);
            }, TypeError, "expected exactly one or two args");

            var ret3;
            assert.doesNotThrow(function() {
                let w = new Wrapper();
                w.triggerAlways()
                    .actionReturnResolvedPromise(new Error("error message"));
                ret3 = w();
            });

            return ret1.then((v) => {
                assert.strictEqual(v, "sleepy");
                return ret2;
            }).then((v) => {
                assert.strictEqual(v, "foo");
                return ret3;
            }).then(function(val) {
                assert.instanceOf(val, Error);
                assert.strictEqual(val.name, "Error");
                assert.strictEqual(val.message, "error message");
            });
        });

        it("can return a rejected promise", function() {
            var testFunc = function() {
                throw new TypeError("lazy");
            };
            testFunc = new Wrapper(testFunc);

            testFunc.triggerAlways()
                .actionReturnRejectedPromise();

            var ret1;
            assert.doesNotThrow(function() {
                ret1 = testFunc();
            });
            assert.instanceOf(ret1, Promise);

            assert.throws(function() {
                testFunc.triggerAlways()
                    .actionReturnRejectedPromise("test");
            }, TypeError, "expected first argument to be of type Error, or no arguments");

            assert.throws(function() {
                testFunc.triggerAlways()
                    .actionReturnRejectedPromise(new Error("test"), 2);
            }, TypeError, "expected first argument to be of type Error, or no arguments");

            return ret1.then(
                () => {
                    assert.isNotOk(true, "expected promise to fail");
                },
                (e) => {
                    assert.instanceOf(e, TypeError);
                    assert.strictEqual(e.message, "lazy");
                });
        });

        it("can return a rejected promise of a different type", function() {
            var testFunc = function() {
                throw new TypeError("lazy");
            };
            testFunc = new Wrapper(testFunc);

            testFunc.triggerAlways()
                .actionReturnRejectedPromise(new Error("foo"));

            var ret1;
            assert.doesNotThrow(function() {
                ret1 = testFunc();
            });
            assert.instanceOf(ret1, Promise);

            return ret1.then(
                () => {
                    assert.isNotOk(true, "expected promise to fail");
                },
                (e) => {
                    assert.instanceOf(e, Error);
                    assert.strictEqual(e.message, "foo");
                });
        });

        it("set callback function", function() {
            var w = new Wrapper();

            var called = false;

            function cb() {
                called = true;
            }

            w.triggerAlways()
                .actionCallbackFunction(cb);
            assert.isNotOk(called);
            w(cb);
            assert.isOk(called);

            assert.throws(function() {
                w.triggerAlways()
                    .actionCallbackFunction();
            }, TypeError, "expected a single argument of type Function");
        });

        it("can callback an argument", function() {
            var w = new Wrapper();

            var called = false;

            function cb() {
                called = true;
            }

            w.triggerAlways()
                .actionCallbackToArg(0);
            assert.isNotOk(called);
            w(cb);
            assert.isOk(called);

            w = new Wrapper();
            called = false;
            w.triggerAlways()
                .actionCallbackToArg(1);
            assert.isNotOk(called);
            w("beer", cb);
            assert.isOk(called);

            assert.throws(function() {
                w("foo", "bar");
            }, Error, "expected argument 1 to be callback function");
        });

        it("can callback with args", function() {
            var w = new Wrapper();

            var called = false;

            function cb(...args) {
                assert.deepEqual(args, [1, {}, true, "beer"]);
                called = true;
            }

            w.triggerAlways()
                .actionCallbackToArg(0)
                .actionCallbackArgs(1, {}, true, "beer");
            assert.isNotOk(called);
            w(cb);
            assert.isOk(called, "expected callback to be called");
        });

        it("can callback with context", function() {
            var w = new Wrapper();

            var called = false;

            function cb() {
                assert.deepEqual(this, {
                    context: "awesome!"
                });
                called = true;
            }

            w.triggerAlways()
                .actionCallbackFunction(cb)
                .actionCallbackContext({
                    context: "awesome!"
                });
            assert.isNotOk(called);
            w();
            assert.isOk(called, "expected callback to be called");

            assert.throws(function() {
                w.triggerAlways()
                    .actionCallbackFunction(cb)
                    .actionCallbackContext();
            }, TypeError, "expected a single argument of any type");
        });

        it("can chain actions");
        it("actionCallbackAsync");
        it("actionCallbackPropibute");
        it("actionAsync");
    });

});
var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;
var Match = CandyWrapper.Match;
var Trigger = CandyWrapper.Trigger;
var Filter = CandyWrapper.Filter;
var Operation = CandyWrapper.Operation;
var ExpectError = CandyWrapper.ExpectError;
var Sandbox = CandyWrapper.Sandbox;
var Module = CandyWrapper.Module;
var Interface = CandyWrapper.Interface;
var Behavior = CandyWrapper.Behavior;
var InterfaceBehavior = CandyWrapper.InterfaceBehavior;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("module", function() {
    it("can be created", function() {
        var mod = new Module();
        assert.instanceOf(mod, Module);
    });

    it("throws if no module name");

    describe("interface", function() {
        it("can define method", function() {
            var mod = new Module();
            var prop = mod.defineMethod("getUser");
            assert.instanceOf(prop, Interface);
            assert.strictEqual(prop.interfaceName, "getUser");
            assert.strictEqual(prop.interfaceType, "function");
        });

        it("throws when defining method with bad args", function() {
            var mod = new Module();
            assert.throws(function() {
                mod.defineMethod(42);
            }, TypeError, "defineMethod: expected a single argument of type String");

            assert.throws(function() {
                mod.defineMethod();
            }, TypeError, "defineMethod: expected a single argument of type String");
        });

        it("can define property", function() {
            var mod = new Module();
            var prop = mod.defineProperty("userCount");
            assert.instanceOf(prop, Interface);
            assert.strictEqual(prop.interfaceName, "userCount");
            assert.strictEqual(prop.interfaceType, "property");
        });

        it("throws when defining property with bad args", function() {
            var mod = new Module();
            assert.throws(function() {
                mod.defineProperty(42);
            }, TypeError, "defineProperty: expected a single argument of type String");

            assert.throws(function() {
                mod.defineProperty();
            }, TypeError, "defineProperty: expected a single argument of type String");
        });

        it("can't define existing property", function() {
            var mod = new Module();
            var prop = mod.defineMethod("getUser");
            assert.instanceOf(prop, Interface);
            assert.throws(function() {
                mod.defineMethod("getUser");
            }, TypeError, "defineInterface: 'getUser' is already defined");
        });

        it("can get interface", function() {
            var mod = new Module();
            var prop = mod.defineMethod("getUser");
            assert.instanceOf(prop, Interface);

            var prop2 = mod.getInterface("getUser");
            assert.strictEqual(prop, prop2);

            var prop3 = mod.getInterface("asdfqwer");
            assert.isUndefined(prop3);
        });

        it("throws when getInterface gets bad args", function() {
            var mod = new Module();

            // bad arg
            assert.throws(function() {
                mod.getInterface(42);
            }, TypeError, "getInterface: expected a single argument of type String");

            // no arg
            assert.throws(function() {
                mod.getInterface();
            }, TypeError, "getInterface: expected a single argument of type String");

        });

        it("can chain on interface", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            var prop = mod.defineBehavior("getUserSuccess", "getUser");
            assert.instanceOf(prop, InterfaceBehavior);
        });

        it("can define interface");
        it("throws when defineInterface gets bad args");
        it("is chainable");
    });

    describe("defineBehavior", function() {
        it("can define behavior", function() {
            var mod = new Module();
            var behavior = mod.defineBehavior("getUserSuccess");
            assert.instanceOf(behavior, Behavior);
            assert.strictEqual(behavior.behaviorName, "getUserSuccess");
        });

        it("can get behavior", function() {
            var mod = new Module();
            var behav1 = mod.defineBehavior("getUserSuccess");

            // found
            var behav2 = mod.getBehavior("getUserSuccess");
            assert.instanceOf(behav2, Behavior);
            assert.strictEqual(behav1, behav2);

            // not found
            var behav3 = mod.getBehavior("asdfqwer");
            assert.isUndefined(behav3);
        });

        it("throws when getBehavior gets bad args", function() {
            var mod = new Module();

            // not a string
            assert.throws(function() {
                mod.getBehavior(42);
            }, TypeError, "getBehavior: expected a single argument of type String");

            // missing arg
            assert.throws(function() {
                mod.getBehavior();
            }, TypeError, "getBehavior: expected a single argument of type String");
        });

        it("can't define existing behavior", function() {
            var mod = new Module();
            mod.defineBehavior("getUserSuccess");
            assert.throws(function() {
                mod.defineBehavior("getUserSuccess");
            }, TypeError, "defineBehavior: behavior name 'getUserSuccess' is already defined");
        });

        it("can't define a behavior with the same name as an interface", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            assert.throws(function() {
                mod.defineBehavior("getUser");
            }, TypeError, "defineBehavior: behavior name 'getUser' is already used as an interface name");
        });

        it("throws if first argument isn't a string", function() {
            var mod = new Module();
            assert.throws(function() {
                mod.defineBehavior(42);
            }, TypeError, "defineBehavior: expected first argument 'behaviorName' to be of type String");

            assert.throws(function() {
                mod.defineBehavior();
            }, TypeError, "defineBehavior: expected first argument 'behaviorName' to be of type String");
        });

        it("throws if second argument isn't a string", function() {
            var mod = new Module();
            assert.throws(function() {
                mod.defineBehavior("getUserSuccess", 42);
            }, TypeError, "defineBehavior: expected second argument 'interfaceName' to be of type String");
        });

        it("throws if interface isn't defined", function() {
            var mod = new Module();
            assert.throws(function() {
                mod.defineBehavior("getUserSuccess", "getUser");
            }, TypeError, "defineBehavior: interface 'getUser' not found");
        });

        it("can get interface via chaining", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            var prop = mod.defineBehavior("getUserSuccess").getUser();
            assert.instanceOf(prop, InterfaceBehavior);
        });

        it("can create behaviors via chaining", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess")
                .getUser()
                .returns({
                    user: "Adam"
                });
            var behavior = mod.defineBehavior("getUsers")
                .getUserSuccess()
                .getUserSuccess();
            assert.strictEqual(behavior.behaviorName, "getUsers");
            assert.isArray(behavior.behaviorSequence);
            assert.strictEqual(behavior.behaviorSequence.length, 2);
            assert.strictEqual(behavior.behaviorSequence[0].behaviorName, "getUserSuccess");
            assert.strictEqual(behavior.behaviorSequence[1].behaviorName, "getUserSuccess");
        });

        it("is chainable");
    });

    describe("getStub", function() {
        it("throws with bad args", function() {
            var mod = new Module();

            assert.throws(function() {
                mod.getStub();
            }, TypeError, "getStub: expected a single argument of type String");

            assert.throws(function() {
                mod.getStub(42);
            }, TypeError, "getStub: expected a single argument of type String");

            assert.throws(function() {
                mod.getStub("getUserSuccess");
            }, TypeError, "getStub: behavior 'getUserSuccess' not defined");
        });

        it("can create a simple stub", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess")
                .getUser()
                .returns({
                    user: "Adam"
                });
            var stub = mod.getStub("getUserSuccess");
            assert.isTrue(Wrapper.isWrapper(stub.getUser));
            var ret = stub.getUser();
            assert.deepEqual(ret, {
                user: "Adam"
            });
        });

        it("can create a deeper stub", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess")
                .getUser()
                .returns({
                    user: "Adam"
                });
            mod.defineBehavior("getUsers")
                .getUserSuccess()
                .getUserSuccess();
            var stub = mod.getStub("getUsers");
            assert.isTrue(Wrapper.isWrapper(stub.getUser));

            // first call
            var ret = stub.getUser();
            assert.deepEqual(ret, {
                user: "Adam"
            });

            // second call
            ret = stub.getUser();
            assert.deepEqual(ret, {
                user: "Adam"
            });

            // third call
            ret = stub.getUser();
            assert.isUndefined(ret);
        });

        it("can create a multi-stub", function() {
            var mod = new Module();

            // methods
            mod.defineMethod("getUser");
            mod.defineMethod("createUser");

            // behaviors
            mod.defineBehavior("getUserFail", "getUser")
                .throws(new Error("User not found"));
            mod.defineBehavior("createUserSuccess", "createUser")
                .returns(true);
            mod.defineBehavior("getUserSuccess", "getUser")
                .returns("Adam");
            mod.defineBehavior("createAccount")
                .getUserFail()
                .createUserSuccess()
                .getUserSuccess();

            // create stub
            var stub = mod.getStub("createAccount");
            assert.isTrue(Wrapper.isWrapper(stub.getUser));
            assert.isTrue(Wrapper.isWrapper(stub.createUser));
            var ret;

            // first call
            assert.throws(function() {
                stub.getUser();
            }, Error, "User not found");

            // second call
            ret = stub.createUser();
            assert.strictEqual(ret, true);

            // third call
            ret = stub.getUser();
            assert.strictEqual(ret, "Adam");

            // all done
            ret = stub.getUser();
            assert.isUndefined(ret);
            ret = stub.createUser();
            assert.isUndefined(ret);
        });

        it("can stub arguments", function() {
            var mod = new Module();

            // methods
            mod.defineMethod("getUser");

            // behaviors
            mod.defineBehavior("getUserMissing", "getUser")
                .args("Adam")
                .returns(false);

            // create stub
            var stub = mod.getStub("getUserMissing");

            // first call
            var ret = stub.getUser("Adam");
            assert.isFalse(ret);
            assert.isTrue(Wrapper.isWrapper(stub.getUser));
            var callArgs = stub.getUser.historyList.getAllCallArgs();
            assert.isArray(callArgs);
            assert.strictEqual(callArgs.length, 1);
            assert.deepEqual(callArgs[0], ["Adam"]);
        });

        it("can stub context", function() {
            var mod = new Module();

            // methods
            mod.defineMethod("getUser");

            // behaviors
            mod.defineBehavior("getUserMissing", "getUser")
                .context({
                    ctx: true,
                    name: "beer"
                })
                .returns(false);

            // create stub
            var stub = mod.getStub("getUserMissing");

            // first call
            var ret = stub.getUser.call({
                ctx: true,
                name: "beer"
            });
            assert.isFalse(ret);
            assert.isTrue(Wrapper.isWrapper(stub.getUser));
            var callContexts = stub.getUser.historyList.getAllCallContexts();
            assert.isArray(callContexts);
            assert.strictEqual(callContexts.length, 1);
            assert.deepEqual(callContexts[0], {
                ctx: true,
                name: "beer"
            });
        });

        it("can stub exception");

        it("can create property stub and get", function() {
            var mod = new Module();

            // property
            mod.defineProperty("beer");

            // behavior
            mod.defineBehavior("getBeerSuccess")
                .beer()
                .returns("yummy");

            // get stub
            var stub = mod.getStub("getBeerSuccess");

            // pass
            var ret = stub.beer;
            assert.strictEqual(ret, "yummy");
        });

        it("can create property stub and throw", function() {
            var mod = new Module();

            // property
            mod.defineProperty("beer");

            // behavior
            mod.defineBehavior("getBeerError")
                .beer()
                .throws(new Error("beer not found"));

            // get stub
            var stub = mod.getStub("getBeerError");

            // pass
            assert.throws(function() {
                stub.beer = "gross";
            }, Error, "beer not found");
            var ret = stub.beer;
            assert.strictEqual(ret, "gross");
        });

        it("can create property stub with set", function() {
            var mod = new Module();

            // property
            mod.defineProperty("beer");

            // behavior
            mod.defineBehavior("getBeerSuccess")
                .beer()
                .set("yummy");

            // get stub
            var stub = mod.getStub("getBeerSuccess");

            // pass
            stub.beer = "gross";
            var ret = stub.beer;
            assert.strictEqual(ret, "yummy");
        });
    });

    describe("defineTest", function() {
        it("throws on bad args", function() {
            var mod = new Module();

            // doesn't exist
            assert.throws(function() {
                mod.defineTest("asdfqwer");
            }, TypeError, "defineTest: behavior 'asdfqwer' not defined");

            // bad args
            assert.throws(function() {
                mod.defineTest();
            }, TypeError, "defineTest: expected argument 'behaviorName' to be of type String");
            assert.throws(function() {
                mod.defineTest(42);
            }, TypeError, "defineTest: expected argument 'behaviorName' to be of type String");

            mod.defineBehavior("getUserSuccess");
            assert.throws(function() {
                mod.defineTest("getUserSuccess", 42);
            }, TypeError, "defineTest: expection optional argument 'desc' to be of type String");
        });

        it("defines a test", function() {
            var mod = new Module();

            mod.defineBehavior("getUserSuccess");
            mod.defineTest("getUserSuccess");
            assert.strictEqual(mod.testList.length, 1);
            assert.strictEqual(mod.testList[0].behaviorName, "getUserSuccess");
        });

        it("uses behavior name as default description", function() {
            var mod = new Module();

            mod.defineBehavior("getUserSuccess");
            mod.defineTest("getUserSuccess");
            assert.strictEqual(mod.testList[0].behaviorName, "getUserSuccess");
            assert.strictEqual(mod.testList[0].desc, "getUserSuccess");
        });

        it("set desc explicitly", function() {
            var mod = new Module();

            mod.defineBehavior("getUserSuccess");
            mod.defineTest("getUserSuccess", "ensures user success");
            assert.strictEqual(mod.testList[0].behaviorName, "getUserSuccess");
            assert.strictEqual(mod.testList[0].desc, "ensures user success");
        });

        it("can test exception", function() {
            var mod = new Module();

            mod.defineMethod("getUser");
            mod.defineBehavior("getUserError")
                .getUser()
                .throws(new Error("user not found"));
            mod.defineTest("getUserError", "throws error on failure");

            // pass
            var myMod = {
                getUser: function() {
                    throw new Error("user not found");
                }
            };
            mod.runAllTests(myMod, mochaIt);

            // fail - no error
            myMod.getUser = function() {};
            assert.throws(function() {
                mod.runAllTests(myMod, mochaIt);
            }, ExpectError, "expectException: expectation failed for: Error: user not found");

            // fail - wrong error
            myMod.getUser = function() {
                throw new Error("out of memory");
            };
            assert.throws(function() {
                mod.runAllTests(myMod, mochaIt);
            }, ExpectError, "expectException: expectation failed for: Error: user not found");
        });

        it("can set test args", function() {
            var mod = new Module();

            // method
            mod.defineMethod("getUser");
            var myMod = {
                getUser: function(...args) {
                    assert.deepEqual(args, [1, undefined, false, "God"]);
                }
            };

            // behavior
            mod.defineBehavior("getUserArgs")
                .getUser()
                .args(1, undefined, false, "God");
            mod.defineTest("getUserArgs", "tests the getUserArgs");

            // pass
            mod.runAllTests(myMod, mochaIt);
        });

        it("can set test context", function() {
            var mod = new Module();

            // method
            mod.defineMethod("getUser");
            var myMod = {
                getUser: function() {
                    assert.deepEqual(this, {
                        happy: true,
                        name: "bob",
                        sumthin: "yup"
                    });
                }
            };

            // behavior
            mod.defineBehavior("getUserArgs")
                .getUser()
                .context({
                    happy: true,
                    name: "bob",
                    sumthin: "yup"
                });
            mod.defineTest("getUserArgs", "tests the getUserArgs");

            // pass
            mod.runAllTests(myMod, mochaIt);
        });

        it("can test a get value", function() {
            var mod = new Module();

            mod.defineProperty("beer");
            mod.defineBehavior("getBeerSuccess")
                .beer()
                .returns("Altamont");
            mod.defineTest("getBeerSuccess");

            var myMod = {
                beer: "Altamont"
            };

            mod.runAllTests(myMod, mochaIt);
        });

        it("can test a set value", function() {
            var mod = new Module();

            mod.defineProperty("beer");
            mod.defineBehavior("getBeerSuccess")
                .beer()
                .set("Altamont");

            mod.defineTest("getBeerSuccess");

            var myMod = {
                beer: "Budweiser"
            };

            mod.runAllTests(myMod, mochaIt);
            assert.strictEqual (myMod.beer, "Altamont");
        });

        it("can test an exception", function() {
            var mod = new Module();

            mod.defineProperty("beer");
            mod.defineBehavior("getBeerSuccess")
                .beer()
                .throws(new Error ("test error"));

            mod.defineTest("getBeerSuccess");

            var myMod = {};
            Object.defineProperty(myMod, "beer", {
                get: function() {
                    throw new Error ("test error");
                },
                configurable: true,
                enumerable: true
            });

            mod.runAllTests(myMod, mochaIt);
        });

        it("cleans up wrappers after test");
    });

    describe("runAllTests", function() {
        it("throws on bad args", function() {
            var mod = new Module();

            // missing first arg
            assert.throws(function() {
                mod.runAllTests();
            }, TypeError, "runAllTests: expected first argument to be the module to be tested and be of type Object");

            // wrong first arg
            assert.throws(function() {
                mod.runAllTests(42);
            }, TypeError, "runAllTests: expected first argument to be the module to be tested and be of type Object");

            // missing second arg
            assert.throws(function() {
                mod.runAllTests({});
            }, TypeError, "runAllTests: expected second argument to be callback function for running tests");

            // wrong second arg
            assert.throws(function() {
                mod.runAllTests({}, 42);
            }, TypeError, "runAllTests: expected second argument to be callback function for running tests");
        });
    });

    describe("_testFunctionFactory", function() {
        it("creates a function", function() {
            var mod = new Module();

            var behav = mod.defineBehavior("testBehavior");

            var fn = mod._testFunctionFactory(behav);
            assert.isFunction(fn);
            fn();
        });
    });

    function mochaIt(desc, fn) {
        // console.log("    " + desc);
        fn();
    }

    describe("getTestList", function() {
        it("returns a test list", function() {
            var mod = new Module();

            mod.defineBehavior("getUserSuccess");
            mod.defineTest("getUserSuccess", "successful get user");
            var testList = mod.getTestList();
            assert.isArray(testList);
            assert.strictEqual(testList.length, 1);
            assert.strictEqual(testList[0].behaviorName, "getUserSuccess");
        });
    });

    describe("test", function() {
        it("throws if interace isn't defined", function() {
            var mod = new Module();

            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess").getUser().returns("Adam");
            mod.defineTest("getUserSuccess", "successful get user");
            var testList = mod.getTestList();

            assert.throws(function() {
                mochaIt(testList[0].desc, testList[0].fn({
                    module: "test"
                }));
            }, Error, "runTest: expected property 'getUser' to exist on module");
        });

        it("throws on bad return value", function() {
            var mod = new Module();

            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess").getUser().returns("Adam");
            mod.defineTest("getUserSuccess", "successful get user");
            var testList = mod.getTestList();

            var myMod = {
                name: "myMod",
                getUser: function() {
                    return "Bob";
                }
            };
            assert.throws(function() {
                mochaIt(testList[0].desc, testList[0].fn(myMod));
            }, ExpectError, "expectReturn: expectation failed for: Adam");
        });

        it("passes good expect", function() {
            var mod = new Module();

            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess").getUser().returns("Adam");
            mod.defineTest("getUserSuccess", "successful get user");
            var testList = mod.getTestList();

            var myMod = {
                getUser: function() {
                    return "Adam";
                }
            };

            mochaIt(testList[0].desc, testList[0].fn(myMod));
        });
    });

    describe("integrity checks", function() {
        it("simple stub passes test", function() {
            var mod = new Module();

            mod.defineMethod("getUser");
            mod.defineBehavior("getUserSuccess")
                .getUser()
                .returns("Adam");
            mod.defineTest("getUserSuccess", "successful get user");
            var stub = mod.getStub("getUserSuccess");
            mod.runAllTests(stub, mochaIt);
        });

        it("multi-stub", function() {
            var mod = new Module();

            // methods
            mod.defineMethod("getUser");
            mod.defineMethod("createUser");

            // behaviors
            mod.defineBehavior("getUserFail", "getUser")
                .throws(new Error("User not found"));
            mod.defineBehavior("createUserSuccess", "createUser")
                .returns(true);
            mod.defineBehavior("getUserSuccess", "getUser")
                .returns("Adam");
            mod.defineBehavior("createAccount")
                .getUserFail()
                .createUserSuccess()
                .getUserSuccess();

            // create stub
            var stub = mod.getStub("createAccount");

            // define tests
            mod.defineTest("createAccount", "can create an account");
            mod.runAllTests(stub, mochaIt);
        });
    });
});
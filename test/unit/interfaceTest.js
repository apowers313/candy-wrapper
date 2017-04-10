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

        it("can define interface");
        it("throws when defineInterface gets bad args");

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

        it("throws when getInterface gets bad args");

        it("can chain on interface", function() {
            var mod = new Module();
            mod.defineMethod("getUser");
            var prop = mod.defineBehavior("getUserSuccess", "getUser");
            assert.instanceOf(prop, InterfaceBehavior);
        });
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

        it("throws when getBehavior gets bad args");

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
            assert.isTrue(Wrapper.isWrapper(stub));
            var ret = stub();
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
            assert.isTrue(Wrapper.isWrapper(stub));

            // first call
            var ret = stub();
            assert.deepEqual(ret, {
                user: "Adam"
            });

            // second call
            ret = stub();
            assert.deepEqual(ret, {
                user: "Adam"
            });

            // third call
            ret = stub();
            assert.isUndefined(ret);
        });
    });
});
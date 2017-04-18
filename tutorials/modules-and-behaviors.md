{@link Module Modules}, and their associated {@link Interface Interfaces} and {@link Behavior Behaviors}, are a way of programmatically defining and testing the behavior of an API. Modules are intended to be a single `Object` that contains method functions and properties -- which are referred to as the `Interfaces`<sup>*</sup>.

For every interface, a set of `Behaviors` can be defined for the interface -- how the interface behaves with different arguments, what values it returns, when it might throw errors, etc. These `Behaviors` can then be used to generate a stub `Wrapper` or a set of tests for testing instances of the `Module`.

The sections that follow walk through how to create a `Module`, define its `Intefaces` and `Behaviors`, and then use it to create stubs and tests.

(<sup>*</sup> Okay, I admit that `Interface` may not be a perfect name. I'm open to other ideas.)

## Defining a Module
Defining a module is easy:

``` js
var myModule = new Module();
```

There's nothing fancy here -- a `Module` is just a container for the interfaces and behaviors.

## Defining Interfaces
`Interfaces` are technically properties on the `Module` object that provide ways of interacting with the module. There are two types of interfaces: 1) function / method interfaces; and 2) property interfaces. While there is an {@link Interface Interface Class}, interfaces should be created by calling the {@link Module#defineMethod defineMethod} and {@link Module#defineProperty defineProperty} methods on the `Module`:

``` js
var carModule = new Module();

// define a function for the module
carModule.defineMethod("startEngine");
// define a property for the module
carModule.defineProperty("currentSpeed");
```

These interfaces won't do anything interesting until we define their behaviors.

## Defining Behaviors

Every `Interface` can have multiple `Behaviors` -- and should have at least one `Behavior`. These behaviors describe what the `Interface` is expected to do in different conditions. If no behaviors are defined for an `Interface`, then it will essentially do nothing and be useless.

Defining behaviors is easy, and is closely related to the {@link Operation} interface for {@link Wrappers}. Method interfaces can have arguments, context (`this` value`), throw exceptions, or return values. Properties can have set values, get values, or throw exceptions. Here are some examples of defining behaviors:

``` js
var carModule = new Module();

// define a function for the module
carModule.defineMethod("startEngine");
// successfully start the engine
carModule.defineBehavior("startEngineSuccess")
    .startEngine()
    .args("key")
    .returns(true);
// fail to start the engine because no key was provided
carModule.defineBehavior("startEngineNoKey")
    .startEngine()
    .args()
    .throws(new Error("no key provided"));

// define a property for the module
carModule.defineProperty("currentSpeed");
// property returns 10 when going slow
carModule.defineBehavior("currentSpeedSlow")
    .currentSpeed()
    .returns(10);
// property returns 70 when at cruising speed
carModule.defineBehavior("currentSpeedCruise")
    .currentSpeed()
    .returns(70);
// property returns 120 when going fast
carModule.defineBehavior("currentSpeedFast")
    .currentSpeed()
    .returns(120);
```

You will notice that the general pattern of these is to call {@link Module#defineBehavior defineBehavior}, followed by chaining the name of the interface that is to be defined and the expected behavior of that interface.

Behaviors can be nested, so building on the behaviors that were defined above we can define a new `accelerate` behavior:

``` js
carModule.defineBehavior("accelerate")
    .startEngineSuccess()
    .currentSpeedSlow()
    .currentSpeedCruise()
    .currentSpeedFast();
```

The `accelerate` behavior expects the car to be started through a `startEngine()` call, and then for the `currentSpeed` property to be `10`, `70`, and `120` the next three times it is checked.

Now that we have defined some behaviors, we can use them to create stubs or tests.

## Behavior Stubs
A behavior stub is essentially a {@link Wrapper} that performs the behavior described by the `Behavior`. These are simple to create, for example using the behaviors defined in the previous section we could create a stub like this:

``` js
var myCarStartEngineStub = carModule.getStub("startEngineSuccess");
```

In this case, {@link Module#getStub getStub} would return an `Object` with the method `startEngine` defined on it. When called the first time, the `startEngine` would throw an {@link ExpectError} if the first argument isn't `"key"`, or would return `true` if the first argument was `"key"`. Since only the first behavior of `startEngine` is defined, each subsequent time the method is called it would return `undefined` and wouldn't have any expectations for the arguments.

Since `currentSpeed` isn't defined as part of the `Behavior` it wouldn't be defined on the stub behavior.

This stub could be used wherever you wanted to use your `carModule` in your testing.

## Running Tests
Similar to getting a behavior stub, it is easy to test that an instance of a module has the expected behaviors. Since all behaviors may not be testable in a stand-alone fashion, it is necessary to define which behaviors should be tested. For example, it may not be desirable to test the current speed of the car without first starting the car, so `currentSpeedCruise` shouldn't be tested by itself.

For our module, let's assume that there are three behaviors that we want to test:

``` js
carModule.defineTest("startEngineSuccess", "start the car's engine");
carModule.defineTest("startEngineNoKey", "fails to start the engine without a key");
carModule.defineTest("accelerate", "start the engine and current speed gets faster");
```

You'll notice that the second argument to {@link Module#defineTest defineTest} is an optional description of the test. This is useful for running the tests, as we will see momentarily.

Now let's define our module to be tested:

``` js
var myFerrari = {
    startEngine = function(key) {
        if (key !== "key") throw new Error ("no key provided");
        return true;
    },
    currentSpeed: 0
}
```

Now we can run the tests against my instance of the module:

``` js
describe ("my ferrari", function() {
    mod.runAllTests(myFerrari, it);
});
```

This runs all the defined tests against the `myFerrari` module. Note that `describe` and `it` are from a test runner like [Mocha](https://mochajs.org/) or [Jasmine](https://jasmine.github.io/). (The `describe` function has nothing to do with this library, other than the fact that the `it` function of those libraries does nothing if it isn't inside a `describe` function). The `it` function is called with the arguments `desc` and `function` that were defined for your behavior, where the `function` will throw if there is an error.

If you are using a test runner that doesn't have a testing function that follows the `test(desc, fn)` format, just provide your own callback function and call the function directly:

``` js
mod.runAllTests(myFerrari, function(desc, fn) {
    myTestSuite(fn); // or whatever your test runner requires...
});
```

(Note that our example module fails the tests since the cruise speed never changes... guess we will have to create a `applyGasPedal` method and add that to the `Behavior`. This is left as an exercise for the reader.)

## Integration Testing
If it isn't already obvious, stubs are to be used where you module should be consumed and tests are to be used for instances of the module. Stubs and tests should test the same behaviors, ensuring that when a stub is replaced with an actual instance of module that the instance of the module behaves exactly as the stub did.

Since stubs and tests are mirror images of each other, the following should always work:

``` js
var stub = module.getStub("behavior");
var test = module.getTest("behavior", myModule);
test(stub); // success!
```
**This project is currently a RELEASE CANDIDATE. Please provide feedback on bugs or improvements before the 1.0 release.**

![##candy-wrapper](https://cdn.rawgit.com/apowers313/candy-wrapper/2e325ece/img/candy-wrapper-full-logo-1116x200.png?raw=true)

[![Build Status](https://travis-ci.org/apowers313/candy-wrapper.svg?branch=master)](https://travis-ci.org/apowers313/candy-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/apowers313/candy-wrapper/badge.svg?branch=master)](https://coveralls.io/github/apowers313/candy-wrapper?branch=master)
[![Stories in Ready](https://badge.waffle.io/apowers313/candy-wrapper.png?label=ready&title=Ready)](https://waffle.io/apowers313/candy-wrapper)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/apowers313.svg)](https://saucelabs.com/beta/builds/011f525b0b50411290a7040eaa686fc2)

[Full API Documentation Available Here!](https://apowers313.github.io/candy-wrapper)

Questions, comments, bugs, suggestions, contributions, etc. are welcomed. Please submit an [issue on GitHub](https://github.com/apowers313/candy-wrapper/issues).

## Overview

This library provides the ability to wrap functions or properties so that you can monitor their behavior without changing it. Wrappers also allow you to decide when and how you want to change the behavior of a function or property. Candy-wrapper is similar to wonderful libraries like [Sinon](http://sinonjs.org/) and [shimmer](https://www.npmjs.com/package/shimmer) and can be used for creating stubs, spys, and mocks for testing and monkey patching in production environments. The motivation behind creating candy-wrapper was that other libraries were too hard to learn, had inconsistent APIs, or generally couldn't do the things I needed to do with a wrapper. Hopefully candy-wrapper does everything anyone could ever hope for from a wrapper, or can be easily expanded to add new functionality.

The primary interfaces are Wrapper, Expect, Trigger, and Action:
* [Wrappers](https://apowers313.github.io/candy-wrapper/Wrapper.html) wrap a function or property, so that when the Wrapper is called, so is the underlying function or property.
* You can use [Expect](https://apowers313.github.io/candy-wrapper/Expect.html) to examine what happened with a Wrapper, such as seeing what args were passed to it or what the return value was.
* [Triggers](https://apowers313.github.io/candy-wrapper/Trigger.html) get called just before or just after a function call, providing the opportunity validate Expects or perform Actions. Actions can do things like change arguments recieved by the wrapped function or change the value returned to the caller.

If you are new to wrappers or candy-wrapper, a good place to start is the [Getting Started Tutorial](https://apowers313.github.io/candy-wrapper/tutorial-getting-started.html).

There is also a higher-level interface for defining stubs and tests based on their behavior.
This interface is especially useful for creating stubs and tests that mirror each other, where the stubs can be used to replace a module during testing and a test can make sure that the module has the same behavior as a stub. The primary interface for this functionality is:
* [Module](https://apowers313.github.io/candy-wrapper/Module.html), which defines a group of method and property interfaces, similar to a module that is imported through `require`. After behaviors are defined for the module, stubs and tests can automatically be generated to stub out the module where it is required or test instances of the module.

For a quick introduction to Modules, Intefaces and Behaviors, see the [Modules and Behaviors Tutorial](https://apowers313.github.io/candy-wrapper/modules-and-behaviors.html)

## Installing and Using

### node.js

Install:

``` bash
$ npm install candy-wrapper
```

Use:

``` js
var Wrapper = require("candy-wrapper").Wrapper;
new Wrapper();
```

### Browser

Install:

``` html
<script src=https://rawgit.com/apowers313/candy-wrapper/master/candy-wrapper.js></script>
```

Use:

``` html
<script>
var Wrapper = CandyWrapper.Wrapper;
</script>
```

## Examples
Here are few example use cases to get you started with candy-wrapper...

### Spys
Let's say that you have already written some code and now you want to test it to make sure it works right. Your very simple function `square()` simply takes a number and squares it and you want to make sure it's working right.

``` js
// our simple square function, squares the number passed in
// throws error if the argument isn't a number
var square = function(num) {
    if (typeof num !== "number") {
        throw new TypeError ("expected argument to be Number");
    }

    return num * num;
};

// wrap square so that we can analyze it later
square = new Wrapper(square);

// let's make some calls to square
square(2);
square(4);
try { // gobble up the exception from no arguments
    square();
} catch(e) {}
square(3);
square(5);

square.historyList.filterFirst().expectReturn(4); // true
square.historyList.filterSecond().expectReturn(16); // true
square.historyList.filterThird().expectException(new TypeError ("expected argument to be Number")); // true
square.historyList.filterFourth().expectReturn(10); // false, actually returned 9
square.historyList.filterFifth().expectReturn(23); // false, actually returned 25

square.expectReportAllFailures();
// ExpectError: 2 expectation(s) failed:
//     expectReturn: expectation failed for: 10
//     expectReturn: expectation failed for: 23
```

### Stubs
Let's say you're working on a big complex system that's eventually going to hook up to a database, but you really don't want to have to write all the database code before you can start working on the more interesting code that would rely on it. If only you could create a fake database object that behaved like the real thing...

``` js
var fakeDb = {};
fakeDb.getUser = new Wrapper(); // create a stub function for getUser...
fakeDb.listUsers = new Wrapper(); // create a stub function for listUsers...

// when `fakeDb.getUser` is called with the argument "apwoers", it returns the object below
fakeDb.getUser.triggerOnArgs("apowers")
    .actionReturn({
        username: "apowers",
        firstName: "Adam",
        lastName: "Powers"
    });

// everytime `fakeDb.listUsers` is called, it returns the same array...
fakeDb.listUsers.triggerAlways()
    .actionReturn([{
        username: "apowers",
        firstName: "Adam",
        lastName: "Powers"
    }, {
        username: "bhope",
        firstName: "Bob",
        lastName: "Hope"
    }]);

var user = fakeDb.getUser("apowers"); // returns a user object...
var userList = fakeDb.listUsers(); // returns an array of users...
```

### Mocks
Now let's say it's been a few months, and your system is almost completely done. You have completed your real database, and you're having some sort of error that you suspect is due to your database timing out. You want to simulate errors with your database, but it's not easy to figure out how to make it time out when you want it to. Instead, you can just wrap your database object in a mock and start injecting errors...

``` js
// this is your big complex interface to a MongoDB database
var mysqlDbInterface = {
    // ...
    getUser: function() {
        // make database call here
    }
    // ...
};

var getUserWrapper = new Wrapper(mysqlDbInterface, "getUser");
getUserWrapper.triggerOnCallNumber(2)
    .actionThrowException(new Error("Connection to mySQL timed out"));

// start server
// the third call to `mysqlDbInterface.getUser()` will throw a timeout Error now..
```

### Monkey Patching
Let's say that you are tired of [Math.random()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random) being a pseudo-random number generator and you want it to use your [Digital Random Number Generator (DRNG)](https://software.intel.com/en-us/articles/intel-digital-random-number-generator-drng-software-implementation-guide) instead. Using candy-wrapper, you can [monkey patch](https://en.wikipedia.org/wiki/Monkey_patch) (that is, replace) `Math.random()` with your DRNG:

``` js
// replace "Math.random" with the new function of our choosing...
new Wrapper(Math, "random", function() {
    return 1.2345; // this is where you would call your DRNG...
});

// let's see what it does...
Math.random() // returns 1.2345

// check to see if Math.random is a Wrapper
Wrapper.isWrapper(Math, "random"); // true

// this is probably a bad idea, let's go back to the original random number generator...
Wrapper.unwrap(Math, "random");
```

### Module Stubs and Tests
Changing gears (so to speak), our next example shows how to define a new module that describes the functionality of a car. The {@link Module} can then create a stub to be used where the module is needed during testing, and tests to ensure that any instance of the module will behave properly when imported into the real system.

``` js
// create a new module that will define a car
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

// define a more complex behavior based on the behaviors we already defined
carModule.defineBehavior("accelerate")
    .startEngineSuccess()
    .currentSpeedSlow()
    .currentSpeedCruise()
    .currentSpeedFast();

/*****************************************************
 * A stub that replaces the functionality for testing
 /****************************************************/

// normally this is what happens
var carModule = require("carModule");

// create a stub that mocks the `startEngineSuccess` behavior
// maybe replace the normal module with your stub using something like Mockery:
// https://www.npmjs.com/package/mockery
var carModule = carModule.getStub("startEngineSuccess");

/*****************************************************
 * A module that will have it's behavior tested
 /****************************************************/

// define which behaviors should be tested for the module
carModule.defineTest("startEngineSuccess", "start the car's engine");
carModule.defineTest("startEngineNoKey", "fails to start the engine without a key");
carModule.defineTest("accelerate", "start the engine and current speed gets faster");

// your instance of the car module
var myFerrari = {
    startEngine = function(key) {
        if (key !== "key") throw new Error ("no key provided");
        return true;
    },
    currentSpeed: 0
};

// maybe your module would do something like this
module.exports = myFerrari;

// run all the tests against your module using the 'describe' and 'it' functions from Mocha
describe ("my ferrari", function() {
    mod.runAllTests(myFerrari, it);
});
```

## Required: JavaScript ES6
Note that this library currently makes exensive use of the features of [JavaScript ES6](http://www.ecma-international.org/ecma-262/6.0/), notably [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes), [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), [rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters), and the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator). For information about which platforms currently support ES6, see the [ES6 compatibility table](https://kangax.github.io/compat-table/es6/). It has been tested against Node 6 and is tested against the latest versions of Chrome, Firefox, Edge, and Safari.

Presumably it could be back-ported to ES5.1, perhaps drawing on the work of Sinon. The biggest challenge would be removing the use of Proxies. A [pull request](https://github.com/apowers313/candy-wrapper) would be more than welcome if anyone wants to take that challenge on.

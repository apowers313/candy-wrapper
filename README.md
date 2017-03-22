Work in progress. Please don't use.

## Candy Wrapper

[![Build Status](https://travis-ci.org/apowers313/candy-wrapper.svg?branch=master)](https://travis-ci.org/apowers313/candy-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/apowers313/candy-wrapper/badge.svg?branch=master)](https://coveralls.io/github/apowers313/candy-wrapper?branch=master)

<!-- [![Sauce Test Status](https://saucelabs.com/browser-matrix/apowers313.svg)](https://saucelabs.com/u/apowers313) -->

Docs: https://apowers313.github.io/candy-wrapper

This library is similar to the wonderful [Sinon](http://sinonjs.org/) and can be used for creating stubs, spys, and mocks for testing. The API has been re-invented to be consistent and re-use code across all those functionalities.

The primary interfaces are Wrapper, Expect, Trigger, and Action.
* [Wrappers](https://apowers313.github.io/candy-wrapper/Wrapper.html) wrap a function or attribute, so that when the Wrapper is called, so is the underlying function or attribute.
* You can use [Expect](https://apowers313.github.io/candy-wrapper/Expect.html) to examine what happened with a Wrapper, such as seeing what args were passed to it or what the return value was.
* [Triggers](https://apowers313.github.io/candy-wrapper/Trigger.html) get called just before or just after a function call, providing the opportunity validate Expects or perform Actions.
* Actions can do things like change arguments recieved by the wrapped function or change the value returned to the caller.

## ES6
Note that this library currently makes exensive use of the features of JavaScript ES6, notably [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes), [temlate literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), and the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator). For information about which platforms currently support ES6, see the [ES6 compatibility table](https://kangax.github.io/compat-table/es6/). It has been tested against Node 6 and seems to run on the latest versions of Chrome and Firefox.

Presumably it could be back-ported to ES5.1, perhaps drawing on the work of Sinon. The biggest challenge would be removing the use of Proxies. A [pull request](https://github.com/apowers313/candy-wrapper) would be more than welcome if anyone wants to take that challenge on.

## Examples

## API Overview
#### Wrapper

#### Config

| Function Name         | Description |
|-----------------------|-------------|
| configReset | |

* configPassThrough
* configObserveWaitForValidate
* configObserveThrows
* configRestore

#### Wrapper Expect

Function

| Function Name         | Description |
|-----------------------|-------------|
| expectCallCount | |
| expectCallCountMax | |
| expectCallCountMin | |
| expectCallCountRange | |
| expectCallNever | |
| expectCallOnce | |
| expectCallTwice | |
| expectCallThrice | |

Attribute

* expectSetCount
* expectGetCount
* expectTouchCount
* expectSetCountMax
* expectGetCountMax
* expectTouchCountMax
* expectSetCountMin
* expectGetCountMin
* expectTouchCountMin
* expectSetCountRange
* expectGetCountRange
* expectTouchCountRange
* expectSetNever
* expectGetNever
* expectTouchNever
* expectSetOnce
* expectGetOnce
* expectTouchOnce
* expectSetTwice
* expectGetTwice
* expectTouchTwice
* expectSetThrice
* expectGetThrice
* expectTouchThrice

...All...

...Sometimes...

...Never...

#### Filter API

| Function Name         | Description |
|-----------------------|-------------|
* filterSet
* filterGet

* filterCallByArgs
* filterCallByContext
* filterByException
* filterByReturn
* filterSetByVal

* All
* Some
* None

* filterFirst
* filterLast
* filterOnly
* filterByNumber

#### Get API

Function

* _get
* getAllContexts
* getAllArgs
* getAllExceptions
* getAllReturns
* getAllTriggers

Attribute

* getAllExceptions
* getAllReturns
* getAllSetVals

#### Single Expect

General

* expectValidate
* _expect (name, trigger)

Function

* expectCallArgs
* expectCallContext
* expectReturn
* expectException
* expectCustom (fn, param)

Attribute

* expectSetVal
* expectReturn
* expectException

#### Trigger

* _trigger (name, function)
* triggerOnAll
* triggerOnArgs
* triggerOnContext
* triggerOnCallNumber
* triggerOnException
* triggerOnReturn
* triggerOnCallLike (SingleCall)
* triggerOnTouchLike (SingleTouch)
* triggerOnCustom (fn, single, param)

* ...OnSet
* ...OnSetVal
* ...OnSetNumber
* ...OnGet
* ...OnGetNumber
* ...OnTouch
* ...OnTouchNumber

#### Actions

Function

Attribute

* _action (name, function)
* actionCallbackToArg(arg#)
* actionCallbackFunction(function)
* actionCallbackContext(thisVal)
* actionCallbackArgs(any)
* actionCallbackAsync()
* actionCallbackAttribute(attrName) // returns object.attrName
* actionReturn(any)
* actionReturnFromArg(arg#)
* actionReturnFromContext() // returns ‘this’
* actionThrowException
* actionReturnPromise
* actionRejectPromise
* actionCustom (fn, param)
* actionSetVal

#### Match

* compare
* diff
* extend
* getType
* findCommonType
* getLastDiff
* getDiffMessage

#### Sandbox
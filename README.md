[![Build Status](https://travis-ci.org/apowers313/candy-wrapper.svg?branch=master)](https://travis-ci.org/apowers313/candy-wrapper)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/apowers313.svg)](https://saucelabs.com/u/apowers313)

Setup:

1. Edit **package.json**, set `name`, `description`, `publish`, `repository.url`, `bugs.url`, `keywords`, and `license`
2. Edit **.jsdoc-conf.json**, set `systemName`
3. Edit **test/test.html**, set `title` and `main.js`
4. Rename **main.js**
5. Change git remote: `git remote rm origin` then `git remote add origin new-repo`
6. [Create](https://github.com/settings/tokens) `GH_TOKEN` and add to Travis CI build
7. [Get SauceLabs token](https://saucelabs.com/beta/user-settings) and set `SAUCE_ACCESS_KEY` and `SAUCE_USERNAME` in Travis CI
8. Update badge URLs in **README.md**, and delete these instructions



expect… // spy / assert / expectation — same as compare, but throws if ‘false’ would be returned. can throw immediately or eventually
fake… // stub
trigger… // select where fakes apply
select… // filter calls to observe / expect

works with functions and attributes

Creation
wrapper()
wrapper(obj)
wrapper(func)
wrapper(obj, method)
wrapper(obj, attribute)
wrapper(obj, method, func)
wrapper(obj, attribute, func)

stub = wrapper().configPassThrough(false)
spy = wrapper().configPassThrough(true)
mock = stub + expect…()

Config
.configPassThrough(true/false) // whether the wrapped function or attribute gets called
.configExpectWaitForValidate(true/false) // if true, expect requires that expectVerify() be called and won’t throw until verify()
.configExpectDontThrow()
.configReset
.configRestore

Expect API
expectCallArgs([arg1. arg2, …])
# exact args?
expectCallCount(n)
expectCallCountRange(min, max)
expectContext
expectReturn
expectException
expectValidate

Expect API for Sequences
All…
Sometimes…
Never…

Get API
getContext
getAllContexts
getArgs
getAllArgs
getException
getAllExceptions
getReturn
getAllReturns

Fake API
.fakeCallbackArg(arg#)
.fakeCallbackFunction(function)
.fakeCallbackContext(thisVal)
.fakeCallbackArgs(any)
.fakeCallbackAsync()
.fakeCallbackAttribute(attrName) // returns object.attrName
.fakeReturn(any)
.fakeReturnArg(arg#)
.fakeReturnContext() // returns ‘this’
.fakeException
.fakePromiseReturn
.fakePromiseReject

Select API
# only one per definition
.selectByArgs
.selectByContext
.selectByCallNumber

Match API

Sandbox API

class Wrapper {
}

class Match {
}

class Sandbox {
}

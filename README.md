Work in progress. Please don't use.

[![Build Status](https://travis-ci.org/apowers313/candy-wrapper.svg?branch=master)](https://travis-ci.org/apowers313/candy-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/apowers313/candy-wrapper/badge.svg?branch=master)](https://coveralls.io/github/apowers313/candy-wrapper?branch=master)

<!-- [![Sauce Test Status](https://saucelabs.com/browser-matrix/apowers313.svg)](https://saucelabs.com/u/apowers313) -->

This library is similar to the wonderful [Sinon](http://sinonjs.org/) and can be used for creating stubs, spys, and mocks for testing. The API has been re-invented to be consistent and re-use code across all those functionalities.

The primary interfaces are Wrapper, Expect, Trigger, and Action.
* Wrappers wrap a function or attribute, so that when the Wrapper is called, so is the underlying function or attribute.
* You can use Expect to examine what happened with a Wrapper, such as seeing what args were passed to it or what the return value was.
* Triggers get called just before or just after a function call, providing the opportunity validate Expects or perform Actions.
* Actions can do things like change arguments recieved by the wrapped function or change the value returned to the caller.
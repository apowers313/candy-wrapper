// "use strict";

// UMD returnExports design pattern
(function(root, factory) {
    /* istanbul ignore next */
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.CandyWrapper = factory();
    }
}(this, function() {

    function debug(...args) {
        // console.log(...args);
    }

    /**
     * Creates an alias method for an already existing method
     * @param  {Object}    ctx       The `this` object that the function will be called on.
     * @param  {String}    aliasName The name of the new alias.
     * @param  {Function}  fn        The name of the function that the alias will call
     * @param  {...Any} args         The arguments to bind to the function.
     * @private
     */
    function alias(ctx, aliasName, fn, ...args) {
        ctx[aliasName] = fn.bind(ctx, ...args);
    }

    function killAlias(type, obj, prop) {
        var myType = (type === "function") ? "FUNCTION" : "PROPERTY";
        var otherType = (type === "function") ? "PROPERTY" : "FUNCTION";
        Object.defineProperty(obj, prop, {
            get: function() {
                throw new Error(`ERROR: attempting to get ${prop} on ${myType}. Only available on ${otherType}.`);
            },
            set: function() {
                throw new Error(`ERROR: attempting to set ${prop} on ${myType}. Only available on ${otherType}.`);
            }
        });
    }

    function walkObject(obj, cb) {
        for (let key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            if (typeof obj[key] === "object") {
                walkObject(obj[key], cb);
            } else {
                cb(obj, key);
            }
        }
    }

    function indent(num) {
        var base = "      ";
        var indent = "    ";
        var ret = base;
        for (let i = 0; i < num; i++) ret += indent;
        return ret;
    }

    var wrapperCookie = "193fe616-09d1-4d5c-a5b9-ff6f3e79714c";
    var wrapperCookieKey = "uniquePlaceToKeepAGuidForCandyWrapper";

    /**
     * `Wrapper` is the main class for candy-wrapper. A wrapper goes around an existing function, method, or property
     * enabling you to monitor the behavior of the underlying wrapped thing or optionally changing the behavior of
     * the wrapped thing when you want to. If you are new to candy-wrapper, or wrappers in general, you may want to
     * check out the {@tutorial getting-started} tutorial.
     *
     * Below are all the different forms of the contructor, which are basically syntactic sugar for creating wrappers
     * around lots of different kinds of things
     *
     * ``` js
     * // creates a wrapper around an object's method
     * new Wrapper(obj, method);
     *
     * // createa a wrapper around an object's property
     * new Wrapper(obj, property);
     *
     * // creates a wrapper around a function and returns the new wrapped function
     * // calling the old, unwrapped function doesn't trigger the wrapper
     * var func = new Wrapper(func);
     *
     * // creates a new wrapped empty, anonymous function
     * var stub = new Wrapper();
     *
     * // recursively wraps every property and method in an object
     * new Wrapper(obj);
     *
     * // wraps a method but calls `func` instead of the underlying method
     * new Wrapper(obj, method, func);
     *
     * // wraps a property but cals `func` instead of the setter / getter for the property
     * new Wrapper(obj, property, func)
     * ```
     *
     * Once you have wrapped a function or property, there are two main ways to work with it. One is through the `historyList`
     * which contains all the historical calls to the `Wrapper`. The other is through {@link Trigger Triggers} which can change
     * the behavior of the `Wrapper` as well as validating expectations every time the `Wrapper` is called. The `historyList` is
     * a {@link Filter} array of all the calls that have been made, where each call is represented as a {@link Operation}.
     * `Filters` have a number of convenience methods that make it easier to manipulate the `historyList` and select only the
     * `Operations` that you are interested in validating.
     *
     * Likewise, `Triggers` are executed on the `Operation` as it is being used during the call. A `Trigger` has the opportunity
     * to set the arguments or context for functions or the set value for properties before the wrapped function or property is
     * called, and `Triggers` are called a second time to modify the return value or exceptions that are thrown after the wrapped
     * function or property has executed. `Triggers` can be created on a `Wrapper` using the methods that start with `trigger` and
     * `Triggers` are evaluated in the order they are defined on the `Wrapper`.
     *
     * `Wrappers` also hhave a number of configuration functions that define their behavior, such as when attempting to "rewrap"
     * the same function or property. The `config` functions enable you to modify these behaviors. By default, rewrapping a function
     * or property will return the existing `Wrapper` without throwing an error and without reseting any of the `Triggers` or
     * `historyList`.
     *
     * Note that the `Wrapper` class is generic to wrapping both functions and properties; however, not all methods are equally
     * applicable to functions and properties. It does not make any sense to specify a "set value" for a function, nor does it make
     * any sense to supply a "context" (`this` value) for a property. When attempting to use a function-specific method on a
     * wrapped property, the method will detect this and throw an `Error` immediately; and the same is true for attempting to use
     * property-specific methods on functions.
     *
     * Here are some example of how to use a `Wrapper`:
     *
     * ``` js
     * // a simple test object
     * var myDrone = {
     *     name: "DJI",
     *     fly: function(direction) {
     *         return true;
     *     }
     * }
     *
     * new Wrapper(myDrone, "name");
     * new Wrapper(myDrone, "fly");
     *
     * myDrone.fly("north");
     * myDrone.fly("west");
     *
     * // evaluating previous calls through the 'historyList' and 'Filters'
     * myDrone.fly.historyList.filterFirst().expectCallArgs("north"); // true
     * myDrone.fly.historyList.filterFirst().expectCallArgs("east"); // false
     * myDrone.fly.expectReportAllFailtures(); // throws an error about the "east" expecation failing
     *
     * // modifying behavior using 'Triggers'
     * myDrone.fly.triggerOnCallArgs("east").actionReturn(false); // will return 'false' when called with "east"
     * myDrone.fly("east"); // false
     * myDrone.fly("west"); // true (the default return value)
     *
     * // working with properties
     * myDrone.name.triggerOnSet().actionThrowException(new Error("do not set the name"));
     * myDrone.name = "Bob"; // throws Error: "do not set the name"
     * var ret = myDrone.name; // ret = "DJI"
     *
     * // rewrapping
     * var flyWrapper = new Wrapper(myDrone, "fly"); // doesn't change anything, just returns the original wrapper
     * flyWrapper.configAllowRewrap(false); // disallow rewrapping
     * new Wrapper(myDrone, "fly"); // throws an error
     *
     * // these sorts of things won't work
     * myDrone.fly.triggerOnSet()... // throws an error -- functions don't have 'set'
     * myDrone.fly.triggerOnCallContext()... // throws an error -- properties don't have 'this' values
     * ```
     * @extends {Function}
     */
    class Wrapper extends Function {

        /**
         * Creates a new `Wrapper` instance.
         */
        constructor(...args) {
            super();

            if (args[0] === null) {
                throw new TypeError("Wrapper: bad arguments to constructor. RTFM.");
            }

            // if already wrapped, warn and return the existing Wrapper
            if (Wrapper.isWrapper(...args)) {
                return this._rewrap(...args);
            }

            // constructed like: wrapper()
            if (args.length === 0) {
                debug("creating empty wrapper");
                return this._callConstructor(function() {});
            }

            // constructed like: wrapper(obj)
            if (args.length === 1 && typeof args[0] === "object") {
                var obj = args[0];
                walkObject(obj, function(obj, key) {
                    new Wrapper(obj, key);
                });
                return obj;
            }

            // constructed like: wrapper(func)
            if (args.length === 1 && typeof args[0] === "function") {
                debug("wrapping function:", args[0].name);
                return this._callConstructor(args[0]);
            }

            // wrapper(obj, method)
            // wrapper(obj, property)
            if (args.length === 2 &&
                typeof args[0] === "object" &&
                typeof args[1] === "string") {
                let obj = args[0];
                let key = args[1];
                this.origObj = obj;
                this.origProp = key;

                // testing `typeof obj[key]` could trigger a getter
                // get the value from the property descriptor instead
                let desc = Object.getOwnPropertyDescriptor(obj, key);

                if (desc && desc.value && typeof desc.value === "function") {
                    obj[key] = this._callConstructor(obj[key]);
                    return obj[key];
                } else {
                    return this._propConstructor(obj, key);
                }
            }

            // wrapper(obj, method, func)
            // wrapper(obj, property, func)
            if (args.length === 3 &&
                typeof args[0] === "object" &&
                typeof args[1] === "string" &&
                typeof args[2] === "function") {
                let obj = args[0];
                let key = args[1];
                let fn = args[2];
                debug("wrapping method or property:", key);
                /** @type {Object} The original object that the property belongs to */
                this.origObj = obj;
                this.origProp = key;
                if (typeof obj[key] === "function") {
                    obj[key] = this._callConstructor(obj[key], fn);
                    return obj[key];
                } else {
                    return this._propConstructor(obj, key, fn);
                }
            }

            throw new TypeError("Wrapper: bad arguments to constructor. RTFM.");
        }

        _rewrap(...args) {
            var oldWrapper;

            // _rewrap(func)
            if (args.length === 1 && typeof args[0] === "function") {
                oldWrapper = args[0];
            }

            // _rewrap(obj, method)
            // _rewrap(obj, property)
            // _rewrap(obj, method, func)
            // _rewrap(obj, property, func)
            if ((args.length === 2 || args.length === 3) &&
                typeof args[0] === "object" &&
                typeof args[1] === "string") {
                let obj = args[0];
                let key = args[1];
                if (typeof obj[key] === "function") {
                    oldWrapper = obj[key];
                } else {
                    oldWrapper = Wrapper.getWrapperFromProperty(obj, key);
                }
            }

            if (!oldWrapper.config.allowRewrap) {
                throw new Error("Function or property already wrapped: rewrapping not allowed. Use configAllowRewrap(true) if you would like to enable rewrapping.");
            }

            // could check isWrapper here... but I'm not sure that's necessary
            return oldWrapper.chainable;
        }

        _commonConstructor(type) {
            /** @lends Wrapper# */
            /** @type {Filter} A list of all the every time the `Wrapper` was used */
            this.historyList = new Filter(this);
            /** @type {String} The type of this Wrapper object. Options are "property" or "function". */
            this.type = type;
        }

        _callConstructor(origFn, wrappedFn) {
            /** @lends Wrapper# */
            this._commonConstructor("function");
            this.orig = origFn;
            wrappedFn = wrappedFn || origFn;
            this.wrapped = wrappedFn;
            this.chainable = new Proxy(this, {
                apply: (target, context, argList) => this._doCall(target, context, argList)
            });

            // mirror function name and length
            Object.defineProperty(this, "name", {
                writable: false,
                enumerable: false,
                configurable: true,
                value: wrappedFn.name
            });
            Object.defineProperty(this, "length", {
                writable: false,
                enumerable: false,
                configurable: true,
                value: wrappedFn.length
            });

            this.configDefault();
            this.configReset();
            return this.chainable;
        }

        _doCall(target, context, argList) {
            var funcName = this.wrapped.name || "<<anonymous>>";
            debug(`calling wrapper on "${funcName}"`);

            var op = new Operation(this, {
                context: context,
                argList: argList
            });

            // run pre-call triggers
            this._runTriggerList("pre", op);

            // run the wrapped function
            var ret, exception = null;
            if (this.config.callUnderlying) { // option to turn on / off whether the function gets called
                try {
                    ret = this.wrapped.apply(op.context, op.argList);
                } catch (ex) {
                    exception = ex;
                }
            }

            op.retVal = ret;
            op.exception = exception;

            // run post-call triggers
            this._runTriggerList("post", op);
            debug("final op", op);

            // save call
            op.postCall = op.preCall = true; // in the future evaulate both pre and post calls
            this.historyList.push(op);

            // throw the exception...
            if (op.exception && // if we have an exception
                (!this.config.swallowException || ( // and the exception shouldn't be swallowed
                    this.config.swallowException && !op.exception.candyWrapperExpected // or the exception should be swallowed, but this error wasn't expected
                )))
                throw op.exception;
            // ...or call the callback...
            if (typeof op.callback.fn === "function") {
                let cbFn = op.callback.fn;
                let cbArgs = op.callback.argList || [];
                let cbCtx = op.callback.context || {};
                op.callback.retVal = cbFn.call(cbCtx, ...cbArgs);
            }
            // ...then return the return value.
            return op.retVal;
        }

        _propConstructor(obj, prop, fn) {
            /** @lends Wrapper# */
            this._commonConstructor("property");

            /** @type {Object} The results of `getOwnPropertyDescriptor` on the original property, saved so that it can be restored later. */
            this.origPropDesc = Object.getOwnPropertyDescriptor(obj, prop);
            if (this.origPropDesc === undefined) {
                throw new TypeError(`Wrapper constructor: expected '${prop}' to exist on object`);
            }
            if (this.origPropDesc.configurable === false) {
                throw new Error(`new Wrapper: can't wrap non-configurable property: '${prop}'`);
            }
            /** @type {any} The current value of the property. */
            this.propValue = this.origPropDesc.value;
            /** @type {Function} An optional custom function that will be called when getting or setting the property. */
            this.getterFn = fn || this.origPropDesc.get;
            /** @type {Function} An optional custom function that will be called when getting or setting the property. */
            this.setterFn = fn || this.origPropDesc.set;

            // create a proxy for the setter / getters
            /** @type {Proxy.<Wrapper>} The thing that is returned representing the Wrapped and is intended to be used for chainable Wrapper calls */
            this.chainable = new Proxy(this, {
                apply: (target, context, argList) => {
                    switch (argList.length) {
                        case 0:
                            return this._doSetterGetter("get");
                        case 1:
                            return this._doSetterGetter("set", argList[0]);
                            /* istanbul ignore next */
                        default:
                            throw new Error("Wrong number of args to setter / getter. (How is that even possible?)");
                    }
                }
            });

            // define the new property
            Object.defineProperty(obj, prop, {
                configurable: this.origPropDesc.configurable,
                enumerable: this.origPropDesc.enumerable,
                get: this.chainable,
                set: this.chainable,
            });

            this.configDefault();
            this.configReset();
            return this.chainable;
        }

        _doSetterGetter(type, val) {
            // create a new Operation for this property
            var op = new Operation(this, {
                getOrSet: type,
                retVal: this.propValue,
                setVal: val
            });

            debug(`_doSetterGetter ${op.getOrSet} "${op.setVal}"`);

            // run pre-call trigger
            this._runTriggerList("pre", op);

            // do the set or get
            var exception = null;
            if (op.getOrSet === "get" && this.getterFn) {
                try {
                    op.retVal = this.getterFn(op.getOrSet);
                } catch (ex) {
                    exception = ex;
                }
            } else if (op.getOrSet === "set" && this.setterFn) {
                try {
                    op.retVal = this.setterFn(op.getOrSet, op.setVal);
                } catch (ex) {
                    exception = ex;
                }
            } else if (op.getOrSet === "set") {
                // if no setter / getter function, just used the cached propValue
                op.retVal = op.setVal;
                this.propValue = op.setVal;
            }

            op.exception = exception;

            // run post-call trigger
            this._runTriggerList("post", op);
            debug("final op", op);

            // save this property Operation for future reference
            this.historyList.push(op);

            // always return the value
            debug("settergetter returning", op.retVal);
            if (op.exception && // if we have an exception
                (!this.config.swallowException || ( // and the exception shouldn't be swallowed
                    this.config.swallowException && !op.exception.candyWrapperExpected // or the exception should be swallowed, but this error wasn't expected
                )))
                throw op.exception;
            return op.retVal;
        }

        _runTriggerList(preOrPost, op) {
            if (preOrPost === "pre") {
                op.postCall = !(op.preCall = true); // only evalute pre calls
            } else { // post
                op.postCall = !(op.preCall = false); // only evaluate post calls
            }

            debug(`_runTriggerList ${preOrPost}`, this.triggerList);

            for (let i = 0; i < this.triggerList.length; i++) {
                let trigger = this.triggerList[i];
                trigger._run(op);
            }
        }

        /**
         * Asserts that the current Wrapper is wrapping an property.
         * @param  {String} callerName The name of the calling function, to be included in
         * the error message if the assertion fails.
         * @throws {Error} If current Wrapper is not wrapping an property.
         * @private
         */
        _propOnly(callerName) {
            if (this.type !== "property") {
                throw new Error(`${callerName} is only supported for PROPERTY wrappers`);
            }
        }

        /**
         * Asserts that the current Wrapper is wrapping a function.
         * @param  {String} callerName The name of the calling function, to be included in
         * the error message if the assertion fails.
         * @throws {Error} If current Wrapper is not wrapping a function.
         * @private
         */
        _funcOnly(callerName) {
            if (this.type !== "function") {
                throw new Error(`${callerName} is only supported for FUNCTION wrappers`);
            }
        }

        /**
         * This static method checks whether something is a Wrapper or not, similar to `Array.isArray`.
         * Works on functions, methods, and properties. This constructor has multiple signatures as illustrated
         * in the example below:
         * @example
         *
         * var testFunction = function(){};
         *
         * var testObject {
         *    prop: 1,
         *    meth: function() {}
         * }
         *
         * Wrapper.isWrapper(testFunction); // false
         * testFunction = new Wrapper(testFunction);
         * Wrapper.isWrapper(testFunction); // true
         *
         * Wrapper.isWrapper(testObject, "prop"); // false
         * new Wrapper(testObject, "prop");
         * Wrapper.isWrapper(testObject, "prop"); // true
         *
         * Wrapper.isWrapper(testObject, "meth"); // false
         * new Wrapper(testObject, "meth");
         * Wrapper.isWrapper(testObject, "meth"); // true
         *
         * @return {Boolean} Returns `true` if the arguments are a Wrapper, `false` otherwise.
         */
        static isWrapper(...args) {
            if (args[0] === undefined) return false;

            // called like: isWrapper(fn)
            // checking to see if a function / method is a wrapper
            if (args.length === 1 && typeof args[0] === "function") {
                let w = args[0];
                // console.log ("w", w);
                if (w[wrapperCookieKey] === wrapperCookie) return true;
                return false;
            }

            // called like: isWrapper(obj, method)
            if (args.length === 2 &&
                typeof args[0] === "object" &&
                typeof args[1] === "string") {
                let obj = args[0];
                let key = args[1];

                let desc = Object.getOwnPropertyDescriptor(obj, key);
                if (desc === undefined)
                    return false;

                // property is a function
                if (desc.value && typeof desc.value === "function")
                    return Wrapper.isWrapper(obj[key]);

                if (desc.value && typeof desc.value === "object")
                    return false;

                if (typeof desc.set !== "function" ||
                    typeof desc.get !== "function")
                    return false;
                return (Wrapper.isWrapper(desc.set) && Wrapper.isWrapper(desc.get));
            }

            return false;
        }

        /**
         * If the property `key` of `Object` `obj` is a wrapped property, the `Wrapper` for that property
         * will be returned. Otherwise `null` will be returned. It is safe to use this in all instances, including
         * if the property `key` isn't defined on the `Object`. Note that this will not return a `Wrapper` for a
         * wrapped function / method.
         * @param  {Object} obj The `Object` for the `obj[key]` combination for which a `Wrapper` will attempt to be retrieved.
         * @param  {String} key The `String` for the `obj[key]` combination for which a `Wrapper` will attempt to be retrieved.
         * @return {Wrapper|null}     Returns a `Wrapper` if the property has been wrapped, `null` otherwise.
         * @example
         * var testObj = {
         *     location: "home"
         * };
         * new Wrapper(testObj, "location"); // wrap the property 'testObj.location'
         * var wrapper = Wrapper.getWrapperFromProperty(testObj, "location"); // returns the wrapper created above
         */
        static getWrapperFromProperty(obj, key) {
            if (typeof obj !== "object") {
                throw new TypeError("getWrapperFromProperty; exepcted 'obj' argument to be Object");
            }

            if (typeof key !== "string") {
                throw new TypeError("getWrapperFromProperty: expected 'key' argument to be String");
            }

            var desc = Object.getOwnPropertyDescriptor(obj, key);
            if (desc === undefined)
                return null;

            var wrapper = desc.set;
            if (typeof wrapper !== "function")
                return null;

            if (wrapper[wrapperCookieKey] === wrapperCookie) {
                return wrapper;
            } else {
                return null;
            }
        }

        /**
         * This static method attempts to remove and destroy the Wrapper on the function, method, property or
         * object that is passed to it. If an object has a mix of wrapped and non-wrapped methods and properties
         * this `unwrap` will automatically detect and unwrap just those items which hvae been wrapped.
         * @param  {...any} args See examples for the various signatures for this method.
         * @return {Function|Object|any}       The original function, object, or the value of the property that has now been unwrapped.
         * @example
         * func = Wrapper.unwrap(func); // unwraps this function
         * Wrapper.unwrap(obj, "property"); // unwraps the property or method at obj[property]
         * Wrapper.unwrap(obj); // recursively unwraps all properties and methods on 'obj'
         * @see  {@link Wrapper#configUnwrap}
         */
        static unwrap(...args) {
            // unwrap(obj)
            if (args.length === 1 && typeof args[0] === "object") {
                var obj = args[0];
                walkObject(obj, function(obj, key) {
                    if (Wrapper.isWrapper(obj, key)) Wrapper.unwrap(obj, key);
                });
                return obj;
            }

            // unwrap(func)
            if (args.length === 1 && typeof args[0] === "function") {
                debug("wrapping function:", args[0].name);
                return args[0].configUnwrap();
            }

            // unwrap(obj, method)
            // unwrap(obj, property)
            // unwrap(obj, method, func)
            // unwrap(obj, property, func)
            if (args.length === 2 &&
                typeof args[0] === "object" &&
                typeof args[1] === "string") {
                let obj = args[0];
                let key = args[1];
                if (!Wrapper.isWrapper(obj, key)) {
                    throw new TypeError("Wrapper.unwrap: attempting to unwrap non-wrapper");
                }
                this.origObj = obj;
                this.origProp = key;
                if (typeof obj[key] === "function") {

                    let methodWrapper = obj[key];
                    return methodWrapper.configUnwrap();
                } else {
                    let propWrapper = Wrapper.getWrapperFromProperty(obj, key);
                    return propWrapper.configUnwrap();
                }
            }

            throw new TypeError(`Wrapper.unwrap: unexpected arguments: ${args}`);
        }

        /**
         * Resets the wrapper to the default configuration, undoing the effects of any `config` calls.
         * @public
         */
        configDefault() {
            this.config = {
                expectThrowsOnTrigger: true,
                expectThrows: false,
                callUnderlying: true,
                allowRewrap: true,
                swallowException: false
            };
        }

        /**
         * Resets the wrapper to its default state. Clears out all {@link Operation} records of previous calls,
         * expected behaviors, pass / fail results, etc. This does not reset any configuration options,
         * which {@link configDefault} can be used for.
         * @return {Wrapper} Returns the Wrapper object so that this call can be chained
         */
        configReset() {
            /** @lends Wrapper# */
            /** @type {Array<Trigger>} A list of {@link Trigger}s to be run whenever this Wrapper is called. */
            this.triggerList = [];
            /** @type {Array<String>} List of messages from failed `expect` calls. */
            this.expectErrorList = [];
            /** @type {Boolean} Whether or not all expectations have passed on this wrapper. */
            this.expectPassed = true;
            /**
             * A nonsensical key and value used to identify if this object is a Wrapper
             * @name uniquePlaceToKeepAGuidForCandyWrapper
             * @type {String}
             * @default "193fe616-09d1-4d5c-a5b9-ff6f3e79714c"
             * @memberof  Wrapper
             * @instance
             */
            this[wrapperCookieKey] = wrapperCookie;

            if (this.type === "function") {
                this._configCallReset();
            }

            if (this.type === "property") {
                this._configPropReset();
            }

            return this.chainable;
        }

        _configCallReset() {
            this.historyList.length = 0;
        }

        _configPropReset() {
            this.historyList.length = 0;
        }

        /**
         * Restores the  wrapped property or function to its original value, and destroys this `Wrapper`.
         * @return {Function|Object} The original function or object that was wrapped.
         * @example
         * var w = new Wrapper(obj, "method"); // create a new wrapper
         * w.configUnwrap(); // destroys the wrapper
         */
        configUnwrap() {
            if (this.type === "function") return this._unwrapMethod();
            return this._unwrapProp();
        }

        _unwrapProp() {
            let obj = this.origObj;
            let key = this.origProp;
            let desc = this.origPropDesc;
            let val = this.propValue;

            delete obj[key];

            // unwraps these:
            // new Wrapper(obj, property)
            // new Wrapper(obj, property, func)
            Object.defineProperty(obj, key, {
                configurable: desc.configurable,
                enumerable: desc.enumerable,
                writable: desc.writable,
                value: val,
                // get: desc.get,
                // set: desc.set
            });
            return val;
        }

        _unwrapMethod() {
            // destroy this wrapper so that it isn't mistakenly used in the future
            var orig = this.orig;
            this.wrapped = function() {
                throw new Error("Calling Wrapper after it has been unwrapped");
            };
            this.unwrapped = true;

            if (typeof this.origObj === "object" &&
                typeof this.origProp === "string") {
                // unwraps these:
                // new Wrapper(obj, method)
                // new Wrapper(obj, method, func)
                let obj = this.origObj;
                let key = this.origProp;
                obj[key] = orig;
                return orig;
            } else {
                // unwraps these:
                // new Wrapper()
                // new Wrapper(func)
                return orig;
            }
        }

        /**
         * Determines whether wrapping a `Wrapper` should be allowed. Default is `true`, meaning that any attempt to wrap a
         * function or property that is already wrapped will result in the currently-in-place `Wrapper` being returned (a new
         * `Wrapper` will not be created). By passing `false` to `configAllowRewrap`, any attempt to rewrap a funciton or
         * property will result in an `Error` being thrown.
         * @param  {Boolean} allow If `true` rewrapping will be allowed. If `false` an error will be thrown when attempting to
         * rewrap.
         */
        configAllowRewrap(allow) {
            validateArgsSingleBoolean("configAllowRewrap", allow);
            this.config.allowRewrap = allow;
        }

        /**
         * By default, the wrapped function or properter setter / getter will get called when the `Wrapper` gets called.
         * This configuration option allows disabling calling of the underlying function or property setter / getter.
         * @param  {Boolean} callUnderlying If `true`, future calls to the `Wrapper` will invoke the underlying function or
         * proprty setter / getter. If `false`, future calls to the `Wrapper` will **NOT** invoke the underlying function or
         * proprty setter / getter.
         */
        configCallUnderlying(callUnderlying) {
            validateArgsSingleBoolean("configCallUnderlying", callUnderlying);
            this.config.callUnderlying = callUnderlying;
        }

        /**
         * Configures whether or not {@link Trigger Triggers} will throw an {@link ExpectError} immediately if the expectation
         * fails.
         * @param  {Boolean} doesThrow If `true` the expectation will throw an `ExpectError` immediately if the expecation fails.
         * If `false`, it will save the failure message to be retrieved later with {@link expectReportAllFailures}.
         */
        configExpectThrowsOnTrigger(doesThrow) {
            validateArgsSingleBoolean("configExpectThrowsOnTrigger", doesThrow);
            this.config.expectThrowsOnTrigger = doesThrow;
        }

        /**
         * By default, failed expectations will not throw on {@link Filter Filters}, but they will fail on {@link Trigger Triggers}.
         * `configExpectThrows` can be used to configure a `Wrapper` so that all of its expectations will throw an {@link ExpectError}.
         * @param  {Boolean} doesThrow If `true` all expect functions will throw an {@link ExpectError} immediately upon failure. If
         * `false`, expect functions will maintain their default behavior.
         */
        configExpectThrows(doesThrow) {
            validateArgsSingleBoolean("configExpectThrows", doesThrow);
            this.config.expectThrows = doesThrow;
        }

        /**
         * When a {@link Trigger} expects an exception, it won't stop the exception from being thrown. When the `swallowException`
         * argument to `configSwallowExpectException` is `true`, it will prevent the specific exception that was expected from
         * being thrown. This is useful for testing, where tests may expect an error to be thrown -- which is actually indicates
         * a successful test case. Allowing the error to be thrown would cause the test to fail. Note that this only swallows the
         * specific `Error` that is expected, and all other errors will still be thrown.
         *
         * Note that even if an exception is swallowed, it will still be recorded to the `Wrapper`'s `historyList`.
         * @param  {Boolean} swallowException If set to `true` any expected exceptions won't be thrown; if `false`, the `Error` will
         * be thrown anyway.
         */
        configSwallowExpectException(swallowException) {
            this.config.swallowException = swallowException;
        }

        /**
         * The typical behavior for expectations called against a {@link Filter}, {@link Operation}
         * is that they will return `true` or `false` immediately. This allows them to be used with assertion libraries,
         * such as [Chai](http://chaijs.com/). Alternatively, `expectReportAllFailures` allows you to run all your expectations
         * and then report all the expectations that did not pass.
         *
         * If all your expectations passed, this function will return true. If one or more of your expectations failed
         * this function will aggregate all the failure messages and throw a {@link ExpectError} that includes all the
         * error messages.
         *
         * An example error message might look something like:
         *
         * > ExpectError: 2 expectation(s) failed:<br>
         * > &nbsp;&nbsp;&nbsp;&nbsp;expectReturn: expectation failed for: 10<br>
         * > &nbsp;&nbsp;&nbsp;&nbsp;expectReturn: expectation failed for: 23<br>
         *
         * `expectReportAllFailures` draws upon a list of messages stored in the wrapper at `Wrapper.expectErrorList`. This
         * list will continue to be added to as new expectations fail. `expectReportAllFailures` includes a convenience
         * argument, `clear`, that will clear out the previous expectation messages and status so that
         * a fresh set of expectations can be built up.
         *
         * Note that the default behavior for {@link Trigger}s is to immediately throw an `ExpectError` if the expectation
         * fails. This prevents them from adding expectation failures to the list for future reporting. This behavior may
         * be changed by calling {@link configExpectThrowsOnTrigger}. Likewise, if {@link configExpectThrows} has been set
         * so that expecations always throw, there will be nothing cached for future validation.
         * @param  {Boolean} clear If `truthy`, the list of previous exception results will be cleared out. If absent or
         * `falsey` the results will continue to be added to as new expectations are run.
         * @return {Boolean}       Returns `true` if all expectations have successfully passed.
         * @throws {ExpectError} If any expectations have been evaluated and failed, but not immediately thrown.
         */
        expectReportAllFailures(clear) {
            if (this.expectPassed) return true;
            var message = `${this.expectErrorList.length} expectation(s) failed:\n`;

            // iterates sub errors from ExpectIterator
            function errListToStr(errList, indentNum) {
                var retMsg = "";
                for (let k = 0; k < errList.length; k++) {
                    let subErr = errList[k];
                    retMsg += indent(indentNum) + subErr.message + "\n";
                    retMsg += subErr.diffToStr(indentNum + 1);
                }
                return retMsg;
            }

            // add the detailed failure messages
            for (let i = 0; i < this.expectErrorList.length; i++) {
                let err = this.expectErrorList[i];
                let newMsg = indent(1) + err.message + "\n";

                // add iterator error messages
                newMsg += errListToStr(err.errorList, 2);

                // add diff messages
                newMsg += err.diffToStr(2);

                message = message.concat(newMsg);
            }

            if (clear) {
                this.expectErrorList.length = 0;
                this.expectPassed = true;
            }

            throw new ExpectError(message);
        }

        /**
         * Creates a new {@link Trigger} on the `Wrapper` that always executes.
         * @return {Trigger} The `Trigger` that was created.
         */
        triggerAlways() {
            var t = new Trigger(this, function() {
                return true;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a new {@link Trigger} on the `Wrapper` that executes when the arguments to the wrapper match the arguments to this call.
         * @param  {...any} args  A list of any arguments that, when matched, will cause this `Trigger` to execute.
         * @return {Trigger}      The `Trigger` that was created.
         * @example
         * // create a Wrapper around something
         * var w = new Wrapper(obj, "method");
         *
         * // create a trigger that executes whenever the arguments exactly "beer"
         * w.triggerOnCallArgs("drink", "beer")
         *      .actionReturn("yum!");
         *
         * // call the wrapped method and see what happens...
         * obj.method("drink", "beer") // returns "yum!"
         */
        triggerOnCallArgs(...args) {
            this._funcOnly("triggerOnCallArgs");
            var m = Match.value(args);
            var t = new Trigger(this, function(op) {
                return m.compare(op.argList);
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a new {@link Trigger} on the `Wrapper` that executes when the `this` value of the wrapped function
         * matches the `context` argument.
         * @param  {Object} context An `Object` that, when matched to the `this` value of the function, will cause the `Trigger` to execute.
         * @return {Trigger}        The `Trigger` that was created.
         * @example
         * // create a Wrapper around something
         * var w = new Wrapper(obj, "method");
         *
         * // create a trigger that executes whenever the arguments exactly "beer"
         * w.triggerOnCallContext({location: "home"})
         *      .actionThrowException(new Error("You should be at work right now."));
         *
         * // call the wrapped method and see what happens...
         * obj.method.call({location: "home"}, "hi mom") // throws "You should be at work right now."
         */
        triggerOnCallContext(context) {
            this._funcOnly("triggerOnCallContext");
            validateArgsSingle("triggerOnCallContext", context);
            var m = Match.value(context);
            var t = new Trigger(this, function(op) {
                var ret = m.compare(op.context);
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a new {@link Trigger} on the `Wrapper` that executes the `Nth` time the wrapper is called.
         * @param  {Number} num What call number this `Trigger` should execute on. Counting starts from zero, so the first call is 0, the second is 1, etc.
         * @return {Trigger}     The `Trigger` that was created.
         * @example
         * // create a Wrapper around something
         * var w = new Wrapper(obj, "method");
         *
         * // create a trigger that executes whenever the arguments exactly "beer"
         * w.triggerOnCallNumber(2)
         *      .actionThrowException(new Error("BOOM!"));
         *
         * // call the wrapped method and see what happens...
         * obj.method(); // nothing...
         * obj.method(); // still nothing...
         * obj.method(); // throws "BOOM!"
         */
        triggerOnCallNumber(num) {
            this._funcOnly("triggerOnCallNumber");
            validateArgsSingleNumber("triggerOnCallNumber", num);
            var count = 0;
            var t = new Trigger(this, function(op) {
                var ret = (count === num);
                if (op.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes whenever the exception matching `err` is thrown
         * by the wrapped function / getter / setter.
         * @param  {Error|null} err Any `Error` (or class that inherits from `Error`, such as `TypeError`, `RangeError`, or
         * custom `Error`s). If `err` exactly matches the error thrown then this trigger will execute. Exactly matching
         * an `Error` requires that the `Error.name` and `Error.message` are strictly equal. If `err` is `null`, this `Trigger` will
         * execute when there was no error.
         * @return {Trigger}   The `Trigger` that was created.
         */
        triggerOnException(err) {
            validateArgsSingleExceptionOrNull("triggerOnException", err);
            var m = Match.value(err);
            var t = new Trigger(this, function(op) {
                var ret = m.compare(op.exception);
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes whenever the return value of the wrapped
         * function / getter / setter matches the value specified here.
         * @param  {any} retVal The return value that will cause this `Trigger` to execute. Note that `undefined`
         * is allowable, but should be explicitly passed as `undefined` rather than simply not passing an argument.
         * @return {Trigger}        The `Trigger` that was created.
         */
        triggerOnReturn(retVal) {
            validateArgsSingle("triggerOnReturn", retVal);
            var m = Match.value(retVal);
            var t = new Trigger(this, function(op) {
                var ret = m.compare(op.retVal);
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} that gets executed based on the callback function `cb`.
         * @param  {Trigger~triggerCustomCallback} cb The callback function. See
         * {@link Trigger~triggerCustomCallback triggerCustomCallback} for the description of the expected syntax and behavior
         * of the callback.
         * @return {Trigger}  The `Trigger` that was created
         */
        triggerOnCustom(cb) {
            validateArgsSingleFunction("triggerOnCustom", cb);
            var t = new Trigger(this, cb);
            this.triggerList.push(t);
            return t;
        }

        /**
         * This is the callback that is passed to {@link Wrapper#triggerOnCustom triggerOnCustom}. The most obvious thing to point out
         * is that it returns `true` when the {@link Trigger} should execute, and `false` when the `Trigger`
         * shouldn't execute; however, there are some unexpected behaviors with this callback that should
         * be observed.
         *
         * First, every `Trigger` callback **is _called twice_ for every time the `Wrapper` is executed**.
         * The callback is called once just before the `Wrapper` executes the wrapped function / setter / getter
         * providing the callback with the opportunity to evaluate arguments and context before they are used. The
         * callback is called again just after the wrapped function / setter / getter is called, giving the
         * callback the opportunity to evaluate return values and exceptions.
         *
         * The first argument to the callback is `curr`, which is a `Operation`. `curr` has the property `preCall`
         * set to `true` if the callback is being called before the function / getter / setter; and has the
         * property `postCall` that is set to `true` if the callback is being called after the function /
         * getter / setter. `curr` also has the property `curr.wrapper`, which references the {@link Wrapper}.
         *
         * Also note that throwing an exception in a custom trigger is not advised since it may adversely effect
         * the behavior of the `Wrapper` and the running of any subsequent `Triggers`. If you want the wrapper to
         * throw an exception, set `single.exception` to a `new Error()`; however, this is best done through an
         * {@link actionThrowException} anyway.
         * @callback Trigger~triggerCustomCallback
         * @param {Operation} curr The current function call or property set / get.
         * @returns {Boolean} Returns `true` if the actions and expectations associated with the `Trigger`
         * should run. Returns `false` if this `Trigger` should not be executed.
         */

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes whenever a property is set. Only valid for
         * `Wrappers` around a property.
         * @return {Trigger} The `Trigger` that was created.
         * @example
         * var myObj = {
         *     name: "Bob"
         * }
         *
         * new Wrapper(myObj, "name");
         * myObj.name.triggerOnSet()
         *     .actionThrowException(new Error("BOOM!"));
         *
         * var ret = myObj.name; // doesn't throw
         * myObj.name = "Mary"; // throws "BOOM!"
         */
        triggerOnSet() {
            this._propOnly("triggerOnSet");
            var t = new Trigger(this, function(single) {
                if (single.getOrSet === "set") return true;
                return false;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes when a property is set to the value
         * corresponding to `setVal`
         * @param  {any} setVal When a property is set to this value, the `Trigger` will execute.
         * @return {Trigger} The `Trigger` that was created.
         */
        triggerOnSetVal(setVal) {
            this._propOnly("triggerOnSetVal");
            validateArgsSingle("triggerOnSetVal", setVal);
            var m = Match.value(setVal);
            var t = new Trigger(this, function(single) {
                return m.compare(single.setVal);
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes the `Nth` time that the property is
         * assigned to, where `Nth` corresponds to `num`
         * @param  {Number} num The `Nth` assignment that will cause this `Trigger` to execute. Note that
         * `0` would be the first assignment, `1` the second, etc.
         * @return {Trigger} The `Trigger` that was created.
         */
        triggerOnSetNumber(num) {
            this._propOnly("triggerOnSetNumber");
            validateArgsSingleNumber("triggerOnSetNumber", num);

            var count = 0;
            var t = new Trigger(this, function(single) {
                if (single.getOrSet !== "set") return false;
                var ret = (count === num);
                if (single.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes when the value of the property is retrieved.
         * @return {Trigger} The `Trigger` that was created.
         * @example
         * var myObj = {
         *     name: "Bob"
         * }
         *
         * new Wrapper(myObj, "name");
         * myObj.name.triggerOnGet()
         *     .actionThrowException(new Error("BOOM!"));
         *
         * myObj.name = "Mary"; // doesn't throw
         * var ret = myObj.name; // throws "BOOM!"
         */
        triggerOnGet() {
            this._propOnly("triggerOnGet");
            var t = new Trigger(this, function(single) {
                if (single.getOrSet === "get") return true;
                return false;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that executes the `Nth` time that the property value
         * is retrieved.
         * @param  {number} num The `Nth` get that will cause this `Trigger` to execute. Note that
         * `0` would be the first assignment, `1` the second, etc.
         * @return {Trigger} The `Trigger` that was created.
         * @example
         * var myObj = {
         *     name: "Bob"
         * }
         *
         * new Wrapper(myObj, "name");
         * myObj.name.triggerOnGetNumber(2)
         *     .actionThrowException(new Error("BOOM!"));
         *
         * var ret;
         * ret = myObj.name; // doesn't throw
         * ret = myObj.name; // doesn't throw
         * ret = myObj.name; // throws "BOOM!"
         */
        triggerOnGetNumber(num) {
            this._propOnly("triggerOnGetNumber");
            validateArgsSingleNumber("triggerOnGetNumber", num);

            var count = 0;
            var t = new Trigger(this, function(single) {
                if (single.getOrSet !== "get") return false;
                var ret = (count === num);
                if (single.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        /**
         * Creates a {@link Trigger} on the `Wrapper` that execuates the `Nth` time that the property is set
         * OR get.
         * @param  {Number} num The `Nth` get that will cause this `Trigger` to execute. Note that
         * `0` would be the first assignment, `1` the second, etc.
         * @return {Trigger} The `Trigger` that was created.
         * @example
         * var myObj = {
         *     name: "Bob"
         * }
         *
         * new Wrapper(myObj, "name");
         * myObj.name.triggerOnTouchNumber(2)
         *     .actionThrowException(new Error("BOOM!"));
         *
         * var ret;
         * ret = myObj.name; // doesn't throw
         * myObj.name = "Mary"; // doesn't throw
         * ret = myObj.name; // throws "BOOM!"
         */
        triggerOnTouchNumber(num) {
            this._propOnly("triggerOnTouchNumber");
            validateArgsSingleNumber("triggerOnTouchNumber", num);

            var count = 0;
            var t = new Trigger(this, function(single) {
                var ret = (count === num);
                if (single.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }
    }

    /**
     * A class that contains all the `expect` calls that gets mixed in to `Triggers` as well as
     * `Operation`. This class really isn't intended to be used on its own.
     * @private
     */
    class Expect {
        constructor() {
            /**
             * Evaluates whether the `call` or `get` returned the value `retVal`.
             * @name expectReturn
             * @function
             * @instance
             * @memberof Expect
             * @param  {any} retVal       The value that is expected to be returned from the function call or property getter.
             * @return {Trigger|Boolean}  When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link Operation}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             */
            alias(this, "expectReturn",
                this._expect, "expectReturn", "both", "post", validateArgsSingle,
                function(single, retVal) {
                    var m = Match.value(retVal);
                    if (m.compare(single.retVal)) {
                        return null;
                    }

                    var err = new ExpectError("expectReturn: expectation failed for: " + retVal);
                    err.diff = m.lastDiff;
                    return err;
                });

            /**
             * Evaluates whether the arguments to a function match the `...args`.
             * @name expectCallArgs
             * @function
             * @instance
             * @memberof Expect
             * @param  {...any} args The list of arguments to validate for the function call.
             * @return {Trigger|Boolean}           When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link Operation}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             */
            alias(this, "expectCallArgs",
                this._expect, "expectCallArgs", "function", "pre", validateArgsAny,
                function(single, ...args) {
                    var m = Match.value(args);
                    if (m.compare(single.argList)) {
                        return null;
                    }
                    var err = new ExpectError("expectCallArgs: expectation failed for: " + args);
                    err.diff = m.lastDiff;
                    return err;
                });

            /**
             * Evaluates whether the context (`this`) of a function call matches the `context` parameter.
             * @name expectCallContext
             * @function
             * @instance
             * @memberof Expect
             * @param {Object} context The expected `this` for the function. Is compared by a strict deep-equals.
             * @return {Trigger|Boolean}           When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link Operation}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             */
            alias(this, "expectCallContext",
                this._expect, "expectCallContext", "function", "pre", validateArgsSingle,
                function(single, context) {
                    var m = Match.value(context);
                    if (m.compare(single.context)) {
                        return null;
                    }
                    var err = new ExpectError("expectCallContext: expectation failed for: " + context);
                    err.diff = m.lastDiff;
                    return err;
                });

            /**
             * Expects that the function call or property set / get threw an `Error` that strictly matches the `exception` arguemnt.
             * @name expectException
             * @function
             * @instance
             * @memberof Expect
             * @param {Error|null} exception The `Error` (or class that inherits from `Error`) that is expected to strictly match. A strict
             * comparison between errors evaluates that the `Error.name` and `Error.message` are the exact same. If `exception` is `null`, it
             * will expecct that there was no `Error` thrown.
             * @return {Trigger|Boolean}           When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link Operation}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             */
            alias(this, "expectException",
                this._expect, "expectException", "both", "post", validateArgsSingleExceptionOrNull,
                function(single, exception) {
                    var m = Match.value(exception);

                    // expectation passed
                    if (m.compare(single.exception)) {
                        // hide a value on the error so that _doCall knows that we expected this error
                        if (single.exception) {
                            Object.defineProperty(single.exception, "candyWrapperExpected", {
                                value: true,
                                writable: true,
                                configurable: true,
                                enumerable: false
                            });
                        }
                        return null;
                    }

                    // expectation failed
                    var err = new ExpectError("expectException: expectation failed for: " + exception);
                    err.diff = m.lastDiff;
                    return err;
                });

            /**
             * Evaluates the value that is set on a property during assignment (e.g. - `obj.prop = setVal`) and expects the value to
             * strictly equal the `setVal` argument.
             * @name expectSetVal
             * @function
             * @instance
             * @memberof Expect
             * @param {any} setVal The value that is expected to be set on the property. An `undefined` value is allowed, but the value `undefined` must be passed explicitly to `expectSetVal`.
             * @return {Trigger|Boolean}           When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link Operation}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             */
            alias(this, "expectSetVal",
                this._expect, "expectSetVal", "property", "post", validateArgsSingle,
                function(single, setVal) {
                    var m = Match.value(setVal);
                    if (m.compare(single.setVal)) {
                        return null;
                    }
                    var err = new ExpectError("expectSetVal: expectation failed for: " + setVal);
                    err.diff = m.lastDiff;
                    return err;
                });

            // returns string or null
            /**
             * Evaluates the callback function
             * @name expectCustom
             * @function
             * @instance
             * @memberof Expect
             * @param {Operation~customExpectCallback} cb Callback function that will determine whether the expecation passes or fails. See {@link Operation~customExpectCallback customExpectCallback} for more details.
             * @return {Trigger|Boolean}           When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link Operation}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             */
            alias(this, "expectCustom",
                this._expect, "expectCustom", "both", "post", validateArgsFirstFunction,
                function(single, cb, ...args) {
                    return cb.call(this, single, ...args);
                });

            /**
             * This is a description of the callback used by {@link expectCustom}.
             * @callback Operation~customExpectCallback
             * @param {Operation} curr The current function call or property / set get.
             * @return {null|ExpectError} `null` if expectation was successful. Returns {@link ExpectError} containing the message for the failed expectation otherwise.
             */
        }

        _addDeferredAction(name, argList) {
            var action = {
                name: name,
                argList: argList
            };
            debug("adding action:", action);
            this.actionList.push(action);
        }

        _getCurrCallOrDefer(name, ...args) {
            if (this instanceof Operation) return this;
            if (this instanceof ExpectIterator) return this.current;
            if (this instanceof Trigger && this.currentCall) return this.currentCall;
            return this._addDeferredAction(name, args);
        }

        static _softAssert(ctx, err) {
            // let the iterator handle the errors
            if (ctx instanceof ExpectIterator && ctx.current) return err;

            // overall pass fail
            var passed = (err === null) ? true : false;

            // decide what to do with the error -- throw or store
            if (!passed) {
                // see if the config says we should throw
                if ((ctx instanceof Trigger && ctx.wrapper.config.expectThrowsOnTrigger) ||
                    ctx.wrapper.config.expectThrows) {
                    err.message += "\n" + err.diffToStr();
                    throw err;
                }

                // store the exception for future reference
                ctx.wrapper.expectErrorList.push(err);
            }

            ctx.wrapper.expectPassed = ctx.wrapper.expectPassed && passed;
            return passed;
        }

        _expect(name, type, timing, validateFn, fn, ...args) {
            if (typeof name !== "string") {
                throw new TypeError("_expect: expected 'name' argument");
            }

            if (type === "property") this.wrapper._propOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            if (typeof timing !== "string") {
                throw new TypeError("_expect: expected 'timing' argument");
            }

            if (typeof validateFn !== "function") {
                throw new TypeError("_expect: expected 'validateFn' argument");
            }

            if (typeof fn !== "function") {
                throw new TypeError(`_expect: expected function argument`);
            }

            validateFn(name, ...args);

            // get the current call, or save the args for when the call is actually run
            var curr = this._getCurrCallOrDefer(name, ...args);
            // if there isn't a current call, return 'this' to enable chaining
            if (!curr) return this; // chainable
            // check if this is the right time to run
            var runNow = (timing === "both") ||
                (curr.postCall && timing === "post") ||
                (curr.preCall && timing === "pre");
            if (!runNow) return this;
            // test the expect
            var msg = fn.call(this, curr, ...args);
            // form the result into an error
            var err;
            if (typeof msg === "string") {
                err = new ExpectError(msg);
            } else {
                err = msg;
            }
            var passed = Expect._softAssert(this, err);

            return passed;
        }
    }

    /**
     * An Error thrown by a failed {@link Expect} call. A different error name so that it
     * can be distinguished from other types of errors, plus lists of errors and diffs for
     * more intelligent diagnostic information of what went wrong.
     * @extends {Error}
     */
    class ExpectError extends Error {
        constructor(message) {
            super(message);
            this.name = "ExpectError";
            this.errorList = []; // for ExpectIterator
            this.diff = null;
        }

        diffToStr(indentNum = 1) {
            if (!this.diff) return "";

            var diffList = this.diff.toStringArray();
            var retMsg = "";
            for (let i = 0; i < diffList.length; i++) {
                retMsg += indent(indentNum) + diffList[i] + "\n";
            }
            return retMsg;
        }
    }

    /**
     * This class is used to apply an expect method to a `Filter` array. It is used for functions
     * such as {@link Filter#expectAll}, {@link Filter#expectSome}, and {@link Filter#expectNone}.
     * @private
     * @extends {Expect}
     */
    class ExpectIterator extends Expect {
        constructor(wrapper, iterType, filter) {
            super();

            this.wrapper = wrapper;
            this.iterType = iterType;
            this.filter = filter;
            this.current = null;
        }

        _expect(...args) {
            var results = [];

            // iterate through all the ops in the filter...
            for (let i = 0; i < this.filter.length; i++) {
                this.current = this.filter[i];
                // ...whatever `expect` was called, call it on each op
                let ret = super._expect(...args);
                results.push(ret);
            }
            this.current = null;

            // now that we have our results, evaluate them
            switch (this.iterType) {
                case "all":
                    return this._expectAll(results);
                case "some":
                    return this._expectSome(results);
                case "none":
                    return this._expectNone(results);
            }
        }

        _expectAll(results) {
            var passed = true;
            var errList = [];

            // check to make sure all the resutls passed
            for (let i = 0; i < results.length; i++) {
                // any results failed, add a failure message to the list
                if (results[i] !== null) {
                    errList.push(results[i]);
                    passed = false;
                }
            }

            // create an error, if necessary
            var err = null;
            if (!passed) {
                err = new ExpectError(`expectAll: all expectations should have passed, but ${errList.length} failed`);
                err.errorList = errList;
            }

            // run the soft assertion
            var ret = Expect._softAssert(this, err);
            return ret;
        }

        _expectSome(results) {
            var passed = false;
            var errList = [];

            // check to make sure at least one the resutls passed
            for (let i = 0; i < results.length; i++) {
                // any results failed, add a failure message to the list
                if (results[i] === null) {
                    passed = true;
                }
            }

            // create an error, if necessary
            var err = null;
            if (!passed) {
                err = new ExpectError(`expectSome: at least one expectation should have passed, but none did`);
                err.errorList = errList;
            }

            // run the soft assertion
            var ret = Expect._softAssert(this, err);
            return ret;
        }

        _expectNone(results) {
            var passed = true;
            var passList = [];

            // check to make sure all the resutls passed
            for (let i = 0; i < results.length; i++) {
                // any results failed, add a failure message to the list
                if (results[i] === null) {
                    passed = false;
                    passList.push(i);
                }
            }

            // create an error, if necessary
            var err = null;
            if (!passed) {
                err = new ExpectError(`expectNone: no expectations should have passed, but ${passList.length} passed`);
            }

            // run the soft assertion
            var ret = Expect._softAssert(this, err);
            return ret;
        }
    }

    /**
     * The {@link Wrapper#historyList} on a {@link Wrapper} contains all the information about the
     * previous operations perfomed by a wrapper. Being able to easily assess this information is
     * one of the important features of candy-wrapper, and so the `historyList` is a `Filter` that
     * allows for easily selecting the parts of the operation history that you are interested in.
     *
     * Filters have two parts: first, the ability to select the operation records you care about using
     * the `filter` calls; and second, the ability to perform `expect` operations on one or more of
     * the operations in the `Filter`.
     *
     * The ability to filter the `historyList` using the `filter` functions is essentially just
     * syntactic sugar on top of the `Array.map()` and `Array.filter()` classes. The methods such
     * as `filterByCallArgs` and `filterByException` simply select the elements of the `Filter`
     * that match the desired attributes. The `get` methods on the `Filter`, such as `getAllCallArgs`
     * or `getAllExceptions` are just doing a map to create an `Array` of the features you care about.
     *
     * There are two different ways of performing `expect` calls on `Filters`. The first is to filter
     * down to a single {@link Operation}, and perform expectations on that operation. This can be
     * done using `filter` methods that return a single `Operation`, such as
     * {@link Filter#filterFirst filterFirst}, {@link Filter#filterLast filterLast} or
     * {@link Filter#filterByNumber filterByNumber}. The other way to perform expect calls on a `Filter`
     * is by performing an expect on the whole list at once, such as using
     * {@link Filter#expectCount expectCount}.
     *
     * Note that many of the `Filter` operations are chainable and combinable to make unique and
     * powerful combinations out of the `Filter` methods.
     * @extends {Array}
     */
    class Filter extends Array {
        constructor(wrapper, ...args) {
            super(...args);
            if (!(wrapper instanceof Wrapper)) {
                throw new TypeError("Filter constructor: expected first argument to be of type Wrapper");
            }
            this.wrapper = wrapper;

            /**
             * Returns the members of the `Filter` that were occurances of when the property was set. Only
             * works for properties.
             * @name filterPropSet
             * @function
             * @memberof Filter
             * @instance
             * @returns {Filter} Returns a `Filter` containing just the {@link Operation} records where a property was set.
             */
            alias(this, "filterPropSet",
                this._filter, "filterSet", "property",
                function(element) {
                    if (element.getOrSet === "set") return true;
                });

            /**
             * Returns the members of the `Filter` that were occurances of when the property was retrieved
             * (i.e. `get`). Only works for properties.
             * @name filterPropGet
             * @function
             * @memberof Filter
             * @instance
             * @returns {Filter} Returns a `Filter` containing just the {@link Operation} records when the property was gotten.
             */
            alias(this, "filterPropGet",
                this._filter, "filterGet", "property",
                function(element) {
                    if (element.getOrSet === "get") return true;
                });

            /**
             * Returns the members of the `Filter` that were occurances of when the property was set to `setVal`
             * @name filterPropSetByVal
             * @function
             * @memberof Filter
             * @instance
             * @param {any} setVal If `setVal` strictly matches the value of a `Operation` where the property was set, the record
             * will be included in the results.
             * @returns {Filter} Returns a `Filter` containing just the {@link Operation} records that are of type `set` and have a
             * matching `setVal`.
             */
            alias(this, "filterPropSetByVal",
                this._filter, "filterPropSetByVal", "property",
                function(element, index, array, ...args) {
                    validateArgsSingle("filterPropSetByVal", ...args);
                    var setVal = args[0];

                    var m = Match.value(setVal);
                    return m.compare(element.setVal);
                });

            /**
             * Returns the members of the `Filter` that were function calls with arguments matching `...args`.
             * @name filterByCallArgs
             * @function
             * @memberof Filter
             * @instance
             * @param {...any} args The function arguments that will be matched
             * @returns {Filter} A `Filter` continaing the function calls where the function was called with
             * arguments that match `...args`.
             * @example
             * new Wrapper(obj, someMethod); // create a new wrapper
             *
             * // do some function calls
             * obj.someMethod("drink", "beer");
             * obj.someMethod("store", "wine");
             * obj.someMethod("drink", "beer");
             * obj.someMethod("store", "beer");
             * obj.someMethod("martini");
             *
             * // returns a Filter with the two calls above that match `args[0] === "drink"` and `args[1] === "beer"`
             * obj.someMethod.historyList.filterByCallArgs("drink", "beer");
             */
            alias(this, "filterByCallArgs",
                this._filter, "filterByCallArgs", "function",
                function(element, index, array, ...args) {
                    var m = Match.value([...args]);
                    return m.compare(element.argList);
                });

            /**
             * Returns the members of the `Filter` that were function calls with a `this` context that matches the `context` argument.
             * @name filterByCallContext
             * @function
             * @memberof Filter
             * @instance
             * @param {Object} context The context that the `this` value of the function will be evaluated against.
             * @returns {Filter} A `Filter` containing the function calls where the `this` strictly and deeply matched `context`.
             */
            alias(this, "filterByCallContext",
                this._filter, "filterByCallContext", "function",
                function(element, index, array, ...args) {
                    validateArgsSingle("filterByCallContext", ...args);
                    var context = args[0];

                    var m = Match.value(context);
                    return m.compare(element.context);
                });

            /**
             * Returns the members of the `Filter` that threw exceptions that exactly matched `exception`.
             * @name filterByException
             * @function
             * @memberof Filter
             * @instance
             * @param {Error|null} exception An `Error` (or any class that inherits from `Error`) that will be
             * strictly matched. If `exception` is `null` the filter will include all {@link Operation} records that did not throw
             * an `Error`.
             * @returns {Filter} A `Filter` containing the function calls or property set / get that threw an
             * `Error` that matches `exception`.
             */
            alias(this, "filterByException",
                this._filter, "filterByException", "both",
                function(element, index, array, ...args) {
                    validateArgsSingleExceptionOrNull("filterByException", ...args);
                    var exception = args[0];

                    var m = Match.value(exception);
                    return m.compare(element.exception);
                });

            /**
             * Returns the members of the `Filter` that are function calls or property set / get where their
             * return value matches `retVal`.
             * @name filterByReturn
             * @function
             * @memberof Filter
             * @instance
             * @param {any} retVal The value that will be matched against. May be `undefined`, but the value `undefined`
             * must be explicitly passed to `filterByReturn`.
             * @returns {Filter} A `Filter` containing the function calls or property set / get that returned a
             * value stictly matching `retVal`.
             */
            alias(this, "filterByReturn",
                this._filter, "filterByReturn", "both",
                function(element, index, array, ...args) {
                    var retVal = args[0];

                    var m = Match.value(retVal);
                    return m.compare(element.retVal);
                });

            /**
             * Gets the first {@link Operation} from the filter. Is the same as
             * `{@link Filter#filterByNumber filterByNumber}(0)`.
             * @name filterFirst
             * @function
             * @memberof Filter
             * @instance
             * @returns {Operation} The first operation record in the `Filter`
             * @see {@link Filter#filterByNumber filterByNumber}
             * {@link Filter#filterSecond filterSecond}
             * {@link Filter#filterThird filterThird}
             * {@link Filter#filterFourth filterFourth}
             * {@link Filter#filterFifth filterFifth}
             */
            alias(this, "filterFirst", this.filterByNumber, 0);

            /**
             * Gets the second {@link Operation} from the filter. Is the same as
             * `{@link Filter#filterByNumber filterByNumber}(1)`.
             * @name filterSecond
             * @function
             * @memberof Filter
             * @instance
             * @returns {Operation} The second operation record in the `Filter`
             * @see {@link Filter#filterByNumber filterByNumber}
             * {@link Filter#filterFirst filterFirst}
             * {@link Filter#filterThird filterThird}
             * {@link Filter#filterFourth filterFourth}
             * {@link Filter#filterFifth filterFifth}
             */
            alias(this, "filterSecond", this.filterByNumber, 1);

            /**
             * Gets the third {@link Operation} from the filter. Is the same as
             * `{@link Filter#filterByNumber filterByNumber}(2)`.
             * @name filterThird
             * @function
             * @memberof Filter
             * @instance
             * @returns {Operation} The third operation record in the `Filter`
             * @see {@link Filter#filterByNumber filterByNumber}
             * {@link Filter#filterFirst filterFirst}
             * {@link Filter#filterSecond filterSecond}
             * {@link Filter#filterFourth filterFourth}
             * {@link Filter#filterFifth filterFifth}
             */
            alias(this, "filterThird", this.filterByNumber, 2);

            /**
             * Gets the fourth {@link Operation} from the filter. Is the same as
             * `{@link Filter#filterByNumber filterByNumber}(3)`.
             * @name filterFourth
             * @function
             * @memberof Filter
             * @instance
             * @returns {Operation} The fourth operation record in the `Filter`
             * @see {@link Filter#filterByNumber filterByNumber}
             * {@link Filter#filterFirst filterFirst}
             * {@link Filter#filterSecond filterSecond}
             * {@link Filter#filterThird filterThird}
             * {@link Filter#filterFifth filterFifth}
             */
            alias(this, "filterFourth", this.filterByNumber, 3);

            /**
             * Gets the fifth {@link Operation} from the filter. Is the same as
             * `{@link Filter#filterByNumber filterByNumber}(4)`.
             * @name filterFifth
             * @function
             * @memberof Filter
             * @instance
             * @returns {Operation} The fifth operation record in the `Filter`
             * @see {@link Filter#filterByNumber filterByNumber}
             * {@link Filter#filterFirst filterFirst}
             * {@link Filter#filterSecond filterSecond}
             * {@link Filter#filterThird filterThird}
             * {@link Filter#filterFourth filterFourth}
             */

            /**
             * Returns an `Array` of all the arguments passed to the functions in the `Filter`
             * @name getAllCallArgs
             * @function
             * @memberof Filter
             * @instance
             * @returns {Array} An `Array` of argument lists, where each argument list is
             * an `Array` of the arguments that were passed to that call. If a function was called
             * without arguments the array will empty (length of 0).
             * @example
             * new Wrapper(obj, someMethod); // create a new wrapper
             *
             * // do some function calls
             * obj.someMethod("drink", "beer");
             * obj.someMethod("store", "wine");
             * obj.someMethod("martini");
             * obj.someMethod();
             *
             * var list = obj.someMethod.historyList.getAllCallArgs();
             * // list is: [["drink", "beer"], ["store", "wine"], ["martini"], [undefined]]
             */
            alias(this, "getAllCallArgs",
                this._get, "getAllCallArgs", "function", "argList");

            /**
             * Returns an `Array` of all the call contexts (`this` values) that the functions in the `Filter` were called with
             * @name getAllCallContexts
             * @function
             * @memberof Filter
             * @instance
             * @returns {Array} An `Array` of call contexts / `this` values
             */
            alias(this, "getAllCallContexts",
                this._get, "getAllCallContexts", "function", "context");

            /**
             * Returns an `Array` of all the exceptions (e.g. `throw Error()`) that the functions in the `Filter` threw.
             * @name getAllExceptions
             * @function
             * @memberof Filter
             * @instance
             * @returns {Array} An `Array` of exceptions. If no exception was thrown, the value at that position in the array will be `null`.
             */
            alias(this, "getAllExceptions",
                this._get, "getAllExceptions", "both", "exception");

            /**
             * Returns an `Array` of all the returnValues from function calls or property set / get.
             * @name getAllReturns
             * @function
             * @memberof Filter
             * @instance
             * @returns {Array} An `Array` of all return values. If a function call didn't return a value, the value at
             * that location in the array will be `undefined`.
             */
            alias(this, "getAllReturns",
                this._get, "getAllReturns", "both", "retVal");

            /**
             * Returns an `Array` of all the values a property was set to.
             * @name getAllSetVals
             * @function
             * @memberof Filter
             * @instance
             * @returns {Array} An `Array` of the values the property was set to.
             */
            alias(this, "getAllSetVals",
                this._get, "getAllSetVals", "property", "setVal");

            alias(this, "filterFifth", this.filterByNumber, 4);
        }

        _filter(name, type, fn, ...args) {
            if (type === "property") this.wrapper._propOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            // NOTE: `Array.filter()` creates a `new Array()`... which doesn't call
            // `new Filter()` with the right args. Rewriting `Array.filter()` is the only
            // solution...
            var newFilter = new Filter(this.wrapper);
            for (let i = 0; i < this.length; i++) {
                if (fn(this[i], i, this, ...args)) {
                    newFilter.push(this[i]);
                }
            }
            return newFilter;
        }

        _get(name, type, property) {
            if (type === "property") this.wrapper._propOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            // NOTE: `Array.map()` creates a `new Array()`... which doesn't call
            // `new Filter()` with the right args. Rewriting `Array.map()` is the only
            // solution...
            var newFilter = new Filter(this.wrapper);
            for (let i = 0; i < this.length; i++) {
                newFilter.push(this[i][property]);
            }
            return newFilter;
        }

        /**
         * Similar to {@link Filter#filterFirst filterFirst}, this returns the first member of
         * the `Filter`; however, it also asserts that it is the ONLY member of the filter and will
         * throw `TypeError` if there is more than one member in the `Filter`.
         * @returns {Operation} Returns the first member of the `Filter`.
         * @throws {TypeError} If there is more than one member in the `Filter`.
         */
        filterOnly() {
            if (this.length !== 1) {
                throw new TypeError("filterOnly: expected exactly one value");
            }

            return this[0];
        }

        /**
         * Returns the `Operation` at the position `num` in the `Filter`
         * @param {Number} num A number indicating the index of the {@link Operation} record to be returned. These are "programming numbers"
         * not "counting numbers", so if `num` is zero it returns the first `Operation` record, one for the second record, etc.
         * @returns {Operation} The operation record at position `num` in the filter. Same as `historyList[num]` or
         * `historyList[num]` but with some light error checking.
         * @throws {RangeError} If `num` is less than zero or larger than the size of the `Filter`; or if the `Filter` is empty.
         */
        filterByNumber(num) {
            validateArgsSingleNumber("filterByNumber", num);

            if (this.length === 0) {
                throw new RangeError("filterByNumber: empty list");
            }

            if (num < 0 || num >= this.length) {
                throw new RangeError("filterByNumber: 'num' out of bounds");
            }

            return this[num];
        }

        /**
         * Similar to {@link Filter#filterFirst filterFirst}, but returns the last {@link Operation} record in the `Filter`.
         * @returns {Operation} Returns the last operation record in the `Filter`
         */
        filterLast() {
            if (this.length === 0) {
                throw new RangeError("filterlast: empty list");
            }

            return this[this.length - 1];
        }

        /**
         * Expects that `Filter` has `count` members.
         * @param  {Number} num  How many members are expected to be in the `Filter`
         * @return {Boolean}      Returns `true` if `Filter` has `count` {@link Operation} records, `false` otherwise
         */
        expectCount(num) {
            validateArgsSingleNumber("expectCount", num);

            var err = null;
            var passed = (this.length === num);
            if (!passed) err = new ExpectError(`expectCount: expected exactly ${num}`);

            return Expect._softAssert(this, err);
        }

        /**
         * Expects that `Filter` has `count` members.
         * @param  {Number} min   How the miniumum number of members expected to be in the `Filter`
         * @param  {Number} max   The maximum number of members expected to be in the `Filter`
         * @return {Boolean}      Returns `true` if `Filter` has `count` {@link Operation} records, `false` otherwise
         */
        expectCountRange(min, max) {
            if (typeof min !== "number") {
                throw new TypeError("expectCountRange: expected 'min' to be of type Number");
            }

            if (typeof max !== "number") {
                throw new TypeError("expectCountRange: expected 'max' to be of type Number");
            }

            var err = null;
            var passed = ((this.length >= min) && (this.length <= max));
            if (!passed) err = new ExpectError(`expectCountRange: expected no more than ${min} and fewer than ${max}`);

            return Expect._softAssert(this, err);
        }

        /**
         * Expects that `Filter` has at least `min` members.
         * @param  {Number} min   How least number of members that are expected to be in the `Filter`
         * @return {Boolean}      Returns `true` if `arr` has at least `count` {@link Operation} records, `false` otherwise
         */
        expectCountMin(min) {
            validateArgsSingleNumber("expectCountMin", min);

            var err = null;
            var passed = (this.length >= min);
            if (!passed) err = new ExpectError(`expectCountMin: expected no more than ${min}`);

            return Expect._softAssert(this, err);
        }

        /**
         * Expects that `Filter` has at most `max` members.
         * @param  {Number} max   The maximum number of members that are expected to be in the `Filter`
         * @return {Boolean}      Returns `true` if `Filter` has less than `count` members, `false` otherwise
         */
        expectCountMax(max) {
            validateArgsSingleNumber("expectCountMax", max);

            var err = null;
            var passed = (this.length <= max);
            if (!passed) err = new ExpectError(`expectCountMax: expected no more than ${max}`);

            return Expect._softAssert(this, err);
        }

        /**
         * Expects that all {@link Operation} records in the `Filter` pass the `expect` function
         * that is chained off this method.
         * @return {ExpectIterator} Returns an {@link ExpectIterator} that applies the next `expect`
         * call to all the operation records in this `Filter`. If no `expect` call is performed,
         * this method effectively does nothing.
         * @example
         * new Wrapper(obj, "method");
         *
         * // call the method twice with the argument "good"
         * obj.method("good");
         * obj.method("good");
         *
         * // expect that all method calls had the argument "good"
         * obj.method.historyList.expectAll().expectCallArgs("good"); // true
         * obj.method.expectReportAllFailure(); // no failures, doesn't throw
         *
         * // call the method one more time with the argument "bad"
         * obj.method("bad");
         *
         * // expect that all method calls had the argument "good"
         * obj.method.historyList.expectAll().expectCallArgs("good"); // false
         * obj.method.expectReportAllFailure(); // throws an error
         */
        expectAll() {
            return new ExpectIterator(this.wrapper, "all", this);
        }

        /**
         * Similar to {@link Filter#expectAll expectAll}, but the `expect` function is only expected
         * to pass at least once.
         * @return {ExpectIterator} Returns an {@link ExpectIterator} that applies the next `expect`
         * call to all the operation records in this `Filter`. If no `expect` call is performed,
         * this method effectively does nothing.
         * @example
         * new Wrapper(obj, "method");
         *
         * // call the method twice with the argument "bad"
         * obj.method("bad");
         * obj.method("bad");
         *
         * // expect that some method calls had the argument "good"
         * obj.method.historyList.exepctSome().expectCallArgs("good"); // false
         * obj.method.expectReportAllFailure(true); // throws
         *
         * // call the method one more time with the argument "good"
         * obj.method("good");
         *
         * // expect that all method calls had the argument "good"
         * obj.method.historyList.exepctSome().expectCallArgs("good"); // true
         * obj.method.expectReportAllFailure(); // no failures, doesn't throw
         */
        expectSome() {
            return new ExpectIterator(this.wrapper, "some", this);
        }

        /**
         * Similar to {@link Filter#expectAll expectAll}, but the `expect` function is expected to never
         * be successful.
         * @return {ExpectIterator} Returns an {@link ExpectIterator} that applies the next `expect`
         * call to all the operation records in this `Filter`. If no `expect` call is performed,
         * this method effectively does nothing.
         * @example
         * new Wrapper(obj, "method");
         *
         * // call the method twice with the argument "good"
         * obj.method("good");
         * obj.method("good");
         *
         * // expect that none of the method calls had the argument "bad"
         * obj.method.historyList.expectNever().expectCallArgs("bad"); // true
         * obj.method.expectReportAllFailure(); // no failures, doesn't throw
         *
         * // call the method one more time with the argument "bad"
         * obj.method("bad");
         *
         * // expect that none of the method calls had the argument "bad"
         * obj.method.historyList.expectNever().expectCallArgs("bad"); // false
         * obj.method.expectReportAllFailure(); // throws an error
         */
        expectNone() {
            return new ExpectIterator(this.wrapper, "none", this);
        }
    }

    /**
     * This class represents a single function call, property get, or property set. It can represent any of those
     * things in the current tense ("this is the operation that is currently running") or in the past tense ("the
     * historyList is full of operations that have already run"). {@link Trigger Triggers} use `Operations` in
     * the present tense, and have the opportunity to modify the `Operation` as it is happening. {@link Filter Filters}
     * operate on the `historyList` of the {@link Wrapper}, which is the history of all the times a function has been
     * called or a property has been set / get.
     *
     * `Operations` may either represent an action taken on function or a property, as represented by the `Operator.type`
     * property. If a `Operator.type` is "property", the `Operator.getOrSet` property will further distinguish whether
     * this operation was a `get` operation (that is, getting the value from the property) or `set` operation (that is,
     * assigning a value to the property).
     *
     * `Operations` extend the `Expect` class, which enables expect methods to be run against the `Operator`. Again
     * these expectations can be run in real-time during a `Trigger`, or after-the-fact from the `historyList`.
     * @borrows Expect#expectCallArgs as expectCallArgs
     * @borrows Expect#expectCallContext as expectCallContext
     * @borrows Expect#expectCustom as expectCustom
     * @borrows Expect#expectException as expectException
     * @borrows Expect#expectReturn as expectReturn
     * @borrows Expect#expectSetVal as expectSetVal
     */
    class Operation extends Expect {
        constructor(wrapper, desc) {
            /** @lends Operation# */
            super();

            if (!Wrapper.isWrapper(wrapper)) {
                throw new TypeError("Operation constructor: expected 'wrapper' argument to be of type Wrapper");
            }

            if (typeof desc !== "object") {
                throw new TypeError("Operation constructor: expected desc to be of type Object");
            }

            // common properties
            /** @type {Wrapper} The {@link Wrapper} that created this call */
            this.wrapper = wrapper;
            /** @type {String} The type of operation record this is, either "function" or "property" */
            this.type = wrapper.type;
            /** @type {Boolean} Set by a {@link Trigger} to be `true` if the operation record is currently in it's "pre-call" phase -- that is before the call to the wrapped thing has actually happened. */
            this.preCall = false;
            /** @type {Boolean} Set by a {@link Trigger} to be `true` if the operation record is in it's "post-call" phase. */
            this.postCall = false;
            /** @type {any} The value that was or will be returned. */
            this.retVal = desc.retVal;
            /** @type {Error|null} The `Error` that was or will be thrown. If null, there was no `Error`. */
            this.exception = desc.exception || null;

            if (this.type === "function") {
                return this._functionConstructor(desc);
            }

            /* istanbul ignore else */
            if (this.type === "property") {
                return this._propertyConstructor(desc);
            }

            // NOTE: not reached
        }

        _functionConstructor(desc) {
            /** @lends Operation# */
            /** @type {any} The `this` value that was or will be used for the function call. Only applies to functions. */
            this.context = desc.context;
            /** @type {...any} The arguments that were or will be passed to the function call. Only applies to functions. */
            this.argList = desc.argList;

            killAlias("function", this, "getOrSet");
            killAlias("function", this, "setVal");

            this.callback = {};

            return this;
        }

        _propertyConstructor(desc) {
            /** @lends Operation# */
            /** @type {String} Whether this was a property "set" (assignment) or a property "get" (retreiving the value). Only applies to properties. */
            this.getOrSet = desc.getOrSet;
            /** @type {any} The value that was or will be used for a property "set". Only applies to properties. */
            this.setVal = desc.setVal;

            killAlias("property", this, "context");
            killAlias("property", this, "argList");

            return this;
        }
    }

    /**
     * A `Trigger` determines what `expect` or `action` calls get run on a wrapped
     * function or property. Triggers usally get created by calling a trigger function
     * on the {@link Wrapper}. Note that triggers are always run in the order that they
     * are added to a `Wrapper`, and any expectations or actions on a trigger are run
     * in the order they were added to the `Trigger`.
     *
     * TODO:
     *     * same expect calls as Operation
     *     * created on the wrapper
     *     * not very interesting by themselves
     *     * customTrigger
     *     * customAction
     *
     * @borrows Expect#expectCallArgs as expectCallArgs
     * @borrows Expect#expectCallContext as expectCallContext
     * @borrows Expect#expectCustom as expectCustom
     * @borrows Expect#expectException as expectException
     * @borrows Expect#expectReturn as expectReturn
     * @borrows Expect#expectSetVal as expectSetVal
     * @example
     * var wrapper = new Wrapper(something);
     * wrapper.triggerAlways()          // every time the wrapper is called...
     *     .expectArgs("abc", 123)      // ...throws error if the wrong args are not `"abc"` and `123`...
     *     .actionReturn(true);         // ...and always change the return value of the function to `true`
     */
    class Trigger extends Expect {
        constructor(wrapper, triggerFn) {
            super();

            if (!(wrapper instanceof Wrapper)) {
                throw new TypeError("Trigger constructor: expected first argument to be of type Wrapper");
            }

            if (typeof triggerFn !== "function") {
                throw new TypeError("Trigger constructor: expected second argument to be of type Function");
            }

            this.wrapper = wrapper;
            this.triggerFn = triggerFn;
            this.currentCall = null;
            this.actionList = [];

            /**
             * When triggered, this action will change the return value of a function call or property get to the value specified by `retVal`.
             * @name actionReturn
             * @function
             * @instance
             * @memberof Trigger
             * @param  {any} retVal  The value that will be returned by the function or property when this action is triggered.
             * @return {Trigger}     Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionReturn",
                this._action, "actionReturn", "both", "post", validateArgsSingle,
                function(curr, retVal) {
                    curr.retVal = retVal;
                });

            /**
             * Specifies a custom action that will be run when triggered.
             * @name  actionCustom
             * @function
             * @instance
             * @memberof Trigger
             * @param  {Trigger~customActionCallback}    fn  The function to be run when this action is triggered.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCustom",
                this._action, "actionCustom", "both", "both", validateArgsFirstFunction,
                function(curr, fn, ...args) {
                    return fn.call(this, curr, ...args);
                });
            /**
             * This is the callback for {@link actionCustom}. Note that actions get called every time a {@link Trigger}
             * executes, which will usually be twice for everytime a `Wrapper` is called -- once before the call, to
             * modify arguments and context, and once after the call to modify exceptions and return values. Use the
             * `current.preCall` and `current.postCall` properties to determine which half of the `Wrapper` call is
             * occuring.
             * @callback Trigger~customActionCallback
             * @param {Operation} current The currently executing function or property set / get.
             */

            /**
             * When triggered this action will set the return value to the value of the argumennt list specified by the
             * index `num`
             * @name actionReturnFromArg
             * @function
             * @instance
             * @memberof Trigger
             * @param {Number} num The index of the argument list to return when the wrapper is called. As an index, this
             * `0` represents the first value, `1` the second, etc.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             * @example
             * var anon = new Wrapper();
             *
             * w.triggerAlways().actionReturnFromArg(2);
             *
             * var ret = anon("I", "like", "sleeping");
             * console.log (ret); // "sleeping"
             */
            alias(this, "actionReturnFromArg",
                this._action, "actionReturnFromArg", "function", "post", validateArgsSingleNumber,
                function(curr, num) {
                    curr.retVal = curr.argList[num];
                });

            /**
             * When triggered, this action sets the return value to the `this` value of the function.
             * @name actionReturnContext
             * @function
             * @instance
             * @memberof Trigger
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionReturnContext",
                this._action, "actionReturnContext", "function", "post", validateArgsNone,
                function(curr) {
                    curr.retVal = curr.context;
                });

            /**
             * When triggered, this action sets the return value to a property on the `this` value that is specified by
             * the `prop` value.
             * @name actionReturnFromContext
             * @function
             * @instance
             * @memberof Trigger
             * @param {String} prop The property on the `this` context that should be returned when the `Wrapper` is called.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionReturnFromContext",
                this._action, "actionReturnFromContext", "function", "post", validateArgsSingleString,
                function(curr, prop) {
                    curr.retVal = curr.context[prop];
                });

            /**
             * When triggered, this action throws the error specified by the `err` argument.
             * @name actionThrowException
             * @function
             * @instance
             * @memberof Trigger
             * @param {Error|null} err   An instance of `Error`, or some class inheriting from `Error`, that will be thrown
             * when this action is triggered. If `null` is used instead of an `Error` then nothing will be thrown and it
             * has the effect of clearing any errors that would have been thrown.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionThrowException",
                this._action, "actionThrowException", "both", "post", validateArgsSingleExceptionOrNull,
                function(curr, err) {
                    curr.exception = err;
                });

            /**
             * When triggered, this action behaves as if assigning the value `setVal` to the property.
             * @name actionSetVal
             * @function
             * @instance
             * @memberof Trigger
             * @param {any} setVal The value to be assigned to the property. May be `undefined`, but requires `undefined` to
             * be explicitly passed as an argument to the function.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionSetVal",
                this._action, "actionSetVal", "property", "pre", validateArgsSingle,
                function(curr, setVal) {
                    // curr.getOrSet = "set";
                    curr.setVal = setVal;
                });

            /**
             * When triggered, this action causes the `Wrapper` to return a resolved (that is, successful) `Promise`. If a
             * `retVal` argument is provided, it will be the value that the `Promise` resolves to. If no `retVal` is provided,
             * then whatever value the `Wrapper` would have returned is wrapped in a promise.
             * @name actionReturnResolvedPromise
             * @function
             * @instance
             * @memberof Trigger
             * @param {any} [retVal] The optional return value to wrap. If this is not specified, the value that is returned
             * by the `Wrapper` will be used.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionReturnResolvedPromise",
                this._action, "actionReturnResolvedPromise", "both", "post", validateArgsNoneOrOne,
                function(curr, retVal) {
                    retVal = retVal || curr.retVal;
                    curr.retVal = Promise.resolve(retVal);
                });

            /**
             * Similar to {@link Trigger#actionReturnPromise actionReturnPromise}, this action causes the `Wrapper` to return a
             * `Promise`, but in this case the `Promise` is one that has been rejected (that is, failed).
             * @name actionReturnRejectedPromise
             * @function
             * @instance
             * @memberof Trigger
             * @param {Error|null} err An instance of `Error`, or inheriting from `Error`, that will be the error the `Promise`
             * resolves to. This will appear as the error argument that is passed to the `.catch()` call on the `Promise`.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionReturnRejectedPromise",
                this._action, "actionReturnRejectedPromise", "both", "post", validateArgsNoneOrOneException,
                function(curr, err) {
                    err = err || curr.exception;
                    curr.exception = null;
                    curr.retVal = Promise.reject(err);
                });

            /**
             * When triggered, sets the call args to the function to the arguments specified by args
             * @name actionCallArgs
             * @function
             * @instance
             * @memberof Trigger
             * @param {...any} args The arguments to be passed to the wrapped function
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCallArgs",
                this._action, "actionCallArgs", "function", "pre", validateArgsAny,
                function(curr, ...args) {
                    curr.argList = args;
                });

            /**
             * When triggered, sets the context (`this` value) of the function to the object specified by `ctx`
             * @name actionCallContext
             * @function
             * @instance
             * @memberof Trigger
             * @param {ctx} args The context to be passed to the wrapped function
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCallContext",
                this._action, "actionCallContext", "function", "pre", validateArgsSingle,
                function(curr, ctx) {
                    curr.context = ctx;
                });

            /**
             * When triggered, this action will callback the function specified by `fn`. It may be combined with
             * {@link Trigger#actionCallbackContext actionCallbackContext} and {@link Trigger#actionCallbackArgs actionCallbackArgs}
             * to specify the `this` context and arguments to pass to the callback.
             * @name actionCallbackFunction
             * @function
             * @instance
             * @memberof Trigger
             * @param {Function} fn The function to be called as a callback. This function is called after the completion of all `Triggers`.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCallbackFunction",
                this._action, "actionCallbackFunction", "function", "post", validateArgsSingleFunction,
                function(curr, fn) {
                    curr.callback.fn = fn;
                });

            /**
             * Similar to {@link Trigger#actionCallbackFunction actionCallbackFunction}, but treats one the arguments specified by the
             * index `num` as the callback function. It will throw an `Error` if the argument at `num` is not a function. It may be combined with
             * {@link Trigger#actionCallbackContext actionCallbackContext} and {@link Trigger#actionCallbackArgs actionCallbackArgs}
             * to specify the `this` context and arguments to pass to the callback.
             * @name actionCallbackToArg
             * @function
             * @instance
             * @memberof Trigger
             * @param {Number} num The index into the array of arguments, where the resulting argument will be treated as a callback function.
             * This function is called after the completion of all `Triggers`.
             * @throws {Error} If the argument at `num` is not a function.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCallbackToArg",
                this._action, "actionCallbackToArg", "function", "post", validateArgsSingleNumber,
                function(curr, num) {
                    var cb = curr.argList[num];
                    if (typeof cb !== "function") {
                        curr.exception = new Error(`actionCallbackToArg: expected argument ${num} to be callback function`);
                        return;
                    }
                    curr.callback.fn = cb;
                });

            /**
             * When triggered, this action sets the `this` context of the callback function. If no callback function is
             * specified, this action has no meaningful impact.
             * @name actionCallbackContext
             * @function
             * @instance
             * @memberof Trigger
             * @param {any} context The `this` context to use when calling the callback function.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCallbackContext",
                this._action, "actionCallbackContext", "function", "post", validateArgsSingle,
                function(curr, context) {
                    curr.callback.context = context;
                });

            /**
             * When triggered, this action sets the arguments of the callback function. If no callback function is
             * specified, this action has no meaningful impact.
             * @name actionCallbackArgs
             * @function
             * @instance
             * @memberof Trigger
             * @param {...any} args The arguments to pass to the callback function.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCallbackArgs",
                this._action, "actionCallbackArgs", "function", "post", validateArgsAny,
                function(curr, ...args) {
                    curr.callback.argList = args;
                });
        }

        _run(op) {
            // check trigger to see if it should run
            if (!this.triggerFn(op)) return;

            // perform actions
            this.currentCall = op;
            for (let i = 0; i < this.actionList.length; i++) {
                let action = this.actionList[i];
                this[action.name](...action.argList);
            }
            this.currentCall = null;
        }

        _action(name, type, timing, validateFn, fn, ...args) {
            if (typeof name !== "string") {
                throw new TypeError("_action: expected 'name' argument");
            }

            if (type === "property") this.wrapper._propOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            if (typeof timing !== "string") {
                throw new TypeError("_action: expected 'timing' argument");
            }

            if (typeof validateFn !== "function") {
                throw new TypeError("_action: expected 'validateFn' argument");
            }

            if (typeof fn !== "function") {
                throw new TypeError(`_action: expected function argument`);
            }

            validateFn(name, ...args);

            // get the current call, or save the args for when the call is actually run
            var curr = this._getCurrCallOrDefer(name, ...args);
            // if there isn't a current call, return 'this' to enable chaining
            if (!curr) return this; // chainable
            // check if this is the right time to run
            var runNow = (timing === "both") ||
                (curr.postCall && timing === "post") ||
                (curr.preCall && timing === "pre");
            if (!runNow) return this;
            // call the callback
            fn.call(this, curr, ...args);

            return this;
        }
    }

    /***************************************************
     * helper functions for validating arguments
     ****************************************************/
    function validateArgsSingleExceptionOrNull(name, ...args) {
        if (args.length === 1 && (args[0] instanceof Error)) return;
        if (args.length === 1 && (args[0] === null)) return;

        throw new TypeError(`${name}: expected a single argument of type Error`);
    }

    function validateArgsSingleBoolean(name, ...args) {
        if (args.length !== 1 ||
            typeof args[0] !== "boolean") {
            throw new TypeError(`${name}: expected a single argument of type Boolean`);
        }
    }

    function validateArgsSingleFunction(name, ...args) {
        if (args.length !== 1 ||
            typeof args[0] !== "function") {
            throw new TypeError(`${name}: expected a single argument of type Function`);
        }
    }

    function validateArgsFirstFunction(name, ...args) {
        if (typeof args[0] !== "function") {
            throw new TypeError(`${name}: expected the first argument to be of type Function`);
        }
    }

    function validateArgsSingleNumber(name, ...args) {
        if (args.length !== 1 ||
            typeof args[0] !== "number") {
            throw new TypeError(`${name}: expected a single argument of type Number`);
        }
    }

    function validateArgsSingleString(name, ...args) {
        if (args.length !== 1 ||
            typeof args[0] !== "string") {
            throw new TypeError(`${name}: expected a single argument of type String`);
        }
    }

    function validateArgsSingle(name, ...args) {
        if (args.length !== 1) {
            throw new TypeError(`${name}: expected a single argument of any type`);
        }
    }

    function validateArgsNone(name, ...args) {
        if (args.length !== 0) {
            throw new TypeError(`${name}: didn't expect any args`);
        }
    }

    function validateArgsNoneOrOne(name, ...args) {
        if (args.length < 0 ||
            args.length > 1) {
            throw new TypeError(`${name}: expected exactly one or two args`);
        }
    }

    function validateArgsNoneOrOneException(name, ...args) {
        if (args.length === 0) return;
        if (args.length === 1 && args[0] instanceof Error) return;

        throw new TypeError(`${name}: expected first argument to be of type Error, or no arguments`);
    }

    function validateArgsAny() {}

    var sandboxSingleton;
    /**
     * A Sandbox is a container for all your wrappers. It gives you a convenient way to track
     * them, and unwrap everything when you are done with your wrappers. This is convenient for
     * test suites, which may be wrapping and unwrapping the same objects on a regular basis.
     *
     * Sandbox also has a singleton -- a single instance of a Sandbox that can be used across
     * multiple contexts.
     *
     * ``` js
     * // create a new sandbox
     * sb = new Sandbox();
     *
     * // create a new wrapper in the sandbox
     * var wrapper = sb.newWrapper(obj, method);
     *
     * // destroy the sandbox, which unwraps the object
     * sb.destroy();
     *
     * // also works with tests
     * it("does a test", Sandbox.test(function() {
     *     var wrapper = this.sandbox.newWrapper(obj, method);
     * }))
     *
     * // the singleton is a convenient way of accessing your sandbox anywhere
     * function init() {
     *     var sb = Sandbox.singletonStart();
     *     sb.newWrapper(obj, method);
     * }
     *
     * // get the same sandbox as the one in init
     * var sb = Sandbox.singletonGetCurrent();
     * sb.newWrapper(obj, method);
     *
     * // unwrap all the wrappers created on the singleton
     * Sandbox.singletonEnd();
     * ```
     */
    class Sandbox {
        constructor() {
            this.wrapperList = new Set();
            this.config = {
                injectProperty: "sandbox"
            };
        }

        /**
         * Creates a Sandbox singleton. Future calls to `Sandbox.singletonGetCurrent` will retrieve the
         * singletone. Makes it easy to work with the same `Sandbox` across multiple contexts.
         * @return {Sandbox} The Sandbox singleton, a single global singleton.
         * @throws {Erro} If the Sandbox Singleton has already been created.
         */
        static singletonStart() {
            if (typeof sandboxSingleton === "object") {
                throw new Error("Sandbox.singletonStart: already started");
            }
            sandboxSingleton = new Sandbox();
            return sandboxSingleton;
        }

        static singletonGetCurrent() {
            if (typeof sandboxSingleton !== "object") {
                throw new Error("Sandbox.singletonGetCurrent: not started yet");
            }

            return sandboxSingleton;
        }

        static singletonEnd() {
            if (typeof sandboxSingleton !== "object") {
                throw new Error("Sandbox.singletonEnd: not started yet");
            }

            sandboxSingleton.destroy();
            sandboxSingleton = undefined;
        }

        /**
         * Creates a testing context, is designed to be passed to something like (Mocha's)[https://mochajs.org/]
         * `it()` functions. The `this` context of the callback function will have a `.sandbox` value
         * that will be a `Sandbox` for creating new wrappers. Any wrappers created with `this.sandbox.newWrapper()`
         * will be automatically unwrapped when the test ends.
         * @param  {Function} fn The callback function that will be executed.
         * @example
         * it("does a test", Sandbox.test(function() {
         *     this.sandbox.newWrapper(...);
         * }))
         * // all wrappers are unwrapped when the sandbox exists
         */
        static test(fn) {
            return function(...args) {
                var sb = new Sandbox();
                this.sandbox = sb;

                var ret = fn.call(this, ...args);

                sb.destroy();

                return ret;
            };
        }

        /**
         * This is the same as {@link Sandbox#test test}, but expects a done callback.
         * @param  {Function} fn The callback function that will be executed.
         * @example
         * it("does a test", Sandbox.test(function(done) {
         *     this.sandbox.newWrapper(...);
         *     done();
         * }))
         * // all wrappers are unwrapped when the sandbox exists
         */
        static testAsync(fn) {
            return function(done, ...args) {
                var sb = new Sandbox();
                this.sandbox = sb;

                fn.call(this, done, ...args);

                sb.destroy();
            };
        }

        /**
         * The same as `new Wrapper()` for creating a {@link Wrapper}, but the `Wrapper`
         * will be contained in the Sandbox, guaranteeing that it will be unwrapped when
         * the Sandbox is done. See {@link Wrapper} for details on this function.
         */
        newWrapper(...args) {
            var w = new Wrapper(...args);

            if (args.length === 1 &&
                typeof args[0] === "object") {
                // if wrapped everything in an object, find everything and add it to our list
                walkObject(args[0], (obj, key) => {
                    if (Wrapper.isWrapper(obj, key)) {
                        this.wrapperList.add(obj[key]);
                    }
                });
            } else {
                // add single wrapper (single function, property, method) to list
                this.wrapperList.add(w);
            }

            return w;
        }

        /**
         * Destroys a Sandbox, unwrapping all the wrappers that belong to it.
         */
        destroy() {
            for (let w of this.wrapperList) {
                w.configUnwrap();
            }
            this.wrapperList.length = 0;
        }
    }


    var matcherRegistrySingleton;
    /**
     * A class for matching anything. Really, anything.
     *
     * Most {@link Trigger Triggers}, {@link Filter Filters} and expects use `Match` internally to match
     * values, and passing a new `Match` to them will use the `Match` that you specify.
     *
     * Matching has two major flavors: matching by "value", where two things are strictly compared to
     * see if they are they exact same; and matching by "type", where something is compared to a class
     * of things to see if it belongs to that class.
     *
     * Examples of comparison by value are `3 === 3`, or `{a: 1} === {a: 1}`. You'll note that the latter
     * doesn't really work with strict equals, so comparisons need to be a bit more sophisticated. To that
     * end, objects and arrays are recursively compared for a strict match using `Match.value`. To help out with this are a
     * number of registered types that can spot the differences between things. Looking at the `Match.addType`
     * and `Match.getType` static methods, these help to register handlers for specific data types. Most
     * data types are already registered, but feel free to add your own (or create a library of types and
     * share with friends!). These registered types create {@link Diff Diffs} that represent the one-or-more
     * differences between two items.
     *
     * Examples of comparison by type are `3 === "string"` or `{a: 1} === "object"`. You can use `Match.type`
     * to compare something to it's type, again using the built-in types or the types of your own choosing.
     *
     * A `Match` object contains an original value or type and is ready to compare to anything passed to it
     * using the `compare()` method. This makes matches easy to pass around, such as passing them as arguments
     * to functions that do comparison.
     * @example
     * var matchVal = Match.value("bob");
     * matchVal.compare("bob"); // true
     * matchVal.compare("sally"); // false
     * matchVal.compare(undefined); // false
     *
     * matchVal = Match.value(undefined);
     * matchVal.compare(undefined); // true
     *
     * var matchType = Match.type("number");
     * matchType.compare(3); // true
     * matchType.compare(42); // true
     * matchType.compare("test"); // false
     * matchType.compare("3"); // false
     *
     * console.log (Match.getType("foo").name); // "string"
     * console.log (Match.getType(12).name); // "number"
     * console.log (Match.getType(true).name); // "boolean"
     * console.log (Match.getType(null).name); // "null"
     * console.log (Match.getType(new Error()).name); // "error"
     * console.log (Match.getType(new Date()).name); // "date"
     * console.log (Match.getType([1, 2, 3]).name); // "array"
     * console.log (Match.getType({a: 1}).name); // "object"
     */
    class Match {
        constructor(opts) {
            opts = opts || {};
            // if !opts throw
            if (opts.hasOwnProperty("value")) {
                // if the value is a Match, just use that instead
                if (opts.value instanceof Match) {
                    return opts.value;
                }

                this.value = opts.value;
                this.matchType = "value";
            } else if (opts.hasOwnProperty("type")) {
                if (typeof opts.type !== "string") {
                    throw new TypeError("Match constructor: expected type name to be of type String");
                }

                // make sure the type exists in the registry
                var reg = Match.getMatcherTypeRegistry();
                if (!reg.matcherList.has(opts.type)) {
                    throw new TypeError(`Match constructor: type '${opts.type}' hasn't be registered`);
                }

                this.typeStr = opts.type;
                this.matchType = "type";
                // } else if (opts.custom) {
                //     this.custom = opts.custom;
            } else {
                throw new TypeError("Match: requires a value or type to match");
            }

        }

        /**
         * Compares a new value to the previously defined value.
         * @param  {any} value The value to be compared against the original value when the `Match` was created.
         * @return {Boolean}     Returns `true` if `value` matches the original value; `false` otherwise
         */
        compare(value) {
            // matching by explicit value
            if (this.matchType === "value") {
                var d = Match.diff(this.value, value);
                this.lastDiff = d;
                if (d.length === 0) return true;
            }

            // matching by type
            if (this.matchType === "type") {
                var type = Match.getType(value);

                // match any parent types of the value
                // for example, an "Error" is an "Object"; however, an "Object" is not an "Error"
                while (type.parent && type.name !== this.typeStr) type = type.parent;

                return (this.typeStr === type.name);
            }

            // TODO: if allowUndefined -- filter undefined

            return false;
        }

        /**
         * Returns the "type registry" singleton which contains a list and hierarchy of all
         * the different registered types.
         * @return {Object} The matcherRegistrySingleton
         * @private
         */
        static getMatcherTypeRegistry() {
            if (typeof matcherRegistrySingleton === "object")
                return matcherRegistrySingleton;

            matcherRegistrySingleton = {};
            matcherRegistrySingleton.matcherList = new Map();
            matcherRegistrySingleton.matcherHierarchy = [];
            Match.addType("number", null, testNumber, diffNumber);
            Match.addType("object", null, testObject, diffObject);
            Match.addType("string", null, testString, diffString);
            Match.addType("null", null, testNull, diffNull);
            Match.addType("boolean", null, testBoolean, diffBoolean);
            Match.addType("undefined", null, testUndef, diffUndef);
            Match.addType("array", "object", testArray, diffArray);
            Match.addType("date", "object", testDate, diffDate);
            Match.addType("regexp", "object", testRegex, diffRegex);
            Match.addType("error", "object", testError, diffError);

            return matcherRegistrySingleton;
        }

        /**
         * A convenience class that creates a new Match and sets the value to be matched to `arg`.
         * @param  {arg} arg The argument to be matched
         * @return {Match}     The new `Match` instance
         * @example
         * var m = Match.value("foo"); // create new `Match` with value set to "foo"
         * m.compare("foo"); // true
         */
        static value(arg) {
            return new Match({
                value: arg
            });
        }

        /**
         * A convenience class that creates a new Match and sets the type to be matched to `arg`.
         * @param  {arg} arg The type to be matched. Built-in types include: "object", "array", "string",
         * "number", "boolean", "number", "null", "undefined", "date", "regexp", and "error".
         * @return {Match}     The new `Match` instance
         * @example
         * var m = Match.type("boolean"); // create new `Match` with value set to "foo"
         * m.compare(false); // true
         * m.compare("test"); // false
         */
        static type(arg) {
            return new Match({
                type: arg
            });
        }

        /**
         * Creates a deep diff between two values. If the arguments are `Objects` or `Arrays`, they are
         * recurisvely iterated and compared.
         * @param  {any} value1 The first value to diff.
         * @param  {any} value2 The second value to diff.
         * @return {Array}    An `Array` of differences between `value1` and `value2`
         * @example
         *  (
         *     {a: 1, b: 2, c: 3},
         *     {a: 1, c: 4}
         *     );
         * // returns:
         * // [{key: ".b", src: 2, dst: undefined},
         * //  {key: ".c", src: 3, dst: 4}]
         */
        static diff(value1, value2) {
            // if the first value is a Match create a type-based diff
            if (value1 instanceof Match) {
                let matched = value1.compare(value2);
                let diff = new Diff("type-match");
                if (!matched && value1.matchType === "type") {
                    diff.addDiff(value1, value2);
                }
                return diff;
            }

            // console.log ("value2 match?", value2 instanceof Match);
            var matcher = Match.findCommonType(value1, value2);
            debug("diff: matcher:", matcher);
            if (!matcher) {
                debug("common type not found, returning diff");
                // throw new TypeError("diff: can't compare uncommon values");
                return new Diff("type-mismatch").addDiff(value1, value2);
            }
            return matcher.diff(value1, value2);
        }

        /**
         * Returns the most specific 'matcher' that can identify the type
         * @param  {any} value          The value to get the type for
         * @param  {Map} [matcherList=matcherRegistrySingleton] The matcher list to retrieve the type from. Mosty used for recursion.
         * @return {Object}             The previously registered 'matcher' Object
         * @example
         * var matcher = Match.getType("foo");
         * console.log (matcher.name); // "string"
         *
         * matcher = Match.getType(true);
         * console.log (matcher.name); // "boolean"
         *
         * matcher = Match.getType(null);
         * console.log (matcher.name); // "null"
         *
         * matcher = Match.getType(undefined);
         * console.log (matcher.name); // "undefined"
         */
        static getType(value, matcherList) {
            if (!matcherList) {
                let m = Match.getMatcherTypeRegistry();
                matcherList = m.matcherHierarchy;
            }

            // check for the type in the provided list
            for (let i = 0; i < matcherList.length; i++) {
                let matcher = matcherList[i];
                if (matcher.test(value)) {
                    debug("matcher found:", matcher.name);
                    // recursively check any children for the type
                    let nextType = Match.getType(value, matcher.children);
                    debug("next type:", nextType);
                    return (nextType ? nextType : matcher);
                } else {
                    debug("didn't match:", matcher.name);
                }
            }

            return null;
        }

        /**
         * Adds a new type to the type registry
         * @param {String} name       The name of the type
         * @param {String|null} parentName The parent of this type. For example, the parent
         * of `Array` or `Error` is `Object`, since both `Array` and `Error` are objects. Care
         * must be used in selecting the right parent, or else `getType` may fail and so will
         * everything else. Use `null` if no parent type exists; however, all conceivable
         * parent types have already been registered by default.
         * @param {Function} testFn     A function that when passed a value, will return `true`
         * if it is of this type and `false` otherwise.
         * @param {Function} diffFn     A function that when passed two values of this type can
         * tell the difference between them and return a proper diff `Array`.
         * @example
         * function testRegex(rex) {
         *     if (rex instanceof RegExp) return true;
         *     return false;
         * }
         *
         * function diffRegex(rex1, rex2) {
         *     if (rex1.toString() !== rex2.toString()) return newDiff(rex1.toString(), rex2.toString());
         *     return [];
         * }
         *
         * Match.addType("regexp", "object", testRegex, diffRegex);
         */
        static addType(name, parentName, testFn, diffFn) {
            if (typeof name !== "string") {
                throw new TypeError(`Match.addType: 'name' should be string`);
            }

            if (matcherRegistrySingleton.matcherList.has(name)) {
                throw new TypeError(`Match.addType: '${name}' already exists`);
            }

            var parentMatcher = matcherRegistrySingleton.matcherList.get(parentName);
            parentMatcher = parentMatcher || null;

            var matcher = {
                name: name,
                test: testFn,
                diff: diffFn,
                parent: parentMatcher,
                children: []
            };

            matcherRegistrySingleton.matcherList.set(name, matcher);
            if (!parentMatcher) {
                matcherRegistrySingleton.matcherHierarchy.push(matcher);
            } else {
                parentMatcher.children.push(matcher);
            }
        }

        /**
         * Finds a common type between two matchers or values
         * @param  {any} matcher1 A matcher or any value that can be converted to a matcher using {@link Match.getType}
         * @param  {any} matcher2 A matcher or any value that can be converted to a matcher using {@link Match.getType}
         * @return {Object|null}  The matcher that is common to the type of both `matcher1` and `matcher2`
         * or `null` if no common type can be found.
         * @example
         * var matcher = Match.findCommonType({}, new Error());
         * console.log (matcher.name); // "object"
         * var matcher = Match.findCommonType({}, "foo");
         * console.log (matcher.name); // null
         * @private
         */
        static findCommonType(matcher1, matcher2) {
            // convert values to matchers
            if (!Match.isMatcher(matcher1)) {
                debug("findCommonType: converting matcher1 value to matcher:", matcher1);
                matcher1 = Match.getType(matcher1);
                debug("matcher1:", matcher1);
            }
            if (!Match.isMatcher(matcher2)) {
                debug("findCommonType: converting matcher2 value to matcher:", matcher2);
                matcher2 = Match.getType(matcher2);
                debug("matcher2:", matcher2);
            }

            var m1types = [];
            var m2types = [];

            // make a list of the names of all the parents
            var p = matcher1;
            while (p) {
                m1types.unshift(p.name);
                p = p.parent;
            }

            p = matcher2;
            while (p) {
                m2types.unshift(p.name);
                p = p.parent;
            }
            debug("m1types", m1types);
            debug("m2types", m2types);

            // find the furthest most common type
            var commonType = null;
            for (let i = 0; i < m1types.length; i++) {
                if (m1types[i] === m2types[i]) {
                    commonType = m1types[i];
                } else {
                    break;
                }
            }
            debug("commonType:", commonType);

            // resolve common type name to matcher object
            if (commonType) {
                let m = Match.getMatcherTypeRegistry();
                commonType = m.matcherList.get(commonType);
            }

            return commonType;
        }

        /**
         * Checks whether an `Object` is a valid matcher
         * @param  {Object}  matcher The object to check and see if it's a matcher.
         * @return {Boolean}         `true` if the `Object` is a matcher; `false` otherwise
         * @private
         */
        static isMatcher(matcher) {
            debug("isMatcher:", matcher);
            return (typeof matcher === "object" &&
                matcher !== null &&
                typeof matcher.name === "string" &&
                typeof matcher.test === "function" &&
                typeof matcher.diff === "function" &&
                Array.isArray(matcher.children) &&
                (
                    matcher.parent === null ||
                    Match.isMatcher(matcher.parent)
                ));
        }
    }

    /**
     * A class for storing diff results and subsequently turning them in to strings.
     * @private
     */
    class Diff extends Array {
        constructor(name) {
            super();

            Object.defineProperty(this, "diffType", {
                configurable: false,
                enumerable: false,
                value: name,
                writable: false
            });
        }

        /**
         * Adds a new diff to the diff collection.
         * @param {any} v1  The first value, typically the 'original' value, that didn't match.
         * @param {any} v2  The second value that didn't match.
         * @param {String} [key] The Object or Array property or index, generically described as a "key".
         * Includes any decorators such as bracket or dot notation.
         */
        addDiff(v1, v2, key) {
            var ret = {
                src: v1,
                dst: v2
            };
            if (key !== undefined) {
                ret.key = key;
            }
            this.push(ret);

            return this;
        }

        /**
         * Converts the diff to an array of descriptive strings that explain why two things are different.
         * @return {Array.<String>} One string in the array for each difference.
         */
        toStringArray() {
            var msgList = [];

            for (let val of this) {
                let key = val.key;
                if (key) msgList.push(`At ${key}: Expected: '${val.src}'; Got: '${val.dst}'`);
                else msgList.push(`Expected: '${val.src}'; Got: '${val.dst}'`);
            }

            return msgList;
        }
    }

    /***************************************************
     * helper functions for testing various data types
     ****************************************************/

    function testNumber(n) {
        if (typeof n === "number") return true;
        return false;
    }

    function diffNumber(n1, n2) {
        if (n1 !== n2) return new Diff("number").addDiff(n1, n2);

        return new Diff("number");
    }

    function testString(s) {
        if (typeof s === "string") return true;
        return false;
    }

    function diffString(s1, s2) {
        if (s1 !== s2) return new Diff("string").addDiff(s1, s2);

        return new Diff("string");
    }

    function testObject(o) {
        if (typeof o === "object" && o !== null) return true;
        return false;
    }

    function diffObject(o1, o2) {
        var diff = new Diff("object");

        // make a list of all the keys between the two objects
        var keyList = new Set();
        for (let key in o1) {
            keyList.add(key);
        }
        for (let key in o2) {
            keyList.add(key);
        }

        // for the combined list of keys, create a list of different keys or different values
        for (let key of keyList) {
            if ((key in o1) && (key in o2)) {
                let childDiff = Match.diff(o1[key], o2[key]);
                for (let childDiffMember of childDiff) {
                    let newKey = childDiffMember.key ? key + childDiffMember.key : key;
                    diff.addDiff(childDiffMember.src, childDiffMember.dst, "." + newKey);
                }
            } else {
                diff.addDiff(o1[key], o2[key], "." + key);
            }
        }

        debug("returning diff:", diff);
        return diff;
    }

    function testArray(a) {
        if (Array.isArray(a)) return true;
        return false;
    }

    function diffArray(a1, a2) {
        var diff = new Diff("array");

        // for the longer of the arrays, create a list of different values
        var len = (a1.length > a2.length) ? a1.length : a2.length;
        for (let i = 0; i < len; i++) {
            // recursive diff
            let childDiff = Match.diff(a1[i], a2[i]);
            for (let childDiffMember of childDiff) {
                let newKey = childDiffMember.key ? `[${i}]` + childDiffMember.key : `[${i}]`;
                diff.addDiff(childDiffMember.src, childDiffMember.dst, newKey);
            }
        }

        return diff;
    }

    function testNull(n) {
        if (n === null) return true;
        return false;
    }

    function diffNull() {
        // guaranteed that both n1 and n2 are of type "null"
        // since there's no different types of null, there can be no real diff here
        return new Diff("null");
    }

    function testBoolean(b) {
        if (typeof b === "boolean") return true;
        return false;
    }

    function diffBoolean(b1, b2) {
        if (b1 !== b2) return new Diff("boolean").addDiff(b1, b2);
        return new Diff("boolean");
    }

    function testDate(d) {
        if (d instanceof Date) return true;
        return false;
    }

    function diffDate(d1, d2) {
        if (d1.getTime() !== d2.getTime()) return new Diff("date").addDiff(d1, d2);
        return new Diff("date");
    }

    function testUndef(u) {
        if (u === undefined) return true;
        return false;
    }

    function diffUndef() {
        // guaranteed that both n1 and n2 are of type "undefined"
        // since there's no different types of undefined, there can be no real diff here
        return new Diff("undefined");
    }

    function testRegex(rex) {
        if (rex instanceof RegExp) return true;
        return false;
    }

    function diffRegex(rex1, rex2) {
        if (rex1.toString() !== rex2.toString()) return new Diff("regexp").addDiff(rex1.toString(), rex2.toString());
        return new Diff("regexp");
    }

    function testError(e) {
        if (e instanceof Error) return true;
    }

    function diffError(e1, e2) {
        var diff = new Diff("error");
        if (e1.name !== e2.name) diff.addDiff(e1.name, e2.name, "name");
        if (e1.message !== e2.message) diff.addDiff(e1.message, e2.message, "message");
        return diff;
    }

    /**
     * Used for creating a group of behavior-based stubs and tests. Modules are like most JavaScript modules: a
     * group of logically related behaviors -- for example, those that would be imported through a `require` call.
     *
     * Modules have interfaces that can created through `defineMethod` (for functions) and `defineProperty`. Every
     * interface can have multiple {@link Behavior Behaviors}, that describe how the interface works.
     */
    class Module {
        constructor(moduleName) {
            this.moduleName = moduleName;
            this.propertyMap = new Map();
            this.behaviorMap = new Map();
            this.testList = [];
        }

        /**
         * Defines a new method / funciton interface on the module.
         * @param  {String} name The name of the interface (i.e. - the key used to access / call the method)
         * @return {Interface}      The interface that was created
         */
        defineMethod(name) {
            validateArgsSingleString("defineMethod", name);
            return this.defineInterface(name, "function");
        }

        /**
         * Defines a new property interface on the module.
         * @param  {String} name The name of the interface / property
         * @return {Interface}      The interface that was created
         */
        defineProperty(name) {
            validateArgsSingleString("defineProperty", name);
            return this.defineInterface(name, "property");
        }

        /**
         * Defines an interface (method or property) on the module
         * @param  {String} name The name of the interface to be created
         * @param  {String} type The type of interface, either "function" or "property"
         * @return {Interface}      The interface that was created
         * @private
         */
        defineInterface(name, type) {
            if (this.getInterface(name)) {
                throw new TypeError(`defineInterface: '${name}' is already defined`);
            }

            var newProp = new Interface(this, name, type);
            this.propertyMap.set(name, newProp);
            return newProp;
        }

        /**
         * Defines a new behavior for the module.
         * @param  {String} behaviorName  The name of the behavior
         * @param  {String} [interfaceName] An optional interface that the behavior is being defined for
         * @return {Behavior}               The Behavior that was created
         */
        defineBehavior(behaviorName, interfaceName) {
            if (typeof behaviorName !== "string") {
                throw new TypeError("defineBehavior: expected first argument 'behaviorName' to be of type String");
            }

            if (this.getBehavior(behaviorName)) {
                throw new TypeError(`defineBehavior: behavior name '${behaviorName}' is already defined`);
            }

            if (this.getInterface(behaviorName)) {
                throw new TypeError(`defineBehavior: behavior name '${behaviorName}' is already used as an interface name`);
            }

            var newBehavior = new Behavior(this, behaviorName);
            this.behaviorMap.set(behaviorName, newBehavior);
            if (interfaceName === undefined) return newBehavior;

            if (typeof interfaceName !== "string") {
                throw new TypeError("defineBehavior: expected second argument 'interfaceName' to be of type String");
            }

            var foundInterface = this.getInterface(interfaceName);
            if (!foundInterface) {
                throw new TypeError(`defineBehavior: interface '${interfaceName}' not found`);
            }

            return newBehavior[foundInterface.interfaceName]();
        }

        /**
         * Returns the interface specified by `interfaceName`
         * @param  {String} interfaceName The name of the interface to get
         * @return {Interface|undefined}  The requrested interface or undefined if the interface wasn't found
         */
        getInterface(interfaceName) {
            validateArgsSingleString("getInterface", interfaceName);
            return this.propertyMap.get(interfaceName);
        }

        /**
         * Returns the behavior specified by `behaviorName`
         * @param  {String} behaviorName The name of the behavior to get
         * @return {Behavior|undefined}  The requrested behavior or undefined if the behavior wasn't found
         */
        getBehavior(behaviorName) {
            validateArgsSingleString("getBehavior", behaviorName);
            return this.behaviorMap.get(behaviorName);
        }

        /**
         * Returns a stub {@link Wrapper} for the specified behavior.
         * @param  {String} behaviorName The behavior to create a stub for
         * @return {Wrapper}             A stub that performs the specified behavior
         */
        getStub(behaviorName) {
            validateArgsSingleString("getStub", behaviorName);
            var behavior = this.getBehavior(behaviorName);
            if (!behavior) {
                throw new TypeError(`getStub: behavior '${behaviorName}' not defined`);
            }

            return behavior.getStub();
        }

        /**
         * Specifies that one of the previously defined `Behaviors` should be tested by the module. Only
         * the behaviors that have been specified through `defineTest` will be tested. Tests will be run
         * in the order that they are defined.
         * @param  {String} behaviorName The name of the behavior to be tested
         * @param  {String} [desc]       An optional description of the test, similar to what might be passed to
         * the `test()` or `it()` function of a test runner. If not specified, the behavior name will be used.
         */
        defineTest(behaviorName, desc) {
            if (typeof behaviorName !== "string") {
                throw new TypeError("defineTest: expected argument 'behaviorName' to be of type String");
            }
            var behavior = this.getBehavior(behaviorName);
            if (!behavior) {
                throw new TypeError(`defineTest: behavior '${behaviorName}' not defined`);
            }

            if (desc !== undefined && typeof desc !== "string") {
                throw new TypeError("defineTest: expection optional argument 'desc' to be of type String");
            }

            desc = desc || behavior.behaviorName;

            this.testList.push({
                behaviorName: behaviorName,
                desc: desc
            });
        }

        _testFunctionFactory(behavior) {
            return function(mod) {
                return behavior.runTest(mod);
            };
        }

        /**
         * @typedef {Object} Test
         * @property {String} behaviorName The name of the behavior to be tested
         * @property {String} desc A short description of the test...[any]
         * @property {Function} fn The function that runs the test. No arguments required and no return value. Throws on failure.
         */
        /**
         * Returns an array of tests.
         * @returns {Array.<Test>} An array of test objects. Each object has a `desc` and `fn` that is ready to be passed to a
         * test runner, such as Mocha, Jasmine, or QUnit.
         */
        getTestList() {
            // cheap deep-clone testList
            var retTestList = JSON.parse(JSON.stringify(this.testList));

            // add test function to corresponding testList entries
            for (let i = 0; i < retTestList.length; i++) {
                let name = retTestList[i].behaviorName;
                let behav = this.getBehavior(name);
                retTestList[i].fn = this._testFunctionFactory(behav);
            }

            return retTestList;
        }

        /**
         * Runs all the tests in the testList.
         * @param  {Object}   mod The module to be tested. Should support all the interfaces and behaviors that will be tested.
         * @param  {Function} cb  A callback that receives the arguments `description` and `function` for each test to be run. Most
         * testing framworks can simply pass a `test` or `it` function.
         */
        runAllTests(mod, cb) {
            var runList = this.getTestList();
            for (let i = 0; i < runList.length; i++) {
                let test = runList[i];
                let fn = test.fn(mod);
                cb(test.desc, fn);
            }
        }
    }

    /**
     * Describes an interface
     */
    class Interface {
        constructor(module, name, type) {
            this.module = module;
            this.interfaceName = name;
            this.interfaceType = type;
        }
    }

    // returns a function, and that function returns the specified value
    function fnRetVal(val) {
        var fn = function(retVal) {
            return retVal;
        };
        return fn.bind(null, val);
    }

    /**
     * Describes a behavior
     */
    class Behavior {
        constructor(module, name) {
            this.module = module;
            this.behaviorName = name;
            this.behaviorSequence = [];

            this.chainable = new Proxy(this, {
                get: (obj, property) => {
                    var found = this._lookupProperty(property);
                    if (!found) return obj[property];
                    return found;
                }
            });

            return this.chainable;
        }

        _lookupProperty(property) {
            // lookup interface
            var foundInterface = this.module.getInterface(property);
            if (foundInterface instanceof Interface) {
                return this._addInterfaceBehavior(foundInterface);
            }

            // lookup behavior
            var behavior = this.module.getBehavior(property);
            if (behavior instanceof Behavior) {
                return this._addBehavior(behavior);
            }

            return undefined;
        }

        _addInterfaceBehavior(interfaceObj) {
            var interfaceBehavior = new InterfaceBehavior(this.module, this, interfaceObj);
            this.behaviorSequence.push(interfaceBehavior);
            return fnRetVal(interfaceBehavior);
        }

        _addBehavior(behavior) {
            this.behaviorSequence.push(behavior);
            return fnRetVal(this.chainable);
        }

        /**
         * Returns a stub for this behavior
         * @return {Wrapper} The stub for this behavior
         */
        getStub() {
            var stubObj = {};

            function newStub(prop, type) {
                if (type === "function") {
                    let stub = new Wrapper();
                    stubObj[prop] = stub;
                    return stub;
                } else { // property
                    stubObj[prop] = undefined;
                    let stub = new Wrapper(stubObj, prop);
                    return stub;
                }

            }

            // adds the correct behavior to the stub
            function addInterfaceBehaviorToStub(stub, cnt, interfaceBehavior) {
                var trigger;
                var type = interfaceBehavior.interface.interfaceType;

                if (type === "function") {
                    trigger = stub.triggerOnCallNumber(cnt);
                    if (interfaceBehavior.hasOwnProperty("args")) {
                        trigger.expectCallArgs(...interfaceBehavior.args);
                    }

                    if (interfaceBehavior.hasOwnProperty("context")) {
                        trigger.expectCallContext(interfaceBehavior.context);
                    }

                    if (interfaceBehavior.hasOwnProperty("retVal")) {
                        trigger.actionReturn(interfaceBehavior.retVal);
                    }

                    if (interfaceBehavior.hasOwnProperty("exception")) {
                        trigger.actionThrowException(interfaceBehavior.exception);
                    }
                } else { // property
                    if (interfaceBehavior.hasOwnProperty("retVal")) {
                        let trigger = stub.triggerOnGetNumber(cnt);
                        trigger.actionReturn(interfaceBehavior.retVal);
                    }

                    if (interfaceBehavior.hasOwnProperty("exception")) {
                        let trigger = stub.triggerOnTouchNumber(cnt);
                        trigger.actionThrowException(interfaceBehavior.exception);
                    }

                    if (interfaceBehavior.hasOwnProperty("setVal")) {
                        let trigger = stub.triggerOnSetNumber(cnt);
                        trigger.actionSetVal(interfaceBehavior.setVal);
                    }
                }
            }

            this._iterateInterfaceBehaviors(newStub, addInterfaceBehaviorToStub);

            return stubObj;
        }

        /**
         * Tests that the module specified by `mod` correctly implements this behavior
         * @param  {Object} mod The module to be tested
         */
        runTest(mod) {
            // create sandbox
            var sandbox = new Sandbox();
            var callList = [];

            function newTest(prop) {
                if (!mod.hasOwnProperty(prop)) {
                    throw new Error(`runTest: expected property '${prop}' to exist on module`);
                }

                var test = sandbox.newWrapper(mod, prop);
                test.configSwallowExpectException(true);
                return test;
            }

            function createTest(wrapper, cnt, interfaceBehavior) {
                var trigger;
                var type = interfaceBehavior.interface.interfaceType;

                if (type === "function") {
                    // add call to list
                    callList.push(wrapper);

                    // configure wrapper's expectations
                    trigger = wrapper.triggerOnCallNumber(cnt);

                    if (interfaceBehavior.hasOwnProperty("retVal")) {
                        trigger.expectReturn(interfaceBehavior.retVal);
                    }

                    if (interfaceBehavior.hasOwnProperty("exception")) {
                        trigger.expectException(interfaceBehavior.exception);
                    }

                    if (interfaceBehavior.hasOwnProperty("args")) {
                        trigger.actionCallArgs(...interfaceBehavior.args);
                    }

                    if (interfaceBehavior.hasOwnProperty("context")) {
                        trigger.actionCallContext(interfaceBehavior.context);
                    }
                } else {
                    if (interfaceBehavior.hasOwnProperty("retVal")) {
                        trigger = wrapper.triggerOnGetNumber(cnt);
                        trigger.expectReturn(interfaceBehavior.retVal);
                        callList.push(wrapper);
                    }

                    if (interfaceBehavior.hasOwnProperty("exception")) {
                        trigger = wrapper.triggerOnTouchNumber(cnt);
                        trigger.expectException(interfaceBehavior.exception);
                        callList.push(wrapper);
                    }

                    if (interfaceBehavior.hasOwnProperty("setVal")) {
                        trigger = wrapper.triggerOnSetNumber(cnt);
                        trigger.actionSetVal(interfaceBehavior.setVal);
                        callList.push(function() {
                            wrapper(true);
                        });
                    }
                }
            }

            // iterate all behaviors creating wrappers on all tested interfaces
            // and adding expected behaviors to each of those wrappers
            this._iterateInterfaceBehaviors(newTest, createTest);

            // Sandbox.test?
            var testBehavior = function() {
                // call module N times
                for (let i = 0; i < callList.length; i++) {
                    callList[i]();
                }

                // unwrap all wrapped methods
                sandbox.destroy();
            };

            return testBehavior;
        }

        // this iterates all the defined behaviors
        // it calls `newFn` to create a new thing (probably a test or stub)
        // and it calls `updateFn` to add functionality to that thing
        _iterateInterfaceBehaviors(newFn, updateFn) {
            var interfaceCountMap = new Map();
            var interfaceMap = new Map();

            function getOrCreateWrapper(interfaceBehavior) {
                var name = interfaceBehavior.interface.interfaceName;
                var type = interfaceBehavior.interface.interfaceType;

                var interfaceFn = interfaceMap.get(name);

                // if it hasn't been created, create it now
                if (!interfaceFn) {
                    interfaceFn = newFn(name, type);
                    interfaceMap.set(name, interfaceFn);
                }

                return interfaceFn;
            }

            function incrementInterfaceCountMap(interfaceBehavior) {
                var name = interfaceBehavior.interface.interfaceName;

                if (interfaceCountMap.has(name)) {
                    let count = interfaceCountMap.get(name);
                    count++;
                    interfaceCountMap.set(name, count);
                    return count;
                } else {
                    interfaceCountMap.set(name, 0);
                    return 0;
                }
            }

            // recursively iterates all behaviors and adds any interface behaviors to the returned array
            function gatherInterfaceBehaviors(behavior) {
                var ret = [];

                for (let i = 0; i < behavior.behaviorSequence.length; i++) {
                    let currBehavior = behavior.behaviorSequence[i];
                    if (currBehavior instanceof InterfaceBehavior) {
                        ret.push(currBehavior);
                    } else {
                        ret = ret.concat(gatherInterfaceBehaviors(currBehavior));
                    }
                }

                return ret;
            }

            // collect all the interface behaviors from the abstract behaviors
            let interfaceBehaviorList = gatherInterfaceBehaviors(this);

            // add all the interface behaviors to the stub
            for (let i = 0; i < interfaceBehaviorList.length; i++) {
                let behavior = interfaceBehaviorList[i];
                let count = incrementInterfaceCountMap(behavior);
                let wrapper = getOrCreateWrapper(behavior);
                updateFn(wrapper, count, behavior);
            }
        }
    }

    /**
     * Describes the behavior of an interface
     */
    class InterfaceBehavior {
        constructor(module, behavior, interfaceObj) {
            this.module = module;
            this.interface = interfaceObj;
        }

        /**
         * The interface returns the value specified by `retVal`
         * @param  {any} retVal The value to be returned by the interface
         * @return {InterfaceBehavior}        This interface, for chaining
         */
        returns(retVal) {
            validateArgsSingle("returns", retVal);
            this.retVal = retVal;
            return this;
        }

        /**
         * The interface throws the `Error` specified by `err`
         * @param  {Error} err The error to be thrown
         * @return {InterfaceBehavior}        This interface, for chaining
         */
        throws(err) {
            validateArgsSingleExceptionOrNull("throws", err);
            this.exception = err;
            return this;
        }

        /**
         * The arguments to be sent to the interface, as specified by `args`
         * @param  {...any} args The arguments to be passed to the interface
         * @return {InterfaceBehavior}        This interface, for chaining
         */
        args(...args) {
            validateArgsAny("args", ...args);
            this.args = args;
            return this;
        }

        /**
         * The context (`this` value) to be passed to the interface. Only applicable
         * to method / function interfaces.
         * @param  {any} ctx The value to set the context of the function to
         * @return {InterfaceBehavior}        This interface, for chaining
         */
        context(ctx) {
            validateArgsSingle("context", ctx);
            this.context = ctx;
            return this;
        }

        /**
         * The value to be set on the property, as specified by `val`
         * @param {any} val The value to set for the property
         * @return {InterfaceBehavior}        This interface, for chaining
         */
        set(val) {
            validateArgsSingle("set", val);
            this.setVal = val;
            return this;
        }
    }

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return {
        Wrapper: Wrapper,
        Operation: Operation,
        Match: Match,
        Trigger: Trigger,
        ExpectError: ExpectError,
        Sandbox: Sandbox,
        Filter: Filter,
        Module: Module,
        Interface: Interface,
        Behavior: Behavior,
        InterfaceBehavior: InterfaceBehavior
    };
}));

/* JSHINT */
/* globals define */
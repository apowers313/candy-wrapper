// UMD returnExports design pattern
(function(root, factory) {
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

    var wrapperCookie = "193fe616-09d1-4d5c-a5b9-ff6f3e79714c";
    var wrapperCookieKey = "uniquePlaceToKeepAGuidForCandyWrapper";

    /**
     * Creates a new function or attribute wrapper -- a spy, stub, mock, etc.
     */
    class Wrapper extends Function {

        constructor() {
            super();

            if (arguments[0] === null) {
                throw new TypeError("Wrapper: bad arguments to constructor. RTFM.");
            }

            // below are all the different forms of the contructor,
            // which are basically syntactic sugar for creating wrappers
            // around lots of different kinds of things

            // forms of wrapper:
            // new Wrapper()
            // new Wrapper(obj)
            // new Wrapper(func)
            // new Wrapper(obj, method)
            // new Wrapper(obj, attribute)
            // new Wrapper(obj, method, func)
            // new Wrapper(obj, attribute, func)

            // constructed like: wrapper()
            if (arguments.length === 0) {
                debug("creating empty wrapper");
                return this._callConstructor(function() {});
            }

            // constructed like: wrapper(obj)
            /**
             * Wrap all aspects of an object
             * @param  {Object} obj Object to be wrapped
             * @return {Object}    Returns an object with all methods and attributes wrapped
             * @lends Wrapper
             * @constructor
             */
            if (arguments.length === 1 && typeof arguments[0] === "object") {
                debug("wrapping object");
                throw new Error("not implemented");
            }

            // constructed like: wrapper(func)
            /**
             * Puts a wrapper around a function and returns it
             * @param  {Function} fn Function to be wrapped
             * @return {Wrapper}    Returns the a Proxy for a Wrapper around the function
             * @constructs
             * @memberof Wrapper
             */
            if (arguments.length === 1 && typeof arguments[0] === "function") {
                debug("wrapping function:", arguments[0].name);
                return this._callConstructor(arguments[0]);
            }

            // wrapper(obj, method)
            // wrapper(obj, attribute)
            if (arguments.length === 2 &&
                typeof arguments[0] === "object" &&
                typeof arguments[1] === "string") {
                let obj = arguments[0];
                let key = arguments[1];
                debug("wrapping method or attribute:", key);
                if (typeof obj[key] === "function") {
                    obj[key] = this._callConstructor(obj[key]);
                    return obj[key];
                } else {
                    return this._attrConstructor(obj, key);
                }
            }

            // wrapper(obj, method, func)
            // wrapper(obj, attribute, func)
            if (arguments.length === 3 &&
                typeof arguments[0] === "object" &&
                typeof arguments[1] === "string" &&
                typeof arguments[2] === "function") {
                let obj = arguments[0];
                let key = arguments[1];
                let fn = arguments[2];
                debug("wrapping method or attribute:", key);
                if (typeof obj[key] === "function") {
                    return this._callConstructor(obj[key], fn);
                } else {
                    return this._attrConstructor(obj, key, fn);
                }
            }

            throw new TypeError("Wrapper: bad arguments to constructor. RTFM.");
        }

        _callConstructor(origFn, wrappedFn) {
            this.type = "function";
            this.callList = new Filter(this);
            this.orig = origFn;
            wrappedFn = wrappedFn || origFn;
            this.wrapped = wrappedFn;
            this.chainable = new Proxy(this, {
                apply: (target, thisArg, argList) => this._doCall(target, thisArg, argList)
            });

            /**
             * Validates that the Wrapper was called `count` times.
             * @param   {Number} count  The number of times the Wrapper should have been called.
             * @returns {Boolean}       Returns `true` if  Wrapper was called `count` times, `false` otherwise.
             * @memberOf WrapperCall
             * @instance
             */
            alias(this, "expectCallCount", this._Count, "expectCallCount", this.callList);
            alias(this, "expectCallCountRange", this._CountRange, "expectCallCountRange", this.callList);
            alias(this, "expectCallCountMin", this._CountMin, "expectCallCountMin", this.callList);
            alias(this, "expectCallCountMax", this._CountMax, "expectCallCountMax", this.callList);
            alias(this, "expectCallNever", this.expectCallCount, 0);
            /**
             * Expects Wrapper to be called exactly once. Same as {@link expectCallCount} (1)
             * @method expectCallOnce
             * @returns {Boolean} Returns `true` if the wrapper was called exactly once, `false` otherwise.
             * @memberOf WrapperCall
             * @instance
             */
            alias(this, "expectCallOnce", this.expectCallCount, 1);
            /**
             * Expects Wrapper to be called exactly once. Same as expectCallCount(2)
             * @method expectCallTwice
             * @returns {Boolean} Returns `true` if the wrapper was called exactly twice, `false` otherwise.
             * @memberOf WrapperCall
             * @instance
             */
            alias(this, "expectCallTwice", this.expectCallCount, 2);
            /**
             * Expects Wrapper to be called exactly once. Same as expectCallCount(3)
             * @method expectCallThrice
             * @returns {Boolean} Returns `true` if the wrapper was called exactly three times, `false` otherwise.
             * @memberOf WrapperCall
             * @instance
             */
            alias(this, "expectCallThrice", this.expectCallCount, 3);

            this.configReset();
            return this.chainable;
        }

        _doCall(target, thisArg, argList) {
            var funcName = this.wrapped.name || "<<anonymous>>";
            debug(`calling wrapper on "${funcName}"`);

            var si = new SingleCall(this, thisArg, argList);

            // run pre-call triggers
            this._runTriggerList("pre", si);

            // run the wrapped function
            var ret, exception;
            try {
                ret = this.wrapped.apply(thisArg, argList);
            } catch (ex) {
                exception = ex;
            }
            si.retVal = ret;
            si.exception = exception;

            // run post-call triggers
            this._runTriggerList("post", si);
            debug("final si", si);

            // save call
            si.postCall = si.preCall = true; // in the future evaulate both pre and post calls
            this.callList.push(si);

            return si.retVal;
        }

        _attrConstructor(obj, attr, fn) {
            if (typeof obj[attr] === "object") {
                throw new TypeError("can't wrap a sub-object: not implemented");
            }

            // save the values
            this.origAttr = Object.getOwnPropertyDescriptor(obj, attr);
            this.attrValue = this.origAttr.value;
            this.setterGetterFn = fn;
            this.type = "attribute";
            this.touchList = new Filter(this);

            // create a proxy for the setter / getters
            this.chainable = new Proxy(this, {
                apply: (target, thisArg, argList) => {
                    switch (argList.length) {
                        case 0:
                            return this._doSetterGetter("get");
                        case 1:
                            return this._doSetterGetter("set", argList[0]);
                        default:
                            throw new Error("Wrong number of args to setter / getter. (How is that even possible?)");
                    }
                }
            });

            // define the new property
            Object.defineProperty(obj, attr, {
                configurable: this.origAttr.configurable,
                enumerable: this.origAttr.enumerable,
                get: this.chainable,
                set: this.chainable,
            });

            this.configReset();
            this.chainable = this;
            return this.chainable;
        }

        _doSetterGetter(type, val) {
            // create a new single touch instance
            var st = new SingleTouch(this, type, this.attrValue, val);

            debug(`_doSetterGetter ${type} "${val}"`);

            // run pre-call trigger
            this._runTriggerList("pre", st);

            // do the set or get
            if (type === "get" && this.setterGetterFn) {
                st.retVal = this.setterGetterFn(type);
            } else if (type === "set" && this.setterGetterFn) {
                st.retVal = this.setterGetterFn(type, st.setVal);
            } else if (type === "set") {
                // if no setter / getter function, just used the cached attrValue
                st.retVal = st.setVal;
                this.attrValue = st.setVal;
            }

            // run post-call trigger
            this._runTriggerList("post", st);
            debug("final st", st);

            // save this touch for future reference
            this.touchList.push(st);

            // always return the value
            debug("settergetter returning", st.retVal);
            return st.retVal;
        }

        _softAssert(passed, message) {
            if (!passed) {
                this.expectMessageList.push(message);
            }

            this.expectPassed = this.expectPassed && passed;
            return this.expectPassed;
        }

        _runTriggerList(preOrPost, single) {
            if (preOrPost === "pre") {
                single.postCall = !(single.preCall = true); // only evalute pre calls
            } else { // post
                single.postCall = !(single.preCall = false); // only evaluate post calls
            }

            debug(`_runTriggerList ${preOrPost}`, this.triggerList);

            for (let idx in this.triggerList) {
                let trigger = this.triggerList[idx];
                trigger.run(single);
            }
        }

        /**
         * Asserts that the current Wrapper is wrapping an attribute.
         * @param  {String} callerName The name of the calling function, to be included in
         * the error message if the assertion fails.
         * @throws {Error} If Current Wrapper is not wrapping an attribute.
         * @private
         */
        _attrOnly(callerName) {
            if (this.type !== "attribute") {
                throw new Error(`${callerName} is only supported for ATTRIBUTE wrappers`);
            }
        }

        /**
         * Asserts that the current Wrapper is wrapping a function.
         * @param  {String} callerName The name of the calling function, to be included in
         * the error message if the assertion fails.
         * @throws {Error} If Current Wrapper is not wrapping a function.
         * @private
         */
        _funcOnly(callerName) {
            if (this.type !== "function") {
                throw new Error(`${callerName} is only supported for FUNCTION wrappers`);
            }
        }

        /**
         * Expects that `arr` has `count` members. Serves as the basis of
         * {@link expectCallCount}, {@link expectTouchCount} and similar Expect functions.
         * @param  {String} name  Name of the calling function, for any errors that are thrown.
         * @param  {Array} arr    The array to count the members of.
         * @param  {Number} count  How many members are expected to be in the `arr`
         * @return {Boolean}      Returns `true` if `arr` has `count` members, `false` otherwise
         * @private
         */
        _Count(name, arr, count) {
            if (typeof name !== "string") {
                throw new TypeError("_Count: expected 'name' to be string");
            }

            if (!Array.isArray(arr)) {
                throw new TypeError(`${name}: expected 'arr' to be of type Array`);
            }

            if (typeof count !== "number") {
                throw new TypeError(`${name}: expected 'count' to be of type Number`);
            }

            return (arr.length === count);
        }

        /**
         * Expects that `arr` has `count` members. Serves as the basis of
         * {@link expectCallCountRange}, {@link expectTouchCountRange} and similar Expect functions.
         * @param  {String} name  Name of the calling function, for any errors that are thrown.
         * @param  {Array} arr    The array to count the members of.
         * @param  {Number} min   How the miniumum number of members expected to be in the `arr`
         * @param  {Number} max   The maximum number of members expected to be in the `arr`
         * @return {Boolean}      Returns `true` if `arr` has `count` members, `false` otherwise
         * @private
         */
        _CountRange(name, arr, min, max) {
            if (typeof name !== "string") {
                throw new TypeError("_CountRange: expected 'name' to be string");
            }

            if (!Array.isArray(arr)) {
                throw new TypeError(`${name}: expected 'arr' to be of type Array`);
            }

            if (typeof min !== "number") {
                throw new TypeError(`${name}: expected 'min' to be of type Number`);
            }

            if (typeof max !== "number") {
                throw new TypeError(`${name}: expected 'max' to be of type Number`);
            }

            return ((arr.length >= min) && (arr.length <= max));
        }

        /**
         * Expects that `arr` has at least `count` members. Serves as the basis of
         * {@link expectCallCountMin}, {@link expectTouchCountMin} and similar Expect functions.
         * @param  {String} name  Name of the calling function, for any errors that are thrown.
         * @param  {Array} arr    The array to count the members of.
         * @param  {Number} min   How least number of members that are expected to be in the `arr`
         * @return {Boolean}      Returns `true` if `arr` has at least `count` members, `false` otherwise
         * @private
         */
        _CountMin(name, arr, min) {
            if (typeof name !== "string") {
                throw new TypeError("_CountMin: expected 'name' to be string");
            }

            if (!Array.isArray(arr)) {
                throw new TypeError(`${name}: expected 'arr' to be of type Array`);
            }

            if (typeof min !== "number") {
                throw new TypeError(`${name}: expected 'min' to be of type Number`);
            }

            return (arr.length >= min);
        }

        /**
         * Expects that `arr` has at most`count` members. Serves as the basis of
         * {@link expectCallCountMax}, {@link expectTouchCountMax} and similar Expect functions.
         * @param  {String} name  Name of the calling function, for any errors that are thrown.
         * @param  {Array} arr    The array to count the members of.
         * @param  {Number} max   The maximum number of members that are expected to be in the `arr`
         * @return {Boolean}      Returns `true` if `arr` has less than `count` members, `false` otherwise
         * @private
         */
        _CountMax(name, arr, max) {
            if (typeof name !== "string") {
                throw new TypeError("_CountMax: expected 'name' to be string");
            }

            if (!Array.isArray(arr)) {
                throw new TypeError(`${name}: expected 'arr' to be of type Array`);
            }

            if (typeof max !== "number") {
                throw new TypeError(`${name}: expected 'max' to be of type Number`);
            }

            return (arr.length <= max);
        }

        /**
         * This static method checks whether something is a Wrapper or not, similar to `Array.isArray`.
         * Works on functions, methods, and attributes. This function has multiple signatures as illustrated
         * below.
         * @example
         *
         * var testFunction = function(){};
         *
         * var testObject {
         *    attr: 1,
         *    meth: function() {}
         * }
         *
         * Wrapper.isWrapper(testFunction); // false
         * testFunction = new Wrapper(testFunction);
         * Wrapper.isWrapper(testFunction); // true
         *
         * Wrapper.isWrapper(testObject, "attr"); // false
         * new Wrapper(testObject, "attr");
         * Wrapper.isWrapper(testObject, "attr"); // true
         *
         * Wrapper.isWrapper(testObject, "meth"); // false
         * new Wrapper(testObject, "meth");
         * Wrapper.isWrapper(testObject, "meth"); // true
         *
         * @return {Boolean} Returns `true` if the arguments are a Wrapper, `false` otherwise
         */
        static isWrapper() {
            // called like: isWrapper(fn)
            // checking to see if a function / method is a wrapper
            if (arguments.length === 1 && typeof arguments[0] === "function") {
                let w = arguments[0];
                // console.log ("w", w);
                if (w[wrapperCookieKey] === wrapperCookie) return true;
                return false;
            }

            // called like: isWrapper(obj, method)
            if (arguments.length === 2 &&
                typeof arguments[0] === "object" &&
                typeof arguments[1] === "string") {
                let obj = arguments[0];
                let key = arguments[1];

                // attribute is a function
                if (typeof obj[key] === "function")
                    return Wrapper.isWrapper(obj[key]);

                if (typeof obj[key] === "object")
                    return false;

                let desc = Object.getOwnPropertyDescriptor(obj, key);
                if (typeof desc.set !== "function" ||
                    typeof desc.get !== "function")
                    return false;
                return (Wrapper.isWrapper(desc.set) && Wrapper.isWrapper(desc.get));
            }

            throw new TypeError("isWrapper: unsupported arguments");
        }

        /**
         * Resets the wrapper to its default state. Clears out all records of previous calls,
         * expected behaviors, pass / fail results, etc.
         * @return {Wrapper} Returns the Wrapper object so that this call can be chained
         */
        configReset() {
            this.triggerList = [];
            this.expectMessageList = [];
            this.expectPassed = true;
            this[wrapperCookieKey] = wrapperCookie;

            if (this.type === "function") {
                this._configCallReset();
            }

            if (this.type === "attribute") {
                this._configAttrReset();
            }

            return this.chainable;
        }

        _configCallReset() {
            this.callList.length = 0;
        }

        _configAttrReset() {
            this.touchList.length = 0;
        }

        filterOneByCallNumber(num) {
            var callCount = this.callList.length;
            if (typeof num !== "number" || num < 0) {
                throw new TypeError(`filterOneByCallNumber: bad call number argument: ${num}`);
            }
            if (num >= callCount) {
                throw new RangeError(`filterOneByCallNumber: ${num} is more than the number of calls made`);
            }

            return this.callList[num];
        }

        triggerAlways() {
            var t = new Trigger(this, function() {
                return true;
            });
            this.triggerList.push(t);
            return t;
        }
    }

    /**
     * A class for expect... calls. Gets mixed in to `Triggers` as well as
     * `SingleCall` and `SingleTouch`.
     */
    class Expect {
        constructor() {}

        /* DESIGN PATTERN
         *
         * All expect... and action... calls have a similar design pattern.
         * The template looks something like:
         *
         * expectOrFunctionThingy(args) {
         *    var curr = getCurrOrDefer("expectOrFunctionThingy", args);
         *    if (!curr || !curr.postCall) return this;
         *    // do test here
         * }
         *
         * The first line of the function figures out if we have a current context
         * for the call (either a SingleCall or a SingleTouch, depending on whether
         * the wrapper is wrapping a function or attribute). If there's a current call
         * it will return curr. If there is no current context, then the expect or
         * action will be added to the action list and will be executed when triggered.
         *
         * The second line, in addition to checking whether this is the current call,
         * checks whether this call should be run pre-call or post-call.
         *
         * The rest of the funcation is dedicated to the logic of the actual action
         * or expect.
         */

        addDeferredAction(name, args) {
            var action = {
                name: name,
                args: args
            };
            debug("adding action:", action);
            this.actionList.push(action);
        }

        getCurrCallOrDefer(name, ...args) {
            if (this instanceof SingleCall) return this;
            if (this instanceof SingleTouch) return this;
            if (this instanceof Trigger && this.currentCall) return this.currentCall;
            var argArray = [...args];
            if (typeof this.addDeferredAction === "function") return this.addDeferredAction(name, argArray);
            throw new Error(`Couldn't figure current or how to defer for: ${name}`);
        }

        // expectDoValidation(si) {
        //     this[this.expectType](si, this.expectParam);
        // }

        expectCallArgs(...args) {
            // this call only works for functions
            this.wrapper._funcOnly();
            // get the current call, or save the args for when the call is actually run
            var curr = this.getCurrCallOrDefer("expectCallArgs", ...args);
            // if there isn't a current call, return 'this' to enable chaining
            if (!curr || !curr.preCall) return this; // chainable
            // test the expect
            var m = new Match({
                value: [...args]
            });
            var passed = m.compare(curr.argList);
            this.wrapper._softAssert(passed, `expectCallArgs: args did not match`);

            return passed;
        }

        // expectCallArgs(si)
        // expectContext(si)
        // expectReturn(si)
        // expectException(si)
        // expectCustom (fn, param)
    }

    class Filter extends Array {
        constructor(wrapper, ...args) {
            super(...args);
            this.wrapper = wrapper;

            alias(this, "filterAttrSet", this._filter, "filterSet", "attribute",
                function(element) {
                    if (element.type === "set") return true;
                });

            alias(this, "filterAttrGet", this._filter, "filterGet", "attribute",
                function(element) {
                    if (element.type === "get") return true;
                });

            alias(this, "filterAttrSetByVal", this._filter, "filterAttrSetByVal", "attribute",
                function(element, index, array, ...args) {
                    var argList = [...args];
                    if (argList.length !== 1) {
                        throw new TypeError("filterAttrSetByVal: expected one argument");
                    }
                    var setVal = argList[0];

                    var m = Match.Value(setVal);
                    return m.compare(element.setVal);
                });

            alias(this, "filterCallByArgs", this._filter, "filterCallByArgs", "function",
                function(element, index, array, ...args) {
                    var m = Match.Value([...args]);
                    return m.compare(element.argList);
                });

            alias(this, "filterCallByContext", this._filter, "filterCallByContext", "function",
                function(element, index, array, ...args) {
                    var argList = [...args];
                    if (argList.length !== 1) {
                        throw new TypeError("filterCallByContext: expected one argument");
                    }
                    var context = argList[0];

                    var m = Match.Value(context);
                    return m.compare(element.thisArg);
                });

            alias(this, "filterByException", this._filter, "filterByException", "both",
                function(element, index, array, ...args) {
                    var argList = [...args];
                    if (argList.length !== 1) {
                        throw new TypeError("filterByException: expected one argument");
                    }
                    var exception = argList[0];

                    var m = Match.Value(exception);
                    return m.compare(element.exception);
                });

            alias(this, "filterByReturn", this._filter, "filterByReturn", "both",
                function(element, index, array, ...args) {
                    var argList = [...args];
                    if (argList.length !== 1) {
                        throw new TypeError("filterByReturn: expected one argument");
                    }
                    var retVal = argList[0];

                    var m = Match.Value(retVal);
                    return m.compare(element.retVal);
                });

            alias(this, "getAllCallArgs", this._get, "getAllCallArgs", "function", "argList");
            alias(this, "getAllCallContexts", this._get, "getAllCallContexts", "function", "thisArg");
            alias(this, "getAllExceptions", this._get, "getAllExceptions", "both", "exception");
            alias(this, "getAllReturns", this._get, "getAllReturns", "both", "retVal");
            alias(this, "getAllSetVals", this._get, "getAllSetVals", "attribute", "setVal");
        }

        _filter(name, type, fn, ...args) {
            if (type === "attribute") this.wrapper._attrOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            return this.filter(function(element, index, array) {
                return fn(element, index, array, ...args);
            });
        }

        _get(name, type, idx) {
            if (type === "attribute") this.wrapper._attrOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            return this.map(function(element) {
                return element[idx];
            });
        }

        // All(expectName, ...args) {
        //     var ret = true;
        //     this.forEach(() => {
        //         ret = ret && this.wrapper[expectName](...args);
        //     });
        //     return ret;
        // }

        // Some(expectName, ...args) {
        // }

        // None(expectName, ...args) {
        // }
    }

    /**
     * A representation of a single `get` or `set` on an attribute.
     */
    class SingleTouch extends Expect {
        constructor(wrapper, type, retVal, setVal, exception) {
            super();

            this.wrapper = wrapper;
            this.type = type;
            this.setVal = setVal;
            this.retVal = retVal;
            this.exception = exception;
        }
    }

    /**
     * A representation of a single function call.
     */
    class SingleCall extends Expect {
        constructor(wrapper, thisArg, argList, retVal, exception) {
            super();

            // this.calledWithNew = thisArg.new && thisArg.new.target;
            this.wrapper = wrapper;
            this.preCall = false;
            this.postCall = false;
            this.thisArg = thisArg;
            this.argList = argList;
            this.retVal = retVal;
            this.exception = exception;
        }
    }

    /**
     * A `Trigger` determines what `expect` or `action` calls get run on a wrapped
     * function or attribute. Triggers usally get created by calling a trigger function
     * on the {@link Wrapper}.
     * @example
     * var wrapper = new Wrapper(something);
     * wrapper.triggerAlways()          // every time the wrapper is called...
     *     .expectArgs("abc", 123)      // ...error if the wrong args are not `"abc"` and `123`...
     *     .actionReturn(true);         // ...and always change the return value of the function to `true`
     */
    class Trigger extends Expect {
        constructor(wrapper, triggerFn) {
            super();
            this.wrapper = wrapper;
            this.triggerFn = triggerFn;
            this.currentCall = null;
            this.actionList = [];
        }

        run(si) {
            // check trigger to see if it should run
            if (!this.triggerFn.call(this, si)) return;

            // perform actions
            this.currentCall = si;
            debug("actionList", this.actionList);
            for (let idx in this.actionList) {
                let action = this.actionList[idx];
                this[action.name](...action.args);
            }
            this.currentCall = null;
        }

        actionReturn(retVal) {
            // get the current call, or save the args for when the call is actually run
            var curr = this.getCurrCallOrDefer("actionReturn", retVal);
            // if there isn't a current call, return 'this' to enable chaining
            if (!curr || !curr.postCall) return this; // chainable
            // run the action
            curr.retVal = retVal;

            return this;
        }
    }

    /**
     * A class for matching anything. Really, anything.
     */
    class Match {
        constructor(opts) {
            opts = opts || {};
            // if !opts throw
            if (opts.hasOwnProperty("value")) {
                this.value = opts.value;
                // } else if (opts.type) {
                //     this.type = opts.type;
                // } else if (opts.custom) {
                //     this.custom = opts.custom;
            } else {
                throw new TypeError("Match: requires a value or type to match");
            }

            this.strict = true;
            this.matcherList = new Map();
            this.matcherHierarchy = [];
            this.extend("number", null, testNumber, diffNumber);
            this.extend("array", null, testArray, diffArray);
            this.extend("object", null, testObject, diffObject);
            this.extend("string", null, testString, diffString);
            this.extend("null", null, testNull, diffNull);
            this.extend("boolean", null, testBoolean, diffBoolean);
            this.extend("undefined", null, testUndef, diffUndef);
            this.extend("date", "object", testDate, diffDate);
            this.extend("regexp", "object", testRegex, diffRegex);
            this.extend("error", "object", testError, diffError);
            this.extend("SingleCall", "object", testSingleCall, diffSingleCall);
        }

        static Value(arg) {
            return new Match({
                value: arg
            });
        }

        compare(any) {
            var d = this.diff(this.value, any);
            if (d.length === 0) return true;
            // TODO: if allowUndefined -- filter undefined

            return false;
        }

        // compareType

        diff(v1, v2) {
            var matcher = this.findCommonType(v1, v2);
            debug("diff: matcher:", matcher);
            if (!matcher) {
                debug("common type not found, returning diff");
                // throw new TypeError("diff: can't compare uncommon values");
                return newDiff(v1, v2);
            }
            this.lastDiff = matcher.diff.call(this, v1, v2);
            return this.lastDiff;
        }

        getType(any, matcherList) {
            if (!matcherList) {
                matcherList = this.matcherHierarchy;
            }

            // check for the type in the provided list
            for (let i = 0; i < matcherList.length; i++) {
                let matcher = matcherList[i];
                if (matcher.test(any)) {
                    debug("matcher found:", matcher.name);
                    // recursively check any children for the type
                    let nextType = this.getType(any, matcher.children);
                    debug("next type:", nextType);
                    return (nextType ? nextType : matcher);
                } else {
                    debug("didn't match:", matcher.name);
                }
            }

            return null;
        }

        findCommonType(matcher1, matcher2) {
            // convert values to matchers
            if (!this.isMatcher(matcher1)) {
                debug("findCommonType: converting matcher1 value to matcher:", matcher1);
                matcher1 = this.getType(matcher1);
                debug("matcher1:", matcher1);
            }
            if (!this.isMatcher(matcher2)) {
                debug("findCommonType: converting matcher2 value to matcher:", matcher2);
                matcher2 = this.getType(matcher2);
                debug("matcher2:", matcher2);
            }

            if (!matcher1 || !matcher2) {
                // throw new TypeError ("findCommonType: couldn't identify types to match");
                return null;
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
                commonType = this.matcherList.get(commonType);
            }

            return commonType;
        }

        isMatcher(matcher) {
            debug("isMatcher:", matcher);
            return (typeof matcher === "object" &&
                matcher !== null &&
                typeof matcher.name === "string" &&
                typeof matcher.test === "function" &&
                typeof matcher.diff === "function" &&
                Array.isArray(matcher.children) &&
                (
                    matcher.parent === null ||
                    this.isMatcher(matcher.parent)
                ));
        }

        extend(name, parentName, testFn, diffFn) {
            if (typeof name !== "string") {
                throw new TypeError(`Match.extend: 'name' should be string`);
            }

            if (this.matcherList.has(name)) {
                throw new TypeError(`Match.extend: '${name}' already exists`);
            }

            var parentMatcher = this.matcherList.get(parentName);
            parentMatcher = parentMatcher || null;

            var matcher = {
                name: name,
                test: testFn,
                diff: diffFn,
                parent: parentMatcher,
                children: []
            };

            this.matcherList.set(name, matcher);
            if (!parentMatcher) {
                this.matcherHierarchy.push(matcher);
            } else {
                parentMatcher.children.push(matcher);
            }
        }

        // getLastDiff() {
        //     return this.lastDiff;
        // }
    }

    /***************************************************
     * helper functions for testing various data types
     ****************************************************/

    function newDiff(v1, v2, key) {
        if (key !== undefined) {
            return [{
                key: key,
                src: v1,
                dst: v2
            }];
        } else {
            return [{
                src: v1,
                dst: v2
            }];
        }

    }

    function testNumber(n) {
        if (typeof n === "number") return true;
        return false;
    }

    function diffNumber(n1, n2) {
        if (n1 !== n2) return newDiff(n1, n2);

        return [];
    }

    function testString(s) {
        if (typeof s === "string") return true;
        return false;
    }

    function diffString(s1, s2) {
        if (s1 !== s2) return newDiff(s1, s2);

        return [];
    }

    function testObject(o) {
        if (typeof o === "object" && o !== null) return true;
        return false;
    }

    function addKeyToDiff(d, key) {
        for (let i = 0; i < d.length; i++) {
            d[i].key = key;
        }

        return d;
    }

    function diffObject(o1, o2) {
        var diff = [];

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
                let d = this.diff(o1[key], o2[key]);
                addKeyToDiff(d, key);
                diff = diff.concat(d);
            } else {
                diff = diff.concat(newDiff(o1[key], o2[key], key));
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
        var diff = [];

        if (!Array.isArray(a1) || !Array.isArray(a2)) {
            throw new TypeError("diffArray got non-array");
        }

        // for the longer of the arrays, create a list of different values
        var len = (a1.length > a2.length) ? a1.length : a2.length;
        for (let i = 0; i < len; i++) {
            // recursive diff
            let d = this.diff(a1[i], a2[i]);
            if (d.length > 0) {
                diff = diff.concat(newDiff(a1[i], a2[i], i));
            }
        }

        return diff;
    }

    function testNull(n) {
        if (n === null) return true;
        return false;
    }

    function diffNull(n1, n2) {
        if (n1 !== n2) return newDiff(n1, n2);
        return [];
    }

    function testBoolean(b) {
        if (typeof b === "boolean") return true;
        return false;
    }

    function diffBoolean(b1, b2) {
        if (b1 !== b2) return newDiff(b1, b2);
        return [];
    }

    function testDate(d) {
        if (d instanceof Date) return true;
        return false;
    }

    function diffDate(d1, d2) {
        if (d1.getTime() !== d2.getTime()) return newDiff(d1, d2);
        return [];
    }

    function testSingleCall(si) {
        if (si instanceof SingleCall) return true;
        return false;
    }

    function testUndef(u) {
        if (u === undefined) return true;
        return false;
    }

    function diffUndef(u1, u2) {
        if (u1 !== u2) return newDiff(u1, u2);
        return [];
    }

    function testRegex(rex) {
        if (rex instanceof RegExp) return true;
        return false;
    }

    function diffRegex(rex1, rex2) {
        if (rex1.toString() !== rex2.toString()) return newDiff(rex1.toString(), rex2.toString());
        return [];
    }

    function testError(e) {
        if (e instanceof Error) return true;
    }

    function diffError(e1, e2) {
        var ret = [];
        if (e1.name !== e2.name) ret = ret.concat(addKeyToDiff(newDiff(e1.name, e2.name), "name"));
        if (e1.message !== e2.message) ret = ret.concat(addKeyToDiff(newDiff(e1.message, e2.message), "message"));
        return ret;
    }

    function diffSingleCall(si1, si2) {
        var argDiff = addKeyToDiff(this.diff(si1.argList, si2.argList), "argList");
        var thisDiff = addKeyToDiff(this.diff(si1.thisArg, si2.thisArg), "thisArg");
        var retDiff = addKeyToDiff(this.diff(si1.retVal, si2.retVal), "retVal");
        var exDiff = addKeyToDiff(this.diff(si1.exception, si2.exception), "exception");

        return [].concat(argDiff, thisDiff, retDiff, exDiff);
    }

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return {
        Wrapper: Wrapper,
        SingleCall: SingleCall,
        Match: Match,
        Trigger: Trigger
    };
}));

/* JSHINT */
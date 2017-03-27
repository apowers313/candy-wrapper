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

    var wrapperCookie = "193fe616-09d1-4d5c-a5b9-ff6f3e79714c";
    var wrapperCookieKey = "uniquePlaceToKeepAGuidForCandyWrapper";

    /**
     * Creates a new function or property wrapper -- a spy, stub, mock, etc.
     *
     * Below are all the different forms of the contructor,
     * which are basically syntactic sugar for creating wrappers
     * around lots of different kinds of things
     *
     * Signatures for Wrapper:
     *      new Wrapper()
     *      new Wrapper(obj)
     *      new Wrapper(func)
     *      new Wrapper(obj, method)
     *      new Wrapper(obj, property)
     *      new Wrapper(obj, method, func)
     *      new Wrapper(obj, property, func)
     *
     * @extends {Function}
     */
    class Wrapper extends Function {

        constructor(...args) {
            super();

            if (args[0] === null) {
                throw new TypeError("Wrapper: bad arguments to constructor. RTFM.");
            }

            // constructed like: wrapper()
            if (args.length === 0) {
                debug("creating empty wrapper");
                return this._callConstructor(function() {});
            }

            // constructed like: wrapper(obj)
            /**
             * Recursively wrap all properties and methods of an object
             * @param  {Object} obj Object to be wrapped
             * @return {Object}    Returns an object with all methods and propertys wrapped
             * @constructor
             */
            if (args.length === 1 && typeof args[0] === "object") {
                var obj = args[0];
                walkObject(obj, function(obj, key) {
                    new Wrapper(obj, key);
                });
                return obj;
            }

            // constructed like: wrapper(func)
            /**
             * Puts a wrapper around a function and returns it
             * @param  {Function} fn Function to be wrapped
             * @return {Wrapper}    Returns the a Proxy for a Wrapper around the function
             * @constructs
             * @memberof Wrapper
             */
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
                if (typeof obj[key] === "function") {
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

        _callConstructor(origFn, wrappedFn) {
            /** @lends Wrapper# */
            this.type = "function";
            this.callList = new Filter(this);
            this.orig = origFn;
            wrappedFn = wrappedFn || origFn;
            this.wrapped = wrappedFn;
            this.chainable = new Proxy(this, {
                apply: (target, context, argList) => this._doCall(target, context, argList)
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

            this.configDefault();
            this.configReset();
            return this.chainable;
        }

        _doCall(target, context, argList) {
            var funcName = this.wrapped.name || "<<anonymous>>";
            debug(`calling wrapper on "${funcName}"`);

            var si = new SingleCall(this, context, argList);

            // run pre-call triggers
            this._runTriggerList("pre", si);

            // run the wrapped function
            var ret, exception;
            try {
                ret = this.wrapped.apply(context, argList);
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

            // throw the exception...
            if (si.exception) throw si.exception;
            // ...or call the callback...
            if (typeof si.callback.fn === "function") {
                let cbFn = si.callback.fn;
                let cbArgs = si.callback.argList || [];
                let cbCtx = si.callback.context || {};
                si.callback.retVal = cbFn.call(cbCtx, ...cbArgs);
            }
            // ...then return the return value.
            return si.retVal;
        }

        _propConstructor(obj, prop, fn) {
            /** @lends Wrapper# */

            /** @type {Object} The results of `getOwnPropertyDescriptor` on the original property, saved so that it can be restored later. */
            this.origPropDesc = Object.getOwnPropertyDescriptor(obj, prop);
            /** @type {any} The current value of the property. */
            this.propValue = this.origPropDesc.value;
            /** @type {Function} An optional custom function that will be called when getting or setting the property. */
            this.setterGetterFn = fn;
            /** @type {String} The type of this Wrapper object. Options are "property" or "function". */
            this.type = "property";
            /** @type {Filter} A list of all the touches (gets / sets) on the property. */
            this.touchList = new Filter(this);

            // create a proxy for the setter / getters
            /** @type {Proxy.<Wrapper>} The thing that is returned representing the Wrapped and is intended to be used for chainable Wrapper calls */
            this.chainable = new Proxy(this, {
                apply: (target, context, argList) => {
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
            // create a new single touch instance
            var st = new SingleTouch(this, type, this.propValue, val);

            debug(`_doSetterGetter ${type} "${val}"`);

            // run pre-call trigger
            this._runTriggerList("pre", st);

            // do the set or get
            if (type === "get" && this.setterGetterFn) {
                st.retVal = this.setterGetterFn(type);
            } else if (type === "set" && this.setterGetterFn) {
                st.retVal = this.setterGetterFn(type, st.setVal);
            } else if (type === "set") {
                // if no setter / getter function, just used the cached propValue
                st.retVal = st.setVal;
                this.propValue = st.setVal;
            }

            // run post-call trigger
            this._runTriggerList("post", st);
            debug("final st", st);

            // save this touch for future reference
            this.touchList.push(st);

            // always return the value
            debug("settergetter returning", st.retVal);
            if (st.exception) throw st.exception;
            return st.retVal;
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
         * Asserts that the current Wrapper is wrapping an property.
         * @param  {String} callerName The name of the calling function, to be included in
         * the error message if the assertion fails.
         * @throws {Error} If Current Wrapper is not wrapping an property.
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
         * Works on functions, methods, and propertys. This function has multiple signatures as illustrated
         * below.
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
         * @return {Boolean} Returns `true` if the arguments are a Wrapper, `false` otherwise
         */
        static isWrapper(...args) {
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

                // property is a function
                if (typeof obj[key] === "function")
                    return Wrapper.isWrapper(obj[key]);

                if (typeof obj[key] === "object")
                    return false;

                let desc = Object.getOwnPropertyDescriptor(obj, key);
                if (desc === undefined)
                    return false;

                if (typeof desc.set !== "function" ||
                    typeof desc.get !== "function")
                    return false;
                return (Wrapper.isWrapper(desc.set) && Wrapper.isWrapper(desc.get));
            }

            throw new TypeError("isWrapper: unsupported arguments");
        }

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
                expectThrowOnTrigger: true,
                expectThrow: false
            };
        }

        /**
         * Resets the wrapper to its default state. Clears out all records of previous calls,
         * expected behaviors, pass / fail results, etc. This does not reset any configuration options,
         * which {@link configDefault} can be used for.
         * @return {Wrapper} Returns the Wrapper object so that this call can be chained
         */
        configReset() {
            /** @lends Wrapper# */
            /** @type {Array<Trigger>} A list of {@link Trigger}s to be run whenever this Wrapper is called. */
            this.triggerList = [];
            /** @type {Array<String>} List of messages from failed `expect` calls. */
            this.expectMessageList = [];
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
            this.callList.length = 0;
        }

        _configPropReset() {
            this.touchList.length = 0;
        }

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

        expectValidateAll(clear) {
            if (this.expectPassed) return true;
            var message = `${this.expectMessageList.length} expectation(s) failed:\n`;
            for (let idx in this.expectMessageList) {
                let newMsg = "          " + this.expectMessageList[idx] + "\n";
                message = message.concat(newMsg);
            }

            if (clear) {
                this.expectMessageList.length = 0;
                this.expectPassed = true;
            }

            throw new ExpectError(message);
        }

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
         * w.triggerOnArgs("drink", "beer")
         *      .actionReturn("yum!");
         *
         * // call the wrapped method and see what happens...
         * obj.method("drink", "beer") // returns "yum!"
         */
        triggerOnArgs(...args) {
            this._funcOnly();
            var m = Match.value([...args]);
            var t = new Trigger(this, function(single) {
                return m.compare(single.argList);
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
         * w.triggerOnContext({location: "home"})
         *      .actionThrowException(new Error("You should be at work right now."));
         *
         * // call the wrapped method and see what happens...
         * obj.method.call({location: "home"}, "hi mom") // throws "You should be at work right now."
         */
        triggerOnContext(context) {
            this._funcOnly();
            validateArgsSingleObject("triggerOnContext", context);
            var m = Match.value(context);
            var t = new Trigger(this, function(single) {
                var ret = m.compare(single.context);
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
            this._funcOnly();
            validateArgsSingleNumber("triggerOnCallNumber", num);
            var count = 0;
            var t = new Trigger(this, function(single) {
                var ret = (count === num);
                if (single.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnException(e) {
            validateArgsSingleException("triggerOnException", e);
            var m = Match.value(e);
            var t = new Trigger(this, function(single) {
                var ret = m.compare(single.exception);
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnReturn(retVal) {
            validateArgsSingle("triggerOnReturn", retVal);
            var m = Match.value(retVal);
            var t = new Trigger(this, function(single) {
                var ret = m.compare(single.retVal);
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        // Every trigger gets called twice, once before and once after the actual call / touch,
        // ostensibly so that it can modify arguments or context before the call or so that it can
        // modify the return value or exceptions thrown after a call.
        // The `single` value passed in to the `callback` contains two properties for identifying
        // and controlling behavior pre- and post- call / touch. `single.preCall` will be `true` before
        // the call, and `false` afterwards; and `single.postCall` will be `true` after the call and
        // `false` before.
        // Throwing an exception in a custom trigger is not advised since it may adversely effect the
        // behavior of the wrapper. If you want the wrapper to throw an exception, set `single.exception`
        // to a `new Error()`; however, this is best done through an action anyway.
        triggerOnCustom(fn) {
            validateArgsSingleFunction("triggerOnCustom", fn);
            var t = new Trigger(this, fn);
            this.triggerList.push(t);
            return t;
        }

        triggerOnSet() {
            this._propOnly();
            var t = new Trigger(this, function(single) {
                if (single.type === "set") return true;
                return false;
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnSetVal(setVal) {
            this._propOnly();
            validateArgsSingle("triggerOnSetVal", setVal);
            var m = Match.value(setVal);
            var t = new Trigger(this, function(single) {
                return m.compare(single.setVal);
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnSetNumber(num) {
            this._propOnly();
            validateArgsSingleNumber("triggerOnSetNumber", num);

            var count = 0;
            var t = new Trigger(this, function(single) {
                if (single.type !== "set") return false;
                var ret = (count === num);
                if (single.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnGet() {
            this._propOnly();
            var t = new Trigger(this, function(single) {
                if (single.type === "get") return true;
                return false;
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnGetNumber(num) {
            this._propOnly();
            validateArgsSingleNumber("triggerOnGetNumber", num);

            var count = 0;
            var t = new Trigger(this, function(single) {
                if (single.type !== "get") return false;
                var ret = (count === num);
                if (single.postCall) count++;
                return ret;
            });
            this.triggerList.push(t);
            return t;
        }

        triggerOnTouchNumber(num) {
            this._propOnly();
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
     * A class for expect... calls. Gets mixed in to `Triggers` as well as
     * `SingleCall` and `SingleTouch`.
     */
    class Expect {
        constructor() {
            /**
             * Evaluates whether the `call` or `get` returned the value `retVal`.
             * @name expectReturn
             * @function
             * @memberof Expect
             * @param  {any} retVal       The value that is expected to be returned from the function call or property getter.
             * @return {Trigger|Boolean}  When called on a {@link Trigger}, the expectation is stored for future evaluation and the `Trigger` value is returned to make this chainable.
             * When called on a {@link SingleCall} or {@link SingleTouch}, the expectation is evaluated immediately and `true` is returned if the expectation passed; `false` if it failed.
             * @instance
             */
            alias(this, "expectReturn",
                this._expect, "expectReturn", "both", "post", validateArgsSingle,
                function(single, retVal) {
                    var m = Match.value(retVal);
                    if (m.compare(single.retVal)) {
                        return null;
                    }
                    return "expectReturn: expectation failed for: " + retVal;
                });

            alias(this, "expectCallArgs",
                this._expect, "expectCallArgs", "function", "pre", validateArgsAny,
                function(single, ...args) {
                    var m = Match.value(args);
                    if (m.compare(single.argList)) {
                        return null;
                    }
                    return "expectCallArgs: expectation failed for: " + args;
                });

            alias(this, "expectContext",
                this._expect, "expectContext", "function", "pre", validateArgsSingleObject,
                function(single, context) {
                    var m = Match.value(context);
                    if (m.compare(single.context)) {
                        return null;
                    }
                    return "expectContext: expectation failed for: " + context;
                });

            alias(this, "expectException",
                this._expect, "expectException", "both", "post", validateArgsSingleException,
                function(single, exception) {
                    var m = Match.value(exception);
                    if (m.compare(single.exception)) {
                        return null;
                    }
                    console.log ("diff", m.lastDiff);
                    return "expectException: expectation failed for: " + exception;
                });

            alias(this, "expectSetVal",
                this._expect, "expectSetVal", "property", "post", validateArgsSingle,
                function(single, setVal) {
                    var m = Match.value(setVal);
                    if (m.compare(single.setVal)) {
                        return null;
                    }
                    return "expectSetVal: expectation failed for: " + setVal;
                });

            // returns string or null
            alias(this, "expectCustom",
                this._expect, "expectCustom", "both", "post", validateArgsFirstFunction,
                function(single, fn, ...args) {
                    return fn.call(this, single, ...args);
                });
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
            if (this instanceof SingleCall) return this;
            if (this instanceof SingleTouch) return this;
            if (this instanceof Trigger && this.currentCall) return this.currentCall;
            return this._addDeferredAction(name, args);
        }

        _softAssert(message) {
            var passed = (message === null) ? true : false;

            if (!passed) {
                // see if the config says we should throw
                if ((this instanceof Trigger && this.wrapper.config.expectThrowOnTrigger) ||
                    this.wrapper.config.expectThrow) {
                    throw new ExpectError(message);
                }

                // otherwise store the message for future reference
                this.wrapper.expectMessageList.push(message);
            }

            this.wrapper.expectPassed = this.wrapper.expectPassed && passed;
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
            var passed = this._softAssert(msg);

            return passed;
        }
    }

    /**
     * An Error thrown by a failed {@link Expect} call.
     * @extends {Error}
     */
    class ExpectError extends Error {
        constructor(message) {
            super(message);
            this.name = "ExpectError";
        }
    }

    /**
     * Methods for filtering the `callList` or `touchList` of a {@link Wrapper}.
     * @extends {Array}
     */
    class Filter extends Array {
        constructor(wrapper, ...args) {
            super(...args);
            this.wrapper = wrapper;

            /**
             * When called, will return the members of the `Filter` that were occurances of when the property was set. Only works for properties.
             * @name filterPropSet
             * @function
             * @memberof Filter
             * @instance
             */
            alias(this, "filterPropSet",
                this._filter, "filterSet", "property",
                function(element) {
                    if (element.type === "set") return true;
                });

            /**
             * When called, will return the members of the `Filter` that were occurances of when the property was retrieved (i.e. `get`). Only works for properties.
             * @name filterPropGet
             * @function
             * @memberof Filter
             * @instance
             */
            alias(this, "filterPropGet",
                this._filter, "filterGet", "property",
                function(element) {
                    if (element.type === "get") return true;
                });

            alias(this, "filterPropSetByVal",
                this._filter, "filterPropSetByVal", "property",
                function(element, index, array, ...args) {
                    validateArgsSingle("filterPropSetByVal", ...args);
                    var setVal = args[0];

                    var m = Match.value(setVal);
                    return m.compare(element.setVal);
                });

            alias(this, "filterCallByArgs",
                this._filter, "filterCallByArgs", "function",
                function(element, index, array, ...args) {
                    var m = Match.value([...args]);
                    return m.compare(element.argList);
                });

            alias(this, "filterCallByContext",
                this._filter, "filterCallByContext", "function",
                function(element, index, array, ...args) {
                    validateArgsSingleObject("filterCallByContext", ...args);
                    var context = args[0];

                    var m = Match.value(context);
                    return m.compare(element.context);
                });

            alias(this, "filterByException",
                this._filter, "filterByException", "both",
                function(element, index, array, ...args) {
                    validateArgsSingleException("filterByException", ...args);
                    var exception = args[0];

                    var m = Match.value(exception);
                    return m.compare(element.exception);
                });

            alias(this, "filterByReturn",
                this._filter, "filterByReturn", "both",
                function(element, index, array, ...args) {
                    var retVal = args[0];

                    var m = Match.value(retVal);
                    return m.compare(element.retVal);
                });

            alias(this, "getAllCallArgs",
                this._get, "getAllCallArgs", "function", "argList");
            alias(this, "getAllCallContexts",
                this._get, "getAllCallContexts", "function", "context");
            alias(this, "getAllExceptions",
                this._get, "getAllExceptions", "both", "exception");
            alias(this, "getAllReturns",
                this._get, "getAllReturns", "both", "retVal");
            alias(this, "getAllSetVals",
                this._get, "getAllSetVals", "property", "setVal");

            alias(this, "filterFirst", this.filterByNumber, 0);
            alias(this, "filterSecond", this.filterByNumber, 1);
            alias(this, "filterThird", this.filterByNumber, 2);
            alias(this, "filterFourth", this.filterByNumber, 3);
            alias(this, "filterFifth", this.filterByNumber, 4);
        }

        _filter(name, type, fn, ...args) {
            if (type === "property") this.wrapper._propOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            return this.filter(function(element, index, array) {
                return fn(element, index, array, ...args);
            });
        }

        _get(name, type, idx) {
            if (type === "property") this.wrapper._propOnly(name);
            if (type === "function") this.wrapper._funcOnly(name);

            return this.map(function(element) {
                return element[idx];
            });
        }

        filterOnly() {
            if (this.length !== 1) {
                throw new TypeError("filterOnly: expected exactly one value");
            }

            return this[0];
        }

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

        filterLast() {
            if (this.length === 0) {
                throw new RangeError("filterlast: empty list");
            }

            return this[this.length - 1];
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
     * A representation of a single `get` or `set` on an property.
     * @extends {Expect}
     */
    class SingleTouch extends Expect {
        constructor(wrapper, type, retVal, setVal, exception) {
            super();

            this.wrapper = wrapper;
            this.type = type;
            this.setVal = setVal;
            this.retVal = retVal;
            this.exception = exception || null;
        }
    }

    /**
     * A representation of a single function call.
     * @extends {Expect}
     */
    class SingleCall extends Expect {
        constructor(wrapper, context, argList, retVal, exception) {
            super();

            // this.calledWithNew = context.new && context.new.target;
            this.wrapper = wrapper;
            this.preCall = false;
            this.postCall = false;
            this.context = context;
            this.argList = argList;
            this.retVal = retVal;
            this.exception = exception || null;
            this.callback = {};
        }
    }

    /**
     * A `Trigger` determines what `expect` or `action` calls get run on a wrapped
     * function or property. Triggers usally get created by calling a trigger function
     * on the {@link Wrapper}. Note that triggers are always run in the order that they
     * are added to a `Wrapper`, and any expectations or actions on a trigger are run
     * in the order they were added to the `Trigger`.
     * @extends {Expect}
     * @example
     * var wrapper = new Wrapper(something);
     * wrapper.triggerAlways()          // every time the wrapper is called...
     *     .expectArgs("abc", 123)      // ...error if the wrong args are not `"abc"` and `123`...
     *     .actionReturn(true);         // ...and always change the return value of the function to `true`
     */
    class Trigger extends Expect {
        constructor(wrapper, triggerFn) {
            super();

            if (!(wrapper instanceof Wrapper)) {
                throw new TypeError("Trigger constructor: expected first argument to be of type Wrapper");
            }

            if(typeof triggerFn !== "function") {
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
             * @memberof Trigger
             * @instance
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
             * @param  {Trigger#actionCustom~requestCallback}    fn  The function to be run when this action is triggered.
             * @return {Trigger}         Returns this `Trigger`, so that further actions or expectations can be chained.
             */
            alias(this, "actionCustom",
                this._action, "actionCustom", "both", "both", validateArgsFirstFunction,
                function(curr, fn, ...args) {
                    return fn.call(this, curr, ...args);
                });
            /**
             * The callback
             * @callback Trigger#actionCustom~requestCallback
             * @param {SingleCall|SingleTouch} current The currently executing function or property touch.
             * @param {...any} args The arguments that were passed to the function call or property setter.
             */

            alias(this, "actionReturnFromArg",
                this._action, "actionReturnFromArg", "function", "post", validateArgsSingleNumber,
                function(curr, num) {
                    curr.retVal = curr.argList[num];
                });

            alias(this, "actionReturnContext",
                this._action, "actionReturnContext", "function", "post", validateArgsNone,
                function(curr) {
                    curr.retVal = curr.context;
                });

            alias(this, "actionReturnFromContext",
                this._action, "actionReturnFromContext", "function", "post", validateArgsSingleString,
                function(curr, prop) {
                    curr.retVal = curr.context[prop];
                });

            alias(this, "actionThrowException",
                this._action, "actionThrowException", "both", "post", validateArgsSingleException,
                function(curr, err) {
                    curr.exception = err;
                });

            alias(this, "actionSetVal",
                this._action, "actionSetVal", "property", "pre", validateArgsSingle,
                function(curr, setVal) {
                    curr.setVal = setVal;
                });

            alias(this, "actionReturnPromise",
                this._action, "actionReturnPromise", "both", "post", validateArgsNoneOrOne,
                function(curr, retVal) {
                    retVal = retVal || curr.retVal;
                    curr.retVal = Promise.resolve(retVal);
                });

            alias(this, "actionRejectPromise",
                this._action, "actionRejectPromise", "both", "post", validateArgsNoneOrOneException,
                function(curr, e) {
                    e = e || curr.exception;
                    curr.exception = null;
                    curr.retVal = Promise.reject(e);
                });

            alias(this, "actionCallbackFunction",
                this._action, "actionCallbackFunction", "function", "post", validateArgsSingleFunction,
                function(curr, fn) {
                    curr.callback.fn = fn;
                });

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

            alias(this, "actionCallbackContext",
                this._action, "actionCallbackContext", "function", "post", validateArgsSingleObject,
                function(curr, context) {
                    curr.callback.context = context;
                });

            alias(this, "actionCallbackArgs",
                this._action, "actionCallbackArgs", "function", "post", validateArgsAny,
                function(curr, ...args) {
                    curr.callback.argList = args;
                });
        }

        run(si) {
            // check trigger to see if it should run
            if (!this.triggerFn.call(this, si)) return;

            // perform actions
            this.currentCall = si;
            for (let idx in this.actionList) {
                let action = this.actionList[idx];
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
    function validateArgsSingleObject(name, ...args) {
        if (args.length !== 1 ||
            typeof args[0] !== "object") {
            throw new TypeError(`${name}: expected a single argument of type Object`);
        }
    }

    function validateArgsSingleException(name, ...args) {
        if (args.length !== 1 ||
            !(args[0] instanceof Error)) {
            throw new TypeError(`${name}: expected a single argument of type Error`);
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

        static value(arg) {
            return new Match({
                value: arg
            });
        }

        compare(any) {
            var d = this.diff(this.value, any);
            this.lastDiff = d;
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

    function diffNull() {
        // guaranteed that both n1 and n2 are of type "null"
        // since there's no different types of null, there can be no real diff here
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

    function diffUndef() {
        // guaranteed that both n1 and n2 are of type "undefined"
        // since there's no different types of undefined, there can be no real diff here
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
        var thisDiff = addKeyToDiff(this.diff(si1.context, si2.context), "context");
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
        Trigger: Trigger,
        ExpectError: ExpectError
    };
}));

/* JSHINT */
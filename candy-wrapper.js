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
        console.log(...args);
    }

    var wrapperCookie = "193fe616-09d1-4d5c-a5b9-ff6f3e79714c";

    class Expect {
        constructor() {
            this.futureMatch = [];
        }

        addDeferredAction(name, args) {
            var action = {
                name: name,
                args: args
            };
            console.log ("adding action:", action);
            this.actionList.push(action);
        }

        getCurrCallOrDefer(name, ...args) {
            console.log ("getCurrCallOrDefer");
            if (this instanceof SingleInvocation) return this;
            console.log ("checking currCall");
            if (this instanceof Trigger && this.currentCall instanceof SingleInvocation) return this.currentCall;
            console.log ("deferring");
            var argArray = [...args];
            if (typeof this.addDeferredAction === "function") this.addDeferredAction(name, argArray);
        }

        expectDoValidation(si) {
            this[this.expectType](si, this.expectParam);
        }

        expectCallArgs(...args /*, siRef */ ) {
            var passed = false;
            var newSi = new SingleInvocation();
            newSi.argList = args;
            var siRef;

            if (arguments.length === 2 && arguments[1] instanceof SingleInvocation) {
                siRef = arguments[1];
            } else if (arguments.length !== 1 || !Array.isArray(args)) {
                throw new TypeError("expectCallArgs: expected a single args array for an argument");
            }

            var match = new Match(siRef);

            // if future evaluation, save the match
            this.futureMatch.push(new Match(siRef));

            // if evaluate now, check and return
            match.compare(siRef);

            return passed;
        }

        // expectCallArgs(si)
        // expectContext(si)
        // expectReturn(si)
        // expectException(si)
        // expectCustom (fn, param)
    }

    /**
     * Creates a new function wrapper -- a spy, stub, mock, etc.
     * @class
     */
    class Wrapper extends Function {
        /**
         * This is a constructor
         * @return {Wrapper} Proxy around a Wrapper object
         */
        constructor() {
            super();

            // forms of wrapper:
            // wrapper()
            // wrapper(obj)
            // wrapper(func)
            // wrapper(obj, method)
            // wrapper(obj, attribute)
            // wrapper(obj, method, func)
            // wrapper(obj, attribute, func)

            // constructed like: wrapper()
            if (arguments.length === 0) {
                debug("creating empty wrapper");
                this.wrapped = function() {};
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
                debug("wrapping function");
                this.wrapped = arguments[0];
            }

            // set default values
            this.configReset();

            this.chainable = new Proxy(this, {
                apply: (target, thisArg, argList) => this._doCall(target, thisArg, argList)
            });

            return this.chainable;
        }

        _doCall(target, thisArg, argList) {
            var funcName = this.wrapped.name || "<<anonymous>>";
            debug(`calling wrapper on "${funcName}"`);

            var si = new SingleInvocation(thisArg, argList);

            // checkAndRun pre-triggers
            si.postCall = !(si.preCall = true); // only evalute pre calls
            for (let idx in this.triggerList) {
                let trigger = this.triggerList[idx];
                trigger.run(si);
            }

            // run the wrapped function
            var ret, exception;
            try {
                ret = this.wrapped.apply(thisArg, argList);
            } catch (ex) {
                exception = ex;
            }
            si.retVal = ret;
            si.exception = exception;

            // checkAndRun post-triggers
            si.postCall = !(si.preCall = false); // only evaluate post calls
            for (let idx in this.triggerList) {
                let trigger = this.triggerList[idx];
                trigger.run(si);
            }
            console.log ("final si", si);

            // save call
            si.postCall = si.preCall = true; // in the future evaulate both pre and post calls
            this.callList.push(si);

            return si.retVal;
        }

        _softAssert(passed, message) {
            if (!passed) {
                this.expectMessageList.push(message);
            }

            this.expectPassed = this.expectPassed && passed;
            return this.expectPassed;
        }

        /**
         * Resets the wrapper to its default state. Clears out all records of previous calls,
         * expected behaviors, pass / fail results, etc.
         * @return {Wrapper} Returns the Wrapper object so that this call can be chained
         */
        configReset() {
            this.callList = [];
            this.triggerList = [];
            this.expectMessageList = [];
            this.expectPassed = true;
            this.wrapperCookie = wrapperCookie;

            return this.chainable;
        }

        selectOneByCallNumber(num) {
            var callCount = this.callList.length;
            if (typeof num !== "number" || num < 0) {
                throw new TypeError(`selectOneByCallNumber: bad call number argument: ${num}`);
            }
            if (num >= callCount) {
                throw new RangeError(`selectOneByCallNumber: ${num} is more than the number of calls made`);
            }

            return this.callList[num];
        }

        // selectOneByArgs() {}
        // selectOneByContext() {}
        // selectOneByException() {}
        // selectOneByReturn() {}
        // selectByArgs() {}
        // selectByContext() {}
        // selectByException() {}
        // selectByReturn() {}

        expectCallCount(count) {
            var passed = (this.callList.length === count);

            this._softAssert(passed, `expected to be called ${count} times`);

            return passed;
        }

        expectCallCountRange(min, max) {
            var callCount = this.callList.length;
            var passed = (callCount >= min) && (callCount <= max);

            this._softAssert(passed, `expected to be called between ${min} and ${max} times, was called ${callCount} times`);

            return passed;
        }

        triggerAlways() {
            var t = new Trigger(this, function() {
                return true;
            });
            this.triggerList.push(t);
            return t;
        }
    }

    class SingleInvocation extends Expect {
        constructor(thisArg, argList, retVal, exception) {
            super();
            // this.calledWithNew = thisArg.new && thisArg.new.target;
            this.preCall = false;
            this.postCall = false;
            this.thisArg = thisArg;
            this.argList = argList;
            this.retVal = retVal;
            this.exception = exception;
        }
    }

    class Trigger extends Expect {
        constructor(wrapper, triggerFn) {
            super();
            this.wrapper = wrapper;
            this.triggerFn = triggerFn;
            this.currentCall = null;
            this.actionList = [];
        }

        run(si) {
            console.log("run");
            // check trigger to see if it should run
            if (!this.triggerFn.call(this, si)) return;

            // perform actions
            this.currentCall = si;
            console.log ("actionList", this.actionList);
            for (let idx in this.actionList) {
                let action = this.actionList[idx];
                console.log ("action name", action.name);
                console.log ("action args", action.args);
                this[action.name](...action.args);
            }
            this.currentCall = null;
        }

        actionReturn(retVal) {
            console.log ("actionReturn:", retVal);
            // get the current call, or save the args for when the call is actually run
            var curr = this.getCurrCallOrDefer("actionReturn", retVal);
            console.log ("curr", curr);
            // if there isn't a current call, return 'this' to enable chaining
            if (!curr || !curr.postCall) return this; // chainable
            // run the action
            console.log ("!!! SET RETVAL");
            curr.retVal = retVal;
            console.log ("set curr", curr);

            return this;
        }
    }

    class Match {
        constructor(opts) {
            // if !opts throw
            if (opts.value !== undefined) {
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
            this.extend("singleinvocation", "object", testSingleInvocation, diffSingleInvocation);
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
            console.log("diff: matcher:", matcher);
            if (!matcher) {
                console.log("common type not found, returning diff");
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
                    console.log("matcher found:", matcher.name);
                    // recursively check any children for the type
                    let nextType = this.getType(any, matcher.children);
                    console.log("next type:", nextType);
                    return (nextType ? nextType : matcher);
                } else {
                    console.log("didn't match:", matcher.name);
                }
            }

            return null;
        }

        findCommonType(matcher1, matcher2) {
            // convert values to matchers
            if (!this.isMatcher(matcher1)) {
                debug("findCommonType: converting matcher1 value to matcher:", matcher1);
                matcher1 = this.getType(matcher1);
                console.log("matcher1:", matcher1);
            }
            if (!this.isMatcher(matcher2)) {
                debug("findCommonType: converting matcher2 value to matcher:", matcher2);
                matcher2 = this.getType(matcher2);
                console.log("matcher2:", matcher2);
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
            console.log("commonType:", commonType);

            // resolve common type name to matcher object
            if (commonType) {
                commonType = this.matcherList.get(commonType);
            }

            return commonType;
        }

        isMatcher(matcher) {
            console.log("isMatcher:", matcher);
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
            if (this.matcherList.has(name)) {
                throw new TypeError(`Match.extend: ${name} already exists`);
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

        getLastDiff() {
            return this.lastDiff;
        }
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

        console.log("returning diff:", diff);
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
        console.log("diff boolean:", b1, ",", b2);
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

    function testSingleInvocation(si) {
        if (si instanceof SingleInvocation) return true;
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
        if (rex1.toString !== rex2.toString) return newDiff(rex1.toString, rex2.toString);
        return [];
    }

    function diffSingleInvocation(si1, si2) {
        console.log("si1.argList", si1.argList);
        console.log("si2.argList", si2.argList);
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
        SingleInvocation: SingleInvocation,
        Match: Match,
        Trigger: Trigger
    };
}));

/* JSHINT */
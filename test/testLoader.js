// XXX: loader has to run inside a test, or mocha doesn't wait for Promises to resolve
describe("test loader", function() {
    it("runs all tests", function() {
        this.timeout(10000);

        var testList = [
            "unit/exampleTest.js",
            "unit/wrapperTest.js",
            "unit/rewrapTest.js",
            "unit/unwrapTest.js",
            "unit/helpersTest.js",
            "unit/operationTest.js",
            "unit/filterTest.js",
            "unit/triggerTest.js",
            "unit/sandboxTest.js",
            "unit/matchTest.js",
            "unit/interfaceTest.js",
        ];

        // uses node's require to load a script
        function nodeLoadScript(scriptName) {
            return new Promise(function(resolve) {
                // console.log("node loading:", scriptName);
                return resolve(require(__dirname + "/" + scriptName));
            });
        }

        // dynamically creates a <script> tag and loads a script into it
        function browserLoadScript(scriptName) {
            return new Promise(function(resolve, reject) {
                console.log("browser loading", scriptName);

                // dynamic loading of script by creating new <script> tag and seeing the src=
                var scriptElem = document.createElement("script");
                if (typeof scriptElem !== "object") {
                    return reject(new Error("ensureInterface: Error creating script element while loading polyfill"));
                }
                scriptElem.type = "application/javascript";
                scriptElem.onload = function() {
                    return resolve();
                };
                scriptElem.onerror = function() {
                    return reject(new Error("navigator.authentication does not exist"));
                };
                scriptElem.src = scriptName;
                if (document.body) {
                    document.body.appendChild(scriptElem);
                } else {
                    return reject(new Error("ensureInterface: DOM has no body"));
                }
            });
        }

        // figure out which version of script loading we are doing
        var loadScript;
        if (typeof module === "object" && module.exports) {
            // running in node.js
            loadScript = nodeLoadScript;
        } else {
            // running in browser
            loadScript = browserLoadScript;
        }

        // run all promises sequentially
        var p = Promise.resolve();
        for (let i = 0; i < testList.length; i++) {
            p = p.then(function() {
                return loadScript(testList[i]);
            });
        }
        // return a promise to keep mocha happy
        return p;
    });
})
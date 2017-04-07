var assert = assert || chai.assert;
var Wrapper = CandyWrapper.Wrapper;
var Match = CandyWrapper.Match;
var Trigger = CandyWrapper.Trigger;
var Filter = CandyWrapper.Filter;
var Operation = CandyWrapper.Operation;
var ExpectError = CandyWrapper.ExpectError;
var Sandbox = CandyWrapper.Sandbox;

/* JSHINT */
/* globals chai, CandyWrapper */

describe("example", function() {
    it("spy on square", function() {
        // our simple square function, squares the number passed in
        // throws error if the argument isn't a number
        var square = function(num) {
            if (typeof num !== "number") {
                throw new TypeError("expected argument to be Number");
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
        } catch (e) {}
        square(3);
        square(5);

        square.historyList.filterFirst().expectReturn(4); // true
        square.historyList.filterSecond().expectReturn(16); // true
        square.historyList.filterThird().expectException(new TypeError("expected argument to be Number")); // true
        square.historyList.filterFourth().expectReturn(10); // false, actually returned 9
        square.historyList.filterFifth().expectReturn(23); // false, actually returned 25

        assert.throws(function() {
            square.expectReportAllFailures();
            // ExpectError: 2 expectation(s) failed:
            //     expectReturn: expectation failed for: 10
            //     expectReturn: expectation failed for: 23
        }, ExpectError);
    });

    it("stub fake database", function() {
        var fakeDb = {};
        fakeDb.getUser = new Wrapper();
        fakeDb.listUsers = new Wrapper();
        fakeDb.getUser.triggerOnCallArgs("apowers")
            .actionReturn({
                username: "apowers",
                firstName: "Adam",
                lastName: "Powers"
            });
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

        var user = fakeDb.getUser("apowers");
        assert.deepEqual(user, {
            username: "apowers",
            firstName: "Adam",
            lastName: "Powers"
        });
        var userList = fakeDb.listUsers();
        assert.deepEqual(userList, [{
            username: "apowers",
            firstName: "Adam",
            lastName: "Powers"
        }, {
            username: "bhope",
            firstName: "Bob",
            lastName: "Hope"
        }]);
    });

    it("mock database timeout", function() {
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

        assert.doesNotThrow(function() {
            mysqlDbInterface.getUser();
        });
        assert.doesNotThrow(function() {
            mysqlDbInterface.getUser();
        });
        assert.throws(function() {
            mysqlDbInterface.getUser();
        }, Error, "Connection to mySQL timed out");
    });

    it("monkey patching Math.random", function() {
        new Wrapper(Math, "random", function() {
            return 1.2345; // this is where you would call your DRNG...
        });
        assert.isTrue(Wrapper.isWrapper(Math, "random"));
        assert.strictEqual(Math.random(), 1.2345);
        Wrapper.unwrap(Math, "random");
        assert.notEqual(Math.random(), 1.2345);
    });

    it.skip("power object", function() {
        var powerObject = {
            exponent: 2,
            pow: function(num) {
                var ret = 1;

                for (let i = 0; i < this.exponent; i++) ret *= num;

                return ret;
            }
        };

        new Wrapper(powerObject, "pow");

        // powerObject.pow(0);
        // powerObject.pow(1);
        // powerObject.pow(2);
        // powerObject.pow(3);
        powerObject.pow(3);

        // powerObject.pow.historyList.filterFirst().expectReturn(0);
        // powerObject.pow.historyList.filterSecond().expectReturn(1);
        // powerObject.pow.historyList.filterThird().expectReturn(4);
        // powerObject.pow.historyList.filterFourth().expectReturn(9);
        powerObject.pow.historyList.filterFirst().expectReturn(13);
        powerObject.pow.expectReportAllFailures();

        console.log(powerObject.pow.historyList[0].retVal);
        console.log(powerObject.pow.historyList[1].retVal);
    });
});
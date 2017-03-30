If you have never used wrappers or candy-wrapper before, this is a good place to start. It will give you an overview of what a `Wrapper` is and how you can use them for lots of different things. Reading this tutorial shouldn't take more than five minutes and will give you a new tool for testing and development.

## What is a Wrapper?
{@link Wrapper} is the main class for candy-wrapper. A wrapper goes around an existing function, method, or property
enabling you to monitor the behavior of the underlying wrapped thing, and optionally changing the behavior of
the wrapped thing when you want to. Let's start with looking at how to create a `Wrapper`:

``` js
var myObject = {
    name: "Daisy",
    dance: function() {
         console.log ("Look at me! I'm dancing!");
    }
}

new Wrapper(myObject, "name");
new Wrapper(myObject, "dance");

console.log (myObject.name); // "Daisy"
myObject.dance(); // "Look at me! I'm dancing!"
```

The code above creates a wrapper around the `name` property and around the `dance` method, but it doesn't modify their behavior. So, what's different? Now you can review the history of every time a wrapper is called or optionally change the
perceived behavior of the wrapped thing. The next couple sections will walk you through how to do that.

## Wrapper History
Every `Wrapper` has a history of how it has been called in it's `historyList`. This allows you to look at how the function has been called. I created this new object that, in theory,
should raise `num` to the `exponent`. For example, if `num` is 3 and `exponent` is 2, the result should be 3<sup>2</sup> = 9. It's basically a harder to use version of [Math.pow()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow), but it will allow us to play around with viewing the history of both `exponent` and `pow`.

``` js
var powerObject = {
    exponent: 2,
    pow: function(num) {
         var ret = 1;

         for (let i = 0; i < this.exponent; i++) ret *= num;

         return ret;
    }
};
```

Let's start by wrapping the powerObject. There are two ways to do this. The first is to wrap everything in the object:

``` js
new Wrapper(powerObject, "exponent");
new Wrapper(powerObject, "pow");
```

That looks just like how we did it in the previous section. But there's an easier way too:

``` js
new Wrapper(powerObject);
```

That just wrapped ALL the properties and methods on the object. In this case it makes two lines of code into one, but with large objects it could be pretty handy.

Now let's get on to the meat of this section: does my `powerObject` work the way I expect? Let's find out by looking at the historyList:

``` js
powerObject.pow(3);
powerObject.pow(5);

console.log(powerObject.pow.historyList[0].retVal); // 3^2 = 9
console.log(powerObject.pow.historyList[1].retVal); // 5^2 = 25
```

Every time `powerObject.pow()` it added a new {@link SingleRecord} to the `historyList` `Array`. `powerObject.pow()` behaves the exact same, but the `Wrapper` allows us to look at what happened every time it was called.

That's one way of looking at the calls to `powerObject.pow()`, but it's not very easy to read. Here is another way of checking out the history of `powerObject.pow()`:

``` js
powerObject.pow(3);
powerObject.pow(5);

powerObject.pow
    .filterFirst()
    .expectReturn(9); // true
powerObject.pow
    .filterSecond()
    .expectReturn(25); // true
```

There are two things going on there. First, the `historyList` is actually a {@link Filter} and `Filters` provide some convenient ways of accessing specific items in the `historyList`. The `filterFirst()` function is essentially the same as `historyList[0]`, but as we will see later there are other filters that allow more sophisticated ways of what's in the `historyList`.

The second thing that's going on is the use of the `expectReturn()` method. Every {@link SingleRecord} in the `historyList` has a set of expectation methods on it, allowing you to check whether your expectations for that call have been met. The expectations return `true` or `false` depending on whether the expectation was met. You can use these expectations with your favorite assertion library, like [Chai](http://chaijs.com/). Or if you want to throw an `Error` when expectations aren't met, you can do this:

``` js
powerObject.pow(3);
powerObject.pow(5);

powerObject.pow
    .filterFirst()
    .expectReturn(13); // false
powerObject.pow
    .expectReportAllFailures();
// throws an error:
// ExpectError: 1 expectation(s) failed: ...
```

Well, that's easy. Just add all the expectations you want and check them all at the end to get a list of how many and which ones failed.

Of course, this all works with properties as well. Let's look at that:

``` js
powerObject.exponent = 3;

powerObject.pow
    .filterFirst()
    .expectSetVal(3); // true
```

That's just the tip of the iceberg -- there are all kinds of {@link Filter Filters} and {@link SingleRecord expectations} that you can play around with. Before you start experimenting more, it is worth pointing out that there is a pattern to how the expectations and filters are named.

* Return - the return value from a function or property get.
* Exception - the `Error` that was thrown by a function or property get / set, or `null` for no `Error`.
* CallArgs - the arguments passed to a function.
* SetVal - the value that a property was set to.
* CallContext - the `this` value of a function.

These are used repeatedly throughout the APIs. So if you want to filter a `historyList` by what arguments were used to call the function, you can do `filterByCallArgs`. And if you expect that the arguments to a function call were a certain value, you can use `expectCallArgs`.

Now that you know how to look at the history of a function or property, let's look at how to change it's behavior.

## Changing Wrapper Behavior

You will notice that in our previous example, our `powerObject.pow()` wasn't very smart -- it doesn't check to see if `num` is a proper value:

``` js
var powerObject = {
    exponent: 2,
    pow: function(num) {
         var ret = 1;

         for (let i = 0; i < this.exponent; i++) ret *= num;

         return ret;
    }
};
```

Using {@link Trigger Triggers} we can change the behavior of the wrapper:

``` js
powerObject.pow
    .triggerAlways()
    .expectCallArgs(Match.type(Number))
```

## Configuring a Wrapper
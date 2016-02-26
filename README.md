# @IDAGIO/cookie-middleware

Middleware for dealing with the parsing and serialization of cookies for Node.js / Express.js

This middleware is very simplistic: It does exactly what it says on the tin – it gives you a way to work with cookies. What this middleware does not do:

* asynchronous storage of data (e.g., to make data accessible to multiple servers)
* secure storage of non-string data via use of encryption or serialization
* session management

For the above things, you should write a module that does what you need, handling asynchronicity as it arises: don't try to make something asynchronous look synchronous.

At IDAGIO, we use two modules that deal with session management & authentication. Only one is open-source, because the other contains way too much application specific code to be made generic.

## See Also

Our session management module is available as: [`@IDAGIO/session-middleware`](https://github.com/IDAGIO/idagio-session-middleware)

## Usage

### As constructor:

The very basic usage of this module is to use the exported constructor on plain [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse) objects. Below is an example of such:

```js
var http = require('http');
var Cookies = require('@idagio/cookie-middleware');

var internals = {};

internals.handleRequest = function(request, response) {
  request.cookies = new Cookies(request, response);

  // Do something with request.cookies
  //
  // For instance, set a cookie: `request.cookies.set('foo', 'bar')`
  //
  // Or get a cookie: request.cookies.get('foo')

  response.writeHead(200);
  response.end('Done!');
};

http.createServer(internals.handleRequest).listen(8080);
```

### As Express.js middleware:

Alternatively, you can use the middleware that is exported as well, for instance:

```js
var express = require('express');
var Cookies = require('@idagio/cookie-middleware');

var app = express();

app.use(Cookies.middleware);

app.get('/', function(request, response) {
  // Use request.cookies just as above
});

app.listen(3000);
```

### With asynchronicity:

```js
var express = require('express');
var Cookies = require('@idagio/cookie-middleware');
var Redis = Redis.createClient(process.env.REDIS_URL);

var app = express();

app.use(Cookies.middleware);
app.use(function(request, response, next) {
  var sessionId = request.cookies.get('my_app_session');

  if (!sessionId) {
    return next();
  }

  redis.get('session:'+sessionId, function(err, data) {
    if (!err && data) {
      request.session = data;
    }

    next();
  });
});

app.get('/', function(request, response) {
  response.writeHead(200);

  if (request.session) {
    response.end('You have a session!');
  } else {
    response.end('You do not have a session :(')
  }
});

app.listen(3000);
```

## API

### `new Cookies(request, response)`

Creates an instance of the cookie handler using Node.js [`request`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [`response`](https://nodejs.org/api/http.html#http_class_http_serverresponse) objects.

This will override `response.end` via the [js-http onHeaders](https://github.com/jshttp/on-headers) module.

Cookie parsing is delegated to the [js-http cookie](https://github.com/jshttp/cookie) module, however, this only happens when you use the `Cookies#get` method to retrieve a cookie's value.

#### `Cookies.prototype.get(name)`

Parses the cookies and returns the cookie with the given name as a String.

#### `Cookies.prototype.set(name, value, [ options = {}, [ override=false ] ])`

Sets a cookie to be sent as part of the Set-Cookie header. The `options` object is passed directly into the `cookie` modules' serialize function. For the various available options, see that [module's documentation](https://github.com/jshttp/cookie#more). The `override` parameter allows you to clear any other value that may have been set for a cookie with the given name.

Calling `set` multiple times with the same name will result in multiple cookies all with the same name.

#### `Cookies.prototype.unset(name)`

Shorthand for `Cookies.prototype.set(name, '', { expires: new Date(0) }, true);`.

### `Cookies.middleware(request, response, next)`

Standard connect / express.js middleware. Creates an instance of `Cookies` stored as `request.cookies`.

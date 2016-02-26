var CookieHeader = require('cookie');
var onHeaders = require('on-headers');
var isSecure = require('is-secure');

function flattenPending(pending) {
  return Object.keys(pending).reduce(function flatten(acc, key) {
    return acc.concat(pending[key]);
  }, []);
}

function appendHeader(response, field, val) {
  var prev = response.getHeader(field);
  var value = val;

  if (prev) {
    // concat the new and prev vals
    if (Array.isArray(prev)) {
      value = prev.concat(val);
    } else if (Array.isArray(val)) {
      value = [prev].concat(val);
    } else {
      value = [prev, val];
    }
  }

  return response.setHeader(field, value);
}

function setHeaders() {
  flattenPending(this.pending).map(function mapper(cookie) {
    if (cookie.options.secure && !isSecure(this.request)) {
      throw new Error('Cannot send secure cookie over unencrypted connection');
    }

    appendHeader(this.response, 'Set-Cookie', CookieHeader.serialize(cookie.name, cookie.value, cookie.options));
  }, this);
}

function Cookies(request, response) {
  this.request = request;
  this.response = response;
  this.pending = {};

  onHeaders(this.response, setHeaders.bind(this));
}

Cookies.prototype.get = function get(name) {
  var header = this.request.headers.cookie;
  var value;

  if (header) {
    var cookies = CookieHeader.parse(header);

    if (cookies.hasOwnProperty(name)) {
      value = cookies[name];
    }
  }

  return value;
};

Cookies.prototype.set = function set(name, value, options, overwrite) {
  var cookie = { name: name, value: value, options: options || {} };

  if (!!overwrite || !this.pending[name]) {
    this.pending[name] = [ cookie ];
  } else {
    this.pending[name].push(cookie);
  }
};

Cookies.prototype.unset = function unset(name) {
  this.set(name, '', { expires: new Date(0) }, true);
};

Cookies.middleware = function CookieMiddleware(request, response, next) {
  request.cookies = new Cookies(request, response);
  next();
};

module.exports = Cookies;

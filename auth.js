var VError, crypto, nconf, redis, url,
secondsInOneHour, uri, client, User;

VError = require('verror');
redis = require('redis');
url = require('url');
crypto = require('crypto');
nconf = require('nconf');
User = require('./models/user');
secondsInOneHour = 60 * 60;

if (nconf.get('REDISCLOUD_URL')) {
  uri = url.parse(nconf.get('REDISCLOUD_URL'));
  client = redis.createClient(uri.port, uri.hostname);
  if (uri.auth) {
    client.auth(uri.auth.split(':')[1]);
  }
} else {
  client = redis.createClient();
}

exports.session = function authSession() {
  'use strict';

  return function authSessionMiddleware(request, response, next) {
    var token;
    token = request.get('csrf-token');

    return client.get(token, function (error, id) {
      if (error) {
        error = new VError(error, 'error finding user token "%s" for authentication', token);
        return next(error);
      }
      if (!id) {
        return next();
      }

      var query;
      query = User.findOne();
      query.where('_id').equals(id);
      query.populate('profile');
      return query.exec(function (error, user) {
        if (error) {
          error = new VError(error, 'error finding user "%s" for authentication', id);
          return next(error);
        }
        request.session = user;
        return next();
      });
    });
  };
};

exports.can = function authCan(permission) {
  'use strict';

  return function authPermissionMiddleware(request, response, next) {
    var session;
    session = request.session;
    if (!session) {
      return response.status(403).end();
    }
    if (session.profile.permissions.lastIndexOf(permission) === -1) {
      return response.status(403).end();
    }
    return next();
  };
};

exports.token = function generateToken(user) {
  'use strict';

  var token, timestamp, key;
  timestamp = new Date().getTime();
  key = nconf.get('TOKEN_SALT');
  token = crypto.createHash('sha1').update(timestamp + user._id + key).digest('hex');
  client.set(token, user._id);
  client.expire(token, secondsInOneHour);
  return token;
};
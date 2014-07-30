var VError, router, nconf, crypto, basicAuth, async, auth, User, Profile;

VError = require('verror');
router = require('express').Router();
nconf = require('nconf');
crypto = require('crypto');
basicAuth = require('basic-auth');
async = require('async');
auth = require('../auth');
User = require('../models/user');
Profile = require('../models/profile');

router.use(function (request, response, next) {
  'use strict';

  var query, profileSlug;
  profileSlug = request.param('profile');
  if (!profileSlug) {
    return next();
  }
  query = Profile.findOne();
  query.where('slug').equals(profileSlug);
  return query.exec(function (error, profile) {
    if (error) {
      error = new VError(error, 'error finding profile: "$s"', profileSlug);
      return next(error);
    }
    request.profile = profile;
    return next();
  });
});

router
.route('/users')
.post(auth.can('changeUser'))
.post(function createUser(request, response, next) {
  'use strict';

  var user, password;
  password = crypto.createHash('sha1').update(request.param('password') + nconf.get('PASSWORD_SALT')).digest('hex');
  user = new User({
    'academicRegistry' : request.param('academicRegistry'),
    'password'         : request.param('password') ? password : null,
    'profile'          : request.profile ? request.profile._id : null
  });
  async.series([user.save.bind(user), function (done) {
    user.populate('profile');
    user.populate(done);
  }], function createdUser(error) {
    if (error) {
      error = new VError(error, 'error creating user');
      return next(error);
    }
    return response.status(201).end();
  });
});

router
.route('/users/me')
.get(function validateSession(request, response) {
  'use strict';

  var session;
  session = request.session;
  if (!session) {
    return response.status(403).end();
  }
  return response.status(200).send(session);
});

router
.route('/users/me')
.put(auth.can('changeUser'))
.put(function updateUser(request, response, next) {
  'use strict';

  var user, password;
  password = crypto.createHash('sha1').update(request.param('password') + nconf.get('PASSWORD_SALT')).digest('hex');
  user = request.session;
  user.password = request.param('password') ? password : user.password;
  return user.save(function updatedUser(error) {
    if (error) {
      error = new VError(error, 'error updating user: "$s"', request.params.user);
      return next(error);
    }
    return response.status(200).end();
  });
});

router
.route('/users/me/session')
.post(function createSession(request, response, next) {
  'use strict';

  var credentials, academicRegistry, password, query;
  credentials = basicAuth(request);
  academicRegistry = credentials.name;
  password = crypto.createHash('sha1').update(credentials.pass + nconf.get('PASSWORD_SALT')).digest('hex');
  query = User.findOne();
  query.where('academicRegistry').equals(academicRegistry);
  query.where('password').equals(password);
  query.exec(function (error, user) {
    if (error) {
      error = new VError(error, 'error finding user: "$s" to login', academicRegistry);
      return next(error);
    }
    if (!user) {
      return response.status(401).end();
    }
    return response.status(201).send({'token' : auth.token(user)});
  });
});

module.exports = router;
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

/**
 * @api {post} /users Creates a new user.
 * @apiName createUser
 * @apiVersion 1.0.0
 * @apiGroup user
 * @apiPermission changeUser
 * @apiDescription
 * When creating a new user account the user must send the profile, the user academic registry and the password. The
 * academic registry is used for naming and must be unique in the system. If a existing academic registry is sent to
 * this method, a 409 error will be raised. And if no academic registry, or password or profile where sent, a 400 error
 * will be raised. Before saving, the user password will be hashed with sha1 together with a password salt and digested
 * into hex.
 *
 * @apiParam {String} profile User's profile name.
 * @apiParam {String} academicRegistry User academic registry.
 * @apiParam {String} password User password..
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "password": "required",
 *   "profile": "required"
 * }
 *
 * @apiErrorExample
 * HTTP/1.1 403 Forbidden
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 409 Conflict
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 201 Created
 * {}
 */
router
.route('/users')
.post(auth.can('changeUser'))
.post(function createUser(request, response, next) {
  'use strict';

  var user, password;
  password = crypto.createHash('sha1').update(request.param('password') + nconf.get('PASSWORD_SALT')).digest('hex');
  user = new User({
    'password'  : request.param('password') ? password : null,
    'profile'   : request.profile ? request.profile._id : null,
    'name'      : request.param('name'),
    'gender'    : request.param('gender'),
    'email'     : request.param('email'),
    'phones'    : request.param('phones'),
    'addresses' : request.param('addresses'),
    'birthDate' : request.param('birthDate')
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


/**
 * @api {get} /users List all system users.
 * @apiName listUsers
 * @apiVersion 1.0.0
 * @apiGroup user
 * @apiPermission none
 * @apiDescription
 * This method returns an array with all users in the database. The data is returned in pages of length 20. If no
 * page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.
 *
 * @apiParam {[Number=0]} page Requested page.
 *
 * @apiSuccess (user) {String} academicRegistry User academic registry.
 * @apiSuccess (user) {Date} createdAt User creation date.
 * @apiSuccess (user) {Date} updatedAt User last update date.
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * [{
 *   "academicRegistry": "111111",
 *   "profile": {
 *     "slug": "teacher",
 *     "name": "teacher",
 *     "permissions": [
 *       "changeGrades"
 *     ],
 *     "createdAt": "2014-07-01T12:22:25.058Z",
 *     "updatedAt": "2014-07-01T12:22:25.058Z"
 *   },
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }]
 */

router
.route('/users')
.get(function listUser(request, response, next) {
  'use strict';

  var pageSize, page, query;
  pageSize = nconf.get('PAGE_SIZE');
  page = request.param('page', 0) * pageSize;
  query = User.find();
  query.skip(page);
  query.limit(pageSize);
  return query.exec(function listedUser(error, users) {
    if (error) {
      error = new VError(error, 'error finding users');
      return next(error);
    }
    return response.status(200).send(users);
  });
});

/**
 * @api {get} /users/me Get user information.
 * @apiName getUser
 * @apiVersion 1.0.0
 * @apiGroup user
 * @apiPermission none
 * @apiDescription
 * This method returns a single user details, the user academic registry must be passed in the uri to identify th
 * requested user. If no user with the requested academic registry was found, a 404 error will be raised.
 *
 * @apiSuccess {String} academicRegistry User identifier.
 * @apiSuccess {String} profile User profile.
 * @apiSuccess {date} createdAt Profile creation date.
 * @apiSuccess {date} updatedAt Profile last update date.
 * @apiSuccess (profile) {String} slug Profile identifier.
 * @apiSuccess (profile) {String} name Profile name.
 * @apiSuccess (profile) {[String]} permissions List of profile permissions.
 * @apiSuccess (profile) {date} createdAt Profile creation date.
 * @apiSuccess (profile) {date} updatedAt Profile last update date.
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * {
 *   "academicRegistry": "111111",
 *   "profile": {
 *     "slug": "teacher",
 *     "name": "teacher",
 *     "permissions": [
 *       "changeGrades"
 *     ],
 *     "createdAt": "2014-07-01T12:22:25.058Z",
 *     "updatedAt": "2014-07-01T12:22:25.058Z"
 *   },
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }
 */
router
.route('/users/me')
.get(function getUser(request, response) {
  'use strict';

  var session;
  session = request.session;
  if (!session) {
    return response.status(403).end();
  }
  return response.status(200).send(session);
});

/**
 * @api {put} /users/me Updates user information.
 * @apiName updateUser
 * @apiVersion 1.0.0
 * @apiGroup user
 * @apiPermission changeUser
 * @apiDescription
 * When updating a user account the user must send the profile, the user academic registry and the password. If a
 * existing academic registry which is not the original user academic registry is sent to this method, a 409 error will
 * be raised. And if no academic registry, or password or profile is sent, a 400 error will be raised. If no user with
 * the requested academic registry was found, a 404 error will be raised.
 *
 * @apiParam {String} profile User's profile name.
 * @apiParam {String} academicRegistry User academic registry.
 * @apiParam {String} password User password..
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "academicRegistry": "required",
 *   "password": "required",
 *   "profile": "required"
 * }
 *
 * @apiErrorExample
 * HTTP/1.1 403 Forbidden
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 409 Conflict
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 Ok
 * {}
 */
router
.route('/users/me')
.put(auth.can('changeUser'))
.put(function updateUser(request, response, next) {
  'use strict';

  var user, password;
  password = crypto.createHash('sha1').update(request.param('password') + nconf.get('PASSWORD_SALT')).digest('hex');
  user = request.session;
  user.password = request.param('password') ? password : user.password;
  user.name = request.param('name');
  user.gender = request.param('gender');
  user.email = request.param('email');
  user.phones = request.param('phones');
  user.addresses = request.param('addresses');
  user.birthDate = request.param('birthDate');
  return user.save(function updatedUser(error) {
    if (error) {
      error = new VError(error, 'error updating user: "$s"', request.params.user);
      return next(error);
    }
    return response.status(200).end();
  });
});

/**
 * @api {post} /users/me/session Creates a new session.
 * @apiName createSession
 * @apiVersion 1.0.0
 * @apiGroup user
 * @apiPermission changeUser
 * @apiDescription
 * To create a new user session, the user must send his academic registry and password using the http basic header
 * "authorization", in this header the user must put the word "basic " followed by the academic registry and password
 * separated with ":" and encoded in base 64. If the credentials are valid, a access token will be generated.
 * Using the user internal id, the current timestamp and a token salt, this values will be hashed with sha1 and digested
 * into hex to generate a access token. This token can be used for one hour after created. To use the access token, for
 * every request, the user must send the access token in the "csrf-token" header.
 *
 * @apiErrorExample
 * HTTP/1.1 401 Unauthorized
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 Ok
 * {
 *   "token": "fb952b1957b6a96debbdf418304226cd356c5499"
 * }
 */
router
.route('/users/me/session')
.post(function createSession(request, response, next) {
  'use strict';

  var credentials, academicRegistry, password, query;
  credentials = basicAuth(request);
  academicRegistry = credentials ? credentials.name : '';
  password = crypto.createHash('sha1').update((credentials ? credentials.pass : '') + nconf.get('PASSWORD_SALT')).digest('hex');
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

 /**
 * @api {get} /users/:user Get user information.
 * @apiName getUser
 * @apiVersion 1.0.0
 * @apiGroup user
 * @apiPermission none
 * @apiDescription
 * This method returns a single user details, the user academicRegistry must be passed in the uri to identify the requested
 * user. If no user with the requested academicRegistry was found, a 404 error will be raised.
 *
 * @apiSuccess (user) {String} academicRegistry User academic registry.
 * @apiSuccess (user) {Date} createdAt User creation date.
 * @apiSuccess (user) {Date} updatedAt User last update date.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * {
 *   "academicRegistry": "111111",
 *   "profile": {
 *     "slug": "teacher",
 *     "name": "teacher",
 *     "permissions": [
 *       "changeGrades"
 *     ],
 *     "createdAt": "2014-07-01T12:22:25.058Z",
 *     "updatedAt": "2014-07-01T12:22:25.058Z"
 *   },
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }
 */
router
.route('/users/:user')
.get(function getUser(request, response, next) {
  'use strict';

  var user, query;
  user = request.user;
  return response.status(200).send(user);
});

router.param('user', function findUser(request, response, next, id) {
  'use strict';

  var query;
  query = User.findOne();
  query.where('academicRegistry').equals(isNaN(id) ? 0 : id);
  query.populate('profile');
  query.exec(function foundUser(error, user) {
    if (error) {
      error = new VError(error, 'error finding user: "$s"', user);
      return next(error);
    }
    if (!user) {
      return response.status(404).end();
    }
    request.user = user;
    return next();
  });
});

module.exports = router;

var VError, router, nconf, slug, auth, Profile;

VError = require('verror');
router = require('express').Router();
nconf = require('nconf');
slug = require('slug');
auth = require('../auth');
Profile = require('../models/profile');

/**
 * @api {post} /profiles Creates a new profile.
 * @apiName createProfile
 * @apiVersion 1.0.0
 * @apiGroup profile
 * @apiPermission changeProfile
 * @apiDescription
 * When creating a new profile the user must send the profile name and the profile permissions. The profile name is used
 * for naming and must be unique in the system. If a existing name is sent to this method, a 409 error will be raised.
 * And if no name is sent, a 400 error will be raised. The profile permissions consists of an array of strings
 * representing the actions the user can do on the system.
 *
 * @apiParam {String} name Profile name.
 * @apiParam {[String]} permissions List of profile permissions.
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "name": "required"
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
.route('/profiles')
.post(auth.can('changeProfile'))
.post(function createProfile(request, response, next) {
  'use strict';

  var profile;
  profile = new Profile({
    'slug'        : slug(request.param('name', '').toLowerCase()),
    'name'        : request.param('name'),
    'permissions' : request.param('permissions')
  });
  return profile.save(function createdProfile(error) {
    if (error) {
      error = new VError(error, 'error creating profile');
      return next(error);
    }
    return response.status(201).end();
  });
});

/**
 * @api {get} /profiles List all system profiles.
 * @apiName listProfile
 * @apiVersion 1.0.0
 * @apiGroup profile
 * @apiPermission none
 * @apiDescription
 * This method returns an array with all profiles in the database. The data is returned in pages of length 20. If no
 * page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.
 *
 * @apiParam {[Number=0]} page Requested page.
 *
 * @apiSuccess (profile) {String} slug Profile identifier.
 * @apiSuccess (profile) {String} name Profile name.
 * @apiSuccess (profile) {[String]} permissions List of profile permissions.
 * @apiSuccess (profile) {date} createdAt Profile creation date.
 * @apiSuccess (profile) {date} updatedAt Profile last update date.
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * [{
 *   "slug": "teacher",
 *   "name": "teacher",
 *   "permissions": [
 *     "changeGrades"
 *   ],
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }]
 */
router
.route('/profiles')
.get(function listProfile(request, response, next) {
  'use strict';

  var pageSize, page, query;
  pageSize = nconf.get('PAGE_SIZE');
  page = request.param('page', 0) * pageSize;
  query = Profile.find();
  query.skip(page);
  query.limit(pageSize);
  return query.exec(function listedProfile(error, profiles) {
    if (error) {
      error = new VError(error, 'error finding profiles');
      return next(error);
    }
    return response.status(200).send(profiles);
  });
});

/**
 * @api {get} /profiles/:profile Get profile information.
 * @apiName getProfile
 * @apiVersion 1.0.0
 * @apiGroup profile
 * @apiPermission none
 * @apiDescription
 * This method returns a single profile details, the profile slug must be passed in the uri to identify the requested
 * profile. If no profile with the requested slug was found, a 404 error will be raised.
 *
 * @apiSuccess {String} slug Profile identifier.
 * @apiSuccess {String} name Profile name.
 * @apiSuccess {[String]} permissions List of profile permissions.
 * @apiSuccess {date} createdAt Profile creation date.
 * @apiSuccess {date} updatedAt Profile last update date.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * {
 *   "slug": "teacher",
 *   "name": "teacher",
 *   "permissions": [
 *     "changeGrades"
 *   ],
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }
 */
router
.route('/profiles/:profile')
.get(function getProfile(request, response) {
  'use strict';

  var profile;
  profile = request.profile;
  return response.status(200).send(profile);
});

/**
 * @api {post} /profiles Updates profile information.
 * @apiName updateProfile
 * @apiVersion 1.0.0
 * @apiGroup profile
 * @apiPermission changeProfile
 * @apiDescription
 * When updating a profile the user must send the profile name and the profile permissions. If a existing name which is
 * not the original profile name is sent to this method, a 409 error will be raised. And if no name is sent, a 400 error
 * will be raised.  If no profile with the requested slug was found, a 404 error will be raised.
 *
 * @apiParam {String} name Profile name.
 * @apiParam {[String]} permissions List of profile permissions.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "name": "required"
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
.route('/profiles/:profile')
.put(auth.can('changeProfile'))
.put(function updateProfile(request, response, next) {
  'use strict';

  var profile;
  profile = request.profile;
  profile.slug = slug(request.param('name', '').toLowerCase());
  profile.name = request.param('name');
  profile.permissions = request.param('permissions');
  return profile.save(function updatedProfile(error) {
    if (error) {
      error = new VError(error, 'error updating profile: "$s"', request.params.profile);
      return next(error);
    }
    return response.status(200).end();
  });
});

/**
 * @api {post} /profiles Removes profile.
 * @apiName removeProfile
 * @apiVersion 1.0.0
 * @apiGroup profile
 * @apiPermission changeProfile
 * @apiDescription
 * This method removes a profile from the system. If no profile with the requested slug was found, a 404 error will be
 * raised.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 403 Forbidden
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 204 No Content
 * {}
 */
router
.route('/profiles/:profile')
.delete(auth.can('changeProfile'))
.delete(function removeProfile(request, response, next) {
  'use strict';

  var profile;
  profile = request.profile;
  return profile.remove(function removedProfile(error) {
    if (error) {
      error = new VError(error, 'error removing profile: "$s"', request.params.profile);
      return next(error);
    }
    return response.status(204).end();
  });
});

router.param('profile', function findProfile(request, response, next, id) {
  'use strict';

  var query;
  query = Profile.findOne();
  query.where('slug').equals(id);
  query.exec(function foundProfile(error, profile) {
    if (error) {
      error = new VError(error, 'error finding profile: "$s"', id);
      return next(error);
    }
    if (!profile) {
      return response.status(404).end();
    }
    request.profile = profile;
    return next();
  });
});

module.exports = router;
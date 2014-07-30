var VError, router, nconf, slug, auth, Profile;

VError = require('verror');
router = require('express').Router();
nconf = require('nconf');
slug = require('slug');
auth = require('../auth');
Profile = require('../models/profile');

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

router
.route('/profiles/:profile')
.get(function getProfile(request, response) {
  'use strict';

  var profile;
  profile = request.profile;
  return response.status(200).send(profile);
});

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
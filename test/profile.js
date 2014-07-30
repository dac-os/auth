/*globals describe, before, beforeEach, it, after*/
require('should');
var supertest, nock, app, User, Profile, auth, changeProfileProfile, otherProfile, admin, otherUser;

supertest = require('supertest');
app = require('../index.js');
nock = require('nock');
auth = require('../auth');
User = require('../models/user');
Profile = require('../models/profile');

describe('profile controller', function () {
  'use strict';

  describe('create', function () {
    before(Profile.remove.bind(Profile));
    before(User.remove.bind(User));

    before(function (done) {
      changeProfileProfile = new Profile({
        'slug'        : 'change-profile-profile',
        'name'        : 'change profile profile',
        'permissions' : ['changeProfile']
      });
      changeProfileProfile.save(done);
    });

    before(function (done) {
      otherProfile = new Profile({
        'slug'        : 'other-profile',
        'name'        : 'other profile',
        'permissions' : []
      });
      otherProfile.save(done);
    });

    before(function (done) {
      admin = new User({
        'academicRegistry' : '111111',
        'password'         : '1234',
        'profile'          : changeProfileProfile._id
      });
      admin.save(done);
    });

    before(function (done) {
      otherUser = new User({
        'academicRegistry' : '111112',
        'password'         : '1234',
        'profile'          : otherProfile._id
      });
      otherUser.save(done);
    });

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/profiles');
      request.send({'name' : 'test profile'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeProfile permission', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/profiles');
      request.set('csrf-token', auth.token(otherUser));
      request.send({'name' : 'test profile'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without name', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/profiles');
      request.set('csrf-token', auth.token(admin));
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('name').be.equal('required');
      });
      request.end(done);
    });

    it('should create', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/profiles');
      request.set('csrf-token', auth.token(admin));
      request.send({'name' : 'test profile'});
      request.expect(201);
      request.end(done);
    });

    describe('with name taken', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/profiles');
        request.set('csrf-token', auth.token(admin));
        request.send({'name' : 'other test profile'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/profiles');
        request.set('csrf-token', auth.token(admin));
        request.send({'name' : 'other test profile'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('list', function () {
    before(Profile.remove.bind(Profile));
    before(User.remove.bind(User));

    before(function (done) {
      changeProfileProfile = new Profile({
        'slug'        : 'change-profile-profile',
        'name'        : 'change profile profile',
        'permissions' : ['changeProfile']
      });
      changeProfileProfile.save(done);
    });

    it('should list', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/profiles');
      request.expect(200);
      request.expect(function (response) {
        response.body.should.be.instanceOf(Array).with.lengthOf(1);
        response.body.every(function (profile) {
          profile.should.have.property('slug');
          profile.should.have.property('name');
          profile.should.have.property('permissions');
        });
      });
      request.end(done);
    });

    it('should return empty in second page', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/profiles');
      request.send({'page' : 1});
      request.expect(200);
      request.expect(function (response) {
        response.body.should.be.instanceOf(Array).with.lengthOf(0);
      });
      request.end(done);
    });
  });

  describe('details', function () {
    before(Profile.remove.bind(Profile));
    before(User.remove.bind(User));

    before(function (done) {
      changeProfileProfile = new Profile({
        'slug'        : 'change-profile-profile',
        'name'        : 'change profile profile',
        'permissions' : ['changeProfile']
      });
      changeProfileProfile.save(done);
    });

    it('should raise error with invalid slug', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/profiles/invalid');
      request.expect(404);
      request.end(done);
    });

    it('should show', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/profiles/change-profile-profile');
      request.expect(200);
      request.expect(function (response) {
        response.body.should.have.property('slug').be.equal('change-profile-profile');
        response.body.should.have.property('name').be.equal('change profile profile');
        response.body.should.have.property('permissions');
      });
      request.end(done);
    });
  });

  describe('update', function () {
    before(Profile.remove.bind(Profile));
    before(User.remove.bind(User));

    before(function (done) {
      changeProfileProfile = new Profile({
        'slug'        : 'change-profile-profile',
        'name'        : 'change profile profile',
        'permissions' : ['changeProfile']
      });
      changeProfileProfile.save(done);
    });

    before(function (done) {
      otherProfile = new Profile({
        'slug'        : 'other-profile',
        'name'        : 'other profile',
        'permissions' : []
      });
      otherProfile.save(done);
    });

    before(function (done) {
      admin = new User({
        'academicRegistry' : '111111',
        'password'         : '1234',
        'profile'          : changeProfileProfile._id
      });
      admin.save(done);
    });

    before(function (done) {
      otherUser = new User({
        'academicRegistry' : '111112',
        'password'         : '1234',
        'profile'          : otherProfile._id
      });
      otherUser.save(done);
    });

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/profiles/change-profile-profile');
      request.send({'name' : 'test profile 2'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeProfile permission', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/profiles/change-profile-profile');
      request.set('csrf-token', auth.token(otherUser));
      request.send({'name' : 'test profile 2'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error with invalid slug', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/profiles/invalid');
      request.set('csrf-token', auth.token(admin));
      request.send({'name' : 'test profile 2'});
      request.expect(404);
      request.end(done);
    });

    it('should raise error without name', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/profiles/change-profile-profile');
      request.set('csrf-token', auth.token(admin));
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('name').be.equal('required');
      });
      request.end(done);
    });

    it('should update', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/profiles/change-profile-profile');
      request.set('csrf-token', auth.token(admin));
      request.send({'name' : 'test profile 2'});
      request.send({'permissions' : ['changeProfile']});
      request.expect(200);
      request.end(done);
    });

    describe('with name taken', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/profiles');
        request.set('csrf-token', auth.token(admin));
        request.send({'name' : 'other test profile'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/profiles/test-profile-2');
        request.set('csrf-token', auth.token(admin));
        request.send({'name' : 'other test profile'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('delete', function () {
    before(Profile.remove.bind(Profile));
    before(User.remove.bind(User));

    before(function (done) {
      changeProfileProfile = new Profile({
        'slug'        : 'change-profile-profile',
        'name'        : 'change profile profile',
        'permissions' : ['changeProfile']
      });
      changeProfileProfile.save(done);
    });

    before(function (done) {
      otherProfile = new Profile({
        'slug'        : 'other-profile',
        'name'        : 'other profile',
        'permissions' : []
      });
      otherProfile.save(done);
    });

    before(function (done) {
      admin = new User({
        'academicRegistry' : '111111',
        'password'         : '1234',
        'profile'          : changeProfileProfile._id
      });
      admin.save(done);
    });

    before(function (done) {
      otherUser = new User({
        'academicRegistry' : '111112',
        'password'         : '1234',
        'profile'          : otherProfile._id
      });
      otherUser.save(done);
    });

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/profiles/change-profile-profile');
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeProfile permission', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/profiles/change-profile-profile');
      request.set('csrf-token', auth.token(otherUser));
      request.expect(403);
      request.end(done);
    });

    it('should raise error with invalid slug', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/profiles/invalid');
      request.set('csrf-token', auth.token(admin));
      request.expect(404);
      request.end(done);
    });

    it('should delete', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/profiles/change-profile-profile');
      request.set('csrf-token', auth.token(admin));
      request.expect(204);
      request.end(done);
    });
  });
});
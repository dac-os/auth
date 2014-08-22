/*globals describe, before, beforeEach, it, after*/
require('should');
var supertest, nock, app, User, Profile, auth, changeUserProfile, otherProfile, admin, otherUser;

supertest = require('supertest');
app = require('../index.js');
nock = require('nock');
auth = require('../auth');
User = require('../models/user');
Profile = require('../models/profile');

describe('user controller', function () {
  'use strict';

  before(Profile.remove.bind(Profile));

  before(function (done) {
    changeUserProfile = new Profile({
      'slug'        : 'change-user-profile',
      'name'        : 'change user profile',
      'permissions' : ['changeUser']
    });
    changeUserProfile.save(done);
  });

  before(function (done) {
    otherProfile = new Profile({
      'slug'        : 'other-profile',
      'name'        : 'other profile',
      'permissions' : []
    });
    otherProfile.save(done);
  });

  describe('create', function () {
    before(User.remove.bind(User));

    before(function (done) {
      admin = new User({
        'academicRegistry' : '111111',
        'password'         : '1234',
        'profile'          : changeUserProfile._id
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
      request = request.post('/users');
      request.send({'academicRegistry' : '111113'});
      request.send({'password' : '1234'});
      request.send({'profile' : 'other-profile'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeUser permission', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(otherUser));
      request.send({'academicRegistry' : '111113'});
      request.send({'password' : '1234'});
      request.send({'profile' : 'other-profile'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without academicRegistry', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'password' : '1234'});
      request.send({'profile' : 'other-profile'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('academicRegistry').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without password', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'academicRegistry' : '111113'});
      request.send({'profile' : 'other-profile'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('password').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without profile', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'academicRegistry' : '111113'});
      request.send({'password' : '1234'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('profile').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without academicRegistry and password', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'profile' : 'other-profile'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('academicRegistry').be.equal('required');
        response.body.should.have.property('password').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without academicRegistry and profile', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'password' : '1234'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('academicRegistry').be.equal('required');
        response.body.should.have.property('profile').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without password and profile', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'academicRegistry' : '111113'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('profile').be.equal('required');
        response.body.should.have.property('password').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without academicRegistry, password and profile', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('academicRegistry').be.equal('required');
        response.body.should.have.property('profile').be.equal('required');
        response.body.should.have.property('password').be.equal('required');
      });
      request.end(done);
    });

    it('should create', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'academicRegistry' : '111113'});
      request.send({'password' : '1234'});
      request.send({'profile' : 'other-profile'});
      request.expect(201);
      request.end(done);
    });

    describe('with academicRegistry taken', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users');
        request.set('csrf-token', auth.token(admin));
        request.send({'academicRegistry' : '111114'});
        request.send({'password' : '1234'});
        request.send({'profile' : 'other-profile'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users');
        request.set('csrf-token', auth.token(admin));
        request.send({'academicRegistry' : '111114'});
        request.send({'password' : '1234'});
        request.send({'profile' : 'other-profile'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('details', function () {
    before(User.remove.bind(User));

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
      request = request.get('/users/me');
      request.expect(403);
      request.end(done);
    });

    it('should show', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/users/me');
      request.set('csrf-token', auth.token(otherUser));
      request.expect(200);
      request.expect(function (response) {
        response.body.should.have.property('academicRegistry').be.equal('111112');
        response.body.should.have.property('profile').with.property('name').be.equal('other profile');
        response.body.should.have.property('profile').with.property('slug').be.equal('other-profile');
      });
      request.end(done);
    });
  });

  describe('update', function () {
    before(User.remove.bind(User));

    before(function (done) {
      admin = new User({
        'academicRegistry' : '111111',
        'password'         : '1234',
        'profile'          : changeUserProfile._id
      });
      admin.save(done);
    });

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/me');
      request.send({'password' : '1234'});
      request.expect(403);
      request.end(done);
    });

    it('should update', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/me');
      request.set('csrf-token', auth.token(admin));
      request.send({'password' : '1234'});
      request.expect(200);
      request.end(done);
    });
  });

  describe('login', function () {
    before(User.remove.bind(User));

    before(function (done) {
      admin = new User({
        'academicRegistry' : '111111',
        'password'         : '1234',
        'profile'          : changeUserProfile._id
      });
      admin.save(done);
    });

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users');
      request.set('csrf-token', auth.token(admin));
      request.send({'academicRegistry' : '111113'});
      request.send({'password' : '1234'});
      request.send({'profile' : 'other-profile'});
      request.expect(201);
      request.end(done);
    });

    it('should raise error without academicRegistry', function (done) {
      done();
    });

    it('should raise error without password', function (done) {
      done();
    });

    it('should raise error without academicRegistry and password', function (done) {
      done();
    });

    it('should login', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/me/session');
      request.set('authorization', 'Basic ' + new Buffer('111113:1234').toString('base64'));
      request.send({'password' : '1234'});
      request.expect(201);
      request.expect(function (response) {
        response.body.should.have.property('token');
      });
      request.end(done);
    });
  });
});
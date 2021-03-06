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
        'password'         : '1234',
        'profile'          : changeUserProfile._id
      });
      admin.save(done);
    });

    before(function (done) {
      otherUser = new User({
        'password'         : '1234',
        'profile'          : otherProfile._id
      });
      otherUser.save(done);
    });

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users');
        request.send({'password' : '1234'});
        request.send({'profile' : 'other-profile'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeUser permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users');
        request.set('csrf-token', auth.token(otherUser));
        request.send({'password' : '1234'});
        request.send({'profile' : 'other-profile'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without password', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users');
        request.set('csrf-token', auth.token(admin));
        request.send({'profile' : 'other-profile'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('password').be.equal('required');
        });
        request.end(done);
      });
    });

    describe('with valid credentials, name and password', function () {
      it('should create', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users');
        request.set('csrf-token', auth.token(admin));
        request.send({'password' : '1234'});
        request.send({'profile' : 'other-profile'});
        request.expect(201);
        request.end(done);
      });
    });
  });

  describe('details', function () {
    before(User.remove.bind(User));

    before(function (done) {
      otherUser = new User({
        'password'         : '1234',
        'profile'          : otherProfile._id
      });
      otherUser.save(done);
    });

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/me');
        request.expect(403);
        request.end(done);
      });
    });

    describe('with valid credentials', function () {
      it('should show', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/me');
        request.set('csrf-token', auth.token(otherUser));
        request.expect(200);
        request.expect(function (response) {
          response.body.should.have.property('profile').with.property('name').be.equal('other profile');
          response.body.should.have.property('profile').with.property('slug').be.equal('other-profile');
        });
        request.end(done);
      });
    });
  });

  describe('list', function () {
    before(User.remove.bind(User));

    before(function (done) {
      otherUser = new User({
        'academicRegistry' : '111112',
        'password'         : '1234',
        'profile'          : otherProfile._id,
        'name'             : 'Rafael',
        'gender'           : 'Masculino',
        'email'            : 'rafael@mailinator.com',
        'phones'           : [19998111112],
        'addresses'        : [{
          'state'          : 'SP',
          'city'           : 'Campinas',
          'zipCode'        : '11111112',
          'street'         : 'Zeferino Vaz',
          'number'         : '11'
        }],
        'birthDate'        : new Date(1980, 0, 1).toISOString()
      });
      otherUser.save(done);
    });

    describe('with one in database', function () {
      it('should list 1 in first page', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users');
        request.expect(200);
        request.expect(function (response) {
          console.log(response.body)
          response.body.should.be.instanceOf(Array).with.lengthOf(1);
          response.body.every(function (profile) {
            profile.should.have.property('academicRegistry');
            profile.should.have.property('profile');
          });
        });
        request.end(done);
      });

      it('should return empty in second page', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users');
        request.send({'page' : 1});
        request.expect(200);
        request.expect(function (response) {
          response.body.should.be.instanceOf(Array).with.lengthOf(0);
        });
        request.end(done);
      });
    });
  });

  describe('update', function () {
    before(User.remove.bind(User));

    before(function (done) {
      admin = new User({
        'password'         : '1234',
        'profile'          : changeUserProfile._id
      });
      admin.save(done);
    });

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/me');
        request.send({'password' : '1234'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('with valid credentials', function () {
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
  });

  describe('login', function () {
    before(User.remove.bind(User));

    before(function (done) {
      admin = new User({
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
      request.send({'password' : '1234'});
      request.send({'profile' : 'other-profile'});
      request.expect(201);
      request.end(done);
    });

    describe('without academicRegistry', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/me/session');
        request.set('authorization', 'Basic ' + new Buffer(':1234').toString('base64'));
        request.expect(401);
        request.end(done);
      });
    });

    describe('without password', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/me/session');
        request.set('authorization', 'Basic ' + new Buffer('2014000029:').toString('base64'));
        request.expect(401);
        request.end(done);
      });
    });

    describe('without academicRegistry and password', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/me/session');
        request.expect(401);
        request.end(done);
      });
    });

    describe('with valid academicRegistry and password', function () {
      it('should login', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/me/session');
        request.set('authorization', 'Basic ' + new Buffer('2014000029:1234').toString('base64'));
        request.expect(201);
        request.expect(function (response) {
          response.body.should.have.property('token');
        });
        request.end(done);
      });
    });
  });

  describe('delete', function () {
    before(Profile.remove.bind(Profile));
    before(User.remove.bind(User));

    before(function (done) {
      changeUserProfile = new Profile({
        'slug'        : 'changeuser',
        'name'        : 'changeUser',
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

    before(function (done) {
      admin = new User({
        'password'         : '1234',
        'profile'          : changeUserProfile._id
      });
      admin.save(done);
      //console.log(admin)
    });

    before(function (done) {
      otherUser = new User({
        'password'         : '1234',
        'profile'          : otherProfile._id
      });
      otherUser.save(done);
    });

    before(function (done) {
      var query  = User.where({ _id: admin._id });
      query.findOne(function (err, user) {
        admin = user
        done()
      });
    });

    before(function (done) {
      var query  = User.where({ _id: otherUser._id });
      query.findOne(function (err, user) {
        otherUser = user
        done()
      });
    });
    

    describe('without token', function () {
      it('should raise error(forbidden)', function (done) {
        var request;
        request = supertest(app); 
        request = request.del('/users/' + admin.academicRegistry);
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeUser permission', function () {
      it('should raise error (forbidden)', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/' + admin.academicRegistry);
        request.set('csrf-token', auth.token(otherUser));
        request.expect(403);
        request.end(done);
      });
    });

    describe('without valid userCode', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/invalid');
        request.set('csrf-token', auth.token(admin));
        request.expect(404);
        request.end(done);
      });
    });

    describe('with valid credentials and token', function () {
      it('should delete', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/' + admin.academicRegistry);
        request.set('csrf-token', auth.token(admin));
        request.expect(204);
        request.end(done);
      });

      after(function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111112');
        request.expect(404);
        request.end(done);
      });
    });
  });
});
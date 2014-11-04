var VError, mongoose, jsonSelect, nconf, Schema, async, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
nconf = require('nconf');
async = require('async');
Schema = mongoose.Schema;

schema = new Schema({
  'profile'          : {
    'type'     : Schema.ObjectId,
    'ref'      : 'Profile'
  },
  'academicRegistry' : {
    'type'   : String,
    'unique' : true,
    'required' : true
  },
  'password'         : {
    'type' : String,
    'required' : true
  },
  'createdAt'        : {
    'type'    : Date,
    'default' : Date.now
  },
  'updatedAt'        : {
    'type' : Date
  }
}, {
  'collection' : 'users',
  'strict'     : true,
  'toJSON'     : {
    'virtuals' : true
  }
});

schema.plugin(jsonSelect, {
  '_id'              : 0,
  'profile'          : 1,
  'academicRegistry' : 1,
  'password'         : 0,
  'createdAt'        : 1,
  'updatedAt'        : 1
});

schema.pre('save', function setUserUpdatedAt(next) {
  'use strict';

  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', schema);
var VError, mongoose, jsonSelect, nconf, Schema, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
nconf = require('nconf');
Schema = mongoose.Schema;

schema = new Schema({
  'slug'        : {
    'type'   : String,
    'unique' : true
  },
  'name'        : {
    'type'     : String,
    'unique'   : true,
    'required' : true
  },
  'permissions' : [
    String
  ],
  'createdAt'   : {
    'type'    : Date,
    'default' : Date.now
  },
  'updatedAt'   : {
    'type' : Date
  }
}, {
  'collection' : 'profiles',
  'strict'     : true,
  'toJSON'     : {
    'virtuals' : true
  }
});

schema.plugin(jsonSelect, {
  '_id'         : 0,
  'slug'        : 1,
  'name'        : 1,
  'permissions' : 1,
  'createdAt'   : 1,
  'updatedAt'   : 1
});

schema.pre('save', function setProfileUpdatedAt(next) {
  'use strict';

  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Profile', schema);
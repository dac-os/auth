var VError, mongoose, jsonSelect, nconf, Schema, async, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
nconf = require('nconf');
async = require('async');
Schema = mongoose.Schema;

schema = new Schema({
  'profile'          : {
    'type' : Schema.ObjectId,
    'ref'  : 'Profile'
  },
  'academicRegistry' : {
    'type'     : String,
    'unique'   : true,
    'required' : true
  },
  'password'         : {
    'type'     : String,
    'required' : true
  },
  'name'             : {
    'type' : String
  },
  'gender'           : {
    'type' : String
  },
  'email'            : {
    'type' : String
  },
  'phones'           : [
    {
      'type'     : Number,
      'required' : true
    }
  ],
  'addresses'        : [
    {
      'state'        : {
        'type'     : String,
        'required' : true
      },
      'city'         : {
        'type'     : String,
        'required' : true
      },
      'zipCode'      : {
        'type'     : String,
        'required' : true
      },
      'neighborhood' : {
        'type'     : String,
        'required' : false
      },
      'street'       : {
        'type'     : String,
        'required' : true
      },
      'number'       : {
        'type'     : String,
        'required' : true
      },
      'complement'   : {
        'type'     : String,
        'required' : false
      }
    }
  ],
  'birthDate'        : {
    'type' : Date
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
  'name'             : 1,
  'gender'           : 1,
  'email'            : 1,
  'phones'           : 1,
  'addresses'        : 1,
  'birthDate'        : 1,
  'createdAt'        : 1,
  'updatedAt'        : 1
});

schema.pre('save', function setUserUpdatedAt(next) {
  'use strict';

  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', schema);
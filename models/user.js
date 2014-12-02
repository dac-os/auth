var VError, mongoose, jsonSelect, nconf, Schema, async, damm, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
nconf = require('nconf');
async = require('async');
damm = require('damm');
Schema = mongoose.Schema;

schema = new Schema({
  'profile'          : {
    'type' : Schema.ObjectId,
    'ref'  : 'Profile'
  },
  'academicRegistry' : {
    'type'     : String,
    'unique'   : true
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

schema.pre('save', function (next) {
  'use strict';

  var year, now;
  now = new Date();
  year = now.getFullYear().toString();
  async.waterfall([function (next) {
    var query;
    query = this.constructor.find();
    query.where('academicRegistry').equals(new RegExp(year+'[0-9]*'));
    query.sort('-academicRegistry');
    query.limit(1);
    query.exec(next);
  }.bind(this), function (users, next) {
    var user, current;
    user = users[0];
    current = !user ? 1 : user.academicRegistry.match(/[0-9]{4}([0-9]{5})[0-9]{1}/)[1] * 1 + 1;
    next(null, current.toString());
  }.bind(this), function (id, next) {
    var dammInput;
    dammInput = parseInt(year) * 100000 + parseInt(id);
    damm.generate(dammInput.toString());
    this.academicRegistry = damm.append(dammInput.toString());
    next();
  }.bind(this)], next);
});

module.exports = mongoose.model('User', schema);
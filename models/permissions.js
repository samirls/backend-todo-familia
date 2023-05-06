const mongoose = require('mongoose');

const permissionsSchema = new mongoose.Schema({
  nameTo: {
    type: String,
    required: true
  },
  permissionTo: {
    type: String,
    required: true
  },
  permissionFrom: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('permissions', permissionsSchema);
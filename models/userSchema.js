const { mongoose } = require('../db_connect');

const UserSchema = new mongoose.Schema({
  fullName: String,
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    default: ['user']
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };

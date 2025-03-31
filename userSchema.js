const { mongoose } = require('./db_connect');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  roles: { type: [String], default: ['user'] }
})

const User = mongoose.model('User', UserSchema)

module.exports = { User };
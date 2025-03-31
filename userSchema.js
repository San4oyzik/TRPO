const { mongoose } = require('./db_connect');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  roles: Array
})

const User = mongoose.model('User', UserSchema)

module.exports = { User };
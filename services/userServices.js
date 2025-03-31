const { User } = require('../userSchema.js');

const createUser = ({username, email, roles}) => {
  return User.create({
    username,
    email,
    roles: ['user']
})
}

const deleteUser = (userId) => {
  return User.findByIdAndDelete(userId)
}

const updateUser = (userId, {username, email}) => {
  return User.findByIdAndUpdate(
    userId,
    {
      username,
      email
    },
    {new: true}
)
}

const getUserById = (userId) => {
  return User.findById(userId);
}

module.exports = {createUser, deleteUser, updateUser, getUserById};
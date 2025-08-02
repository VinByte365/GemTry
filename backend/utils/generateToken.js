const jwt = require('jsonwebtoken');

exports.generateToken = (user) => {
  return jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

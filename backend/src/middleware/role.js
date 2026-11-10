const ApiError = require('../utils/ApiError');

/**
 * Usage: authorize('admin', 'manager')
 * Must be used after the `protect` middleware so req.user is populated.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized, no authenticated user');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not permitted to perform this action`
      );
    }
    next();
  };
};

module.exports = authorize;

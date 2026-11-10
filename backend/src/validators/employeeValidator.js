const { body } = require('express-validator');

const createEmployeeValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('phone').optional().trim(),
  body('dateOfJoining').optional().isISO8601().withMessage('Invalid date format'),
  body('manager').optional().isMongoId().withMessage('Invalid manager id'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
];

const updateEmployeeValidator = [
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('phone').optional().trim(),
  body('manager').optional().isMongoId().withMessage('Invalid manager id'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on-leave'])
    .withMessage('Invalid status value'),
];

module.exports = { createEmployeeValidator, updateEmployeeValidator };

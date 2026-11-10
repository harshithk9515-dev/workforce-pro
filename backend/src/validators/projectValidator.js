const { body } = require('express-validator');
const { PROJECT_STATUS, PRIORITY } = require('../config/constants');

const createProjectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('manager').isMongoId().withMessage('A valid manager id is required'),
  body('teamMembers').optional().isArray().withMessage('Team members must be an array'),
  body('teamMembers.*').optional().isMongoId().withMessage('Invalid team member id'),
  body('status')
    .optional()
    .isIn(Object.values(PROJECT_STATUS))
    .withMessage('Invalid status value'),
  body('priority').optional().isIn(Object.values(PRIORITY)).withMessage('Invalid priority value'),
  body('startDate').isISO8601().withMessage('A valid start date is required'),
  body('endDate').isISO8601().withMessage('A valid end date is required'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
];

const updateProjectValidator = [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional().trim(),
  body('manager').optional().isMongoId().withMessage('Invalid manager id'),
  body('teamMembers').optional().isArray().withMessage('Team members must be an array'),
  body('teamMembers.*').optional().isMongoId().withMessage('Invalid team member id'),
  body('status')
    .optional()
    .isIn(Object.values(PROJECT_STATUS))
    .withMessage('Invalid status value'),
  body('priority').optional().isIn(Object.values(PRIORITY)).withMessage('Invalid priority value'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
];

module.exports = { createProjectValidator, updateProjectValidator };

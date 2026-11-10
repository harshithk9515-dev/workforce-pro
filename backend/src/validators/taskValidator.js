const { body } = require('express-validator');
const { TASK_STATUS, PRIORITY } = require('../config/constants');

const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim(),
  body('project').isMongoId().withMessage('A valid project id is required'),
  body('assignedTo').isMongoId().withMessage('A valid assignee id is required'),
  body('priority').optional().isIn(Object.values(PRIORITY)).withMessage('Invalid priority value'),
  body('status').optional().isIn(Object.values(TASK_STATUS)).withMessage('Invalid status value'),
  body('dueDate').isISO8601().withMessage('A valid due date is required'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
];

const updateTaskValidator = [
  body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty'),
  body('description').optional().trim(),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignee id'),
  body('priority').optional().isIn(Object.values(PRIORITY)).withMessage('Invalid priority value'),
  body('status').optional().isIn(Object.values(TASK_STATUS)).withMessage('Invalid status value'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Invalid estimated hours'),
  body('actualHours').optional().isFloat({ min: 0 }).withMessage('Invalid actual hours'),
];

module.exports = { createTaskValidator, updateTaskValidator };

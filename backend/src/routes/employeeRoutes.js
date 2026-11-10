const express = require('express');
const router = express.Router();

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
} = require('../validators/employeeValidator');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER), getEmployees);
router.post('/', authorize(ROLES.ADMIN), createEmployeeValidator, validate, createEmployee);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), getEmployeeById);
router.patch('/:id', authorize(ROLES.ADMIN), updateEmployeeValidator, validate, updateEmployee);
router.delete('/:id', authorize(ROLES.ADMIN), deleteEmployee);

module.exports = router;

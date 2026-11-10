const express = require('express');
const router = express.Router();

const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const { registerValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.MANAGER), getUsers);
router.post('/', authorize(ROLES.ADMIN), registerValidator, validate, createUser);
router.patch('/:id', authorize(ROLES.ADMIN), updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), deleteUser);

module.exports = router;

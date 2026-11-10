const express = require('express');
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  createProjectValidator,
  updateProjectValidator,
} = require('../validators/projectValidator');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getProjects);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), createProjectValidator, validate, createProject);
router.get('/:id', getProjectById);
router.patch(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  updateProjectValidator,
  validate,
  updateProject
);
router.delete('/:id', authorize(ROLES.ADMIN), deleteProject);

module.exports = router;

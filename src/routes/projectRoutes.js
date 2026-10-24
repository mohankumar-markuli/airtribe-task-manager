const express = require('express');
const { createProject, listProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;

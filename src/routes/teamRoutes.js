const express = require('express');
const { createTeam, listTeams, getTeam, updateTeam, deleteTeam, addMember, removeMember } = require('../controllers/teamController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', createTeam);
router.get('/', listTeams);
router.get('/:id', getTeam);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;

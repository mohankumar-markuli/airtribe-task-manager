const Project = require('../models/Project');
const Team = require('../models/Team');

function notFound(res, entity = 'Project') {
  return res.status(404).json({ success: false, message: `${entity} not found` });
}

// Create a project within a team (owner must be member of team)
async function createProject(req, res, next) {
  try {
    const { name, description, teamId } = req.body;
    if (!name || !teamId) {
      return res.status(400).json({ success: false, message: 'Project name and teamId are required' });
    }
    const ownerId = req.user.id;
    const team = await Team.findById(teamId);
    if (!team) return notFound(res, 'Team');
    if (!team.members.map((m) => m.toString()).includes(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not a member of the specified team' });
    }
    const project = await Project.create({
      name,
      description: description || '',
      owner: ownerId,
      team: teamId,
    });
    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('team', 'name');
    return res.status(201).json({ success: true, data: { project: populated } });
  } catch (err) {
    next(err);
  }
}

// List projects (for user's teams or filtered by teamId)
async function listProjects(req, res, next) {
  try {
    const { teamId } = req.query;
    let query = {};
    if (teamId) {
      query.team = teamId;
    } else {
      // Find all teams user is part of
      const userTeams = await Team.find({
        $or: [{ members: req.user.id }, { owner: req.user.id }],
      }).select('_id');
      const teamIds = userTeams.map((t) => t._id);
      query = {
        $or: [{ team: { $in: teamIds } }, { owner: req.user.id }],
      };
    }
    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('team', 'name');
    return res.status(200).json({ success: true, data: { projects } });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('team');
    if (!project) return notFound(res);
    const team = await Team.findById(project.team._id || project.team);
    if (team && !team.members.map((m) => m.toString()).includes(req.user.id) && project.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.status(200).json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return notFound(res);
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only owner can update' });
    }
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    const updated = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email')
      .populate('team', 'name');
    return res.status(200).json({ success: true, data: { project: updated } });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return notFound(res);
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only owner can delete' });
    }
    await Project.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
};

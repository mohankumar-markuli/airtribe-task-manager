const Team = require('../models/Team');
const User = require('../models/User');

function notFound(res, entity = 'Team') {
  return res.status(404).json({ success: false, message: `${entity} not found` });
}

// Create a new team – the creator becomes owner and first member
async function createTeam(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }
    const ownerId = req.user.id;
    const team = await Team.create({
      name,
      description: description || '',
      owner: ownerId,
      members: [ownerId],
    });
    const populated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    return res.status(201).json({ success: true, data: { team: populated } });
  } catch (err) {
    next(err);
  }
}

// List all teams the user belongs to or owns
async function listTeams(req, res, next) {
  try {
    const teams = await Team.find({
      $or: [{ members: req.user.id }, { owner: req.user.id }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email');
    return res.status(200).json({ success: true, data: { teams } });
  } catch (err) {
    next(err);
  }
}

// Get a team (only members or owner can view)
async function getTeam(req, res, next) {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!team) return notFound(res);
    const isMember = team.members.some((m) => m._id.toString() === req.user.id);
    const isOwner = team.owner && team.owner._id.toString() === req.user.id;
    if (!isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.status(200).json({ success: true, data: { team } });
  } catch (err) {
    next(err);
  }
}

// Update team name/description (owner only)
async function updateTeam(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return notFound(res);
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team owner can update' });
    }
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    const updated = await Team.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email')
      .populate('members', 'name email');
    return res.status(200).json({ success: true, data: { team: updated } });
  } catch (err) {
    next(err);
  }
}

// Delete team (owner only) – also removes reference from tasks
async function deleteTeam(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return notFound(res);
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team owner can delete' });
    }
    await Team.findByIdAndDelete(req.params.id);
    const Task = require('../models/Task');
    await Task.updateMany({ team: team._id }, { $set: { team: null } });
    return res.status(200).json({ success: true, message: 'Team deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// Add a member – owner can invite by userId or email
async function addMember(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return notFound(res);
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the owner can add members' });
    }
    const { userId, email } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ success: false, message: 'userId or email is required' });
    }
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }
    if (!user) return notFound(res, 'User');

    if (!team.members.map((m) => m.toString()).includes(user._id.toString())) {
      team.members.push(user._id);
      await team.save();
    }
    const updated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    return res.status(200).json({ success: true, message: 'Member added', data: { team: updated } });
  } catch (err) {
    next(err);
  }
}

// Remove a member – owner or the member themselves can remove
async function removeMember(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return notFound(res);
    const { userId } = req.params;
    const requesterId = req.user.id;
    const isOwner = team.owner.toString() === requesterId;
    const isSelf = requesterId === userId;
    if (!isOwner && !isSelf) {
      return res.status(403).json({ success: false, message: 'Only owner or the member can remove' });
    }
    team.members = team.members.filter((id) => id.toString() !== userId);
    if (isSelf && team.owner.toString() === userId) {
      team.owner = team.members[0] || null;
    }
    await team.save();
    const updated = await Team.findById(team._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    return res.status(200).json({ success: true, message: 'Member removed', data: { team: updated } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
};

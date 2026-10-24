const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Team = require('../models/Team');

async function hasTaskAccess(task, userId) {
  if (!task) return false;
  if (task.owner.toString() === userId.toString()) return true;
  if (task.assignee && task.assignee.toString() === userId.toString()) return true;
  if (task.team) {
    const team = await Team.findById(task.team);
    if (team && team.members.map((m) => m.toString()).includes(userId.toString())) {
      return true;
    }
  }
  return false;
}

// Add a comment to a task
async function addComment(req, res, next) {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    const authorId = req.user.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const allowed = await hasTaskAccess(task, authorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const comment = await Comment.create({ task: taskId, author: authorId, content: content.trim() });
    const populated = await Comment.findById(comment._id).populate('author', 'name email');

    // Emit socket event to task room
    const io = req.app.get('io');
    if (io) {
      io.to(taskId).emit('commentAdded', populated);
      if (task.assignee && task.assignee.toString() !== authorId) {
        io.to(`user_${task.assignee}`).emit('commentAdded', populated);
      }
    }
    return res.status(201).json({ success: true, message: 'Comment added', data: { comment: populated } });
  } catch (err) {
    next(err);
  }
}

// List comments for a task
async function getComments(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const allowed = await hasTaskAccess(task, req.user.id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const comments = await Comment.find({ task: taskId })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: { comments } });
  } catch (err) {
    next(err);
  }
}

// Delete a comment – only author or task owner can delete
async function deleteComment(req, res, next) {
  try {
    const { taskId, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const isAuthor = comment.author.toString() === req.user.id;
    const isTaskOwner = task.owner.toString() === req.user.id;
    if (!isAuthor && !isTaskOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }
    await Comment.findByIdAndDelete(commentId);
    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { addComment, getComments, deleteComment };

const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const Team = require('../models/Team');
const path = require('path');
const fs = require('fs');

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

// Upload a file for a task
async function uploadAttachment(req, res, next) {
  try {
    const { taskId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    const userId = req.user.id;
    const allowed = await hasTaskAccess(task, userId);
    if (!allowed) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const attachment = await Attachment.create({
      task: taskId,
      uploader: userId,
      filename: file.originalname || file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });
    const populated = await Attachment.findById(attachment._id).populate('uploader', 'name email');

    // Emit socket event for the task room
    const io = req.app.get('io');
    if (io) {
      io.to(taskId).emit('attachmentAdded', populated);
    }
    return res.status(201).json({ success: true, message: 'Attachment uploaded successfully', data: { attachment: populated } });
  } catch (err) {
    next(err);
  }
}

// List all attachments for a task
async function listAttachments(req, res, next) {
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
    const attachments = await Attachment.find({ task: taskId })
      .populate('uploader', 'name email')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: { attachments } });
  } catch (err) {
    next(err);
  }
}

// Download an attachment file
async function getAttachment(req, res, next) {
  try {
    const { taskId, attachmentId } = req.params;
    const attachment = await Attachment.findOne({ _id: attachmentId, task: taskId });
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    const task = await Task.findById(taskId);
    const allowed = await hasTaskAccess(task, req.user.id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const filePath = path.resolve(attachment.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Attachment file not found on disk' });
    }
    return res.download(filePath, attachment.filename);
  } catch (err) {
    next(err);
  }
}

// Delete an attachment (owner or uploader)
async function deleteAttachment(req, res, next) {
  try {
    const { taskId, attachmentId } = req.params;
    const attachment = await Attachment.findOne({ _id: attachmentId, task: taskId });
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    const task = await Task.findById(taskId);
    const userId = req.user.id;
    const isOwner = task && task.owner.toString() === userId;
    const isUploader = attachment.uploader.toString() === userId;
    if (!isOwner && !isUploader) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete' });
    }
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }
    await Attachment.findByIdAndDelete(attachmentId);
    return res.status(200).json({ success: true, message: 'Attachment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadAttachment, listAttachments, getAttachment, deleteAttachment };

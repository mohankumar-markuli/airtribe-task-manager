const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true }, // relative path on server
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Attachment', attachmentSchema);

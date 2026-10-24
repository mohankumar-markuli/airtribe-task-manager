
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            minlength: [2, 'Task title must contain at least 2 characters'],
            maxlength: [120, 'Task title cannot exceed 120 characters'],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
            default: '',
        },

        dueDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending',
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Task owner is required'],
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);

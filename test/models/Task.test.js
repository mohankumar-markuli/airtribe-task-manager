
const mongoose = require('mongoose');
const Task = require('../../src/models/Task');

describe('Task model', () => {
    it('creates a task with default values', () => {
        const task = new Task({
            title: 'Finish assignment',
            owner: new mongoose.Types.ObjectId(),
        });

        expect(task.title).toBe('Finish assignment');
        expect(task.description).toBe('');
        expect(task.status).toBe('pending');
        expect(task.dueDate).toBeNull();
        expect(task.owner).toBeDefined();
    });

    it('enables automatic creation and update timestamps', () => {
        expect(Task.schema.options.timestamps).toBe(true);
        expect(Task.schema.path('createdAt')).toBeDefined();
        expect(Task.schema.path('updatedAt')).toBeDefined();
    });

    it('rejects a task without a title', async () => {
        const task = new Task({
            owner: new mongoose.Types.ObjectId(),
        });

        await expect(task.validate()).rejects.toMatchObject({
            errors: {
                title: expect.anything(),
            },
        });
    });

    it('rejects an invalid task status', async () => {
        const task = new Task({
            title: 'Finish assignment',
            owner: new mongoose.Types.ObjectId(),
            status: 'unknown',
        });

        await expect(task.validate()).rejects.toMatchObject({
            errors: {
                status: expect.anything(),
            },
        });
    });

    it('rejects a title that is too short', async () => {
        const task = new Task({
            title: 'A',
            owner: new mongoose.Types.ObjectId(),
        });

        await expect(task.validate()).rejects.toMatchObject({
            errors: {
                title: expect.anything(),
            },
        });
    });
});

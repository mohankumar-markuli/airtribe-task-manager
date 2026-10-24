
const {
    createTaskSchema,
    updateTaskSchema,
} = require('../../src/utils/taskValidation');

describe('createTaskSchema', () => {
    it('accepts a valid task', () => {
        const result = createTaskSchema.safeParse({
            title: 'Finish assignment',
            description: 'Complete the backend',
            dueDate: '2026-10-25T18:00:00+05:30',
        });

        expect(result.success).toBe(true);
    });

    it('rejects a short title', () => {
        const result = createTaskSchema.safeParse({
            title: 'A',
        });

        expect(result.success).toBe(false);
    });

    it('rejects unexpected fields', () => {
        const result = createTaskSchema.safeParse({
            title: 'Finish assignment',
            owner: 'another-user-id',
        });

        expect(result.success).toBe(false);
    });

    it('rejects an invalid due date', () => {
        const result = createTaskSchema.safeParse({
            title: 'Finish assignment',
            dueDate: 'tomorrow',
        });

        expect(result.success).toBe(false);
    });
});

describe('updateTaskSchema', () => {
    it('accepts a status update', () => {
        const result = updateTaskSchema.safeParse({
            status: 'completed',
        });

        expect(result.success).toBe(true);
    });

    it('accepts clearing the due date', () => {
        const result = updateTaskSchema.safeParse({
            dueDate: null,
        });

        expect(result.success).toBe(true);
    });

    it('rejects an empty update', () => {
        const result = updateTaskSchema.safeParse({});

        expect(result.success).toBe(false);
    });

    it('rejects an invalid status', () => {
        const result = updateTaskSchema.safeParse({
            status: 'finished',
        });

        expect(result.success).toBe(false);
    });
});

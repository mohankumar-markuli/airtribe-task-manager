require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const path = require('path');
const fs = require('fs');

async function testAllEndpoints() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const results = [];
  const record = (name, method, endpoint, status, passed, details = '') => {
    results.push({ name, method, endpoint, status, passed, details });
    const mark = passed ? '✅' : '❌';
    console.log(`${mark} [${method}] ${endpoint} -> ${status} ${details ? `(${details})` : ''}`);
  };

  // 1. Health
  try {
    const res = await request(app).get('/api/v1/health');
    record('Health Check', 'GET', '/api/v1/health', res.status, res.status === 200, res.body.data?.database);
  } catch (e) {
    record('Health Check', 'GET', '/api/v1/health', 500, false, e.message);
  }

  // 2. Auth: Register
  let userToken = '';
  let userId = '';
  const testUserEmail = `tester_${Date.now()}@example.com`;
  try {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Integration Tester',
      email: testUserEmail,
      password: 'Password123!',
    });
    record('User Registration', 'POST', '/api/v1/auth/register', res.status, res.status === 201, res.body.data?.user?.email);
  } catch (e) {
    record('User Registration', 'POST', '/api/v1/auth/register', 500, false, e.message);
  }

  // 3. Auth: Login
  try {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUserEmail,
      password: 'Password123!',
    });
    userToken = res.body.data?.accessToken;
    userId = res.body.data?.user?.id;
    record('User Login', 'POST', '/api/v1/auth/login', res.status, res.status === 200 && !!userToken);
  } catch (e) {
    record('User Login', 'POST', '/api/v1/auth/login', 500, false, e.message);
  }

  const authHeader = { Authorization: `Bearer ${userToken}` };

  // 4. Auth: Get Profile
  try {
    const res = await request(app).get('/api/v1/auth/me').set(authHeader);
    record('Get Profile', 'GET', '/api/v1/auth/me', res.status, res.status === 200, res.body.data?.user?.name);
  } catch (e) {
    record('Get Profile', 'GET', '/api/v1/auth/me', 500, false, e.message);
  }

  // 5. Auth: Update Profile
  try {
    const res = await request(app).patch('/api/v1/auth/me').set(authHeader).send({
      name: 'Integration Tester Lead',
    });
    record('Update Profile', 'PATCH', '/api/v1/auth/me', res.status, res.status === 200, res.body.data?.user?.name);
  } catch (e) {
    record('Update Profile', 'PATCH', '/api/v1/auth/me', 500, false, e.message);
  }

  // 6. Teams: Create Team
  let teamId = '';
  try {
    const res = await request(app).post('/api/v1/teams').set(authHeader).send({
      name: 'QA & Testing Team',
      description: 'Dedicated to automated and integration testing.',
    });
    teamId = res.body.data?.team?._id;
    record('Create Team', 'POST', '/api/v1/teams', res.status, res.status === 201, `ID: ${teamId}`);
  } catch (e) {
    record('Create Team', 'POST', '/api/v1/teams', 500, false, e.message);
  }

  // 7. Teams: List Teams
  try {
    const res = await request(app).get('/api/v1/teams').set(authHeader);
    record('List Teams', 'GET', '/api/v1/teams', res.status, res.status === 200, `Count: ${res.body.data?.teams?.length}`);
  } catch (e) {
    record('List Teams', 'GET', '/api/v1/teams', 500, false, e.message);
  }

  // 8. Teams: Get Team by ID
  try {
    const res = await request(app).get(`/api/v1/teams/${teamId}`).set(authHeader);
    record('Get Team by ID', 'GET', `/api/v1/teams/:id`, res.status, res.status === 200, res.body.data?.team?.name);
  } catch (e) {
    record('Get Team by ID', 'GET', `/api/v1/teams/:id`, 500, false, e.message);
  }

  // 9. Teams: Add Member by Email
  try {
    const res = await request(app).post(`/api/v1/teams/${teamId}/members`).set(authHeader).send({
      email: 'bob@example.com',
    });
    record('Add Team Member', 'POST', `/api/v1/teams/:id/members`, res.status, res.status === 200, 'Invited bob@example.com');
  } catch (e) {
    record('Add Team Member', 'POST', `/api/v1/teams/:id/members`, 500, false, e.message);
  }

  // 10. Projects: Create Project
  let projectId = '';
  try {
    const res = await request(app).post('/api/v1/projects').set(authHeader).send({
      name: 'Test Automation Framework',
      description: 'Comprehensive API test coverage project',
      teamId: teamId,
    });
    projectId = res.body.data?.project?._id;
    record('Create Project', 'POST', '/api/v1/projects', res.status, res.status === 201, `ID: ${projectId}`);
  } catch (e) {
    record('Create Project', 'POST', '/api/v1/projects', 500, false, e.message);
  }

  // 11. Projects: List Projects
  try {
    const res = await request(app).get('/api/v1/projects').set(authHeader);
    record('List Projects', 'GET', '/api/v1/projects', res.status, res.status === 200, `Count: ${res.body.data?.projects?.length}`);
  } catch (e) {
    record('List Projects', 'GET', '/api/v1/projects', 500, false, e.message);
  }

  // 12. Tasks: Create Task
  let taskId = '';
  try {
    const res = await request(app).post('/api/v1/tasks').set(authHeader).send({
      title: 'Write Integration Test Report',
      description: 'Automate verification of all routes and status codes',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'pending',
      team: teamId,
    });
    taskId = res.body.data?.task?._id;
    record('Create Task', 'POST', '/api/v1/tasks', res.status, res.status === 201, `ID: ${taskId}`);
  } catch (e) {
    record('Create Task', 'POST', '/api/v1/tasks', 500, false, e.message);
  }

  // 13. Tasks: List Tasks (Search & Filter)
  try {
    const res = await request(app).get('/api/v1/tasks?search=report&status=open').set(authHeader);
    record('List Tasks with Filters', 'GET', '/api/v1/tasks?search=report&status=open', res.status, res.status === 200, `Found: ${res.body.data?.tasks?.length}`);
  } catch (e) {
    record('List Tasks with Filters', 'GET', '/api/v1/tasks', 500, false, e.message);
  }

  // 14. Tasks: Get Task Details
  try {
    const res = await request(app).get(`/api/v1/tasks/${taskId}`).set(authHeader);
    record('Get Task by ID', 'GET', `/api/v1/tasks/:id`, res.status, res.status === 200, res.body.data?.task?.title);
  } catch (e) {
    record('Get Task by ID', 'GET', `/api/v1/tasks/:id`, 500, false, e.message);
  }

  // 15. Tasks: Update / Mark Task Completed
  try {
    const res = await request(app).patch(`/api/v1/tasks/${taskId}`).set(authHeader).send({
      status: 'completed',
    });
    record('Update/Complete Task', 'PATCH', `/api/v1/tasks/:id`, res.status, res.status === 200, `Status: ${res.body.data?.task?.status}`);
  } catch (e) {
    record('Update/Complete Task', 'PATCH', `/api/v1/tasks/:id`, 500, false, e.message);
  }

  // 16. Comments: Add Comment
  let commentId = '';
  try {
    const res = await request(app).post(`/api/v1/tasks/${taskId}/comments`).set(authHeader).send({
      content: 'All validation criteria met successfully in automated suite.',
    });
    commentId = res.body.data?.comment?._id;
    record('Add Comment', 'POST', `/api/v1/tasks/:taskId/comments`, res.status, res.status === 201, `Comment ID: ${commentId}`);
  } catch (e) {
    record('Add Comment', 'POST', `/api/v1/tasks/:taskId/comments`, 500, false, e.message);
  }

  // 17. Comments: List Comments
  try {
    const res = await request(app).get(`/api/v1/tasks/${taskId}/comments`).set(authHeader);
    record('List Comments', 'GET', `/api/v1/tasks/:taskId/comments`, res.status, res.status === 200, `Count: ${res.body.data?.comments?.length}`);
  } catch (e) {
    record('List Comments', 'GET', `/api/v1/tasks/:taskId/comments`, 500, false, e.message);
  }

  // 18. Attachments: Upload File Attachment
  let attachmentId = '';
  try {
    const dummyFilePath = path.resolve(__dirname, 'test-upload.txt');
    fs.writeFileSync(dummyFilePath, 'Sample test upload content for task attachments verification.');
    const res = await request(app)
      .post(`/api/v1/tasks/${taskId}/attachments`)
      .set(authHeader)
      .attach('file', dummyFilePath);
    attachmentId = res.body.data?.attachment?._id;
    if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    record('Upload Attachment', 'POST', `/api/v1/tasks/:taskId/attachments`, res.status, res.status === 201, `Filename: ${res.body.data?.attachment?.filename}`);
  } catch (e) {
    record('Upload Attachment', 'POST', `/api/v1/tasks/:taskId/attachments`, 500, false, e.message);
  }

  // 19. Attachments: List Attachments
  try {
    const res = await request(app).get(`/api/v1/tasks/${taskId}/attachments`).set(authHeader);
    record('List Attachments', 'GET', `/api/v1/tasks/:taskId/attachments`, res.status, res.status === 200, `Count: ${res.body.data?.attachments?.length}`);
  } catch (e) {
    record('List Attachments', 'GET', `/api/v1/tasks/:taskId/attachments`, 500, false, e.message);
  }

  // 20. Attachments: Download Attachment
  try {
    const res = await request(app).get(`/api/v1/tasks/${taskId}/attachments/${attachmentId}`).set(authHeader);
    record('Download Attachment', 'GET', `/api/v1/tasks/:taskId/attachments/:id`, res.status, res.status === 200, 'File binary/text received');
  } catch (e) {
    record('Download Attachment', 'GET', `/api/v1/tasks/:taskId/attachments/:id`, 500, false, e.message);
  }

  // 21. AI Description Generation
  try {
    const res = await request(app).post('/api/v1/ai/generate-description').set(authHeader).send({
      title: 'Automated Continuous Delivery Pipeline',
      details: 'Configure GitHub Actions workflow for zero-downtime deployment',
    });
    record('AI Task Description', 'POST', '/api/v1/ai/generate-description', res.status, res.status === 200, `Model: ${res.body.data?.model}`);
  } catch (e) {
    record('AI Task Description', 'POST', '/api/v1/ai/generate-description', 500, false, e.message);
  }

  // 22. Auth: Logout
  try {
    const res = await request(app).post('/api/v1/auth/logout').set(authHeader);
    record('User Logout', 'POST', '/api/v1/auth/logout', res.status, res.status === 200, res.body.message);
  } catch (e) {
    record('User Logout', 'POST', '/api/v1/auth/logout', 500, false, e.message);
  }

  // 23. Cleanup: Delete Task & Team created during test
  try {
    if (taskId) {
      const res = await request(app).delete(`/api/v1/tasks/${taskId}`).set(authHeader);
      record('Delete Task', 'DELETE', `/api/v1/tasks/:id`, res.status, res.status === 200, res.body.message);
    }
    if (teamId) {
      const res = await request(app).delete(`/api/v1/teams/${teamId}`).set(authHeader);
      record('Delete Team', 'DELETE', `/api/v1/teams/:id`, res.status, res.status === 200, res.body.message);
    }
  } catch (e) {
    // cleanup
  }

  console.log('\n========================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TEST SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} Endpoints Passed`);
  console.log(`Overall Status: ${allPassed ? 'ALL ENDPOINTS WORKING PERFECTLY ✅' : 'SOME CHECKS FAILED ❌'}`);
  console.log('========================================\n');

  await mongoose.disconnect();
}

testAllEndpoints().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

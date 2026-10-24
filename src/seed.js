require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Team = require('./models/Team');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Attachment = require('./models/Attachment');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully.');

  console.log('Clearing existing dummy data (optional cleanup)...');
  // Clean up previous test users if any
  const testEmails = [
    'alice@example.com',
    'bob@example.com',
    'charlie@example.com',
  ];
  const existingUsers = await User.find({ email: { $in: testEmails } });
  const userIds = existingUsers.map((u) => u._id);

  if (userIds.length > 0) {
    await Task.deleteMany({ owner: { $in: userIds } });
    await Team.deleteMany({ owner: { $in: userIds } });
    await Project.deleteMany({ owner: { $in: userIds } });
    await Comment.deleteMany({ author: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    console.log('Cleaned up previous sample data.');
  }

  console.log('Creating dummy users...');
  const alice = await User.create({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'Password123!',
  });

  const bob = await User.create({
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'Password123!',
  });

  const charlie = await User.create({
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    password: 'Password123!',
  });

  console.log('Users created:');
  console.log(` - Alice: ${alice.email} (ID: ${alice._id})`);
  console.log(` - Bob:   ${bob.email} (ID: ${bob._id})`);
  console.log(` - Charlie: ${charlie.email} (ID: ${charlie._id})`);

  console.log('Creating dummy teams...');
  const engineeringTeam = await Team.create({
    name: 'Core Engineering',
    description: 'Responsible for backend architecture, cloud APIs, and infrastructure.',
    owner: alice._id,
    members: [alice._id, bob._id, charlie._id],
  });

  console.log(` - Team created: "${engineeringTeam.name}" (ID: ${engineeringTeam._id})`);

  console.log('Creating dummy projects...');
  const cloudProject = await Project.create({
    name: 'Cloud Infrastructure Upgrade',
    description: 'Transition database clusters and set up auto-scaling containers.',
    owner: alice._id,
    team: engineeringTeam._id,
  });

  console.log(` - Project created: "${cloudProject.name}" (ID: ${cloudProject._id})`);

  console.log('Creating dummy tasks...');
  const task1 = await Task.create({
    title: 'Setup Redis Caching for User Sessions',
    description: 'Integrate Redis cluster and implement TTL caching to reduce query loads.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'in_progress',
    owner: alice._id,
    assignee: bob._id,
    team: engineeringTeam._id,
  });

  const task2 = await Task.create({
    title: 'Database Index Optimization',
    description: 'Create compound indexes on Task owner, status, and due dates for faster searches.',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'completed',
    owner: alice._id,
    assignee: alice._id,
    team: engineeringTeam._id,
  });

  const task3 = await Task.create({
    title: 'Implement AI Task Summary Endpoint',
    description: 'Connect OpenRouter nemotron model to generate automatic summaries of task requirements.',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'pending',
    owner: bob._id,
    assignee: charlie._id,
    team: engineeringTeam._id,
  });

  console.log(` - Task 1: "${task1.title}" (Assigned to Bob)`);
  console.log(` - Task 2: "${task2.title}" (Assigned to Alice)`);
  console.log(` - Task 3: "${task3.title}" (Assigned to Charlie)`);

  console.log('Creating dummy comments...');
  const comment1 = await Comment.create({
    task: task1._id,
    author: bob._id,
    content: 'Initial benchmarks with Redis look great, query latency dropped by 60%.',
  });

  const comment2 = await Comment.create({
    task: task1._id,
    author: alice._id,
    content: 'Awesome work Bob! Please make sure fallback connection logic is handled.',
  });

  console.log(` - Comments created on task "${task1.title}"`);

  console.log('Creating sample attachment dummy entry...');
  const sampleFilePath = path.resolve(__dirname, '../uploads/sample-architecture.txt');
  const uploadDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  fs.writeFileSync(sampleFilePath, 'Architecture Diagram & Specification Document - Airtribe Task Manager');

  const attachment = await Attachment.create({
    task: task1._id,
    uploader: alice._id,
    filename: 'sample-architecture.txt',
    mimetype: 'text/plain',
    size: Buffer.byteLength('Architecture Diagram & Specification Document - Airtribe Task Manager'),
    path: sampleFilePath,
  });
  console.log(` - Attachment created: "${attachment.filename}"`);

  console.log('\n========================================');
  console.log('🎉 MongoDB Dummy Data Seeded Successfully!');
  console.log('========================================');
  console.log('Sample Accounts for Testing (Password for all: Password123!):');
  console.log('1. alice@example.com (Owner of Engineering Team)');
  console.log('2. bob@example.com (Assignee on Task 1)');
  console.log('3. charlie@example.com (Assignee on Task 3)');
  console.log('========================================\n');

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

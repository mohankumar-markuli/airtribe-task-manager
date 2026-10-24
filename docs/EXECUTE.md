# Execution & API Guide

This guide provides step-by-step instructions to set up, run, and test the **Airtribe Task Manager Backend API**.

---

## 1. Prerequisites

- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: MongoDB Atlas URI or a local MongoDB instance running on `mongodb://localhost:27017/taskmanager`

---

## 2. Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/mohankumar-markuli/airtribe-task-manager.git
   cd airtribe-task-manager
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   *On Windows PowerShell:*
   ```powershell
   Copy-Item .env.example .env
   ```

   Ensure `.env` contains:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskmanager
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars_long
   JWT_EXPIRES_IN=1d
   CORS_ORIGIN=http://localhost:3000
   OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
   ```

---

## 3. Running the Application

### Development Mode (with hot-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

When the server starts successfully, you will see:
```
MongoDB connected successfully.
Task Manager API listening on port 3000
```

### Health Check:
Open browser or run:
```bash
curl http://localhost:3000/api/v1/health
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task Manager API is running",
  "data": {
    "status": "healthy",
    "service": "airtribe-task-manager",
    "database": "connected"
  }
}
```

---

## 4. API Endpoints & Testing Guide

All protected endpoints require the following header:
```http
Authorization: Bearer <your_jwt_access_token>
```

### 4.1 Authentication & Profile Management

#### Register User
- **POST** `/api/v1/auth/register`
- **Body:**
  ```json
  {
    "name": "Alice Developer",
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```

#### Login User
- **POST** `/api/v1/auth/login`
- **Body:**
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "...", "name": "Alice Developer", "email": "alice@example.com" },
      "accessToken": "eyJhbGciOi...",
      "tokenType": "Bearer"
    }
  }
  ```

#### Get Current Profile
- **GET** `/api/v1/auth/me`

#### Update Profile (Personal Information)
- **PUT** or **PATCH** `/api/v1/auth/me`
- **Body:**
  ```json
  {
    "name": "Alice Senior Engineer",
    "password": "NewSecretPassword123!"
  }
  ```

#### Logout
- **POST** `/api/v1/auth/logout`

---

### 4.2 Task Management

#### Create Task
- **POST** `/api/v1/tasks`
- **Body:**
  ```json
  {
    "title": "Design Database Schema",
    "description": "Create ER diagrams and Mongoose schemas for tasks, teams, and comments",
    "dueDate": "2026-11-01T18:00:00.000Z",
    "status": "pending",
    "assignee": "<userId_optional>",
    "team": "<teamId_optional>"
  }
  ```

#### List Tasks (Filtering, Sorting, Searching)
- **GET** `/api/v1/tasks`
- **Query Parameters:**
  - `status`: `pending` | `in_progress` | `completed` | `open` (matches pending & in_progress)
  - `search`: Searches across **both title and description** (e.g. `?search=schema`)
  - `sortBy`: `createdAt` | `dueDate` | `title` | `updatedAt`
  - `order`: `asc` | `desc`
  - `assignedToMe`: `true` (lists only tasks assigned to the current user)
  - `scope`: `assigned` | `created` | `all`
  - `team`: Filter by team ID

**Example:**
```bash
curl -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/api/v1/tasks?status=open&search=design&sortBy=dueDate&order=asc"
```

#### Get Task Details
- **GET** `/api/v1/tasks/:id`

#### Update Task / Complete Task / Assign Task
- **PATCH** `/api/v1/tasks/:id`
- **Body:**
  ```json
  {
    "status": "completed",
    "assignee": "<target_user_id>"
  }
  ```

#### Delete Task
- **DELETE** `/api/v1/tasks/:id`

---

### 4.3 Team & Project Collaboration

#### Create Team
- **POST** `/api/v1/teams`
- **Body:**
  ```json
  {
    "name": "Engineering Alpha",
    "description": "Backend & infrastructure engineering squad"
  }
  ```

#### List My Teams
- **GET** `/api/v1/teams`

#### Get Team Details
- **GET** `/api/v1/teams/:id`

#### Invite / Add Team Member
- **POST** `/api/v1/teams/:id/members`
- **Body (by user ID or email):**
  ```json
  {
    "email": "bob@example.com"
  }
  ```

#### Remove Team Member
- **DELETE** `/api/v1/teams/:id/members/:userId`

#### Create Project within Team
- **POST** `/api/v1/projects`
- **Body:**
  ```json
  {
    "name": "Cloud Migration",
    "description": "Migrate services to production cluster",
    "teamId": "<team_id>"
  }
  ```

#### List Projects
- **GET** `/api/v1/projects` (optional query: `?teamId=<team_id>`)

---

### 4.4 Task Comments & Attachments

#### Add Comment to Task
- **POST** `/api/v1/tasks/:taskId/comments`
- **Body:**
  ```json
  {
    "content": "I reviewed the initial PR and added benchmark numbers."
  }
  ```

#### List Comments for Task
- **GET** `/api/v1/tasks/:taskId/comments`

#### Delete Comment
- **DELETE** `/api/v1/tasks/:taskId/comments/:commentId`

#### Upload File Attachment
- **POST** `/api/v1/tasks/:taskId/attachments`
- **Header:** `Content-Type: multipart/form-data`
- **Form-data field:** `file` (Select any image, document, or PDF up to 5MB)

#### List Attachments for Task
- **GET** `/api/v1/tasks/:taskId/attachments`

#### Download Attachment
- **GET** `/api/v1/tasks/:taskId/attachments/:attachmentId`

#### Delete Attachment
- **DELETE** `/api/v1/tasks/:taskId/attachments/:attachmentId`

---

### 4.5 Generative AI Task Description & Summarization

Generate polished task descriptions or summaries using OpenRouter AI (`nvidia/nemotron-3-ultra-550b-a55b:free`):

- **POST** `/api/v1/ai/generate-description`
- **Body:**
  ```json
  {
    "title": "Implement Redis Caching Layer",
    "details": "Cache user sessions and task lookups with 15-minute TTL to reduce database latency"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "description": "Objective: Implement a Redis caching layer to cache user sessions and task queries...\nExpected Outcomes: Reduced query latency and optimized DB load.\nAcceptance Criteria: Sessions cached with 15m TTL...",
      "model": "nvidia/nemotron-3-ultra-550b-a55b:free"
    }
  }
  ```

---

### 4.6 Real-Time Notifications (Socket.io)

Connect to `http://localhost:3000` using any WebSocket / Socket.io client:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// Join personal user room to receive task assignments
socket.emit('joinUser', '<your_user_id>');

// Join a task room to receive task updates, comments, and attachments
socket.emit('joinTask', '<task_id>');

// Listen for assignment notifications
socket.on('taskAssigned', (data) => {
  console.log('Notification received:', data.message, data.task);
});

// Listen for live task updates
socket.on('taskUpdated', (task) => {
  console.log('Task updated:', task);
});

// Listen for live comments
socket.on('commentAdded', (comment) => {
  console.log('New comment on task:', comment);
});

// Listen for live attachments
socket.on('attachmentAdded', (attachment) => {
  console.log('New attachment uploaded:', attachment);
});
```

---

## 5. Verification Checklist

- [x] Node.js + Express.js setup with modular architecture
- [x] MongoDB database connection with Mongoose
- [x] Secure authentication with bcrypt password hashing and JWT
- [x] User registration, login, profile view, profile update, and logout
- [x] Full CRUD operations on tasks
- [x] Task filtering by status (including `open`), sorting (by date, title), and full-text search (title & description)
- [x] Task assignment within teams and view assigned tasks (`?assignedToMe=true`)
- [x] Team management: create team, invite member by email/ID, remove member
- [x] Project management: create project within team, list projects
- [x] Task collaboration: comments and file attachments with Multer
- [x] Real-time updates and notifications using Socket.io
- [x] Generative AI integration via OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free`)

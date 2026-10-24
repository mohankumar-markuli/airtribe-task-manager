# Airtribe Task Manager API

A collaborative, real-time backend system for task tracking and management built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Socket.io**. The application empowers users to create, assign, and track tasks, collaborate with team members through comments and file attachments, receive real-time notifications, and generate AI-assisted task descriptions.

---

## 🚀 Features & Highlights

- **User Authentication & Management**: Secure registration, login, JWT session management, password hashing via `bcryptjs`, profile viewing/updates, and secure logout.
- **Task Management (Full CRUD)**:
  - Create tasks with title, description, due date, status, assignee, and team.
  - Multi-attribute task filtering by status (`pending`, `in_progress`, `completed`, `open`).
  - Search across **both title and description**.
  - Flexible sorting (`createdAt`, `dueDate`, `title`, `updatedAt`).
  - View tasks assigned to the authenticated user (`?assignedToMe=true`).
- **Team & Project Collaboration**:
  - Create and manage teams, invite members by email or user ID, and remove members.
  - Create and manage projects associated with teams.
  - Task assignment to team members with real-time assignment notifications.
- **Comments & File Attachments**:
  - Add and list comments on tasks with author population.
  - Upload file attachments (images, documents, PDFs) with `Multer` (up to 5MB) and stream downloads.
- **Real-Time Updates & Notifications (Socket.io)**:
  - Live socket events for task creation (`taskCreated`), updates (`taskUpdated`), assignments (`taskAssigned`), comments (`commentAdded`), and attachments (`attachmentAdded`).
  - Room-based isolation for user personal notifications (`joinUser`) and task collaboration (`joinTask`).
- **Generative AI Integration (OpenRouter)**:
  - Generate polished task descriptions and summaries automatically using OpenRouter AI (`nvidia/nemotron-3-ultra-550b-a55b:free`).
- **Production-Ready & Secure**:
  - Security headers with `helmet`.
  - Rate limiting with `express-rate-limit`.
  - Strict input validation using `Zod`.
  - Configurable CORS.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (v18+) |
| **Web Framework** | Express.js 5 |
| **Database** | MongoDB Atlas / Local MongoDB via Mongoose |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` |
| **Real-time WebSockets** | Socket.io 4 |
| **File Uploads** | Multer |
| **AI Integration** | OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free`) |
| **Validation** | Zod schemas |
| **Security** | Helmet, CORS, Express Rate Limit |

---

## 📋 API Overview

Base URL: `/api/v1`

### 1. Health
- `GET /api/v1/health` - Health check & database connection status

### 2. Authentication & Profile
- `POST /api/v1/auth/register` - Create a new user account
- `POST /api/v1/auth/login` - Authenticate user & receive JWT Bearer token
- `GET /api/v1/auth/me` - View current authenticated profile
- `PUT /api/v1/auth/me` / `PATCH /api/v1/auth/me` - Update personal profile information
- `POST /api/v1/auth/logout` - Secure logout

### 3. Task Management
- `POST /api/v1/tasks` - Create a new task (with title, description, due date, assignee, team)
- `GET /api/v1/tasks` - List tasks with filtering (`status`, `assignedToMe`), search (`search`), and sorting (`sortBy`, `order`)
- `GET /api/v1/tasks/:id` - Get details of a single task
- `PATCH /api/v1/tasks/:id` - Update task details, status, or assign to team member
- `DELETE /api/v1/tasks/:id` - Delete a task (owner only)

### 4. Teams & Projects
- `POST /api/v1/teams` - Create a new team
- `GET /api/v1/teams` - List teams the user owns or belongs to
- `GET /api/v1/teams/:id` - View team details and member list
- `PATCH /api/v1/teams/:id` - Update team info (owner only)
- `DELETE /api/v1/teams/:id` - Delete team (owner only)
- `POST /api/v1/teams/:id/members` - Invite/add member by email or user ID
- `DELETE /api/v1/teams/:id/members/:userId` - Remove member from team
- `POST /api/v1/projects` - Create a project within a team
- `GET /api/v1/projects` - List projects (optional filter by `teamId`)
- `GET /api/v1/projects/:id` - View project details
- `PATCH /api/v1/projects/:id` - Update project (owner only)
- `DELETE /api/v1/projects/:id` - Delete project (owner only)

### 5. Comments & Attachments
- `POST /api/v1/tasks/:taskId/comments` - Add a comment to a task
- `GET /api/v1/tasks/:taskId/comments` - List comments for a task
- `DELETE /api/v1/tasks/:taskId/comments/:commentId` - Delete a comment
- `POST /api/v1/tasks/:taskId/attachments` - Upload file attachment (`multipart/form-data`)
- `GET /api/v1/tasks/:taskId/attachments` - List attachments on a task
- `GET /api/v1/tasks/:taskId/attachments/:attachmentId` - Download attachment file
- `DELETE /api/v1/tasks/:taskId/attachments/:attachmentId` - Delete attachment

### 6. Generative AI
- `POST /api/v1/ai/generate-description` - Generate AI-powered task descriptions or summaries

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/mohankumar-markuli/airtribe-task-manager.git
cd airtribe-task-manager
npm install
```

### 2. Configure Environment (`.env`)
```bash
cp .env.example .env
```
Edit `.env` and set:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskmanager
JWT_SECRET=your_secure_jwt_secret_key_minimum_32_characters
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Seed MongoDB with Sample Data
Populate users, teams, projects, tasks, comments, and attachments directly into your database:
```bash
npm run seed
```

### 4. Start Application
```bash
# Development (with auto-reload):
npm run dev

# Production:
npm start

# Automated End-to-End API Verification:
npm run test:api
```

---

## 📖 Detailed Guides & Postman Collection

- 📘 **[Postman API Collection & Testing Guide (Markdown)](docs/POSTMAN_API_COLLECTION.md)**: Full catalog of all endpoints, parameters, example inputs, and response bodies for Postman users.
- 📦 **[Downloadable Postman Collection (JSON)](docs/Airtribe_Task_Manager.postman_collection.json)**: Ready to import directly into Postman.
- 🛠 **[Execution & API Documentation](docs/EXECUTE.md)**: Step-by-step cURL walkthrough and Socket.io client setup.

---

## 📁 Project Structure

```
airtribe-task-manager/
├── docs/
│   ├── ARCHITECTURE.md          # System architecture & layers
│   └── EXECUTE.md               # Step-by-step execution & cURL test guide
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection handler
│   ├── controllers/             # Express request & response controllers
│   ├── middlewares/             # JWT auth & Multer file upload middlewares
│   ├── models/                  # Mongoose models (User, Task, Team, Project, Comment, Attachment)
│   ├── routes/                  # Express REST routes
│   ├── services/                # Business logic & database operations
│   ├── utils/                   # Zod schemas & helpers
│   ├── app.js                   # Express application setup
│   ├── server.js                # Server entry point & graceful shutdown
│   └── socket.js                # Socket.io setup & event dispatching
├── uploads/                     # Storage directory for task file attachments
├── .env.example                 # Environment configuration template
├── package.json                 # Project dependencies & scripts
└── README.md                    # Project overview & documentation
```

---

## 📄 License

ISC License.

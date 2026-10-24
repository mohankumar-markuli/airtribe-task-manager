# Airtribe Task Manager API

A RESTful backend for task tracking built with Node.js, Express.js, and MongoDB. The API supports user authentication and personal task management, with validation, security middleware, and automated tests.

## Features

- User registration and login using JWT authentication
- Password hashing with bcrypt
- Authenticated current-user endpoint
- Create, list, retrieve, update, and delete tasks
- Task status management: `pending`, `in_progress`, and `completed`
- Filter tasks by status
- Search tasks by title
- Sort tasks by creation date, due date, or title
- Validate request data and return structured errors
- Security headers, configurable CORS, and API rate limiting
- MongoDB Atlas integration
- Automated tests using Jest and Supertest

## Technology Stack

- Node.js
- Express.js
- MongoDB Atlas and Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Zod validation
- Helmet and CORS
- Jest and Supertest

## Prerequisites

Install the following:

- Node.js and npm
- A MongoDB Atlas account or a reachable MongoDB instance
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mohankumar-markuli/airtribe-task-manager.git
cd airtribe-task-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file using `.env.example` as a reference.

Configure the variables required by the application, including:

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGIN`

Use your own MongoDB connection string and strong, unique secrets. Never commit `.env` or real credentials to GitHub.

Only environment variables actually used by the application affect its behavior; check the configuration files if you need to confirm which are currently active.

### 4. Start the development server

```bash
npm run dev
```

Alternatively, start the application normally:

```bash
npm start
```

The default application port is `3000`, unless configured otherwise.

## API Endpoints

The API prefix is `/api/v1`.

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Check API health |

### Authentication

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register a user | Not required |
| POST | `/api/v1/auth/login` | Log in | Not required |
| GET | `/api/v1/auth/me` | Retrieve the current user | Required |

For protected endpoints, send the JWT in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Tasks

All task endpoints require authentication. Tasks are associated with their owner, and users can access only their own tasks.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/tasks` | Create a task |
| GET | `/api/v1/tasks` | List tasks |
| GET | `/api/v1/tasks/:id` | Retrieve a task |
| PATCH | `/api/v1/tasks/:id` | Update a task |
| DELETE | `/api/v1/tasks/:id` | Delete a task |

### Task fields

- `title`: required string, 2–120 characters
- `description`: optional string, up to 2,000 characters
- `dueDate`: optional ISO 8601 datetime
- `status`: `pending`, `in_progress`, or `completed`

New tasks default to `pending`.

### List, filter, search, and sort tasks

The list endpoint supports these query parameters:

| Parameter | Purpose | Allowed values |
|---|---|---|
| `status` | Filter by task status | `pending`, `in_progress`, `completed` |
| `search` | Search task titles | Text, up to 120 characters |
| `sortBy` | Choose the sort field | `createdAt`, `dueDate`, `title` |
| `order` | Choose sort direction | `asc`, `desc` |

Example:

```http
GET /api/v1/tasks?status=pending&search=report&sortBy=dueDate&order=asc
```

### Example task request

Create a task by sending a JSON request to `POST /api/v1/tasks` with a valid access token:

```json
{
  "title": "Complete project documentation",
  "description": "Document the API and setup instructions",
  "dueDate": "2026-10-25T18:00:00.000Z"
}
```

Update a task using `PATCH /api/v1/tasks/:id`:

```json
{
  "status": "completed"
}
```

Use a task ID returned by the API in place of `:id`. Refer to the validation rules and authentication responses when preparing requests.

## Running Tests

Run the complete automated test suite:

```bash
npm test
```

The tests cover application behavior, authentication, validation, task services, and API routes.

## Project Structure

```text
src/
  config/        Application configuration
  controllers/   HTTP request handlers
  middlewares/   Authentication and shared middleware
  models/        MongoDB data models
  routes/        API route definitions
  services/      Business logic
  utils/         Validation and shared utilities

test/            Automated tests
docs/            Project documentation
```

## Error Handling and Security

- Validate incoming request data.
- Return appropriate HTTP status codes for validation and resource errors.
- Protect private endpoints with JWT authentication.
- Restrict task operations to the authenticated owner.
- Hash passwords rather than storing them in plain text.
- Use Helmet, CORS configuration, and rate limiting.
- Keep credentials and environment files out of version control.

## Current Scope and Future Improvements

The implemented scope includes authentication and personal task management. Team collaboration, project membership, invitations, task assignment to other users, comments, file attachments, and real-time notifications should be considered incomplete until their corresponding implementations and tests are added.

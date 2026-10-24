# Postman API Collection & Testing Guide

This document provides a complete guide for testing all API endpoints of the **Airtribe Task Manager** using **Postman** or **cURL**. It includes ready-to-use request payloads, query parameters, headers, and verified example responses.

---

## 📌 Global Configuration for Postman

- **Base URL**: `http://localhost:3000/api/v1`
- **Recommended Postman Environment Variables**:
  - `baseUrl`: `http://localhost:3000/api/v1`
  - `token`: `{{accessToken_from_login}}`
  - `taskId`: `{{created_task_id}}`
  - `teamId`: `{{created_team_id}}`

### 🔑 Pre-Seeded Test Accounts in MongoDB
You can use these accounts immediately (seeded using `npm run seed`):

| Name | Email | Password | Role / Responsibility |
|---|---|---|---|
| **Alice Johnson** | `alice@example.com` | `Password123!` | Owner of "Core Engineering" team & Creator of Project |
| **Bob Smith** | `bob@example.com` | `Password123!` | Member of team, Assignee on Redis task |
| **Charlie Davis** | `charlie@example.com` | `Password123!` | Member of team, Assignee on AI task |

---

## 📚 Endpoints Directory

1. [System & Health](#1-system--health)
2. [Authentication & Profile Management](#2-authentication--profile-management)
3. [Team Collaboration](#3-team-collaboration)
4. [Project Management](#4-project-management)
5. [Task Management](#5-task-management)
6. [Task Comments](#6-task-comments)
7. [File Attachments](#7-file-attachments)
8. [Generative AI Assistance](#8-generative-ai-assistance)
9. [Real-time WebSockets (Socket.io)](#9-real-time-websockets)

---

## 1. System & Health

### 1.1 Health Check
- **Method:** `GET`
- **URL:** `{{baseUrl}}/health`
- **Auth:** None (Public)
- **Description:** Verifies service uptime and live MongoDB Atlas database connection status.
- **Example Response (200 OK):**
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

## 2. Authentication & Profile Management

### 2.1 Register New Account
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Auth:** None (Public)
- **Headers:** `Content-Type: application/json`
- **Request Body (raw JSON):**
```json
{
  "name": "David Miller",
  "email": "david.miller@example.com",
  "password": "SecurePassword123!"
}
```
- **Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "6adcc0534284ce3dc31b9dc1",
      "name": "David Miller",
      "email": "david.miller@example.com",
      "createdAt": "2026-10-24T14:27:00.000Z"
    }
  }
}
```

---

### 2.2 User Login
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Auth:** None (Public)
- **Headers:** `Content-Type: application/json`
- **Request Body (raw JSON):**
```json
{
  "email": "alice@example.com",
  "password": "Password123!"
}
```
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6adcbfc76d3496614cef6665",
      "name": "Alice Johnson",
      "email": "alice@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWRjYmZjNzZkMzQ5NjYxNGNlZjY2NjUiLCJpYXQiOjE3OTI4NTIwNTAsImV4cCI6MTc5Mjg1Mjk1MH0...",
    "tokenType": "Bearer"
  }
}
```
> **Tip for Postman:** Copy the `accessToken` and paste it under the **Authorization** tab as `Bearer Token`, or set `pm.environment.set("token", pm.response.json().data.accessToken);` in Tests tab.

---

### 2.3 Get Current User Profile
- **Method:** `GET`
- **URL:** `{{baseUrl}}/auth/me`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "6adcbfc76d3496614cef6665",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "createdAt": "2026-10-24T14:25:12.000Z",
      "updatedAt": "2026-10-24T14:25:12.000Z"
    }
  }
}
```

---

### 2.4 Update Profile Information
- **Method:** `PATCH` or `PUT`
- **URL:** `{{baseUrl}}/auth/me`
- **Auth:** `Bearer Token`
- **Headers:** `Content-Type: application/json`
- **Request Body (raw JSON):**
```json
{
  "name": "Alice Johnson (Lead Architect)",
  "password": "NewSecretPassword123!"
}
```
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "6adcbfc76d3496614cef6665",
      "name": "Alice Johnson (Lead Architect)",
      "email": "alice@example.com",
      "updatedAt": "2026-10-24T14:28:15.000Z"
    }
  }
}
```

---

### 2.5 User Logout
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/logout`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Team Collaboration

### 3.1 Create Team
- **Method:** `POST`
- **URL:** `{{baseUrl}}/teams`
- **Auth:** `Bearer Token`
- **Request Body (raw JSON):**
```json
{
  "name": "Cloud DevOps Team",
  "description": "Responsible for AWS infrastructure, CI/CD, and monitoring"
}
```
- **Example Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "team": {
      "_id": "6adcc0534284ce3dc31b9dc4",
      "name": "Cloud DevOps Team",
      "description": "Responsible for AWS infrastructure, CI/CD, and monitoring",
      "owner": {
        "_id": "6adcbfc76d3496614cef6665",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "members": [
        {
          "_id": "6adcbfc76d3496614cef6665",
          "name": "Alice Johnson",
          "email": "alice@example.com"
        }
      ],
      "createdAt": "2026-10-24T14:27:10.000Z"
    }
  }
}
```

---

### 3.2 List My Teams
- **Method:** `GET`
- **URL:** `{{baseUrl}}/teams`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "_id": "6adcbfc86d3496614cef6668",
        "name": "Core Engineering",
        "description": "Responsible for backend architecture, cloud APIs, and infrastructure.",
        "owner": {
          "_id": "6adcbfc76d3496614cef6665",
          "name": "Alice Johnson",
          "email": "alice@example.com"
        },
        "members": [
          { "_id": "6adcbfc76d3496614cef6665", "name": "Alice Johnson", "email": "alice@example.com" },
          { "_id": "6adcbfc86d3496614cef6666", "name": "Bob Smith", "email": "bob@example.com" },
          { "_id": "6adcbfc86d3496614cef6667", "name": "Charlie Davis", "email": "charlie@example.com" }
        ]
      }
    ]
  }
}
```

---

### 3.3 Get Team Details by ID
- **Method:** `GET`
- **URL:** `{{baseUrl}}/teams/:teamId`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "team": {
      "_id": "6adcbfc86d3496614cef6668",
      "name": "Core Engineering",
      "description": "Responsible for backend architecture, cloud APIs, and infrastructure.",
      "members": [ ... ]
    }
  }
}
```

---

### 3.4 Invite Member to Team
- **Method:** `POST`
- **URL:** `{{baseUrl}}/teams/:teamId/members`
- **Auth:** `Bearer Token` (Owner only)
- **Request Body (by Email or User ID):**
```json
{
  "email": "bob@example.com"
}
```
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Member added",
  "data": {
    "team": {
      "_id": "6adcbfc86d3496614cef6668",
      "name": "Core Engineering",
      "members": [ ... ]
    }
  }
}
```

---

### 3.5 Remove Member from Team
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/teams/:teamId/members/:userId`
- **Auth:** `Bearer Token` (Owner or the member themselves)
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Member removed",
  "data": { "team": { ... } }
}
```

---

## 4. Project Management

### 4.1 Create Project within a Team
- **Method:** `POST`
- **URL:** `{{baseUrl}}/projects`
- **Auth:** `Bearer Token` (Must be member of team)
- **Request Body (raw JSON):**
```json
{
  "name": "Payment Gateway Integration",
  "description": "Integrate Stripe and PayPal with webhook verification",
  "teamId": "6adcbfc86d3496614cef6668"
}
```
- **Example Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "6adcc0544284ce3dc31b9dc5",
      "name": "Payment Gateway Integration",
      "description": "Integrate Stripe and PayPal with webhook verification",
      "owner": {
        "_id": "6adcbfc76d3496614cef6665",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "team": {
        "_id": "6adcbfc86d3496614cef6668",
        "name": "Core Engineering"
      },
      "createdAt": "2026-10-24T14:27:12.000Z"
    }
  }
}
```

---

### 4.2 List Projects
- **Method:** `GET`
- **URL:** `{{baseUrl}}/projects`
- **Optional Query Parameter:** `?teamId=6adcbfc86d3496614cef6668`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "6adcbfc86d3496614cef6669",
        "name": "Cloud Infrastructure Upgrade",
        "description": "Transition database clusters and set up auto-scaling containers.",
        "team": {
          "_id": "6adcbfc86d3496614cef6668",
          "name": "Core Engineering"
        }
      }
    ]
  }
}
```

---

## 5. Task Management

### 5.1 Create a Task
- **Method:** `POST`
- **URL:** `{{baseUrl}}/tasks`
- **Auth:** `Bearer Token`
- **Request Body (raw JSON):**
```json
{
  "title": "Configure Webhook Handlers for Stripe",
  "description": "Implement idempotent endpoint for charge.succeeded and invoice.payment_failed",
  "dueDate": "2026-11-05T12:00:00.000Z",
  "status": "pending",
  "assignee": "6adcbfc86d3496614cef6666",
  "team": "6adcbfc86d3496614cef6668"
}
```
- **Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "_id": "6adcc0554284ce3dc31b9dc6",
      "title": "Configure Webhook Handlers for Stripe",
      "description": "Implement idempotent endpoint for charge.succeeded and invoice.payment_failed",
      "dueDate": "2026-11-05T12:00:00.000Z",
      "status": "pending",
      "owner": {
        "_id": "6adcbfc76d3496614cef6665",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "assignee": {
        "_id": "6adcbfc86d3496614cef6666",
        "name": "Bob Smith",
        "email": "bob@example.com"
      },
      "team": {
        "_id": "6adcbfc86d3496614cef6668",
        "name": "Core Engineering"
      },
      "createdAt": "2026-10-24T14:27:14.000Z"
    }
  }
}
```

---

### 5.2 List Tasks (Filtering, Search & Sorting)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/tasks`
- **Auth:** `Bearer Token`
- **Query Parameters Available:**
  - `status`: `pending`, `in_progress`, `completed`, or `open` (matches pending & in_progress)
  - `search`: Searches in **both title and description** (e.g. `?search=redis`)
  - `assignedToMe`: `true` (filters tasks where current user is assignee)
  - `sortBy`: `dueDate`, `createdAt`, `title`, or `updatedAt`
  - `order`: `asc` or `desc`
  - `team`: Filter tasks by team ObjectId

#### Example 1: View Tasks Assigned to Me
`GET {{baseUrl}}/tasks?assignedToMe=true`

#### Example 2: Search Open Tasks Sorted by Due Date
`GET {{baseUrl}}/tasks?search=caching&status=open&sortBy=dueDate&order=asc`

- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "6adcbfc86d3496614cef666a",
        "title": "Setup Redis Caching for User Sessions",
        "description": "Integrate Redis cluster and implement TTL caching to reduce query loads.",
        "dueDate": "2026-10-31T14:25:12.000Z",
        "status": "in_progress",
        "owner": { "name": "Alice Johnson", "email": "alice@example.com" },
        "assignee": { "name": "Bob Smith", "email": "bob@example.com" }
      }
    ]
  }
}
```

---

### 5.3 Get Task Details by ID
- **Method:** `GET`
- **URL:** `{{baseUrl}}/tasks/:taskId`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "6adcbfc86d3496614cef666a",
      "title": "Setup Redis Caching for User Sessions",
      "status": "in_progress",
      "owner": { ... },
      "assignee": { ... }
    }
  }
}
```

---

### 5.4 Update / Complete Task / Reassign
- **Method:** `PATCH`
- **URL:** `{{baseUrl}}/tasks/:taskId`
- **Auth:** `Bearer Token` (Owner or Assignee)
- **Request Body (raw JSON):**
```json
{
  "status": "completed",
  "description": "Redis cluster deployed and cache hit ratio verified at 94%."
}
```
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {
      "_id": "6adcbfc86d3496614cef666a",
      "status": "completed",
      "title": "Setup Redis Caching for User Sessions"
    }
  }
}
```

---

### 5.5 Delete Task
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/tasks/:taskId`
- **Auth:** `Bearer Token` (Owner only)
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 6. Task Comments

### 6.1 Add Comment to Task
- **Method:** `POST`
- **URL:** `{{baseUrl}}/tasks/:taskId/comments`
- **Auth:** `Bearer Token` (Task owner, assignee, or team member)
- **Request Body (raw JSON):**
```json
{
  "content": "Load testing passed with 5,000 req/sec without latency spikes."
}
```
- **Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Comment added",
  "data": {
    "comment": {
      "_id": "6adcc0564284ce3dc31b9dc7",
      "task": "6adcbfc86d3496614cef666a",
      "content": "Load testing passed with 5,000 req/sec without latency spikes.",
      "author": {
        "_id": "6adcbfc76d3496614cef6665",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "createdAt": "2026-10-24T14:27:16.000Z"
    }
  }
}
```

---

### 6.2 List Comments for a Task
- **Method:** `GET`
- **URL:** `{{baseUrl}}/tasks/:taskId/comments`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "6adcbfc86d3496614cef666d",
        "content": "Initial benchmarks with Redis look great, query latency dropped by 60%.",
        "author": {
          "_id": "6adcbfc86d3496614cef6666",
          "name": "Bob Smith",
          "email": "bob@example.com"
        },
        "createdAt": "2026-10-24T14:25:12.000Z"
      }
    ]
  }
}
```

---

### 6.3 Delete Comment
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/tasks/:taskId/comments/:commentId`
- **Auth:** `Bearer Token` (Author or Task owner)
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## 7. File Attachments

### 7.1 Upload File Attachment
- **Method:** `POST`
- **URL:** `{{baseUrl}}/tasks/:taskId/attachments`
- **Auth:** `Bearer Token`
- **Headers:** None (Postman sets `multipart/form-data` automatically)
- **Body format:** `form-data`
  - Key: `file` (Change key type from *Text* to *File* in Postman dropdown)
  - Value: Select any file (`.pdf`, `.png`, `.jpg`, `.txt`, `.docx` up to 5MB)
- **Example Response (201 Created):**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "attachment": {
      "_id": "6adcc0564284ce3dc31b9dc8",
      "task": "6adcbfc86d3496614cef666a",
      "filename": "database-architecture.pdf",
      "mimetype": "application/pdf",
      "size": 240810,
      "uploader": {
        "_id": "6adcbfc76d3496614cef6665",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "createdAt": "2026-10-24T14:27:18.000Z"
    }
  }
}
```

---

### 7.2 List Attachments for a Task
- **Method:** `GET`
- **URL:** `{{baseUrl}}/tasks/:taskId/attachments`
- **Auth:** `Bearer Token`
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "_id": "6adcbfc86d3496614cef666e",
        "filename": "sample-architecture.txt",
        "mimetype": "text/plain",
        "size": 75,
        "uploader": {
          "_id": "6adcbfc76d3496614cef6665",
          "name": "Alice Johnson",
          "email": "alice@example.com"
        }
      }
    ]
  }
}
```

---

### 7.3 Download Attachment
- **Method:** `GET`
- **URL:** `{{baseUrl}}/tasks/:taskId/attachments/:attachmentId`
- **Auth:** `Bearer Token`
- **Description:** Streams binary/text file directly with content disposition.
- In Postman, click **Send and Download** to save file to your local computer.

---

### 7.4 Delete Attachment
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/tasks/:taskId/attachments/:attachmentId`
- **Auth:** `Bearer Token` (Uploader or Task owner)
- **Example Response (200 OK):**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

---

## 8. Generative AI Assistance

Generate structured task descriptions, objectives, deliverables, and acceptance criteria automatically powered by **OpenRouter AI** (`nvidia/nemotron-3-ultra-550b-a55b:free`):

### 8.1 Generate Task Description / Specification
- **Method:** `POST`
- **URL:** `{{baseUrl}}/ai/generate-description`
- **Auth:** `Bearer Token`
- **Request Body (raw JSON):**
```json
{
  "title": "Automate Zero-Downtime Database Migration",
  "details": "Switch read replicas to primary in PostgreSQL cluster with fallback health check"
}
```
- **Example Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "description": "Objective: Automate zero-downtime database failover and replica promotion in PostgreSQL.\n\nKey Deliverables:\n1. Health check watchdog monitoring primary node availability.\n2. Automated replica promotion script with WAL replay verification.\n3. DNS/Connection string failover automation with zero packet drops.\n\nAcceptance Criteria:\n- Zero data loss during failover testing.\n- Total switchover completed in < 15 seconds.",
    "model": "nvidia/nemotron-3-ultra-550b-a55b:free"
  }
}
```

---

## 9. Real-Time WebSockets

Connect to `ws://localhost:3000` or `http://localhost:3000` using Postman's **WebSocket Request** feature (or socket.io client):

### Client Setup (Socket.io)
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// 1. Join your personal notification room
socket.emit('joinUser', '6adcbfc86d3496614cef6666'); // Bob's ID

// 2. Join a task room for live collaboration
socket.emit('joinTask', '6adcbfc86d3496614cef666a');

// 3. Listen for real-time task assignment events
socket.on('taskAssigned', (data) => {
  console.log('🔔 Assigned to task:', data.message, data.task);
});

// 4. Listen for real-time comments
socket.on('commentAdded', (comment) => {
  console.log('💬 New comment:', comment.content, 'by', comment.author.name);
});

// 5. Listen for task status updates
socket.on('taskUpdated', (task) => {
  console.log('🔄 Task status changed to:', task.status);
});

// 6. Listen for attachment uploads
socket.on('attachmentAdded', (attachment) => {
  console.log('📎 New attachment:', attachment.filename);
});
```

---

## 🛡️ Error Handling Reference

All API errors return consistent JSON responses:

| Status Code | Reason | Example Response Body |
|---|---|---|
| `400 Bad Request` | Missing required fields or schema validation failure | `{"success": false, "message": "Validation failed", "errors": [...]}` |
| `401 Unauthorized` | Missing, expired, or invalid JWT Bearer token | `{"success": false, "message": "Authentication required"}` |
| `403 Forbidden` | User lacks permission to view/modify resource | `{"success": false, "message": "Access denied"}` |
| `404 Not Found` | Resource ID does not exist | `{"success": false, "message": "Task not found"}` |
| `409 Conflict` | Duplicate email during registration | `{"success": false, "message": "An account with this email already exists"}` |
| `429 Too Many Requests` | Rate limit exceeded (100 requests / 15 minutes) | `{"success": false, "message": "Too many requests, please try again later."}` |

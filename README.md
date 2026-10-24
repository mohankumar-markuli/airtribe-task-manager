
# Airtribe Task Manager API

A RESTful backend for task tracking and team collaboration, built with
Node.js, Express.js, and MongoDB.

## Current Features

- Express API server
- Health-check endpoint
- Security headers using Helmet
- Configurable CORS
- API request rate limiting
- JSON error response for unknown routes
- Automated tests using Jest and Supertest

## Technology Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Jest and Supertest
- Git and GitHub

## Prerequisites

- Node.js and npm
- A MongoDB Atlas account or a MongoDB server

## Getting Started

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` file using `.env.example` as a reference.
4. Configure the environment variables.
5. Start the development server:

   ```bash
   npm run dev
   ```

The API will run on port 3000 by default.

## Health Check

**Endpoint:** `GET /api/v1/health`

A successful response returns HTTP 200 and the API status.

## Running Tests

```bash
npm test
```

## Project Structure

- `src/config/` — application configuration
- `src/controllers/` — HTTP request handlers
- `src/middlewares/` — reusable middleware
- `src/models/` — MongoDB data models
- `src/routes/` — REST API routes
- `src/services/` — business logic
- `src/utils/` — shared utilities
- `test/` — automated tests
- `docs/` — project documentation

## Security

- Never commit `.env` or real credentials.
- Use `.env.example` to document required configuration.
- Keep dependencies updated and review security advisories.

## Project Status

The initial API foundation is implemented. Authentication, task management,
teams, comments, and attachments will be added in subsequent milestones.

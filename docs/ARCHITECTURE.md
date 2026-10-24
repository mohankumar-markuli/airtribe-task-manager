
# Architecture

## Overview

Airtribe Task Manager is a RESTful backend built with Node.js,
Express.js, and MongoDB.

## Application Layers

- `src/config/`: Environment and database configuration.
- `src/controllers/`: HTTP request and response handling.
- `src/middlewares/`: Reusable request-processing logic.
- `src/models/`: Mongoose schemas and data models.
- `src/routes/`: REST API route definitions.
- `src/services/`: Business rules and application operations.
- `src/utils/`: Shared helper functions.
- `src/app.js`: Express middleware and route configuration.
- `src/server.js`: Database connection and server startup.
- `test/`: Automated tests.

## Current Request Flow

An HTTP request enters the Express application, passes through
configured middleware, reaches a matching route handler, and
receives a JSON response.

## Database

MongoDB stores application data. Mongoose manages the connection
and will provide schemas and model validation as features are added.

## Security

Secrets are stored in `.env`, which must not be committed.
`.env.example` documents the required configuration without real
credentials.

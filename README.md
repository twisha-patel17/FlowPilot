# FlowPilot

<p align="center">
  <strong>Visual workflow automation for developers.</strong>
</p>

<p align="center">
  Build, connect, and execute automated workflows without writing repetitive integration code.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Overview

FlowPilot is a developer-focused workflow automation platform for connecting services and automating repetitive tasks through visual workflows.

Instead of implementing every integration as custom application code, FlowPilot lets users define an automation as a sequence of triggers, conditions, and actions. The workflow is then processed by a backend execution system that handles job queuing, retries, execution tracking, and integration communication.

The goal is to provide the convenience of workflow automation while keeping the underlying execution process understandable and observable.

A typical workflow might look like:

**GitHub Issue Created → Check Priority → Send Discord Message → Store Data**

Each step is represented as part of a workflow graph and executed by the FlowPilot backend.

---

## Why FlowPilot?

Modern applications frequently depend on multiple services. A single development workflow may involve GitHub, Discord, email services, databases, internal APIs, and other external systems.

Connecting these services often results in repetitive webhook handlers, API requests, error handling, retry logic, and background jobs.

FlowPilot provides a common execution layer for these workflows.

Instead of writing and maintaining separate automation logic for every use case, a workflow can be created visually and executed through the same backend infrastructure.

This makes the automation process easier to configure while preserving visibility into individual executions.

---

## Features

### Visual Workflow Builder

FlowPilot uses a node-based workflow builder to represent automation logic visually.

Workflows are composed of connected nodes representing triggers, conditions, and actions. The visual representation is backed by a structured workflow definition that can be persisted and executed independently of the frontend.

This makes it possible to build automation logic without manually wiring together multiple API integrations for every workflow.

---

### Event-Driven Workflows

Workflows can be started by external events through integrations and webhooks.

For example, a GitHub event can enter FlowPilot through a webhook, where the platform identifies the corresponding workflow and creates an execution job.

The execution is then handed to the background processing system rather than being performed directly inside the incoming HTTP request.

This separation allows external events to be handled quickly while workflow execution continues independently.

---

### Background Job Processing

FlowPilot uses **Redis and BullMQ** to process workflow executions asynchronously.

When a workflow is triggered, the API creates a job and places it into a queue. A worker consumes the job and executes the workflow nodes.

This architecture separates request handling from workflow processing and provides a dedicated place for retry logic, execution state management, and long-running tasks.

The simplified execution lifecycle is:

```text
Trigger
   ↓
Create Job
   ↓
BullMQ Queue
   ↓
Worker
   ↓
Execute Workflow
   ↓
Store Execution
```

---

### Automatic Retries

Temporary failures are an expected part of distributed systems and external API integrations.

FlowPilot supports configurable retry behavior so failed workflow jobs can be attempted again instead of immediately being marked as permanently failed.

Retry configuration includes the maximum number of attempts and retry delay, allowing workflow execution to recover from transient service failures.

---

### Execution History

Every workflow run can be tracked through its execution record.

Execution history provides visibility into what happened during an automation, including execution status, timing, failures, and associated workflow information.

This makes debugging considerably easier because workflow execution does not disappear after the job finishes.

Instead, each run becomes an inspectable record that can be reviewed from the application.

---

### Real-Time Execution Updates

FlowPilot uses **Socket.IO** to provide real-time communication between the backend and frontend.

When relevant execution events occur, the backend can notify connected clients immediately, allowing the interface to reflect changes without relying entirely on repeated polling.

This is particularly useful for workflow execution states where users expect the interface to update while a workflow is running.

---

### Multiple Personal Workspaces

FlowPilot supports multiple workspaces for a single user.

Workspaces provide a way to separate workflows and automation resources by project or purpose without introducing team collaboration.

For example, a user can maintain separate spaces such as:

* Personal automations
* Project-specific workflows
* Experiments
* Client-specific workflows

Each workspace provides a logical organization boundary for its workflows and related resources.

---

## Integrations

FlowPilot is built around integrations that allow workflows to communicate with external services.

### GitHub

GitHub can act as an event source for workflow automation. Repository activity can enter FlowPilot through webhook events and trigger corresponding workflows.

This makes it possible to build automations around issues, pull requests, and other repository events.

For example:

```text
GitHub Issue Created
        ↓
Check Priority
        ↓
Priority == HIGH
        ↓
Send Discord Notification
```

---

### Discord

Discord can be used as an action within a workflow to send automated messages and notifications.

This makes it possible to connect development activity with team communication channels without writing a custom notification service for each workflow.

---

### Email

Email actions allow workflows to send automated messages as part of an execution.

Email configuration is handled through FlowPilot's integration system, keeping provider credentials separate from the workflow's actual logic.

---

### MongoDB

MongoDB can be used to store information generated during workflow execution.

This is useful when an automation needs to persist structured data rather than simply triggering an external action.

---

### HTTP

The HTTP integration provides a general-purpose way to connect FlowPilot with APIs that do not have a dedicated integration.

Users can configure requests with the required HTTP method, URL, headers, and request body.

This makes the HTTP action useful for connecting internal services, third-party APIs, and custom endpoints.

---

### Webhooks

Webhooks provide an entry point for external systems to trigger FlowPilot workflows.

An external service sends an HTTP request to a FlowPilot webhook endpoint, which identifies the appropriate workflow and starts its execution.

This allows FlowPilot to integrate with services beyond the set of dedicated integrations.

---

## Architecture

FlowPilot is divided into several layers that work together to separate user interaction, API processing, persistent data, and workflow execution.

The React frontend communicates with the Node.js and Express backend through REST APIs and Socket.IO. MongoDB stores application data such as users, workspaces, workflows, integrations, and executions.

When a workflow needs to run, the API creates a BullMQ job backed by Redis. A worker then processes the job and executes the workflow nodes. Integration services handle communication with external platforms such as GitHub, Discord, email providers, MongoDB, and HTTP APIs.

This creates a clear separation between the application layer and the execution layer:

```text
Frontend
   │
   ├── REST API
   └── Socket.IO
          │
          ▼
      Express API
          │
     ┌────┴────┐
     ▼         ▼
 MongoDB     Redis
               │
               ▼
            BullMQ
               │
               ▼
             Worker
               │
               ▼
        Workflow Execution
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
    GitHub  Discord   HTTP
```

The queue and worker architecture is particularly important because workflow execution can involve external services and operations that should not block the API request that originally triggered the automation.

---

## Workflow Execution

A workflow is stored as a graph consisting of nodes and connections between those nodes.

Nodes contain information about their type and configuration, while edges define how execution moves from one node to another.

For example, a workflow can represent:

```text
Trigger
  ↓
Condition
  ↓
Action
  ↓
Action
```

When the workflow is triggered, FlowPilot creates an execution job. The worker retrieves the workflow definition and processes its nodes according to the defined connections.

During execution, the system tracks the execution state and records the resulting success or failure.

This approach keeps workflow design separate from workflow execution, allowing the frontend to focus on configuration while the backend handles the actual automation process.

---

## Authentication

FlowPilot provides authentication for application access using JWT-based authentication.

Users can create accounts using email and password or authenticate through GitHub OAuth.

The authentication system uses short-lived access tokens together with refresh tokens to maintain authenticated sessions.

Protected API routes verify the access token before allowing access to user-specific resources.

GitHub authentication uses OAuth state validation and PKCE during the authorization flow.

Password-based accounts use bcrypt hashing rather than storing raw passwords.

---

## Security

Security-sensitive values are kept separate from application code through environment variables and encrypted credential storage.

FlowPilot uses:

* JWT authentication
* Refresh-token rotation
* HTTP-only refresh cookies
* bcrypt password hashing
* GitHub OAuth state validation
* PKCE for OAuth authorization
* Protected API middleware
* Environment-based secrets
* Encrypted integration credentials

Integration credentials are handled separately from workflow definitions so that workflow configuration does not require storing provider secrets directly inside the workflow graph.

---

## Technology Stack

### Frontend

**React** powers the application interface, while **Vite** provides the development and build environment.

**Tailwind CSS** is used for styling and responsive layouts. **React Router** handles client-side navigation, while **React Flow** provides the visual workflow editor.

**TanStack Query** manages server state and API data, and **Axios** handles communication with the backend API. **Socket.IO Client** provides real-time communication for execution updates.

### Backend

The backend is built with **Node.js and Express**.

**MongoDB with Mongoose** provides persistent storage for users, workspaces, workflows, integrations, and execution records.

**Redis and BullMQ** provide the background job infrastructure used for asynchronous workflow processing, retries, and queue management.

**Socket.IO** handles real-time communication between the backend and connected clients.

### Infrastructure

FlowPilot uses **Docker** for containerized local infrastructure and **Docker Compose** for running supporting services.

The production frontend is deployed through Vercel, while the backend is deployed through Render. MongoDB Atlas provides managed MongoDB infrastructure, with Redis supporting the background job system.

---

## Project Structure

```text
FlowPilot/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── socket/
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── workers/
│   └── server.js
│
├── docker-compose.yml
└── README.md
```

The frontend and backend are intentionally separated so that the UI layer, API layer, and workflow execution infrastructure can evolve independently.

---

## Getting Started

### Prerequisites

Before running FlowPilot locally, make sure you have:

* Node.js
* npm
* MongoDB or MongoDB Atlas
* Redis
* Docker Desktop

### Clone the repository

```bash
git clone https://github.com/twisha-patel17/FlowPilot.git

cd FlowPilot
```

### Install dependencies

Install the frontend dependencies:

```bash
cd client
npm install
```

Then install the backend dependencies:

```bash
cd ../server
npm install
```

### Environment Configuration

Create a `.env` file inside the `server` directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

CLIENT_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379

RESEND_API_KEY=your_resend_api_key

WORKFLOW_TIMEOUT_MS=300000
WORKFLOW_MAX_ATTEMPTS=3
WORKFLOW_RETRY_DELAY_MS=2000

INTEGRATION_ENCRYPTION_KEY=your_encryption_key

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

Do not commit `.env` files or application secrets to the repository.

### Start the supporting services

If using Docker Compose:

```bash
docker compose up -d
```

### Start the backend

```bash
cd server
npm run dev
```

### Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

The development application will be available at:

```text
http://localhost:5173
```

The backend API runs at:

```text
http://localhost:5000
```

---

## Deployment

FlowPilot separates the frontend and backend into independent deployment environments.

The React frontend is deployed through **Vercel**, while the Node.js backend runs through **Render**. MongoDB Atlas provides the production database and Redis provides the queue infrastructure required by BullMQ.

The production environment communicates through configured frontend and backend origins, with credentials and service configuration supplied through deployment environment variables.

---

## API

The backend exposes REST endpoints for authentication and application resources.

Authentication endpoints include:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/github
GET    /api/auth/github/callback
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/profile
PATCH  /api/auth/profile
PATCH  /api/auth/change-password
DELETE /api/auth/account
```

Application APIs are organized around the main FlowPilot resources, including workspaces, workflows, executions, schedules, integrations, and webhooks.

Protected resources require an authenticated user session.

---

## Design

FlowPilot uses a dark developer-oriented interface with a minimal visual language.

The interface emphasizes clear hierarchy, compact technical information, visual workflow construction, execution states, and developer-focused controls.

The design uses a dark neutral foundation with violet accents and monospace typography for technical details, keeping the interface focused on the workflow rather than decorative elements.

---

## License

This project is maintained as a personal software project.

© 2026 Twisha Patel. All rights reserved.

---

<p align="center">
  <strong>FlowPilot</strong>
  <br />
  Visual workflow automation for developers.
</p>

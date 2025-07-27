# Mercury - Full Stack Dashboard

<img width="1440" height="518" alt="mercury_1440x518_transparent" src="https://github.com/user-attachments/assets/75b61c75-56cb-45ea-adc0-fd29a901b261" />

## Table of Contents
- [Mercury - Full Stack Dashboard](#mercury---full-stack-dashboard)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Installation](#installation)
    - [Local Development](#local-development)
    - [Docker Setup](#docker-setup)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Authentication](#authentication)
      - [Default Admin User](#default-admin-user)
      - [Features](#features-1)
  - [Usage](#usage)
    - [Running Locally](#running-locally)
    - [Running with Docker Compose](#running-with-docker-compose)
    - [Running Individual Docker Container](#running-individual-docker-container)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication-1)
    - [Data](#data)
    - [Health](#health)
  - [Database Integration](#database-integration)
    - [ClickHouse Tables](#clickhouse-tables)
    - [Database Utilities](#database-utilities)
  - [Security Features](#security-features)
  - [Real-Time Features](#real-time-features)
    - [WebSocket Integration](#websocket-integration)
    - [Live Updates](#live-updates)
  - [Performance](#performance)
    - [Optimization Features](#optimization-features)
    - [Monitoring](#monitoring)
  - [Troubleshooting](#troubleshooting)
    - [Debug Mode](#debug-mode)
  - [Integration](#integration)
  - [Development](#development)
    - [Available Scripts](#available-scripts)
    - [Styling](#styling)
  - [License](#license)

## Overview

Mercury is a modern, real-time delivery tracking dashboard built with Next.js, TypeScript, and Material-UI. It provides comprehensive delivery tracking visualization, fleet management capabilities, and interactive analytics for the PacketPulse platform.

## Features

- **Real-Time Dashboard**: Live monitoring of vehicle sessions and fleet status
- **Interactive Maps**: Real-time vehicle tracking with Leaflet maps
- **Advanced Analytics**: Comprehensive analytics with charts and KPIs
- **User Authentication**: Secure login/signup with JWT tokens
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **WebSocket Integration**: Real-time data updates via WebSocket
- **Health Monitoring**: Real-time connection status indicators

## Requirements

- Node.js 18+
- npm or yarn
- Access to ClickHouse server (default: localhost:8123)
- Dependencies listed in `package.json`

## Installation

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Create .env.local file
JWT_SECRET=your-secret-key-change-in-production
CLICKHOUSE_HOST=http://localhost:8123
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### Docker Setup

1. **Build the image:**
```bash
docker build -t mercury:latest .
```

2. **Run with Docker Compose (recommended):**
```bash
cd Infrastructure
docker-compose up mercury
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `your-secret-key` | Secret key for JWT token signing |
| `CLICKHOUSE_HOST` | `http://clickhouse:8123` | ClickHouse server URL |
| `NODE_ENV` | `development` | Environment (development/production) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Public API URL |

### Authentication

#### Default Admin User
- **Username**: admin
- **Email**: admin@example.com
- **Password**: password

#### Features
- JWT-based authentication with HTTP-only cookies
- Secure password hashing with bcrypt
- Protected routes with middleware
- User registration and login
- Automatic session management

## Usage

### Running Locally

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

### Running with Docker Compose

From the Infrastructure directory:
```bash
# Start all services
docker-compose up -d

# Start Mercury dashboard
docker-compose up mercury

# Or run in detached mode
docker-compose up -d mercury
```

### Running Individual Docker Container

```bash
# Build and run
docker build -t mercury:latest .
docker run --network packetpulse_network -p 3000:3000 mercury:latest
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/password` - Update password

### Data
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/active` - Get active sessions
- `GET /api/sessions/recent` - Get recent sessions
- `GET /api/sessions/[id]` - Get specific session
- `GET /api/analytics` - Get analytics data
- `GET /api/charts` - Get chart data
- `GET /api/trends` - Get trend data

### Health
- `GET /api/health` - Health check endpoint

## Database Integration

### ClickHouse Tables

The dashboard connects to ClickHouse tables created by Jupiter and Uranus:

- `sessions_base` - Session header information
- `session_events` - Status change events
- `session_movements` - GPS movement data
- `active_sessions` - Real-time active sessions (Uranus)
- `session_summary` - Session aggregations (Uranus)
- `fleet_summary` - Fleet analytics (Uranus)
- `kpi_aggregates` - Business KPIs (Uranus)
- `users` - User management (Uranus)

### Database Utilities

```typescript
// utils/database.ts
export async function queryClickHouse(sql: string) {
  // ClickHouse query execution
}

export async function getActiveSessions() {
  // Get real-time active sessions
}

export async function getSessionAnalytics() {
  // Get session analytics data
}
```

## Security Features

- **Password Hashing**: All passwords hashed using bcrypt with cost factor 12
- **JWT Tokens**: Secure token-based authentication
- **HTTP-only Cookies**: Tokens stored in secure, HTTP-only cookies
- **Protected Routes**: Middleware protection for all dashboard routes
- **Input Validation**: Email and password validation on both client and server
- **CORS Protection**: Configurable CORS settings

## Real-Time Features

### WebSocket Integration

```typescript
// utils/useWebSocket.ts
export function useWebSocket(url: string) {
  // Real-time WebSocket connection
  // Handles connection management and data updates
}
```

### Live Updates

- **Real-time Map**: Live vehicle tracking with position updates
- **Session Status**: Real-time session status changes
- **Analytics**: Live KPI and metric updates
- **Connection Status**: Real-time service health monitoring

## Performance

### Optimization Features

- **Next.js App Router**: Modern React server components
- **Static Generation**: Optimized page loading
- **Image Optimization**: Next.js image optimization
- **Code Splitting**: Automatic code splitting for better performance
- **Caching**: Efficient data caching strategies

### Monitoring

- **Performance Metrics**: Page load times and Core Web Vitals
- **Error Tracking**: Comprehensive error monitoring
- **User Analytics**: User behavior and engagement tracking
- **API Performance**: Endpoint response times and availability

## Troubleshooting

### Debug Mode

Enable debug logging:
```bash
export NODE_ENV=development
export DEBUG=*
npm run dev
```

## Integration

Mercury integrates with the PacketPulse platform:
- **Input**: Business-ready data from ClickHouse (via Uranus)
- **Authentication**: User management and security
- **Real-time Data**: Live updates from WebSocket services
- **Analytics**: Comprehensive dashboard and reporting

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Styling

The project uses:
- **Material-UI**: Component library and theming
- **CSS Modules**: Component-specific styling
- **Global CSS**: App-wide styles in `globals.css`
- **Responsive Design**: Mobile-first approach

## License

This project is licensed under the MIT License.

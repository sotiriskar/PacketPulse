# Mercury - Full Stack Dashboard

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

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── charts/        # Chart data endpoints
│   │   ├── health/        # Health check endpoint
│   │   ├── sessions/      # Session data endpoints
│   │   └── trends/        # Trend data endpoints
│   ├── auth/              # Authentication page
│   ├── dashboard/         # Main dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (auth redirect)
├── components/            # React components
│   ├── Analytics.tsx      # Analytics dashboard
│   ├── LiveMap.tsx        # Real-time map
│   ├── Login.tsx          # Login form
│   ├── MapComponent.tsx   # Map utilities
│   ├── Overview.tsx       # Dashboard overview
│   ├── Settings.tsx       # Settings panel
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── Signup.tsx         # Signup form
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── middleware.ts          # Next.js middleware
└── utils/                 # Utility functions
    ├── api.ts             # API service
    ├── database.ts        # Database utilities
    └── useWebSocket.ts    # WebSocket hook
```

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

### Common Issues

1. **Authentication Errors**: Verify JWT_SECRET and database connectivity
2. **ClickHouse Connection Failed**: Ensure ClickHouse server is running
3. **WebSocket Connection Issues**: Check WebSocket service availability
4. **Build Failures**: Verify Node.js version and dependencies

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

### Adding New Features

1. **New Pages**: Add routes in `app/` directory
2. **New Components**: Create React components in `components/`
3. **New API Endpoints**: Add API routes in `app/api/`
4. **Database Queries**: Extend utilities in `utils/database.ts`

### Styling

The project uses:
- **Material-UI**: Component library and theming
- **CSS Modules**: Component-specific styling
- **Global CSS**: App-wide styles in `globals.css`
- **Responsive Design**: Mobile-first approach

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

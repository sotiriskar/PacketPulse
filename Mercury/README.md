# Mercury - PacketPulse Dashboard

A modern, real-time vehicle data monitoring and analytics dashboard built with Next.js, Material-UI, and TypeScript.

## Features

- **Real-time Dashboard**: Live monitoring of vehicle sessions and fleet status
- **Interactive Maps**: Real-time vehicle tracking with Leaflet maps
- **Advanced Analytics**: Comprehensive analytics with charts and KPIs
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Authentication System**: Secure login/signup with JWT tokens
- **Health Monitoring**: Real-time connection status indicators

## Authentication

The dashboard now includes a complete authentication system:

### Default Admin User
- **Username**: admin
- **Email**: admin@example.com
- **Password**: password

### Features
- JWT-based authentication with HTTP-only cookies
- Secure password hashing with bcrypt
- Protected routes with middleware
- User registration and login
- Automatic session management

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication token

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (for backend services)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file
JWT_SECRET=your-secret-key-change-in-production
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Login
- Navigate to the dashboard
- Use the default admin credentials or create a new account
- You'll be redirected to the dashboard upon successful authentication

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── auth/              # Authentication page
│   ├── dashboard/         # Main dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (auth redirect)
├── components/            # React components
│   ├── Analytics.tsx      # Analytics dashboard
│   ├── LiveMap.tsx        # Real-time map
│   ├── Login.tsx          # Login form
│   ├── Overview.tsx       # Dashboard overview
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── Signup.tsx         # Signup form
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── middleware.ts          # Next.js middleware
└── utils/                 # Utility functions
    ├── api.ts             # API service
    └── useWebSocket.ts    # WebSocket hook
```

## Database

The authentication system uses a users table created in the Uranus dbt project:

```sql
-- Users table structure
CREATE TABLE users (
    user_id UUID DEFAULT generateUUIDv4(),
    username String,
    email String,
    password_hash String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now(),
    is_active Boolean DEFAULT true
) ENGINE = MergeTree()
ORDER BY user_id;
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with cost factor 12
- **JWT Tokens**: Secure token-based authentication
- **HTTP-only Cookies**: Tokens stored in secure, HTTP-only cookies
- **Protected Routes**: Middleware protection for all dashboard routes
- **Input Validation**: Email and password validation on both client and server

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

- `JWT_SECRET` - Secret key for JWT token signing (required)
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

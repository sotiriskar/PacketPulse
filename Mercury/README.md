# Mercury - Frontend Service

Mercury is the frontend service for the PacketPulse platform, built with Next.js and TypeScript.

## Features

- Modern React with Next.js 15
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- App Router architecture

## Development

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
npm install
```

### Running in Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

### Running in Production

```bash
npm start
```

## Docker

To build and run the Docker container:

```bash
docker build -t mercury .
docker run -p 3000:3000 mercury
```

## Integration

Mercury connects to the Venus WebSocket service for real-time data and can interact with other PacketPulse services through their respective APIs.

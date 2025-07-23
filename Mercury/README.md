# PacketPulse Dashboard

A comprehensive fleet management dashboard built with Next.js, Material-UI, and TypeScript.

## Features

### 🏠 Overview Dashboard
- **KPI Cards**: Real-time metrics including active sessions, total vehicles, distance covered, and average speed
- **Interactive Charts**: Fleet distribution pie chart and speed distribution bar chart
- **Recent Sessions Table**: Quick overview of active sessions with status indicators
- **Quick Stats**: Sidebar with key performance indicators

### 🗺️ Live Map
- **Real-time Vehicle Tracking**: Interactive map showing vehicle locations
- **Vehicle List**: Searchable list of all active vehicles with status indicators
- **Session Details**: Click on any vehicle to view detailed session information
- **Location Data**: Mock coordinates with detailed vehicle information

### 📊 Analytics
- **Performance Metrics**: Fleet utilization, average speed, trip completion rates, and distance efficiency
- **Trend Analysis**: Performance over time charts with speed and efficiency metrics
- **Fleet Utilization**: Pie chart showing vehicle status distribution
- **Speed Analysis**: Bar charts and area charts for speed and distance correlation
- **Key Insights**: AI-powered recommendations and performance highlights

### 🚛 Fleet Management
- **Fleet Overview**: Total vehicles, active vehicles, maintenance status, and efficiency metrics
- **Vehicle Details**: Comprehensive table with all vehicle information
- **Add/Edit Vehicles**: Modal dialogs for fleet management operations
- **Status Tracking**: Real-time status updates (active, maintenance, idle, offline)
- **Performance Metrics**: Individual vehicle efficiency and speed tracking

### 🔧 Additional Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Auto-refresh every 10 seconds for live data
- **Search & Filter**: Find specific vehicles or sessions quickly
- **Status Indicators**: Color-coded chips for easy status identification
- **Interactive Elements**: Hover effects, tooltips, and clickable components

## Navigation

The dashboard features a comprehensive sidebar navigation with the following sections:

1. **Overview** - Main dashboard with KPIs and charts
2. **Live Map** - Real-time vehicle tracking and location data
3. **Analytics** - Performance metrics and trend analysis
4. **Fleet Management** - Vehicle fleet overview and management
5. **Performance** - Detailed performance metrics (coming soon)
6. **Route Planning** - Route optimization tools (coming soon)
7. **Timeline** - Historical data view (coming soon)

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Material-UI v7
- **Charts**: Recharts
- **Styling**: Emotion (CSS-in-JS)
- **Icons**: Material-UI Icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

The dashboard connects to the following API endpoints:

- `/api/sessions` - Get all active sessions
- `/api/sessions/[id]` - Get specific session details
- `/api/stats` - Get dashboard statistics
- `/api/health` - Health check endpoint

## Data Structure

### Session Interface
```typescript
interface Session {
  session_id: string;
  vehicle_id: string;
  order_id: string;
  order_status: string;
  start_time: string;
  last_update_time: string;
  distance_to_destination_km: number;
  elapsed_time: string;
  avg_speed_kmh: number;
  eta: string;
}
```

### Stats Interface
```typescript
interface Stats {
  total_sessions: number;
  active_sessions: number;
  total_distance_km: number;
  avg_speed_kmh: number;
  total_vehicles: number;
  vehicles_in_use: number;
  total_completed_trips: number;
}
```

## Future Enhancements

- **Real Map Integration**: Integration with Google Maps or Mapbox
- **WebSocket Support**: Real-time data streaming
- **Advanced Analytics**: Machine learning insights and predictions
- **Mobile App**: React Native companion app
- **Notifications**: Real-time alerts and notifications
- **Export Features**: PDF reports and data export
- **User Management**: Role-based access control
- **API Documentation**: Swagger/OpenAPI documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

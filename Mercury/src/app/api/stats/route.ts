import { NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    // Get KPIs from ClickHouse
    const kpiQuery = `
      SELECT 
        count() as total_sessions,
        countIf(order_status IN ('started', 'en_route')) as active_sessions,
        sum(distance_to_destination_km) as total_distance_km,
        avg(avg_speed_kmh) as avg_speed_kmh
      FROM active_sessions
    `;
    
    const fleetQuery = `
      SELECT 
        count() as total_vehicles,
        sum(active_sessions) as vehicles_in_use,
        sum(completed_trips) as total_completed_trips
      FROM vehicle_fleet
    `;
    
    const [kpiResponse, fleetResponse] = await Promise.all([
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(kpiQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(fleetQuery)}`)
    ]);

    if (!kpiResponse.ok || !fleetResponse.ok) {
      console.log('ClickHouse not available, returning zero stats');
      return NextResponse.json({
        total_sessions: 0,
        active_sessions: 0,
        total_distance_km: 0,
        avg_speed_kmh: 0,
        total_vehicles: 0,
        vehicles_in_use: 0,
        total_completed_trips: 0
      });
    }

    const [kpiData, fleetData] = await Promise.all([
      kpiResponse.text(),
      fleetResponse.text()
    ]);

    // Parse ClickHouse response (it returns TSV format)
    const parseClickHouseResponse = (text: string) => {
      const lines = text.trim().split('\n');
      if (lines.length < 2) return {};
      
      const headers = lines[0].split('\t');
      const values = lines[1].split('\t');
      return headers.reduce((obj, header, index) => {
        obj[header] = parseFloat(values[index]) || 0;
        return obj;
      }, {} as Record<string, number>);
    };

    const kpiStats = parseClickHouseResponse(kpiData);
    const fleetStats = parseClickHouseResponse(fleetData);

    return NextResponse.json({
      ...kpiStats,
      ...fleetStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    const query = `
      SELECT
        a.session_id AS session_id,
        a.vehicle_id AS vehicle_id,
        a.order_id AS order_id,
        a.order_status AS order_status,
        a.start_time AS start_time,
        a.last_update_time AS last_update_time,
        a.distance_to_destination_km AS distance_to_destination_km,
        a.elapsed_time AS elapsed_time,
        a.avg_speed_kmh AS avg_speed_kmh,
        a.eta AS eta,
        lm.current_lat AS current_lat,
        lm.current_lon AS current_lon,
        s.start_lat AS start_lat,
        s.start_lon AS start_lon,
        s.end_lat AS end_lat,
        s.end_lon AS end_lon
      FROM active_sessions AS a
      INNER JOIN sessions AS s
        ON a.session_id = s.session_id
      LEFT JOIN (
        /* for each session_id, pick the current_lat/lon at the max event_tsp */
        SELECT
          session_id,
          argMax(current_lat, event_tsp) AS current_lat,
          argMax(current_lon, event_tsp) AS current_lon
        FROM session_movements
        GROUP BY session_id
      ) AS lm
        ON lm.session_id = a.session_id
      WHERE a.order_status IN ('started', 'en_route')
      ORDER BY a.last_update_time DESC
      LIMIT 100
      FORMAT TSVWithNames
    `;
    
    const response = await fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('ClickHouse not available, returning empty array');

      return NextResponse.json([]);
    }

    const data = await response.text();
    

    
    // Parse ClickHouse TSV response
    const parseClickHouseResponse = (text: string) => {
      const lines = text.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split('\t');
      const rows = lines.slice(1);
      

      
      return rows.map(row => {
        const values = row.split('\t');
        const obj = headers.reduce((obj, header, index) => {
          const value = values[index] || '';
          // Convert numeric fields
          if (['distance_to_destination_km', 'avg_speed_kmh', 'current_lat', 'current_lon', 'start_lat', 'start_lon', 'end_lat', 'end_lon'].includes(header)) {
            obj[header] = value === '' ? null : parseFloat(value);
          } else {
            obj[header] = value;
          }
          return obj;
        }, {} as Record<string, any>);
        

        return obj;
      });
    };

    const parsedData = parseClickHouseResponse(data);
    
    // Transform field names to match the expected interface
    const transformedData = parsedData.map(row => ({
      session_id: row.session_id,
      vehicle_id: row.vehicle_id,
      order_id: row.order_id,
      order_status: row.order_status,
      start_time: row.start_time,
      last_update_time: row.last_update_time,
      distance_to_destination_km: row.distance_to_destination_km,
      elapsed_time: row.elapsed_time,
      avg_speed_kmh: row.avg_speed_kmh,
      eta: row.eta,
      current_latitude: row.current_lat,
      current_longitude: row.current_lon,
      start_latitude: row.start_lat,
      start_longitude: row.start_lon,
      end_latitude: row.end_lat,
      end_longitude: row.end_lon,
    }));
    

    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active sessions' },
      { status: 500 }
    );
  }
} 
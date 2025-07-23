import { NextRequest, NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    const query = `
      SELECT 
        session_id,
        vehicle_id,
        order_id,
        order_status,
        start_time,
        last_update_time,
        distance_to_destination_km,
        elapsed_time,
        avg_speed_kmh,
        eta
      FROM active_sessions
      ORDER BY last_update_time DESC
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
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {} as Record<string, string>);
      });
    };

    const parsedData = parseClickHouseResponse(data);
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, just return success since we're not creating sessions via API
    return NextResponse.json({ 
      success: true, 
      message: 'Session creation not implemented yet' 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 
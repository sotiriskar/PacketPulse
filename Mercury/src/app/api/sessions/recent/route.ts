import { NextRequest, NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    const query = `
      WITH latest_movement AS (
        SELECT
          session_id,
          status,
          event_tsp   AS latest_activity,
          ROW_NUMBER() OVER (
            PARTITION BY session_id
            ORDER BY event_tsp DESC
          )             AS rn
        FROM session_movements
      )
      SELECT
        lm.session_id,
        lm.status,
        lm.latest_activity,
        s.vehicle_id,
        s.order_id
      FROM latest_movement lm
      JOIN sessions s
        ON s.session_id = lm.session_id
      WHERE lm.rn = 1
      ORDER BY lm.latest_activity DESC
      LIMIT 5
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
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {} as Record<string, string>);
      });
    };

    const parsedData = parseClickHouseResponse(data);
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent sessions' },
      { status: 500 }
    );
  }
} 
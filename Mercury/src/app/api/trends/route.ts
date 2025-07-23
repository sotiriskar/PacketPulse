import { NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    // Get today's and yesterday's KPIs from ClickHouse
    const trendsQuery = `
      SELECT
        'today' as period,
        COUNT(DISTINCT s.session_id) AS total_sessions,
        COUNT(DISTINCT s.order_id) AS total_orders,
        COUNT(DISTINCT s.vehicle_id) AS total_fleet,
        CAST(SUM(ss.total_distance_km) AS INTEGER) AS total_distance
      FROM sessions s
      JOIN session_summary ss
        ON s.session_id = ss.session_id
      WHERE ss.end_time >= DATE_TRUNC('day', NOW())
        AND ss.end_time <  DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
      
      UNION ALL
      
      SELECT
        'yesterday' as period,
        COUNT(DISTINCT s.session_id) AS total_sessions,
        COUNT(DISTINCT s.order_id) AS total_orders,
        COUNT(DISTINCT s.vehicle_id) AS total_fleet,
        CAST(SUM(ss.total_distance_km) AS INTEGER) AS total_distance
      FROM sessions s
      JOIN session_summary ss
        ON s.session_id = ss.session_id
      WHERE ss.end_time >= DATE_TRUNC('day', NOW()) - INTERVAL '1 day'
        AND ss.end_time <  DATE_TRUNC('day', NOW())
      
      FORMAT TSVWithNames
    `;

    const response = await fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(trendsQuery)}`);

    if (!response.ok) {
      console.log('ClickHouse not available, returning zero trends');
      return NextResponse.json({
        today: {
          total_sessions: 0,
          total_orders: 0,
          total_fleet: 0,
          total_distance: 0
        },
        yesterday: {
          total_sessions: 0,
          total_orders: 0,
          total_fleet: 0,
          total_distance: 0
        }
      });
    }

    const data = await response.text();

    // Parse ClickHouse response (it returns TSV format with headers)
    const parseClickHouseResponse = (text: string) => {
      const lines = text.trim().split('\n');
      if (lines.length < 3) return { today: {}, yesterday: {} };
      
      const headers = lines[0].split('\t');
      const rows = lines.slice(1);
      
      let today = {};
      let yesterday = {};
      
      rows.forEach(row => {
        const values = row.split('\t');
        const period = values[headers.indexOf('period')];
        const data = headers.reduce((obj, header, index) => {
          if (header !== 'period') {
            obj[header] = parseFloat(values[index]) || 0;
          }
          return obj;
        }, {} as Record<string, number>);
        
        if (period === 'today') {
          today = data;
        } else if (period === 'yesterday') {
          yesterday = data;
        }
      });
      
      return { today, yesterday };
    };

    const trends = parseClickHouseResponse(data);

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
} 
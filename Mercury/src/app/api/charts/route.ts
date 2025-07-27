import { NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    // Get weekly distance data - current week (Monday to Sunday)
    const weeklyDistanceQuery = `
      SELECT
        toDayOfWeek(ss.end_time) as day_of_week,
        toDate(ss.end_time) as date,
        CAST(SUM(ss.total_distance_km) AS INTEGER) AS total_distance
      FROM session_summary ss
      WHERE ss.end_time >= DATE_TRUNC('week', NOW()) - INTERVAL '1 week'
        AND ss.end_time < DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
      GROUP BY toDayOfWeek(ss.end_time), toDate(ss.end_time)
      ORDER BY date
      FORMAT TSVWithNames
    `;

    // Get weekly sessions data (active vs completed) - current week (Monday to Sunday)
    const weeklySessionsQuery = `
      WITH latest_movements AS (
        SELECT
          session_id,
          status,
          toDate(event_tsp) AS day,
          row_number() 
            OVER (
              PARTITION BY session_id
              ORDER BY event_tsp DESC
            ) AS rn
        FROM default.session_movements
      ),
      all_days AS (
        SELECT toDate(today() - (6 - number)) AS day
        FROM numbers(7)
      )
      SELECT
        ad.day,
        countIf(lm.status = 'completed') AS completed_sessions,
        countIf(lm.status IN ('started','en_route')) AS active_sessions
      FROM all_days ad
      LEFT JOIN latest_movements lm ON ad.day = lm.day AND lm.rn = 1
      GROUP BY ad.day
      ORDER BY ad.day
      FORMAT TSVWithNames
    `;

    const [distanceResponse, sessionsResponse] = await Promise.all([
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(weeklyDistanceQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(weeklySessionsQuery)}`)
    ]);

    if (!distanceResponse.ok || !sessionsResponse.ok) {
      console.log('ClickHouse not available, returning mock chart data');
      return NextResponse.json({
        distanceData: [
          { day: 'Mon', distance: 0 },
          { day: 'Tue', distance: 0 },
          { day: 'Wed', distance: 0 },
          { day: 'Thu', distance: 0 },
          { day: 'Fri', distance: 0 },
          { day: 'Sat', distance: 0 },
          { day: 'Sun', distance: 0 }
        ],
        sessionData: [
          { day: 'Mon', active: 0, completed: 0 },
          { day: 'Tue', active: 0, completed: 0 },
          { day: 'Wed', active: 0, completed: 0 },
          { day: 'Thu', active: 0, completed: 0 },
          { day: 'Fri', active: 0, completed: 0 },
          { day: 'Sat', active: 0, completed: 0 },
          { day: 'Sun', active: 0, completed: 0 }
        ]
      });
    }

    const distanceData = await distanceResponse.text();
    const sessionsData = await sessionsResponse.text();

    // Parse ClickHouse responses
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

    const distanceRows = parseClickHouseResponse(distanceData);
    const sessionRows = parseClickHouseResponse(sessionsData);

    // Transform to chart format - Monday to Sunday
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const distanceDataFormatted = dayNames.map(day => {
      // ClickHouse toDayOfWeek returns 1=Monday, 2=Tuesday, etc.
      const dayIndex = dayNames.indexOf(day) + 1;
      const row = distanceRows.find(r => r.day_of_week === dayIndex.toString());
      return {
        day,
        distance: row ? parseInt(row.total_distance) || 0 : 0
      };
    });

    // Map dates to day names for the chart - ensure Monday to Sunday order
    const sessionDataFormatted = dayNames.map(dayName => {
      const dayIndex = dayNames.indexOf(dayName);
      const row = sessionRows.find(row => {
        const date = new Date(row.day);
        // Convert JavaScript day (0=Sunday) to Monday-first index
        const jsDay = date.getDay();
        const mondayFirstIndex = jsDay === 0 ? 6 : jsDay - 1; // Sunday becomes 6, Monday becomes 0
        return mondayFirstIndex === dayIndex;
      });
      return {
        day: dayName,
        active: row ? parseInt(row.active_sessions) || 0 : 0,
        completed: row ? parseInt(row.completed_sessions) || 0 : 0
      };
    });

    return NextResponse.json({
      distanceData: distanceDataFormatted,
      sessionData: sessionDataFormatted
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
} 
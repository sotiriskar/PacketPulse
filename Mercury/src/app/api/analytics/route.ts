import { NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day'; // day, week, month, year

    // Calculate time range based on period
    let timeRange;
    switch (period) {
      case 'day':
        timeRange = {
          start: 'toStartOfDay(now())',
          end: 'toStartOfDay(now()) + INTERVAL 1 DAY'
        };
        break;
      case 'week':
        timeRange = {
          start: 'toStartOfWeek(now())',
          end: 'toStartOfWeek(now()) + INTERVAL 1 WEEK'
        };
        break;
      case 'month':
        timeRange = {
          start: 'toStartOfMonth(now())',
          end: 'toStartOfMonth(now()) + INTERVAL 1 MONTH'
        };
        break;
      case 'year':
        timeRange = {
          start: 'toStartOfYear(now())',
          end: 'toStartOfYear(now()) + INTERVAL 1 YEAR'
        };
        break;
      default:
        timeRange = {
          start: 'toStartOfDay(now())',
          end: 'toStartOfDay(now()) + INTERVAL 1 DAY'
        };
    }

    // Completion Rate Query
    const completionRateQuery = `
      SELECT
        -- number of sessions with ≥1 "completed" today
        uniqExactIf(session_id, status = 'completed') * 1.0
          / uniqExact(session_id) AS completion_ratio
      FROM default.session_movements
      WHERE event_tsp 
            >= ${timeRange.start}
        AND event_tsp 
            < ${timeRange.end}
      FORMAT TSVWithNames
    `;

    // Peak Hour Activity Query
    const peakHourQuery = `
      SELECT
        concat(
          toString(toHour(event_tsp)), 
          '-', 
          toString(toHour(event_tsp) + 1)
        ) AS hour_bucket,
        uniqExact(session_id) AS session_count
      FROM default.session_movements
      WHERE event_tsp >= ${timeRange.start}
        AND event_tsp < ${timeRange.end}
      GROUP BY hour_bucket
      ORDER BY session_count DESC
      FORMAT TSVWithNames
    `;

    // Average Session Duration and Distance Query
    const avgMetricsQuery = `
      SELECT 
        avg(duration_seconds) AS avg_duration_seconds,
        avg(total_distance_km) AS avg_distance_km
      FROM default.session_summary
      WHERE end_time >= ${timeRange.start}
        AND end_time < ${timeRange.end}
      FORMAT TSVWithNames
    `;

    // Duration Distribution Query
    const durationDistributionQuery = `
      SELECT
        multiIf(
          duration_seconds < 300,   '0–5 min',
          duration_seconds < 900,   '5–15 min',
          duration_seconds < 1800,  '15–30 min',
          duration_seconds < 3600,  '30–60 min',
          duration_seconds < 7200,  '1–2 hrs',
                                    '2+ hrs'
        ) AS duration_bucket,
        COUNT(*) AS session_count
      FROM default.session_summary
      WHERE start_time >= ${timeRange.start}
        AND start_time < ${timeRange.end}
      GROUP BY duration_bucket
      ORDER BY
        indexOf(
          ['0–5 min', '5–15 min', '15–30 min', '30–60 min', '1–2 hrs', '2+ hrs'],
          duration_bucket
        )
      FORMAT TSVWithNames
    `;

    // Order Completion Latency Query
    const latencyQuery = `
      SELECT
        toDate(min(event_tsp)) AS day,
        order_id,
        dateDiff('minute', min(event_tsp), max(event_tsp)) AS latency_minutes
      FROM session_movements sm
      INNER JOIN sessions s
      on s.session_id = sm.session_id
      WHERE status IN ('started', 'completed')
        AND event_tsp >= ${timeRange.start}
        AND event_tsp < ${timeRange.end}
      GROUP BY order_id
      HAVING
        countIf(status = 'started') > 0 AND
        countIf(status = 'completed') > 0
      FORMAT TSVWithNames
    `;

    // Fleet Status Query (not affected by time filters)
    const fleetStatusQuery = `
      WITH latest_status_per_vehicle AS (
        SELECT
          s.vehicle_id,
          sm.status,
          sm.event_tsp,
          ROW_NUMBER() OVER (
            PARTITION BY s.vehicle_id
            ORDER BY sm.event_tsp DESC
          ) AS rn
        FROM default.session_movements sm
        JOIN sessions s ON sm.session_id = s.session_id
      )
      SELECT
        SUM(status IN ('started', 'en_route')) AS active_vehicles,
        SUM(status = 'completed') AS available_vehicles,
        0 AS maintenance_vehicles
      FROM latest_status_per_vehicle
      WHERE rn = 1
      FORMAT TSVWithNames
    `;

    // Top Performers Query
    const topPerformersQuery = `
      SELECT
        vehicle_id,
        first_seen,
        last_updated,
        trips,
        total_km,
        1 as completion
      FROM default.fleet_summary
      WHERE first_seen >= ${timeRange.start} AND first_seen < ${timeRange.end}
      ORDER BY trips DESC, total_km DESC
      LIMIT 3
      FORMAT TSVWithNames
    `;

    const [completionResponse, peakHourResponse, avgMetricsResponse, durationDistributionResponse, latencyResponse, fleetStatusResponse, topPerformersResponse] = await Promise.all([
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(completionRateQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(peakHourQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(avgMetricsQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(durationDistributionQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(latencyQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(fleetStatusQuery)}`),
      fetch(`${CLICKHOUSE_URL}/?query=${encodeURIComponent(topPerformersQuery)}`)
    ]);

    if (!completionResponse.ok || !peakHourResponse.ok || !avgMetricsResponse.ok || !durationDistributionResponse.ok || !latencyResponse.ok || !fleetStatusResponse.ok) {
      console.log('ClickHouse not available, returning empty analytics data');
      return NextResponse.json({
        completionRate: 0,
        peakHourActivity: {
          peakHour: '12am-1am',
          peakCount: 0
        },
        peakHourData: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          deliveries: 0
        })),
        avgDurationMinutes: 0,
        avgDistanceKm: 0,
        durationDistribution: [
          { duration: '0–5 min', count: 0 },
          { duration: '5–15 min', count: 0 },
          { duration: '15–30 min', count: 0 },
          { duration: '30–60 min', count: 0 },
          { duration: '1–2 hrs', count: 0 },
          { duration: '2+ hrs', count: 0 }
        ],
        completionTimeByPeriod: Array.from({ length: 24 }, (_, i) => ({
          timeUnit: `${i}:00`,
          avgTime: 0
        })),
        fleetStatus: {
          activeVehicles: 0,
          availableVehicles: 0,
          maintenanceVehicles: 0
        },
        topPerformers: [],
        period: period
      });
    }

    const completionData = await completionResponse.text();
    const peakHourData = await peakHourResponse.text();
    const avgMetricsData = await avgMetricsResponse.text();
    const durationDistributionData = await durationDistributionResponse.text();
    const latencyData = await latencyResponse.text();
    
    // Parse ClickHouse response
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

    const completionResult = parseClickHouseResponse(completionData);
    const peakHourResults = parseClickHouseResponse(peakHourData);
    const avgMetricsResult = parseClickHouseResponse(avgMetricsData);
    const durationDistributionResult = parseClickHouseResponse(durationDistributionData);
    const latencyResult = parseClickHouseResponse(latencyData);
    
    const completionRate = completionResult.length > 0 ? parseFloat(completionResult[0].completion_ratio) * 100 : 0;
    
    // Get average metrics
    const avgDurationMinutes = avgMetricsResult.length > 0 ? 
      Math.round((parseFloat(avgMetricsResult[0].avg_duration_seconds) || 0) / 60) : 0;
    const avgDistanceKm = avgMetricsResult.length > 0 ? 
      Math.round((parseFloat(avgMetricsResult[0].avg_distance_km) || 0) * 10) / 10 : 0;
    
    // Get peak hour activity
    const convertHourToAMPM = (hourBucket: string) => {
      const startHour = parseInt(hourBucket.split('-')[0]);
      const endHour = startHour + 1;
      
      const formatHour = (hour: number) => {
        if (hour === 0) return '12';
        if (hour > 12) return `${hour - 12}`;
        return `${hour}`;
      };
      
      const getAMPM = (hour: number) => {
        if (hour >= 12) return 'pm';
        return 'am';
      };
      
      return `${formatHour(startHour)}${getAMPM(startHour)}-${formatHour(endHour)}${getAMPM(endHour)}`;
    };

    const peakHourActivity = peakHourResults.length > 0 ? {
      peakHour: convertHourToAMPM(peakHourResults[0].hour_bucket),
      peakCount: parseInt(peakHourResults[0].session_count) || 0
    } : { peakHour: '12am-1am', peakCount: 0 };

    // Transform peak hour data for chart (create 24-hour data with actual values)
    const peakHourChartData = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      const hourBucket = `${i}-${i + 1}`;
      const matchingRow = peakHourResults.find(row => row.hour_bucket === hourBucket);
      const sessionCount = matchingRow ? parseInt(matchingRow.session_count) || 0 : 0;
      
      return {
        hour: `${hour}:00`,
        deliveries: sessionCount
      };
    });

    // Ensure all duration buckets are present, even with 0 count
    const allDurationBuckets = [
      '0–5 min', '5–15 min', '15–30 min', '30–60 min', '1–2 hrs', '2+ hrs'
    ];
    
    const durationDistributionWithZeros = allDurationBuckets.map(bucket => {
      const existingRow = durationDistributionResult.find(row => row.duration_bucket === bucket);
      return {
        duration: bucket,
        count: existingRow ? parseInt(existingRow.session_count) || 0 : 0
      };
    });

    // Calculate average completion time by time period
    const calculateAverageCompletionTimeByPeriod = (data: any[], period: string) => {
      if (data.length === 0) {
        if (period === 'day') {
          return Array.from({ length: 24 }, (_, i) => ({
            timeUnit: `${i}:00`,
            avgTime: 0
          }));
        } else if (period === 'week') {
          return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
            timeUnit: day,
            avgTime: 0
          }));
        } else if (period === 'month') {
          return Array.from({ length: 31 }, (_, i) => ({
            timeUnit: `${i + 1}`,
            avgTime: 0
          }));
        } else { // year
          return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
            timeUnit: month,
            avgTime: 0
          }));
        }
      }

      // Group by appropriate time unit
      const timeData = new Map();
      
      data.forEach(row => {
        const date = new Date(row.day);
        let timeUnit: string;
        
        if (period === 'day') {
          timeUnit = `${date.getHours()}:00`;
        } else if (period === 'week') {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          timeUnit = days[date.getDay()];
        } else if (period === 'month') {
          timeUnit = `${date.getDate()}`;
        } else { // year
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          timeUnit = months[date.getMonth()];
        }
        
        const latency = parseInt(row.latency_minutes) || 0;
        
        if (!timeData.has(timeUnit)) {
          timeData.set(timeUnit, { total: 0, count: 0 });
        }
        
        timeData.get(timeUnit).total += latency;
        timeData.get(timeUnit).count += 1;
      });

      // Create result array based on period
      let result: Array<{ timeUnit: string; avgTime: number }>;
      
      if (period === 'day') {
        result = Array.from({ length: 24 }, (_, i) => {
          const timeUnit = `${i}:00`;
          const data = timeData.get(timeUnit);
          const avgTime = data ? Math.round(data.total / data.count) : 0;
          return { timeUnit, avgTime };
        });
      } else if (period === 'week') {
        result = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
          const data = timeData.get(day);
          const avgTime = data ? Math.round(data.total / data.count) : 0;
          return { timeUnit: day, avgTime };
        });
      } else if (period === 'month') {
        result = Array.from({ length: 31 }, (_, i) => {
          const timeUnit = `${i + 1}`;
          const data = timeData.get(timeUnit);
          const avgTime = data ? Math.round(data.total / data.count) : 0;
          return { timeUnit, avgTime };
        });
      } else { // year
        result = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => {
          const data = timeData.get(month);
          const avgTime = data ? Math.round(data.total / data.count) : 0;
          return { timeUnit: month, avgTime };
        });
      }

      return result;
    };

    const completionTimeByPeriod = calculateAverageCompletionTimeByPeriod(latencyResult, period);

    // Process fleet status data
    const fleetStatusText = await fleetStatusResponse.text();
    const fleetStatusResult = parseClickHouseResponse(fleetStatusText);
    
    const fleetStatus = fleetStatusResult.length > 0 ? {
      activeVehicles: parseInt(fleetStatusResult[0].active_vehicles) || 0,
      availableVehicles: parseInt(fleetStatusResult[0].available_vehicles) || 0,
      maintenanceVehicles: parseInt(fleetStatusResult[0].maintenance_vehicles) || 0
    } : {
      activeVehicles: 0,
      availableVehicles: 0,
      maintenanceVehicles: 0
    };

    // Process top performers data (optional - don't break if this fails)
    let topPerformers: Array<{
      vehicleId: string;
      firstSeen: string;
      lastUpdated: string;
      trips: number;
      totalKm: number;
      completion: number;
    }> = [];
    try {
      const topPerformersText = await topPerformersResponse.text();
      console.log('Top performers response status:', topPerformersResponse.status);
      console.log('Top performers response text:', topPerformersText);
      if (topPerformersResponse.ok) {
        const topPerformersResult = parseClickHouseResponse(topPerformersText);
        console.log('Top performers parsed result:', topPerformersResult);
        topPerformers = topPerformersResult.map(row => ({
          vehicleId: row.vehicle_id,
          firstSeen: row.first_seen,
          lastUpdated: row.last_updated,
          trips: parseInt(row.trips) || 0,
          totalKm: parseFloat(row.total_km) || 0,
          completion: parseFloat(row.completion) || 0
        }));
      }
    } catch (error) {
      console.log('Top performers query failed, using empty array:', error);
    }

    return NextResponse.json({
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
      peakHourActivity,
      peakHourData: peakHourChartData,
      avgDurationMinutes,
      avgDistanceKm,
      durationDistribution: durationDistributionWithZeros,
      completionTimeByPeriod,
      fleetStatus,
      topPerformers,
      period: period
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';

export async function GET() {
  try {
    // Check ClickHouse service health
    const clickhouseResponse = await fetch(`${CLICKHOUSE_URL}/ping`, {
      method: 'GET',
    });

    const clickhouseHealth = clickhouseResponse.ok ? 'healthy' : 'unhealthy';

    return NextResponse.json({
      mercury: 'healthy',
      clickhouse: clickhouseHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        mercury: 'healthy',
        clickhouse: 'unreachable',
        timestamp: new Date().toISOString(),
        error: 'Failed to check ClickHouse health',
      },
      { status: 503 }
    );
  }
} 
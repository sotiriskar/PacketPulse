with base as (
  select
    start_time,
    end_time,
    duration_seconds,
    total_distance_km,
    avg_speed_kmh
  from {{ ref('session_summary') }}
)

-- daily
select
  toDate(start_time) as period_start,
  toDate(start_time) as period_end,
  'day' as period_type,
  count(*) as sessions_completed,
  round(avg(duration_seconds), 2) as avg_duration_sec,
  round(sum(total_distance_km), 2) as total_distance_km,
  round(avg(avg_speed_kmh), 2) as avg_speed_kmh
from base
group by toDate(start_time)

union all

-- weekly
select
  toStartOfWeek(start_time) as period_start,
  toStartOfWeek(start_time) + 6 as period_end,
  'week' as period_type,
  count(*) as sessions_completed,
  round(avg(duration_seconds), 2) as avg_duration_sec,
  round(sum(total_distance_km), 2) as total_distance_km,
  round(avg(avg_speed_kmh), 2) as avg_speed_kmh
from base
group by toStartOfWeek(start_time)

union all

-- monthly
select
  toStartOfMonth(start_time) as period_start,
  toStartOfMonth(start_time) + toIntervalMonth(1) - 1 as period_end,
  'month' as period_type,
  count(*) as sessions_completed,
  round(avg(duration_seconds), 2) as avg_duration_sec,
  round(sum(total_distance_km), 2) as total_distance_km,
  round(avg(avg_speed_kmh), 2) as avg_speed_kmh
from base
group by toStartOfMonth(start_time)

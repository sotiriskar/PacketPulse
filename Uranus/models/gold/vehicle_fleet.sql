with session_status as (
  select
    session_id,
    status
  from session_movements
  order by session_id, event_tsp desc
  limit 1 by session_id
),

final as (
    select
    v.vehicle_id as vehicle_id,
    v.first_seen as first_seen,
    max(s.event_started) as last_active_time,
    countDistinctIf(s.session_id, ss.status in ('started', 'en_route')) as active_sessions,
    countDistinctIf(s.session_id, ss.status = 'completed') as completed_trips,
    round(
        countDistinctIf(s.session_id, ss.status = 'completed')
        / nullIf(dateDiff('day', v.first_seen, now()), 0)
    , 2) as trips_per_day
    from vehicles v
    left join sessions s on s.vehicle_id = v.vehicle_id
    left join session_status ss on ss.session_id = s.session_id
    group by v.vehicle_id, v.first_seen
)

select * from final

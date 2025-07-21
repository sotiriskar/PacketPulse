ATTACH TABLE _ UUID 'e8c69e87-d72b-4cfb-a0aa-b98a22c86dbf'
(
    `hostname` LowCardinality(String) COMMENT 'Hostname of the server executing the query.' CODEC(ZSTD(1)),
    `event_date` Date COMMENT 'Event date.' CODEC(Delta(2), ZSTD(1)),
    `event_time` DateTime COMMENT 'Event time.' CODEC(Delta(4), ZSTD(1)),
    `metric` LowCardinality(String) COMMENT 'Metric name.' CODEC(ZSTD(1)),
    `value` Float64 COMMENT 'Metric value.' CODEC(ZSTD(3))
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (metric, event_date, event_time)
SETTINGS index_granularity = 8192
COMMENT 'Contains the historical values for system.asynchronous_metrics, once per time interval (one second by default).\n\nIt is safe to truncate or drop this table at any time.'

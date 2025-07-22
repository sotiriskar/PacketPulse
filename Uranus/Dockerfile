FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install dbt-clickhouse
RUN pip install dbt-clickhouse

# Copy the project files
COPY Uranus/ /app

# Set the profiles directory
ENV DBT_PROFILES_DIR=/app

# Wait for data to be populated, then run dbt
ENTRYPOINT ["sh", "-c", "sleep 10 && dbt run"]

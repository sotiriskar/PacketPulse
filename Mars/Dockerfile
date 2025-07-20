FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better caching
COPY Mars/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Mars application code
COPY Mars/ .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Start the simulator
CMD ["python", "main.py"]

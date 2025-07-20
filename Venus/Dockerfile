FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better caching
COPY Venus/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Venus application code
COPY Venus/ .

# Expose the API port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Start the API server
CMD ["python", "main.py"] 

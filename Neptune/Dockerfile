FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY Neptune/requirements.txt .

# Install dependencies with proper compilation
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files
COPY Neptune/ .

CMD ["python", "-u", "main.py"]

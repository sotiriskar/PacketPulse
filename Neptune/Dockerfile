FROM python:3.11-slim

WORKDIR /app

COPY Neptune/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Neptune/ .

CMD ["python", "main.py"] 
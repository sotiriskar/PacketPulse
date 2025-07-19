# Venus - Packet Tracking API

Venus is a WebSocket API that receives packet delivery data from Mars simulators and stores it in CSV files.

## Features

- Real-time data reception via WebSockets
- CSV storage for delivery tracking with daily files
- API key authentication
- Full data validation (UUIDs, coordinates, status values)
- Health check and info endpoints
- Configurable security settings

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt`

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. (Optional) Edit the configuration file `config.py` to adjust API settings

## Configuration

Edit `config.py` to customize:

- `HOST`: API server host (default: 0.0.0.0)
- `PORT`: API server port (default: 8000)
- `DATA_DIR`: Directory for CSV files (default: data)
- `CSV_FILENAME_FORMAT`: Format for CSV filenames
- `API_KEYS`: Dictionary of valid API keys with permissions
- `CORS_ORIGINS`: CORS settings for HTTP endpoints

## Usage

Start the API server with:

```bash
python -m Venus.api
```

The API server will:
1. Start listening on the configured host and port
2. Accept WebSocket connections at `/ws`
3. Validate incoming data against the data model
4. Store valid data in CSV files
5. Provide acknowledgement responses to clients

## API Endpoints

- `GET /`: API information
- `GET /health`: Health check endpoint
- `GET /info`: Information about connected devices (requires API key)
- `WebSocket /ws`: WebSocket endpoint for receiving packet delivery data

## Data Format

Packet delivery data is stored in CSV files with the following columns:

```
device_id,vehicle_id,session_id,order_number,timestamp,current_latitude,current_longitude,start_latitude,start_longitude,end_latitude,end_longitude,status
```

## Security

Venus uses API key authentication with configurable permissions:
- Default keys in config.py: "simulator123" (write access) and "reader456" (read access)
- Keys should be sent in HTTP header "X-API-Key" for HTTP endpoints
- WebSocket connections don't currently enforce API key authentication 
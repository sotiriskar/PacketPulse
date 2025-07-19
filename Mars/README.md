# Mars - Packet Delivery Simulator

Mars is a simulation component that generates packet delivery data and transmits it to the Venus API via WebSocket.

## Features

- Simulates multiple devices delivering packets from point A to point B
- UUID-based identifiers for devices, vehicles, and sessions
- Real-time position updates with status tracking
- Configurable number of simulated devices
- Speed validation (0-120 km/h equivalent)
- Randomized start and end locations from a configurable list

## Requirements

- Python 3.9+
- Dependencies listed in `requirements.txt`

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. (Optional) Edit the configuration file `config.py` to adjust simulation parameters

## Configuration

Edit `config.py` to customize:

- `NUM_DEVICES`: Number of devices to simulate
- `UPDATE_INTERVAL`: Time between updates in seconds
- `API_URL`: WebSocket URL of Venus API (default: ws://localhost:8000/ws)
- `API_KEY`: API key for authentication
- `DEFAULT_LOCATIONS`: Dictionary of named locations with coordinates

## Usage

Run the simulator with:

```bash
python -m Mars.simulator
```

The simulator will:
1. Initialize packet deliveries with the specified number of devices
2. Begin moving packets along their routes
3. Send telemetry updates to Venus API via WebSocket
4. Track delivery status (not_started → en_route → completed)
5. Continue until all deliveries are complete or interrupted

## Data Format

Each delivery record includes:
- `device_id`: UUID of the device
- `vehicle_id`: UUID of the vehicle
- `session_id`: UUID of the current session
- `order_number`: Sequential order number
- `timestamp`: UNIX timestamp
- `current_location`: Current latitude/longitude
- `start_location`: Starting latitude/longitude
- `end_location`: Destination latitude/longitude
- `status`: Current status (not_started, en_route, completed) 

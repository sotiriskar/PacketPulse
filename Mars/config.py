import os


# Simulator settings
# How many sessions (1 session = 1 device) to simulate in this run
TOTAL_SESSIONS = int(os.getenv("TOTAL_SESSIONS", "10"))

# Frequency (seconds) between each position update sent over the websocket
UPDATE_INTERVAL = float(os.getenv("UPDATE_INTERVAL", "1.0"))

# Device movement speed factor (higher = faster completion)
SIM_SPEED = float(os.getenv("SIM_SPEED", "0.02"))

# API Connection
WEBSOCKET_URL = os.getenv("WEBSOCKET_URL", "ws://localhost:8000/ws")
API_KEY       = os.getenv("API_KEY", "mars-secret-key")

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s" 

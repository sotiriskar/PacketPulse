"""
Configuration for Mars - Packet Delivery Simulator
"""

# Simulator settings
NUM_DEVICES = 5
UPDATE_INTERVAL = 1.0  # seconds

# Speed settings
SPEED_MIN = 0.002  # Speed for ~2 minute completion
SPEED_MAX = 0.004  # Speed for ~2 minute completion

# API Connection
WEBSOCKET_URL = "ws://localhost:8000/ws"
API_KEY = "simulator123"

# NYC locations for reasonable completion time (2-3 minutes)
# Format: (latitude, longitude, name)
NYC_LOCATIONS = [
    (40.7812, -73.9665, "Central Park"),
    (40.7589, -73.9851, "Times Square"),
    (40.7484, -73.9857, "Empire State Building"),
    (40.7061, -73.9969, "Brooklyn Bridge"),
    (40.7587, -73.9787, "Rockefeller Center"),
    (40.7527, -73.9772, "Grand Central"),
    (40.7068, -74.0090, "Wall Street"),
    (40.7248, -74.0020, "SoHo"),
    (40.7033, -74.0170, "Battery Park"),
    (40.7157, -73.9977, "Chinatown")
]

# Cross-country locations (longer routes)
# Format: (latitude, longitude, name)
CROSS_COUNTRY_LOCATIONS = [
    (40.7128, -74.0060, "New York"),
    (34.0522, -118.2437, "Los Angeles"),
    (41.8781, -87.6298, "Chicago"),
    (29.7604, -95.3698, "Houston"),
    (33.4484, -112.0740, "Phoenix"),
    (39.9526, -75.1652, "Philadelphia"),
    (29.4241, -98.4936, "San Antonio"),
    (32.7157, -117.1611, "San Diego"),
    (32.7767, -96.7970, "Dallas"),
    (37.3382, -121.8863, "San Jose")
]

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s" 
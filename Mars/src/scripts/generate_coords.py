# =============================================================== #
# This script is used to get the route between two points
# using the OpenRouteService API. Install dependencies manually.
# Get the API key from the OpenRouteService website.
# Get your own coordinates to play with.
# =============================================================== #

import requests
import polyline

# Replace with your own API key
API_KEY = "your_api_key"

# Example coordinates: Athens to Thessaloniki
start = [0.0, 0.0]         # lon, lat
end = [0.0, 0.0]           # lon, lat

url = "https://api.openrouteservice.org/v2/directions/driving-car"

params = {
    "api_key": API_KEY,
    "start": f"{start[0]},{start[1]}",
    "end": f"{end[0]},{end[1]}"
}

response = requests.get(url, params=params)
response.raise_for_status()
data = response.json()

# Extract coordinates
coords = data['features'][0]['geometry']['coordinates']
latlon = [(lat, lon) for lon, lat in coords]  # Swap order to (lat, lon)

# Print or save
for point in latlon:
    print(point)

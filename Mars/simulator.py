from Mars.models import PacketDelivery, DeliveryStatus
from websockets.exceptions import ConnectionClosed
from typing import Dict
import websockets
import asyncio
import logging
import random
import signal
import uuid
import json
import os


# Configure logging
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Default WebSocket URL
DEFAULT_WEBSOCKET_URL = "ws://venus-api:8000/ws"
WEBSOCKET_URL = os.environ.get("WEBSOCKET_URL", DEFAULT_WEBSOCKET_URL)

# API key for authentication
API_KEY = os.environ.get("API_KEY", "mars-secret-key")

# NYC locations
NYC_LOCATIONS = [
    "Times Square",
    "Central Park",
    "Empire State Building",
    "Brooklyn Bridge",
    "Rockefeller Center",
    "Wall Street",
    "Grand Central",
    "Battery Park",
    "SoHo",
    "Chinatown"
]

class Simulator:
    def __init__(self):
        self.websocket = None
        self.running = False
        self.shutdown_event = asyncio.Event()

        # Number of sessions/devices to simulate in one run
        self.total_sessions: int = int(os.environ.get("TOTAL_SESSIONS", "5"))

        # Prepare all deliveries once at startup
        self.active_deliveries: Dict[str, PacketDelivery] = {}
        for _ in range(self.total_sessions):
            delivery = self._create_delivery()
            self.active_deliveries[delivery.device_id] = delivery

        # Track completed & started sets for logging / status transitions
        self.completed_deliveries: set[str] = set()
        self.started_deliveries: set[str] = set()

        # Background task for consuming server acknowledgments
        self._recv_task: asyncio.Task | None = None

        # Set a speed for progress updates
        FAST_SPEED = float(os.getenv("SIM_SPEED", "0.02"))          # 0.02 = finish in ~50 s
        self.speed = FAST_SPEED

    def _create_delivery(self) -> PacketDelivery:
        """Generate a random delivery between two NYC locations"""
        # Select random start and end locations
        start_location = random.choice(NYC_LOCATIONS)
        end_location = random.choice([loc for loc in NYC_LOCATIONS if loc != start_location])
        
        # Create a new delivery
        delivery = PacketDelivery(
            device_id=str(uuid.uuid4()),
            vehicle_id=str(uuid.uuid4()),
            session_id=str(uuid.uuid4()),
            order_id=str(uuid.uuid4()),
            start_location=start_location,
            end_location=end_location
        )
        
        logger.info(
            f"[SESSION PREPARED] {delivery.device_id} | order {delivery.order_id} | {start_location} -> {end_location}")
        return delivery

    def update_deliveries(self):
        """Update the position of all active deliveries"""
        for device_id, delivery in list(self.active_deliveries.items()):
            # Update the delivery position
            delivery.update_position(self.speed)
            
            # Check if delivery is completed
            if delivery.is_completed() and device_id not in self.completed_deliveries:
                delivery.status = DeliveryStatus.COMPLETED
                self.completed_deliveries.add(device_id)
                logger.info(f"[SESSION END] {device_id} completed")
            
            # Remove completed deliveries after they're processed
            if device_id in self.completed_deliveries and delivery.status == DeliveryStatus.COMPLETED:
                self.active_deliveries.pop(device_id, None)

    async def send_delivery_data(self, delivery: PacketDelivery):
        """Send delivery data to Venus API"""
        if self.websocket:
            try:
                # Set initial status to STARTED for new deliveries
                if delivery.device_id not in self.started_deliveries:
                    delivery.status = DeliveryStatus.STARTED
                    self.started_deliveries.add(delivery.device_id)
                
                # Convert delivery to dict and send as JSON
                data = delivery.to_dict()
                await self.websocket.send(json.dumps(data))
                
                # Log the status being sent
                logger.debug(f"Sent data for device {delivery.device_id}, status: {delivery.status}")
                
                # After sending STARTED status, change to EN_ROUTE for future updates
                if delivery.status == DeliveryStatus.STARTED:
                    delivery.status = DeliveryStatus.EN_ROUTE
            except Exception as e:
                logger.error(f"Error sending delivery data: {e}")
                raise

    async def update_loop(self):
        """Main update loop for the simulator"""
        while self.running and not self.shutdown_event.is_set():
            try:
                # No new deliveries are generated – we prepared everything up-front.
                
                # Update all active deliveries
                self.update_deliveries()
                
                # Send data for all active deliveries
                for delivery in list(self.active_deliveries.values()):
                    await self.send_delivery_data(delivery)
                
                # Wait before the next update
                await asyncio.sleep(1)
                
                # All sessions done → shutdown
                if not self.active_deliveries and len(self.completed_deliveries) == self.total_sessions:
                    logger.info(f"All {self.total_sessions} sessions completed. Shutting down simulator.")
                    self.shutdown_event.set()
                    self.running = False
                    
                    # Close the websocket properly
                    if self.websocket and self.websocket.open:
                        await self.websocket.close()
                        logger.info("WebSocket connection closed properly")
                    
                    # Ensure background receiver task stops
                    if self._recv_task and not self._recv_task.done():
                        self._recv_task.cancel()
                    
                    # Force exit the process
                    logger.info("Exiting simulator process")
                    os._exit(0)  # Use os._exit to force immediate termination
                    return
                    
            except ConnectionClosed as e:
                logger.error(f"WebSocket connection closed: {e}")
                # Try to reconnect instead of shutting down
                self.websocket = None
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in update loop: {e}")
                await asyncio.sleep(0.5)

    async def authenticate(self):
        """Send authentication message to the API"""
        if self.websocket:
            try:
                auth_message = {
                    "type": "authentication",
                    "api_key": API_KEY
                }
                await self.websocket.send(json.dumps(auth_message))
                response = await self.websocket.recv()
                response_data = json.loads(response)
                
                if response_data.get("status") == "authenticated":
                    logger.info("Successfully authenticated with Venus API")
                    # Start background task that continuously consumes inbound messages so the
                    # server's outgoing queue doesn't fill up and force-close the connection.
                    if not self._recv_task or self._recv_task.done():
                        self._recv_task = asyncio.create_task(self._receive_loop(), name="venus-ws-receiver")
                    return True
                else:
                    logger.error(f"Authentication failed: {response_data.get('message', 'Unknown error')}")
                    return False
            except Exception as e:
                logger.error(f"Authentication error: {e}")
                return False
        return False

    async def _receive_loop(self):
        """Continuously read messages from the websocket and discard them.

        Venus replies with a small acknowledgement for every payload we send. If the
        client never reads those messages the server's send buffer (and websockets
        internal *max_queue*) fills up after ~32 messages and the server drops the
        connection with the error we observed ("no close frame received or sent").
        This loop prevents that by eagerly consuming all incoming frames.
        """
        try:
            while self.running and self.websocket and not self.websocket.closed:
                try:
                    # We don't do anything with the response – just read and discard.
                    await self.websocket.recv()
                except ConnectionClosed:
                    break
                except Exception as exc:
                    logger.debug(f"Receiver loop error: {exc}")
                    # small pause to avoid busy loop on repeated failures
                    await asyncio.sleep(0.1)
        finally:
            logger.debug("Receiver loop terminated")

    async def run(self):
        """Run the simulator"""
        self.running = True
        retry_count = 0
        max_retries = 5
        
        while self.running and retry_count < max_retries and not self.shutdown_event.is_set():
            try:
                # Disable automatic ping/pong from client side to avoid 1011 keep-alive errors.
                async with websockets.connect(
                    WEBSOCKET_URL,
                    ping_interval=None,
                    ping_timeout=None,
                    close_timeout=5,
                ) as websocket:
                    self.websocket = websocket
                    logger.info(f"Connected to Venus API at {WEBSOCKET_URL}")
                    
                    # Authenticate with the API
                    if await self.authenticate():
                        # Start the main update loop
                        await self.update_loop()
                        # If we exit the update loop normally, break out of retry loop
                        break
                    else:
                        logger.error("Failed to authenticate with Venus API")
                        retry_count += 1
                        await asyncio.sleep(2)
            except ConnectionClosed as e:
                logger.error(f"WebSocket connection closed: {e}")
                # If all sessions already done break, else retry
                if len(self.completed_deliveries) == self.total_sessions:
                    break
                retry_count += 1
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"Error connecting to Venus API: {e}")
                retry_count += 1
                await asyncio.sleep(2)
            finally:
                self.websocket = None
        
        # Clean shutdown
        self.running = False
        if retry_count >= max_retries:
            logger.error(f"Max retries ({max_retries}) reached, shutting down simulator")
        logger.info("Simulator shutdown complete")
        
        # Exit when finished
        if self.shutdown_event.is_set() or retry_count >= max_retries:
            # Clean up background task before exit
            if self._recv_task and not self._recv_task.done():
                self._recv_task.cancel()
            os._exit(0)

def setup_signal_handlers():
    """Set up signal handlers for graceful shutdown"""
    def handle_signal(signum, frame):
        logger.info(f"Received signal {signum}, shutting down")
        os._exit(0)
    
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

async def main():
    """Main entry point for the simulator"""
    # Set up signal handlers
    setup_signal_handlers()
    
    simulator = Simulator()
    try:
        await simulator.run()
    except KeyboardInterrupt:
        logger.info("Simulator interrupted by user")
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
    finally:
        # Make sure we exit cleanly
        if simulator.running:
            simulator.running = False
            simulator.shutdown_event.set()
        logger.info("Simulator exiting")
        os._exit(0)

if __name__ == "__main__":
    asyncio.run(main())

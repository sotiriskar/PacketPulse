from confluent_kafka import Producer
from typing import Dict, List, Any
from fastapi import WebSocket
import asyncio
import logging
import json
import os


# Configure logging
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_lock = asyncio.Lock()
        self.max_connections = int(os.environ.get("MAX_CONNECTIONS", "100"))
        self.connection_semaphore = asyncio.Semaphore(self.max_connections)
    
    async def connect(self, websocket: WebSocket):
        """Connect a new WebSocket client"""
        async with self.connection_semaphore:
            await websocket.accept()
            async with self.connection_lock:
                self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket client"""
        async with self.connection_lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients"""
        for connection in self.active_connections:
            await connection.send_text(message)

class KafkaProducer:
    """Kafka producer for sending delivery data"""
    
    def __init__(self):
        self.bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
        self.producer = None
        self.delivery_reports = {}
        
    async def start(self):
        """Initialize the Kafka producer"""
        # Configure Kafka producer
        config = {
            'bootstrap.servers': self.bootstrap_servers,
            'client.id': 'venus-api',
            'compression.type': 'lz4',
            'batch.size': 65536,  # 64KB batches
            'linger.ms': 5,       # 5ms delay to allow batching
            'queue.buffering.max.messages': 100000,
            'queue.buffering.max.kbytes': 104857600,  # 100MB
            'enable.idempotence': True,  # Exactly once delivery
            'acks': 'all',        # Wait for all replicas to acknowledge
        }
        
        # Create producer
        self.producer = Producer(config)
        logger.info(f"Kafka producer started, connected to {self.bootstrap_servers}")
        
        # Start delivery report polling
        asyncio.create_task(self._poll_loop())
    
    async def stop(self):
        """Clean up the Kafka producer"""
        if self.producer:
            # Flush any pending messages
            self.producer.flush()
            self.producer = None
            logger.info("Kafka producer stopped")
    
    async def send_message(self, topic: str, data: Dict[str, Any]) -> bool:
        """Send a message to Kafka"""
        if not self.producer:
            logger.error("Kafka producer not initialized")
            return False
        
        try:
            # Convert data to JSON
            message = json.dumps(data).encode('utf-8')
            
            # Send message to Kafka
            self.producer.produce(
                topic=topic,
                value=message,
                key=str(data.get('device_id', '')).encode('utf-8'),
                on_delivery=self._delivery_report
            )
            
            # Trigger any available delivery callbacks
            self.producer.poll(0)
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending message to Kafka: {e}")
            return False
    
    def _delivery_report(self, err, msg):
        """Callback for message delivery reports"""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")
    
    async def _poll_loop(self):
        """Background task to poll for delivery reports"""
        while self.producer is not None:
            self.producer.poll(0.1)  # Poll every 100ms
            await asyncio.sleep(0.1) 

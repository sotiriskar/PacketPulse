from pyiceberg.catalog import load_catalog
import pyarrow as pa
import logging
import boto3
from botocore.exceptions import ClientError
from src.config.settings import (
    ICEBERG_NAMESPACE,
    ICEBERG_TABLE,
    ICEBERG_REST_URL,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET
)

logger = logging.getLogger("iceberg_utils")

def create_minio_bucket_if_not_exists():
    """Create MinIO bucket if it doesn't exist"""
    try:
        # Create S3 client for MinIO
        s3_client = boto3.client(
            's3',
            endpoint_url=MINIO_ENDPOINT,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY
        )
        
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=MINIO_BUCKET)
            logger.info(f"MinIO bucket '{MINIO_BUCKET}' already exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                s3_client.create_bucket(Bucket=MINIO_BUCKET)
                logger.info(f"Created MinIO bucket '{MINIO_BUCKET}'")
            else:
                raise

    except Exception as e:
        logger.error(f"Error creating MinIO bucket: {e}")
        raise

def get_iceberg_catalog():
    """Initialize and return the Iceberg catalog"""
    return load_catalog(
        "docs",
        **{
            "uri": ICEBERG_REST_URL,
            "s3.endpoint": MINIO_ENDPOINT,
            "s3.access-key-id": MINIO_ACCESS_KEY,
            "s3.secret-access-key": MINIO_SECRET_KEY,
            "py-io-impl": "pyiceberg.io.pyarrow.PyArrowFileIO"
        }
    )

def get_delivery_table_schema():
    """Get the PyArrow schema for the delivery table"""
    return pa.schema([
        ('device_id', pa.string()),
        ('vehicle_id', pa.string()),
        ('session_id', pa.string()),
        ('order_id', pa.string()),
        ('status', pa.string()),
        ('timestamp', pa.string()),
        ('start_location', pa.string()),
        ('end_location', pa.string()),
        ('start_lat', pa.float64()),
        ('start_lon', pa.float64()),
        ('end_lat', pa.float64()),
        ('end_lon', pa.float64()),
        ('current_lat', pa.float64()),
        ('current_lon', pa.float64())
    ])

def initialize_iceberg_table():
    """
    Initialize the Iceberg table. If it doesn't exist, create it.
    Also ensures the MinIO bucket exists.
    
    Returns:
        The Iceberg table object
    """
    try:
        # First, ensure the MinIO bucket exists
        create_minio_bucket_if_not_exists()
        
        catalog = get_iceberg_catalog()
        
        # Check if table exists first
        try:
            table = catalog.load_table(f'{ICEBERG_NAMESPACE}.{ICEBERG_TABLE}')
            logger.info(f"Loading existing Iceberg table: {ICEBERG_NAMESPACE}.{ICEBERG_TABLE}")
        except Exception:
            # Create the table with the schema
            schema = get_delivery_table_schema()
            table = catalog.create_table(f'{ICEBERG_NAMESPACE}.{ICEBERG_TABLE}', schema=schema)
            logger.info(f"Created new Iceberg table: {ICEBERG_NAMESPACE}.{ICEBERG_TABLE}")
        
        return table
    except Exception as e:
        logger.error(f"Error initializing Iceberg table: {e}")
        raise 
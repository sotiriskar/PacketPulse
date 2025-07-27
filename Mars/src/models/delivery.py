from __future__ import annotations
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass, field
import enum, math, time, datetime, uuid, random
from src.config.routes import AVAILABLE_ROUTES, get_route_name

def get_random_route() -> List[Tuple[float, float]]:
    """Randomly select one of the available routes"""
    return random.choice(AVAILABLE_ROUTES)

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    φ1, φ2 = map(math.radians, (lat1, lat2))
    dφ     = math.radians(lat2 - lat1)
    dλ     = math.radians(lon2 - lon1)
    a = math.sin(dφ/2)**2 + math.cos(φ1)*math.cos(φ2)*math.sin(dλ/2)**2
    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1-a))

class DeliveryStatus(str, enum.Enum):
    STARTED   = "started"
    EN_ROUTE  = "en_route"
    COMPLETED = "completed"

@dataclass
class PacketDelivery:
    device_id:    str
    vehicle_id:   str
    order_id:     str
    # ---------- overridable configuration ----------
    speed_kmh:    float = 3250.0  # 1000 ~ 20 km/h
    time_factor:  float = 1.0
    waypoints:    Optional[List[Tuple[float, float]]] = None
    # -------------------------------------------------
    session_id:   str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # internal fields initialised later
    _seg: int = field(init=False, default=0)
    _dist_in_seg: float = field(init=False, default=0.0)
    _seg_lens: List[float] = field(init=False)
    _last_tick: float = field(init=False, default_factory=time.perf_counter)
    status: DeliveryStatus = field(init=False, default=DeliveryStatus.STARTED)
    
    # -------------------------------------------------
    def __post_init__(self):
        self.waypoints = self.waypoints or get_random_route()
        self.start_lat, self.start_lon = self.waypoints[0]
        self.end_lat,   self.end_lon   = self.waypoints[-1]
        self.current_lat, self.current_lon = self.start_lat, self.start_lon
        self._seg_lens = [haversine_km(*a, *b) for a, b in zip(
                          self.waypoints[:-1], self.waypoints[1:])]
        self._prev_lat, self._prev_lon = self.current_lat, self.current_lon
        
        # Determine which route was selected for logging
        self.route_name = get_route_name(self.waypoints)
    
    # -------------------------------------------------
    def update_position(self, delta_seconds: Optional[float] = None):
        if self.status is DeliveryStatus.COMPLETED:
            return
        # real‑time step unless overridden
        if delta_seconds is None:
            now = time.perf_counter()
            dt_real = now - self._last_tick
            self._last_tick = now
        else:
            dt_real = delta_seconds
        dt = dt_real * self.time_factor
        if dt <= 0: return
        km_to_go = self.speed_kmh * dt / 3600.0
        
        while km_to_go > 0 and self._seg < len(self._seg_lens):
            seg_len   = self._seg_lens[self._seg]
            remain    = seg_len - self._dist_in_seg
            if km_to_go >= remain:       # jump to next waypoint
                self._seg += 1
                self._dist_in_seg = 0.0
                self.current_lat, self.current_lon = self.waypoints[self._seg]
                km_to_go -= remain
            else:                         # stay within current leg
                self._dist_in_seg += km_to_go
                frac = self._dist_in_seg / seg_len
                lat1, lon1 = self.waypoints[self._seg]
                lat2, lon2 = self.waypoints[self._seg + 1]
                self.current_lat = lat1 + (lat2 - lat1) * frac
                self.current_lon = lon1 + (lon2 - lon1) * frac
                km_to_go = 0.0
        
        if self._seg >= len(self._seg_lens):
            self.status = DeliveryStatus.COMPLETED
        elif self.status is DeliveryStatus.STARTED:
            self.status = DeliveryStatus.EN_ROUTE
        
        self._prev_lat, self._prev_lon = self.current_lat, self.current_lon
    
    # -------------------------------------------------
    def is_completed(self) -> bool:
        return self.status is DeliveryStatus.COMPLETED
    
    # -------------------------------------------------
    def to_dict(self) -> Dict[str, Any]:
        return {
            "device_id": self.device_id,
            "vehicle_id": self.vehicle_id,
            "session_id": self.session_id,
            "order_id":   self.order_id,
            "status":     self.status,
            "timestamp":  datetime.datetime.utcnow().isoformat(),
            "start_lat":  self.start_lat,
            "start_lon":  self.start_lon,
            "end_lat":    self.end_lat,
            "end_lon":    self.end_lon,
            "current_lat": self.current_lat,
            "current_lon": self.current_lon,
            "route_name": self.route_name,
            "waypoint_count": len(self.waypoints)
        }

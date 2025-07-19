# PacketPulse

PacketPulse is a system for simulating and tracking packet deliveries in real-time. It consists of two independent components:

1. **Mars** - Packet Delivery Simulator: Simulates multiple devices delivering packets from point A to point B
2. **Venus** - Packet Tracking API: Receives delivery data via WebSocket and stores it in CSV files

## Component Documentation

Each component has its own documentation and requirements:

- [Mars Documentation](Mars/README.md)
- [Venus Documentation](Venus/README.md)

## Quick Start

1. Install Mars dependencies:
```bash
cd Mars
pip install -r requirements.txt
```

2. Install Venus dependencies:
```bash
cd Venus
pip install -r requirements.txt
```

3. Start Venus API:
```bash
python -m Venus.api
```

4. In a separate terminal, start Mars simulator:
```bash
python -m Mars.simulator
```

## System Architecture

Mars and Venus communicate via WebSocket, with Mars sending packet delivery data to Venus. Venus validates and stores this data in CSV format.

```
┌─────┐   WebSocket    ┌─────┐
│Mars │ ──────────────>│Venus│
└─────┘   JSON Data    └─────┘
                          │
                          ▼
                        CSV Files
```

## License

MIT 
# OCPP Simulator

This is a browser-based simulator for testing OCPP 1.6 charge point communication. You can connect to any OCPP 1.6 central system via WebSocket and send standard charge point messages directly from the UI.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running with Docker

```bash
docker build -t ocpp-simulator .
docker run -p 3000:3000 ocpp-simulator
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration file format

```json
{
  "url": "wss://your-ocpp-server.example.com/ocpp/CP001",
  "settings": {
    "autoReplyBootNotification": false
  }
}
```

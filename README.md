# OCPP Simulator

This is a browser-based simulator for testing OCPP 1.6 charge point communication. You can connect to any OCPP 1.6 central system via WebSocket and send standard charge point messages directly from the UI. I use it mainly to debug my OCPP server simulating various messages type from a chargepoint. It uses OCPP schemas from [ocpp-messages](https://github.com/embyt/ocpp-messages).

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running with Docker

```bash
npm run docker:build
npm run docker:run
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

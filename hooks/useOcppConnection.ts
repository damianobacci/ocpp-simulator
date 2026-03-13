"use client";

import { useState, useRef, useCallback } from "react";

export type LogEntry = {
  id: number;
  timestamp: string;
  direction: "in" | "out" | "system";
  message: string;
};

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

let logIdCounter = 0;

function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

export function useOcppConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = useCallback((direction: LogEntry["direction"], message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: logIdCounter++, timestamp: timestamp(), direction, message },
    ]);
  }, []);

  const connect = useCallback((url: string) => {
    if (wsRef.current) return;

    setStatus("connecting");
    addLog("system", `Connecting to ${url} ...`);

    let ws: WebSocket;
    try {
      ws = new WebSocket(url, ["ocpp1.6"]);
    } catch (e) {
      addLog("system", `Invalid URL: ${e}`);
      setStatus("error");
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      addLog("system", "Connected (OCPP 1.6)");
    };

    ws.onmessage = (event) => {
      addLog("in", event.data);
    };

    ws.onerror = () => {
      addLog("system", "WebSocket error");
      setStatus("error");
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      setStatus("disconnected");
      addLog(
        "system",
        `Disconnected (code ${event.code}${event.reason ? ` — ${event.reason}` : ""})`
      );
    };
  }, [addLog]);

  const disconnect = useCallback(() => {
    wsRef.current?.close(1000, "User disconnected");
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { status, logs, connect, disconnect, clearLogs };
}

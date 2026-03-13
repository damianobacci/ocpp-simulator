"use client";

import { useState, useRef, useCallback } from "react";

export type LogEntry = {
  id: number;
  timestamp: string;
  direction: "in" | "out" | "system";
  message: string;
};

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type BootReplyConfig = {
  enabled: boolean;
  chargePointVendor: string;
  chargePointModel: string;
  chargePointSerialNumber: string;
};

let logIdCounter = 0;

function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

function randomId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => chars[b % chars.length])
    .join("");
}

export function useOcppConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const bootReplyRef = useRef<BootReplyConfig>({ enabled: false, chargePointVendor: "", chargePointModel: "", chargePointSerialNumber: "" });

  const setBootReplyConfig = useCallback((config: BootReplyConfig) => {
    bootReplyRef.current = config;
  }, []);

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
      const cfg = bootReplyRef.current;
      if (cfg.enabled) {
        const message = JSON.stringify([
          2,
          randomId(),
          "BootNotification",
          {
            chargePointVendor: cfg.chargePointVendor,
            chargePointModel: cfg.chargePointModel,
            chargePointSerialNumber: cfg.chargePointSerialNumber,
          },
        ]);
        ws.send(message);
        addLog("out", message);
      }
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

  const send = useCallback((action: string, payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const message = JSON.stringify([2, randomId(), action, payload]);
    ws.send(message);
    addLog("out", message);
  }, [addLog]);

  return { status, logs, connect, disconnect, clearLogs, send, setBootReplyConfig };
}

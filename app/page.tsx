"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useOcppConnection } from "@/hooks/useOcppConnection";
import { StatusBadge } from "@/components/StatusBadge";
import { LogLine } from "@/components/LogLine";

export default function Home() {
  const [url, setUrl] = useState("ws://");
  const { status, logs, connect, disconnect, clearLogs } = useOcppConnection();
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <span className="font-semibold text-sm shrink-0 text-foreground">
          OCPP Simulator
        </span>

        <Separator orientation="vertical" className="h-5" />

        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isConnected && !isConnecting) connect(url);
          }}
          placeholder="ws://localhost:9000/ocpp/CP001"
          disabled={isConnected || isConnecting}
          className="font-mono text-sm flex-1 max-w-lg"
        />

        <div className="flex items-center gap-2 ml-auto">
          <StatusBadge status={status} />

          {isConnected || isConnecting ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={disconnect}
              disabled={isConnecting}
            >
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={() => connect(url)} disabled={isConnecting}>
              Connect
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear
          </Button>
        </div>
      </header>

      {/* Log area */}
      <ScrollArea className="flex-1 p-0">
        <div className="font-mono text-xs p-4 space-y-1">
          {logs.length === 0 && (
            <p className="text-muted-foreground select-none">
              {isConnected
                ? "Waiting for logs…"
                : "No messages yet. Connect to a server to start logging."}
            </p>
          )}
          {logs.map((entry) => (
            <LogLine key={entry.id} entry={entry} />
          ))}
          <div ref={scrollBottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

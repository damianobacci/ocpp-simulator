"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Save, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useOcppConnection } from "@/hooks/useOcppConnection";
import { StatusBadge } from "@/components/StatusBadge";
import { LogLine } from "@/components/LogLine";
import { MessagePanel } from "@/components/MessagePanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "ocpp-simulator-config";

type SimulatorConfig = {
  url: string;
  settings: {
    autoReplyBootNotification: boolean;
  };
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [autoReplyBootNotification, setAutoReplyBootNotification] = useState(false);
  const { status, logs, connect, disconnect, clearLogs, send } = useOcppConnection();
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const buildConfig = useCallback((): SimulatorConfig => ({
    url,
    settings: { autoReplyBootNotification },
  }), [url, autoReplyBootNotification]);

  const applyConfig = useCallback((config: SimulatorConfig) => {
    if (typeof config.url === "string") setUrl(config.url);
    if (typeof config.settings?.autoReplyBootNotification === "boolean")
      setAutoReplyBootNotification(config.settings.autoReplyBootNotification);
  }, []);

  const saveConfig = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildConfig()));
    toast.success("Configuration saved.");
  }, [buildConfig]);

  const downloadConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(buildConfig(), null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "ocpp-simulator-config.json";
    a.click();
    URL.revokeObjectURL(href);
    toast.success("Configuration downloaded.");
  }, [buildConfig]);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        applyConfig(JSON.parse(ev.target?.result as string));
        toast.success("Configuration imported.");
      } catch {
        toast.error("Invalid configuration file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [applyConfig]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { applyConfig(JSON.parse(stored)); } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <span className="font-semibold text-sm shrink-0 text-foreground">
          OCPP Simulator
        </span>

        <Separator orientation="vertical" className="h-5" />

        {/* Connection area */}
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

        <Button variant="outline"  onClick={clearLogs} title="Clear logs">
          <Trash2 /> Clear
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Separator orientation="vertical" className="h-5 mr-2" />
          <span className="text-xs text-muted-foreground mr-1">Configuration</span>
          <Button variant="ghost" size="icon" onClick={saveConfig} title="Save config">
            <Save />
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadConfig} title="Download config">
            <Download />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => importInputRef.current?.click()} title="Import config">
            <Upload />
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
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

        {/* Right panel */}
        <aside className="w-[30%] border-l bg-card flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-3 p-4 border-b">
            <p className="text-sm font-semibold">Settings</p>
            <div className="flex items-center gap-2">
              <Switch
                id="auto-reply-boot"
                checked={autoReplyBootNotification}
                onCheckedChange={setAutoReplyBootNotification}
              />
              <Label htmlFor="auto-reply-boot" className="text-sm cursor-pointer">
                Always reply to BootNotification with this mock data
              </Label>
            </div>
          </div>
          <div className="p-4 border-b">
            <p className="text-sm font-semibold">Send Message</p>
          </div>
          <MessagePanel disabled={!isConnected} onSend={send} />
        </aside>
      </div>
    </div>
  );
}

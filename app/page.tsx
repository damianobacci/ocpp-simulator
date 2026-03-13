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


type SimulatorConfig = {
  url: string;
  settings: {
    autoReplyBootNotification: boolean;
    bootChargePointVendor: string;
    bootChargePointModel: string;
    bootChargePointSerialNumber: string;
  };
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [autoReplyBootNotification, setAutoReplyBootNotification] = useState(false);
  const [bootChargePointVendor, setBootChargePointVendor] = useState("");
  const [bootChargePointModel, setBootChargePointModel] = useState("");
  const [bootChargePointSerialNumber, setBootChargePointSerialNumber] = useState("");
  const { status, logs, connect, disconnect, clearLogs, send, setBootReplyConfig } = useOcppConnection();

  useEffect(() => {
    setBootReplyConfig({
      enabled: autoReplyBootNotification,
      chargePointVendor: bootChargePointVendor,
      chargePointModel: bootChargePointModel,
      chargePointSerialNumber: bootChargePointSerialNumber,
    });
  }, [autoReplyBootNotification, bootChargePointVendor, bootChargePointModel, bootChargePointSerialNumber, setBootReplyConfig]);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const buildConfig = useCallback((): SimulatorConfig => ({
    url,
    settings: { autoReplyBootNotification, bootChargePointVendor, bootChargePointModel, bootChargePointSerialNumber },
  }), [url, autoReplyBootNotification, bootChargePointVendor, bootChargePointModel, bootChargePointSerialNumber]);

  const applyConfig = useCallback((config: SimulatorConfig) => {
    if (typeof config.url === "string") setUrl(config.url);
    if (typeof config.settings?.autoReplyBootNotification === "boolean")
      setAutoReplyBootNotification(config.settings.autoReplyBootNotification);
    if (typeof config.settings?.bootChargePointVendor === "string")
      setBootChargePointVendor(config.settings.bootChargePointVendor);
    if (typeof config.settings?.bootChargePointModel === "string")
      setBootChargePointModel(config.settings.bootChargePointModel);
    if (typeof config.settings?.bootChargePointSerialNumber === "string")
      setBootChargePointSerialNumber(config.settings.bootChargePointSerialNumber);
  }, []);

  const saveConfig = useCallback(async () => {
    const config = buildConfig();
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuration saved.");
    } catch {
      toast.error("Failed to save configuration.");
    }
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

  // Load config from server on mount
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => { if (data) applyConfig(data); })
      .catch(() => { /* ignore */ });
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
          <Trash2 /> Clear Logs
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
                Always send BootNotification with mock data
              </Label>
            </div>
            {autoReplyBootNotification && (
              <div className="flex flex-col gap-2 pl-1">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Charge Point Vendor</Label>
                  <Input
                    value={bootChargePointVendor}
                    onChange={(e) => setBootChargePointVendor(e.target.value)}
                    placeholder="e.g. ABB"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Charge Point Model</Label>
                  <Input
                    value={bootChargePointModel}
                    onChange={(e) => setBootChargePointModel(e.target.value)}
                    placeholder="e.g. Terra AC W7"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Charge Point Serial Number</Label>
                  <Input
                    value={bootChargePointSerialNumber}
                    onChange={(e) => setBootChargePointSerialNumber(e.target.value)}
                    placeholder="e.g. SN-00123456"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
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

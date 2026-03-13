import { Badge } from "@/components/ui/badge";
import type { ConnectionStatus } from "@/hooks/useOcppConnection";

const map: Record<ConnectionStatus, { label: string; className: string }> = {
  disconnected: {
    label: "Disconnected",
    className: "bg-muted text-muted-foreground border-border",
  },
  connecting: {
    label: "Connecting…",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
  },
  connected: {
    label: "Connected",
    className:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  },
  error: {
    label: "Error",
    className:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
  },
};

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const { label, className } = map[status];
  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          status === "connected"
            ? "bg-green-500"
            : status === "connecting"
            ? "bg-yellow-500 animate-pulse"
            : status === "error"
            ? "bg-red-500"
            : "bg-muted-foreground"
        }`}
      />
      {label}
    </Badge>
  );
}

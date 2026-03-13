import type { LogEntry } from "@/hooks/useOcppConnection";

const dirColor: Record<LogEntry["direction"], string> = {
  in: "text-blue-600 dark:text-blue-400",
  out: "text-emerald-600 dark:text-emerald-400",
  system: "text-muted-foreground",
};

const dirLabel: Record<LogEntry["direction"], string> = {
  in: "← IN ",
  out: "→ OUT",
  system: "  SYS",
};

export function LogLine({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex gap-2 leading-relaxed">
      <span className="text-muted-foreground shrink-0 select-none">
        {entry.timestamp}
      </span>
      <span className={`shrink-0 select-none font-semibold ${dirColor[entry.direction]}`}>
        {dirLabel[entry.direction]}
      </span>
      <span className="break-all whitespace-pre-wrap">{entry.message}</span>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHARGE_POINT_MESSAGES, type FieldDef } from "@/lib/ocppMessages";
import type { ChargePointAction } from "ocpp-messages/v1.6";

type Props = {
  disabled: boolean;
  onSend: (action: string, payload: Record<string, unknown>) => void;
};

function nowIso() {
  return new Date().toISOString();
}

function buildInitialValues(fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(
    fields.map((f) => [f.key, f.autoNow ? nowIso() : ""])
  );
}

export function MessagePanel({ disabled, onSend }: Props) {
  const [action, setAction] = useState<ChargePointAction>("Heartbeat");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const messageDef = CHARGE_POINT_MESSAGES.find((m) => m.action === action)!;

  const handleActionChange = useCallback((next: string | null) => {
    if (!next) return;
    const def = CHARGE_POINT_MESSAGES.find((m) => m.action === next)!;
    setAction(next as ChargePointAction);
    setValues(buildInitialValues(def.fields));
    setErrors({});
  }, []);

  const handleSend = useCallback(() => {
    const newErrors: Record<string, string> = {};

    for (const field of messageDef.fields) {
      const raw = (values[field.key] ?? "").trim();
      if (field.required && raw === "") {
        newErrors[field.key] = "Required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: Record<string, unknown> = {};
    for (const field of messageDef.fields) {
      const raw = (values[field.key] ?? "").trim();
      if (raw === "") continue;

      if (field.type === "integer") {
        payload[field.key] = parseInt(raw, 10);
      } else if (field.type === "json") {
        try {
          payload[field.key] = JSON.parse(raw);
        } catch {
          setErrors((prev) => ({ ...prev, [field.key]: "Invalid JSON" }));
          return;
        }
      } else {
        payload[field.key] = raw;
      }
    }

    onSend(action, payload);
    setErrors({});
  }, [action, messageDef, values, onSend]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Action selector */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Action</Label>
        <Select value={action} onValueChange={handleActionChange} disabled={disabled}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {CHARGE_POINT_MESSAGES.map((m) => (
              <SelectItem key={m.action} value={m.action}>
                {m.action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fields */}
      {messageDef.fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No payload required.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {messageDef.fields.map((field) => (
            <div key={field.key} className={field.type === "json" ? "col-span-2" : ""}>
              <FieldInput
                field={field}
                value={values[field.key] ?? ""}
                error={errors[field.key]}
                onChange={(v) => {
                  setValues((prev) => ({ ...prev, [field.key]: v }));
                  setErrors((prev) => ({ ...prev, [field.key]: "" }));
                }}
              />
            </div>
          ))}
        </div>
      )}

      <Button size="sm" onClick={handleSend} disabled={disabled} className="mt-1">
        Send
      </Button>
    </div>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const label = (
    <Label className="text-xs text-muted-foreground">
      {field.label}
      {field.required && <span className="ml-0.5 text-destructive">*</span>}
    </Label>
  );

  let input: React.ReactNode;

  if (field.type === "enum" && field.options) {
    input = (
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="w-full text-sm">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (field.type === "json") {
    input = (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="[]"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y outline-none focus:ring-2 focus:ring-ring/50"
      />
    );
  } else {
    input = (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={field.type === "integer" ? "number" : "text"}
        placeholder={field.autoNow ? "ISO 8601 timestamp" : ""}
        className="text-sm"
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label}
      {input}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

import type { ChargePointAction } from "ocpp-messages/v1.6";

import AuthorizeSchema from "ocpp-messages/schema/v1.6/Authorize.json";
import BootNotificationSchema from "ocpp-messages/schema/v1.6/BootNotification.json";
import DataTransferSchema from "ocpp-messages/schema/v1.6/DataTransfer.json";
import DiagnosticsStatusNotificationSchema from "ocpp-messages/schema/v1.6/DiagnosticsStatusNotification.json";
import FirmwareStatusNotificationSchema from "ocpp-messages/schema/v1.6/FirmwareStatusNotification.json";
import HeartbeatSchema from "ocpp-messages/schema/v1.6/Heartbeat.json";
import MeterValuesSchema from "ocpp-messages/schema/v1.6/MeterValues.json";
import StartTransactionSchema from "ocpp-messages/schema/v1.6/StartTransaction.json";
import StatusNotificationSchema from "ocpp-messages/schema/v1.6/StatusNotification.json";
import StopTransactionSchema from "ocpp-messages/schema/v1.6/StopTransaction.json";

export type FieldType = "string" | "integer" | "datetime" | "enum" | "json";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  autoNow?: boolean;
};

export type MessageDef = {
  action: ChargePointAction;
  fields: FieldDef[];
};

type JsonSchemaProperty = {
  type?: string;
  format?: string;
  enum?: string[];
};

type JsonSchema = {
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

// Fields that should be auto-populated with the current ISO timestamp
const AUTO_NOW_FIELDS = new Set(["timestamp"]);

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function propertyToFieldType(prop: JsonSchemaProperty): FieldType {
  if (prop.enum) return "enum";
  if (prop.type === "integer") return "integer";
  if (prop.type === "string" && prop.format === "date-time") return "datetime";
  if (prop.type === "array" || prop.type === "object") return "json";
  return "string";
}

function schemaToFields(schema: JsonSchema): FieldDef[] {
  const required = new Set(schema.required ?? []);
  const properties = schema.properties ?? {};

  return Object.entries(properties).map(([key, prop]) => {
    const type = propertyToFieldType(prop);
    return {
      key,
      label: toLabel(key),
      type,
      required: required.has(key),
      options: prop.enum,
      autoNow: type === "datetime" && AUTO_NOW_FIELDS.has(key),
    };
  });
}

const SCHEMA_MAP: Record<ChargePointAction, JsonSchema> = {
  Authorize: AuthorizeSchema,
  BootNotification: BootNotificationSchema,
  DataTransfer: DataTransferSchema,
  DiagnosticsStatusNotification: DiagnosticsStatusNotificationSchema,
  FirmwareStatusNotification: FirmwareStatusNotificationSchema,
  Heartbeat: HeartbeatSchema,
  MeterValues: MeterValuesSchema,
  StartTransaction: StartTransactionSchema,
  StatusNotification: StatusNotificationSchema,
  StopTransaction: StopTransactionSchema,
};

export const CHARGE_POINT_MESSAGES: MessageDef[] = (
  Object.entries(SCHEMA_MAP) as [ChargePointAction, JsonSchema][]
).map(([action, schema]) => ({
  action,
  fields: schemaToFields(schema),
}));

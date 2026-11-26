/** Barrier taxonomy shared by the report form and report filters. */

export const barrierTypes = [
  "BROKEN_FOOTPATH",
  "MISSING_RAMP",
  "BLOCKED_SIDEWALK",
  "BROKEN_ELEVATOR",
  "UNSAFE_CROSSING",
] as const;

export const otherReportTypes = [
  "ACCESSIBILITY_ISSUE",
  "INCORRECT_INFORMATION",
  "LOCATION_CLOSED",
  "MISSING_FEATURE",
  "OTHER",
] as const;

export type BarrierType = (typeof barrierTypes)[number];
export type OtherReportType = (typeof otherReportTypes)[number];
export type ReportType = BarrierType | OtherReportType;

export const barrierLabels: Record<ReportType, string> = {
  BROKEN_FOOTPATH: "Broken footpath",
  MISSING_RAMP: "Missing ramp",
  BLOCKED_SIDEWALK: "Blocked sidewalk",
  BROKEN_ELEVATOR: "Broken elevator",
  UNSAFE_CROSSING: "Unsafe crossing",
  ACCESSIBILITY_ISSUE: "Other accessibility issue",
  INCORRECT_INFORMATION: "Incorrect information",
  LOCATION_CLOSED: "Location closed",
  MISSING_FEATURE: "Missing feature",
  OTHER: "Other",
};

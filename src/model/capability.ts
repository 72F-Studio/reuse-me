export type CapabilityStatus = "available" | "missing";

export interface CapabilityReport {
  id: string;
  name: string;
  status: CapabilityStatus;
  reason: string;
}

// Represents a changed file that appears to belong to the UI surface.
// Classification is path- and naming-based only in V1.
export interface UiFile {
  path: string;
  framework: "react" | "react-native" | "unknown";
  kind: "component" | "page" | "layout" | "hook" | "unknown";
}

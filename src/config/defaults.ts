import type { AnalyzerConfig } from "../model/config";

// Default configuration used when no project config is present.
// These values intentionally target the built-in TypeScript React extractor.
export const defaultConfig: AnalyzerConfig = {
  sharedSourceDirs: [
    "src/components",
    "src/ui",
    "src/design-system",
    "src/shared",
    "src/common"
  ],
  localSourceDirs: ["src/screens", "src/pages", "src/routes", "src/views"],
  sharedDirNames: [
    "components",
    "component",
    "ui",
    "design-system",
    "designsystem",
    "design_system",
    "shared",
    "common",
    "widgets",
    "controls",
    "atoms",
    "molecules",
    "organisms",
    "theme",
    "tokens"
  ],
  localDirNames: [
    "screens",
    "screen",
    "pages",
    "page",
    "routes",
    "views",
    "features",
    "scenes",
    "activities",
    "fragments"
  ],
  ignore: [
    "**/*.test.tsx",
    "**/*.test.jsx",
    "**/*.stories.tsx",
    "**/*.stories.jsx",
    "**/__generated__/**",
    "**/generated/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**"
  ],
  warningThreshold: 0.7,
  strongWarningThreshold: 0.85,
  includeLowConfidenceNotes: false
};

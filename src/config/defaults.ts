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
    // Test code and fixtures repeat shapes and literals on purpose. Left in,
    // they dominate the findings and bury the ones about production code.
    "**/*.test.*",
    "**/*.spec.*",
    "**/test/**",
    "**/tests/**",
    "**/__tests__/**",
    "**/__fixtures__/**",
    "**/fixtures/**",
    "**/examples/**",
    // Documentation catalogues. Tutorial snippets are step-by-step variants of
    // one file and are near-identical on purpose, so they dominate findings
    // while describing nothing about the shipped code.
    "**/*.docc/**",
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

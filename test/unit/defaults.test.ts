import { describe, expect, it } from "vitest";

import { defaultConfig } from "../../src/config/defaults";

describe("defaultConfig", () => {
  it("defines shared source directories", () => {
    expect(defaultConfig.sharedSourceDirs).toEqual(
      expect.arrayContaining([
        "src/components",
        "src/ui",
        "src/design-system"
      ])
    );
  });

  it("defines local source directories", () => {
    expect(defaultConfig.localSourceDirs).toEqual(
      expect.arrayContaining(["src/screens", "src/pages", "src/routes"])
    );
  });

  it("defines ignore patterns", () => {
    expect(defaultConfig.ignore).toEqual(
      expect.arrayContaining([
        "**/*.test.tsx",
        "**/*.stories.tsx",
        "**/__generated__/**",
        "**/dist/**"
      ])
    );
  });

  it("defines warning thresholds and low confidence behavior", () => {
    expect(defaultConfig.warningThreshold).toBe(0.7);
    expect(defaultConfig.strongWarningThreshold).toBe(0.85);
    expect(defaultConfig.includeLowConfidenceNotes).toBe(false);
  });
});

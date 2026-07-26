import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { defaultConfig } from "./defaults";
import type { AnalyzerConfig } from "../model/config";

// Single supported V1 config filename.
export const CONFIG_FILENAME = "reuse-me.json";

type LegacyUserConfig = {
  sharedComponentDirs?: string[];
  screenDirs?: string[];
};

type UserConfig = Partial<AnalyzerConfig> & LegacyUserConfig;
type ConfigFieldName = keyof UserConfig;

const CONFIG_KEYS: ConfigFieldName[] = [
  "sharedSourceDirs",
  "localSourceDirs",
  "sharedDirNames",
  "localDirNames",
  "sharedComponentDirs",
  "screenDirs",
  "ignore",
  "warningThreshold",
  "strongWarningThreshold",
  "includeLowConfidenceNotes"
];

// Loads project configuration from a directory and merges it with defaults.
// Returns a complete configuration object suitable for later pipeline stages.
export function loadConfig(directory: string): AnalyzerConfig {
  const configPath = join(directory, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return { ...defaultConfig };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Invalid configuration in ${CONFIG_FILENAME}: ${message}`);
  }

  const userConfig = normalizeUserConfig(validateUserConfig(parsed));

  return {
    ...defaultConfig,
    ...userConfig
  };
}

function validateUserConfig(value: unknown): UserConfig {
  if (!isPlainObject(value)) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: expected a JSON object`
    );
  }

  const unknownKeys = Object.keys(value).filter(
    (key) => !CONFIG_KEYS.includes(key as ConfigFieldName)
  );

  if (unknownKeys.length > 0) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: unknown field(s): ${unknownKeys.join(", ")}`
    );
  }

  const config = value as Record<string, unknown>;

  assertOptionalStringArray(config.sharedSourceDirs, "sharedSourceDirs");
  assertOptionalStringArray(config.localSourceDirs, "localSourceDirs");
  assertOptionalStringArray(config.sharedDirNames, "sharedDirNames");
  assertOptionalStringArray(config.localDirNames, "localDirNames");
  assertOptionalStringArray(config.sharedComponentDirs, "sharedComponentDirs");
  assertOptionalStringArray(config.screenDirs, "screenDirs");
  assertOptionalStringArray(config.ignore, "ignore");
  assertOptionalNumber(config.warningThreshold, "warningThreshold");
  assertOptionalNumber(config.strongWarningThreshold, "strongWarningThreshold");
  assertOptionalBoolean(
    config.includeLowConfidenceNotes,
    "includeLowConfidenceNotes"
  );

  return config as UserConfig;
}

function normalizeUserConfig(config: UserConfig): Partial<AnalyzerConfig> {
  const {
    sharedComponentDirs,
    screenDirs,
    ...normalizedConfig
  } = config;
  const normalized: Partial<AnalyzerConfig> = { ...normalizedConfig };

  if (
    normalizedConfig.sharedSourceDirs !== undefined ||
    sharedComponentDirs !== undefined
  ) {
    normalized.sharedSourceDirs =
      normalizedConfig.sharedSourceDirs ?? sharedComponentDirs;
  }

  if (
    normalizedConfig.localSourceDirs !== undefined ||
    screenDirs !== undefined
  ) {
    normalized.localSourceDirs =
      normalizedConfig.localSourceDirs ?? screenDirs;
  }

  return normalized;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertOptionalStringArray(
  value: unknown,
  fieldName: ConfigFieldName
): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: "${fieldName}" must be an array of strings`
    );
  }
}

function assertOptionalNumber(
  value: unknown,
  fieldName: ConfigFieldName
): void {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: "${fieldName}" must be a number`
    );
  }
}

function assertOptionalBoolean(
  value: unknown,
  fieldName: ConfigFieldName
): void {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "boolean") {
    throw new Error(
      `Invalid configuration in ${CONFIG_FILENAME}: "${fieldName}" must be a boolean`
    );
  }
}

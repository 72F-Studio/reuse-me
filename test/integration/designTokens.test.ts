import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { KnowledgePipelineRunner } from "../../src/runner/knowledgePipelineRunner";
import { RepositoryHealthRunner } from "../../src/runner/repositoryHealthRunner";
import type { ReadyRepositoryHealthResult } from "../../src/model/repositoryHealthResult";

// A colour or a dimension looks the same in every language, which makes the
// token half of the design-system problem the most language-independent
// signal available. These tests cover both halves: a value the repository
// already names and the code wrote literally anyway, and a value repeated
// often enough that it is behaving like a token nobody declared.

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createRepo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "component-intent-audit-tokens-"));
  tempDirs.push(root);
  mkdirSync(join(root, ".git"));

  for (const [path, source] of Object.entries(files)) {
    const absolutePath = join(root, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }

  return root;
}

function health(root: string): ReadyRepositoryHealthResult {
  const construction = new KnowledgePipelineRunner().construct(root);

  if (construction.status !== "ready") {
    throw new Error("Expected ready repository knowledge");
  }

  const result = new RepositoryHealthRunner().run(construction.knowledge, {
    capabilities: construction.capabilities,
    repositoryStructure: construction.repositoryStructure
  });

  if (result.status !== "ready") {
    throw new Error("Expected ready repository health result");
  }

  return result;
}

function kotlinScreen(name: string): string {
  return `package ui.screens

@Composable
fun ${name}Screen() {
    Column {
        Text(text = "${name}", color = Color(0xFF3B82F6))
        Spacer(modifier = Modifier.width(8.dp))
    }
}
`;
}

describe("design token findings", () => {
  it("reports a token that exists but was bypassed, in Kotlin", () => {
    const root = createRepo({
      "ui/theme/Theme.kt": `package ui.theme

val BrandPrimary = Color(0xFF3B82F6)
val SpacingSmall = 8.dp
`,
      "ui/screens/LoginScreen.kt": kotlinScreen("Login"),
      "ui/screens/SignupScreen.kt": kotlinScreen("Signup"),
      "ui/screens/ProfileScreen.kt": kotlinScreen("Profile")
    });

    const bypassed = health(root).untokenizedValues.filter(
      (finding) => finding.reason === "bypassed"
    );

    expect(bypassed.map((finding) => finding.value).sort()).toEqual([
      "0xff3b82f6",
      "8.dp"
    ]);
    expect(
      bypassed.find((finding) => finding.value === "0xff3b82f6")?.tokenNames
    ).toEqual(["BrandPrimary"]);
    // The file declaring the tokens must not be reported for containing them.
    expect(
      bypassed.every((finding) => !finding.sourcePaths.includes("ui/theme/Theme.kt"))
    ).toBe(true);
  });

  it("reports a repeated value with no token declaring it", () => {
    const root = createRepo({
      "ui/screens/LoginScreen.kt": kotlinScreen("Login"),
      "ui/screens/SignupScreen.kt": kotlinScreen("Signup"),
      "ui/screens/ProfileScreen.kt": kotlinScreen("Profile")
    });

    const candidates = health(root).untokenizedValues.filter(
      (finding) => finding.reason === "candidate"
    );

    expect(candidates.map((finding) => finding.value).sort()).toEqual([
      "0xff3b82f6",
      "8.dp"
    ]);
  });

  it("reads CSS custom properties as token declarations", () => {
    const root = createRepo({
      "src/styles/variables.css": `:root {
  --brand-primary: #3B82F6;
}
`,
      "src/screens/Login.tsx": `export function Login() {
  return <div style={{ color: "#3B82F6" }} />;
}
`,
      "src/screens/Signup.tsx": `export function Signup() {
  return <div style={{ color: "#3B82F6" }} />;
}
`
    });

    const bypassed = health(root).untokenizedValues.filter(
      (finding) => finding.reason === "bypassed"
    );

    expect(bypassed).toHaveLength(1);
    expect(bypassed[0]).toMatchObject({
      value: "#3b82f6",
      tokenNames: ["brand-primary"]
    });
  });

  it("does not report a value used in only one place", () => {
    const root = createRepo({
      "ui/screens/LoginScreen.kt": `package ui.screens

@Composable
fun LoginScreen() {
    Text(text = "Login", color = Color(0xFF123456))
}
`,
      "ui/screens/ReportScreen.kt": `package ui.screens

@Composable
fun ReportScreen() {
    LazyColumn { Chart(data = emptyList()) }
}
`
    });

    expect(health(root).untokenizedValues).toEqual([]);
  });
});

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { KnowledgePipelineRunner } from "../../src/runner/knowledgePipelineRunner";
import { RepositoryHealthRunner } from "../../src/runner/repositoryHealthRunner";
import type { ReadyRepositoryHealthResult } from "../../src/model/repositoryHealthResult";

// The product claim is that component drift is a shape problem, not a syntax
// problem: the same duplication should surface in any language without a
// per-language plugin. These fixtures are the evidence for that claim.
//
// Every case is the same story — a shared component exists, and local screens
// re-implement it inline instead of importing it — spelled in a different
// ecosystem. None of these languages has a dedicated provider; all of them go
// through the generic declaration backend.

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function writeFixture(root: string, path: string, source: string): void {
  const absolutePath = join(root, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source);
}

function createRepo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "reuse-me-polyglot-"));
  tempDirs.push(root);
  mkdirSync(join(root, ".git"));

  for (const [path, source] of Object.entries(files)) {
    writeFixture(root, path, source);
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
        Button(onClick = {}) {
            Text(text = "${name}", color = Color(0xFF3B82F6))
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}
`;
}

function swiftScreen(name: string): string {
  return `import SwiftUI

struct ${name}View: View {
    var body: some View {
        ScrollView {
            VStack {
                Text("${name}").foregroundColor(Color(hex: "#3B82F6"))
                Divider()
            }
            .padding(16)
        }
    }
}
`;
}

function dartScreen(name: string): string {
  return `import 'package:flutter/material.dart';

class ${name}Page extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: EdgeInsets.all(16),
        child: Text('${name}', style: TextStyle(color: Color(0xFF3B82F6))),
      ),
    );
  }
}
`;
}

describe("cross-language drift detection", () => {
  it("reports a competing implementation in Kotlin Compose", () => {
    const root = createRepo({
      "ui/components/PrimaryButton.kt": `package ui.components

@Composable
fun PrimaryButton(label: String) {
    Button(onClick = {}) {
        Text(text = label, color = Color(0xFF3B82F6))
        Spacer(modifier = Modifier.width(8.dp))
    }
}
`,
      "ui/screens/LoginScreen.kt": kotlinScreen("Login"),
      "ui/screens/SignupScreen.kt": kotlinScreen("Signup"),
      "ui/screens/ProfileScreen.kt": kotlinScreen("Profile")
    });

    const result = health(root);

    expect(result.competingImplementations).toHaveLength(1);
    expect(result.competingImplementations[0]).toMatchObject({
      candidatePath: "ui/components/PrimaryButton.kt",
      candidateName: "PrimaryButton",
      sourcePaths: [
        "ui/screens/LoginScreen.kt",
        "ui/screens/ProfileScreen.kt",
        "ui/screens/SignupScreen.kt"
      ]
    });
  });

  it("reports a competing implementation in SwiftUI", () => {
    const root = createRepo({
      "Sources/DesignSystem/CardView.swift": `import SwiftUI

struct CardView: View {
    var body: some View {
        VStack {
            Text("title").foregroundColor(Color(hex: "#3B82F6"))
            Divider()
        }
        .padding(16)
    }
}
`,
      "Sources/Screens/HomeView.swift": swiftScreen("Home"),
      "Sources/Screens/SettingsView.swift": swiftScreen("Settings"),
      "Sources/Screens/DetailView.swift": swiftScreen("Detail")
    });

    const result = health(root);

    expect(result.competingImplementations).toHaveLength(1);
    expect(result.competingImplementations[0]).toMatchObject({
      candidatePath: "Sources/DesignSystem/CardView.swift",
      candidateName: "CardView"
    });
  });

  it("reports repeated shape in Flutter widgets", () => {
    const root = createRepo({
      "lib/widgets/BrandCard.dart": `import 'package:flutter/material.dart';

class BrandCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Text('card', style: TextStyle(color: Color(0xFF3B82F6))),
    );
  }
}
`,
      "lib/screens/HomePage.dart": dartScreen("Home"),
      "lib/screens/CartPage.dart": dartScreen("Cart"),
      "lib/screens/OrderPage.dart": dartScreen("Order")
    });

    const result = health(root);

    expect(
      result.competingImplementations.length + result.missingAbstractions.length
    ).toBeGreaterThan(0);
  });

  it("keeps unrelated local files out of the same pattern", () => {
    const root = createRepo({
      "ui/components/PrimaryButton.kt": `package ui.components

@Composable
fun PrimaryButton(label: String) {
    Button(onClick = {}) {
        Text(text = label, color = Color(0xFF3B82F6))
        Spacer(modifier = Modifier.width(8.dp))
    }
}
`,
      "ui/screens/LoginScreen.kt": kotlinScreen("Login"),
      "ui/screens/SignupScreen.kt": kotlinScreen("Signup"),
      // Nothing to do with the button: a different shape entirely.
      "ui/screens/ReportScreen.kt": `package ui.screens

@Composable
fun ReportScreen() {
    LazyColumn {
        Chart(data = emptyList())
        Legend()
    }
}
`
    });

    const result = health(root);

    expect(result.competingImplementations).toHaveLength(1);
    expect(result.competingImplementations[0]?.sourcePaths).toEqual([
      "ui/screens/LoginScreen.kt",
      "ui/screens/SignupScreen.kt"
    ]);
  });

  it("stays quiet on a repository with no repeated shape", () => {
    const root = createRepo({
      "ui/components/PrimaryButton.kt": `package ui.components

@Composable
fun PrimaryButton(label: String) {
    Button(onClick = {}) { Text(text = label) }
}
`,
      "ui/screens/LoginScreen.kt": `package ui.screens

@Composable
fun LoginScreen() {
    PrimaryButton(label = "Sign in")
}
`,
      "ui/screens/ReportScreen.kt": `package ui.screens

@Composable
fun ReportScreen() {
    LazyColumn { Chart(data = emptyList()) }
}
`
    });

    const result = health(root);

    expect(result.competingImplementations).toEqual([]);
    expect(result.missingAbstractions).toEqual([]);
  });
});

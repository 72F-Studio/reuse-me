import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { CheckRunner } from "../../src/runner/checkRunner";
import { InventoryRunner } from "../../src/runner/inventoryRunner";
import { KnowledgePipelineRunner } from "../../src/runner/knowledgePipelineRunner";
import type { RepositoryKnowledge } from "../../src/model/repositoryKnowledge";

// The preventive half. Auditing answers "what went wrong"; these two modes
// answer "what already exists" before code is written, and "does what you
// just wrote duplicate it" immediately after.

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createRepo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "reuse-me-prevent-"));
  tempDirs.push(root);
  mkdirSync(join(root, ".git"));

  for (const [path, source] of Object.entries(files)) {
    const absolutePath = join(root, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }

  return root;
}

function knowledgeFor(root: string): RepositoryKnowledge {
  const construction = new KnowledgePipelineRunner().construct(root);

  if (construction.status !== "ready") {
    throw new Error("Expected ready repository knowledge");
  }

  return construction.knowledge;
}

const REACT_REPO = {
  "src/components/Button.tsx": `export function Button({ label }: { label: string }) {
  return <button className="btn btn-primary rounded px-4 py-2">{label}</button>;
}
`,
  "src/screens/Login.tsx": `export function Login() {
  return (
    <div className="card p-4">
      <button className="btn btn-primary rounded px-4 py-2">Sign in</button>
    </div>
  );
}
`,
  "src/styles/variables.css": `:root {
  --brand-primary: #3B82F6;
}
`
};

describe("inventory mode", () => {
  it("lists shared components and design tokens", () => {
    const result = new InventoryRunner().run(knowledgeFor(createRepo(REACT_REPO)));

    expect(result.components).toEqual([
      { path: "src/components/Button.tsx", name: "Button", referenceCount: 0 }
    ]);
    expect(result.tokens).toEqual([
      {
        name: "brand-primary",
        value: "#3b82f6",
        sourcePath: "src/styles/variables.css"
      }
    ]);
  });

  it("ranks by reference count and caps the list, but reports the real total", () => {
    // The inventory is injected into a coding agent's context before every
    // write, so an unbounded list is not a cosmetic problem: on a real
    // repository it ran to thousands of entries.
    const files: Record<string, string> = {};

    for (let index = 0; index < 60; index += 1) {
      files[`src/components/Widget${index}.tsx`] =
        `export function Widget${index}() {\n  return <div />;\n}\n`;
    }

    files["src/components/Hub.tsx"] = `export function Hub() {
  return <div />;
}
`;
    files["src/screens/Home.tsx"] = `import { Hub } from "../components/Hub";

export function Home() {
  return <Hub />;
}
`;

    const result = new InventoryRunner().run(knowledgeFor(createRepo(files)));

    expect(result.components).toHaveLength(40);
    expect(result.metadata.componentCount).toBe(61);
    expect(result.components[0]?.name).toBe("Hub");
  });

  it("does not list a file's private helpers as reusable components", () => {
    const result = new InventoryRunner().run(
      knowledgeFor(
        createRepo({
          "src/components/Button.tsx": `function classes() {
  return "btn";
}

export function Button() {
  return <button className={classes()} />;
}
`
        })
      )
    );

    expect(result.components.map((component) => component.name)).toEqual([
      "Button"
    ]);
  });

  it("does not list local screens as reusable components", () => {
    const result = new InventoryRunner().run(knowledgeFor(createRepo(REACT_REPO)));

    expect(
      result.components.some((component) =>
        component.path.startsWith("src/screens/")
      )
    ).toBe(false);
  });
});

describe("check mode", () => {
  it("flags a single file that re-implements a shared component", () => {
    // Change analysis needs two files repeating each other before it says
    // anything. An agent writes one file at a time, so this is the case that
    // actually matters for prevention.
    const result = new CheckRunner().run(knowledgeFor(createRepo(REACT_REPO)), [
      "src/screens/Login.tsx"
    ]);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      changedFiles: ["src/screens/Login.tsx"],
      candidatePath: "src/components/Button.tsx",
      candidateName: "Button"
    });
  });

  it("does not flag a shared component for looking like itself", () => {
    const result = new CheckRunner().run(knowledgeFor(createRepo(REACT_REPO)), [
      "src/components/Button.tsx"
    ]);

    expect(result.warnings).toEqual([]);
  });

  it("flags a single Kotlin file with no Kotlin-specific support", () => {
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
      "ui/screens/LoginScreen.kt": `package ui.screens

@Composable
fun LoginScreen() {
    Column {
        Button(onClick = {}) {
            Text(text = "Login", color = Color(0xFF3B82F6))
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}
`
    });

    const result = new CheckRunner().run(knowledgeFor(root), [
      "ui/screens/LoginScreen.kt"
    ]);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.candidatePath).toBe(
      "ui/components/PrimaryButton.kt"
    );
  });

  it("stays silent when the file correctly reuses the component", () => {
    const root = createRepo({
      "src/components/Button.tsx": REACT_REPO["src/components/Button.tsx"],
      "src/screens/Login.tsx": `import { Button } from "../components/Button";

export function Login() {
  return <Button label="Sign in" />;
}
`
    });

    expect(
      new CheckRunner().run(knowledgeFor(root), ["src/screens/Login.tsx"])
        .warnings
    ).toEqual([]);
  });

  it("ignores paths the analyzer has no facts for", () => {
    const result = new CheckRunner().run(knowledgeFor(createRepo(REACT_REPO)), [
      "src/screens/DoesNotExist.tsx"
    ]);

    expect(result.warnings).toEqual([]);
  });
});

import type { ChangedFile } from "../../model/diff";
import type { UiFile } from "./uiFile";

// Classifies changed files into UI-oriented domain objects using file paths only.
// This stage does not inspect file contents or make architectural judgments.
export class UiFileClassifier {
  classifyFiles(changedFiles: ChangedFile[]): UiFile[] {
    return changedFiles
      .map((changedFile) => this.classifyFile(changedFile))
      .filter((uiFile): uiFile is UiFile => uiFile !== null);
  }

  classifyFile(changedFile: ChangedFile): UiFile | null {
    const normalizedPath = changedFile.path.replaceAll("\\", "/");
    const fileName = normalizedPath.split("/").pop() ?? normalizedPath;
    const lowerPath = normalizedPath.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    if (!isUiCandidate(lowerPath, lowerFileName)) {
      return null;
    }

    return {
      path: changedFile.path,
      framework: classifyFramework(lowerPath, lowerFileName),
      kind: classifyKind(normalizedPath, fileName, lowerPath, lowerFileName)
    };
  }
}

function isUiCandidate(lowerPath: string, lowerFileName: string): boolean {
  if (
    lowerFileName.endsWith(".tsx") ||
    lowerFileName.endsWith(".jsx") ||
    lowerFileName.endsWith(".native.tsx") ||
    lowerFileName.endsWith(".native.jsx")
  ) {
    return true;
  }

  if (
    (lowerFileName.endsWith(".ts") || lowerFileName.endsWith(".js")) &&
    (lowerFileName.startsWith("use") || lowerPath.includes("/hooks/"))
  ) {
    return true;
  }

  return false;
}

function classifyFramework(
  lowerPath: string,
  lowerFileName: string
): UiFile["framework"] {
  if (
    lowerFileName.endsWith(".native.tsx") ||
    lowerFileName.endsWith(".native.jsx") ||
    lowerPath.includes("react-native") ||
    lowerPath.includes("/native/")
  ) {
    return "react-native";
  }

  if (
    lowerFileName.endsWith(".tsx") ||
    lowerFileName.endsWith(".jsx") ||
    lowerFileName.endsWith(".ts") ||
    lowerFileName.endsWith(".js")
  ) {
    return "react";
  }

  return "unknown";
}

function classifyKind(
  path: string,
  fileName: string,
  lowerPath: string,
  lowerFileName: string
): UiFile["kind"] {
  if (lowerFileName.startsWith("use") || lowerPath.includes("/hooks/")) {
    return "hook";
  }

  if (
    lowerPath.includes("/layouts/") ||
    lowerPath.includes("/layout/") ||
    fileName.endsWith("Layout.tsx") ||
    fileName.endsWith("Layout.jsx") ||
    fileName === "layout.tsx" ||
    fileName === "layout.jsx"
  ) {
    return "layout";
  }

  if (
    lowerPath.includes("/pages/") ||
    lowerPath.includes("/page/") ||
    lowerPath.includes("/screens/") ||
    lowerPath.includes("/screen/") ||
    lowerPath.includes("/routes/") ||
    lowerPath.includes("/route/") ||
    lowerPath.includes("/views/") ||
    lowerPath.includes("/view/") ||
    /(?:Page|Screen|View|Route|Panel)\.(?:tsx|jsx)$/u.test(fileName)
  ) {
    return "page";
  }

  if (
    lowerPath.includes("/components/") ||
    lowerPath.includes("/component/") ||
    lowerPath.includes("/ui/") ||
    lowerPath.includes("/shared/") ||
    lowerPath.includes("/common/")
  ) {
    return "component";
  }

  if (/^[A-Z][A-Za-z0-9]*\.(?:tsx|jsx)$/u.test(fileName)) {
    return "component";
  }

  return "unknown";
}

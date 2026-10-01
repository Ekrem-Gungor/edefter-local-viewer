import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const outputDirectory = resolve(projectRoot, "dist");
const releaseFileName = "EDEFTER_GORUNTULE.html";
const releaseFilePath = resolve(outputDirectory, releaseFileName);

beforeAll(() => {
  const npmCliPath = process.env.npm_execpath;

  if (!npmCliPath) {
    throw new Error("npm CLI path could not be determined.");
  }

  execFileSync(process.execPath, [npmCliPath, "run", "build"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
});

describe("single-file production build", () => {
  it("produces only the offline release HTML", () => {
    expect(readdirSync(outputDirectory)).toEqual([releaseFileName]);
  });

  it("inlines JavaScript and CSS into the release file", () => {
    const html = readFileSync(releaseFilePath, "utf8");

    expect(html).toContain("<style>");
    expect(html).toContain('<script type="module">');
    expect(html).not.toMatch(/<script\b[^>]*\bsrc=/i);
    expect(html).not.toMatch(
      /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=)/i,
    );
    expect(html).not.toContain("./assets/");
  });

  it("contains the application and local XML processing messages", () => {
    const html = readFileSync(releaseFilePath, "utf8");

    expect(html).toContain("e-Defter Yerel Görüntüleyici");
    expect(html).toContain("Veriler cihazınızdan çıkmaz");
    expect(html).toContain("XML dosyası boş olamaz.");
    expect(html).toContain("not-performed");
  });
});

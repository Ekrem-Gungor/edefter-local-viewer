import {
  access,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "dist");
const sourceHtmlPath = resolve(outputDirectory, "index.html");
const releaseFileName = "EDEFTER_GORUNTULE.html";
const releaseHtmlPath = resolve(outputDirectory, releaseFileName);

const stylesheetPattern =
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/gi;
const scriptPattern =
  /<script\b(?=[^>]*\bsrc=["']([^"']+)["'])[^>]*><\/script>/gi;

function resolveOutputAsset(assetReference) {
  if (/^(?:[a-z]+:)?\/\//i.test(assetReference)) {
    throw new Error(`Harici build kaynağı gömülemez: ${assetReference}`);
  }

  const normalizedReference = assetReference.replace(/^\.\//, "");
  const assetPath = resolve(outputDirectory, normalizedReference);
  const relativeAssetPath = relative(outputDirectory, assetPath);

  if (relativeAssetPath.startsWith("..") || isAbsolute(relativeAssetPath)) {
    throw new Error(`Build kaynağı dist dizininin dışında: ${assetReference}`);
  }

  return assetPath;
}

async function replaceMatches(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)];

  if (matches.length === 0) {
    return source;
  }

  let cursor = 0;
  let result = "";

  for (const match of matches) {
    result += source.slice(cursor, match.index);
    result += await replacer(match);
    cursor = match.index + match[0].length;
  }

  return result + source.slice(cursor);
}

async function inlineStyles(html) {
  return replaceMatches(html, stylesheetPattern, async (match) => {
    const css = await readFile(resolveOutputAsset(match[1]), "utf8");
    return `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`;
  });
}

async function inlineScripts(html) {
  return replaceMatches(html, scriptPattern, async (match) => {
    const javascript = await readFile(resolveOutputAsset(match[1]), "utf8");
    return `<script type="module">${javascript.replace(/<\/script/gi, "<\\/script")}</script>`;
  });
}

function assertSelfContained(html) {
  if (/<script\b[^>]*\bsrc=["'][^"']+["']/i.test(html)) {
    throw new Error("Final HTML harici bir script kaynağı içeriyor.");
  }

  if (
    /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'][^"']+["'])/i.test(
      html,
    )
  ) {
    throw new Error("Final HTML harici bir stil kaynağı içeriyor.");
  }

  if (/\.?\/assets\//i.test(html)) {
    throw new Error("Final HTML çözümlenmemiş bir asset yolu içeriyor.");
  }
}

async function buildSingleFile() {
  await access(sourceHtmlPath);

  let html = await readFile(sourceHtmlPath, "utf8");
  html = await inlineStyles(html);
  html = await inlineScripts(html);

  assertSelfContained(html);

  await writeFile(releaseHtmlPath, html, "utf8");
  await rm(sourceHtmlPath);
  await rm(resolve(outputDirectory, "assets"), {
    force: true,
    recursive: true,
  });

  const outputFiles = await readdir(outputDirectory);

  if (outputFiles.length !== 1 || outputFiles[0] !== releaseFileName) {
    throw new Error(
      `Beklenmeyen build çıktısı: ${outputFiles.join(", ") || "boş"}`,
    );
  }

  console.log(`Tek dosyalı çıktı oluşturuldu: dist/${releaseFileName}`);
}

await buildSingleFile();

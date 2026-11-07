import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { File as NodeFile, Blob as NodeBlob } from "node:buffer";
import { JSDOM, VirtualConsole, requestInterceptor } from "jsdom";
import { syntheticLedger } from "../helpers/syntheticLedger.js";

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

// jsdom does not execute module script tags. This output has no remaining imports;
// execute it after the markup is ready, matching deferred module bootstrap timing.
// This is a DOM smoke check, not a replacement for native-browser release checks.
describe("bundled offline runtime", () => {
  it("opens XML/ZIP locally, prints all rows and preserves downloaded bytes", async () => {
    const html = readFileSync(releaseFilePath, "utf8");
    expect(html).toContain("Stuart Knightley");
    expect(html).toContain("Üçüncü taraf bildirimleri");
    const errors = [],
      requests = [],
      downloads = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error) => {
      if (!error.message.includes("navigation")) errors.push(error.message);
    });
    const dom = new JSDOM(html, {
      runScripts: "outside-only",
      resources: {
        interceptors: [
          requestInterceptor((request) => {
            requests.push(request.url);
            return new Response("");
          }),
        ],
      },
      virtualConsole,
      beforeParse(window) {
        Object.assign(window, {
          TextDecoder,
          TextEncoder,
          setImmediate,
          clearImmediate,
          Blob: NodeBlob,
        });
        window.fetch = (...args) => {
          requests.push(String(args[0]));
          return Promise.reject(new Error("Unexpected network request"));
        };
        window.URL.createObjectURL = (blob) => {
          downloads.push(blob);
          return "blob:synthetic";
        };
        window.URL.revokeObjectURL = () => {};
      },
    });
    try {
      const { window } = dom,
        document = window.document;
      window.eval(document.querySelector('script[type="module"]').textContent);
      const input = document.getElementById("file-input");
      const wait = async (condition) => {
        for (let i = 0; i < 200; i++) {
          if (condition()) return;
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
        throw new Error(
          "Bundled runtime did not settle: " +
            JSON.stringify({
              errors,
              status: document.getElementById("status").textContent,
            }),
        );
      };
      const source = new TextEncoder().encode(
        "\ufeff" + syntheticLedger({ count: 61 }),
      );
      Object.defineProperty(input, "files", {
        value: [new NodeFile([source], "Y.xml")],
        configurable: true,
      });
      input.dispatchEvent(new window.Event("change"));
      await wait(
        () => document.getElementById("status").dataset.tone === "success",
      );
      expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(60);
      window.dispatchEvent(new window.Event("beforeprint"));
      expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(61);
      window.dispatchEvent(new window.Event("afterprint"));
      expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(60);
      document.getElementById("download-xml").click();
      expect(
        Array.from(new Uint8Array(await downloads[0].arrayBuffer())),
      ).toEqual(Array.from(source));
      document.getElementById("export-csv").click();
      expect((await downloads[1].text()).split("\r\n")).toHaveLength(62);
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      zip.file("folder/K.xml", syntheticLedger({ type: "ledger" }));
      zip.file("bad.xml", "<broken");
      Object.defineProperty(input, "files", {
        value: [
          new NodeFile(
            [
              await zip.generateAsync({
                type: "uint8array",
                compression: "DEFLATE",
              }),
            ],
            "books.zip",
          ),
        ],
        configurable: true,
      });
      input.dispatchEvent(new window.Event("change"));
      await wait(() => document.querySelector("#errors-list li"));
      expect(document.querySelectorAll(".file-item")).toHaveLength(2);
      expect(document.querySelectorAll("#errors-list li")).toHaveLength(1);
      expect(errors).toEqual([]);
      expect(requests).toEqual([]);
    } finally {
      dom.window.close();
    }
  });
});

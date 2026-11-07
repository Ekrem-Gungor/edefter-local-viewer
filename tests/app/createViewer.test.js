import { File as NodeFile } from "node:buffer";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createViewer } from "../../src/app/createViewer.js";
import { createDocumentStore } from "../../src/import/documentStore.js";
import { syntheticLedger } from "../helpers/syntheticLedger.js";
const page = readFileSync("index.html", "utf8");
const file = (name, options = {}) =>
  new NodeFile([syntheticLedger(options)], name);
const el = (id) => document.getElementById(id);
let app, download;
beforeEach(() => {
  document.body.innerHTML = new DOMParser().parseFromString(
    page,
    "text/html",
  ).body.innerHTML;
  download = vi.fn();
  app = createViewer({ download });
});
afterEach(() => {
  app.dispose();
  vi.restoreAllMocks();
});
describe("kullanıcı dosya akışı", () => {
  it("çoklu belgeyi listeler, seçer ve temizler", async () => {
    await app.importFiles([
      file("Y.xml"),
      file("KB.xml", { type: "ledger", kind: "berat" }),
    ]);
    expect(el("file-count").textContent).toBe("2");
    expect(app.state.selected.name).toBe("Y.xml");
    document.querySelectorAll(".file-item")[1].click();
    expect(app.state.selected.name).toBe("KB.xml");
    expect(el("stat-type").textContent).toBe("Büyük Defter Beratı");
    el("clear").click();
    expect(app.store.docs).toHaveLength(0);
    expect(el("report").classList.contains("hidden")).toBe(true);
    expect(el("clear").disabled).toBe(true);
  });
  it("arama varken bile tüm hareketleri yazdırır ve aramayı geri yükler", async () => {
    await app.importFiles([file("Y.xml", { count: 61 })]);
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(60);
    el("next-page").click();
    expect(app.state.page).toBe(1);
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(1);
    el("movement-search").value = "Deneme 61";
    el("movement-search").dispatchEvent(new Event("input"));
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(1);
    window.dispatchEvent(new Event("beforeprint"));
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(61);
    window.dispatchEvent(new Event("afterprint"));
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(1);
    expect(el("movement-search").value).toBe("Deneme 61");
  });
  it("açık ikinci sayfayı yazdırmadan sonra geri yükler", async () => {
    await app.importFiles([file("Y.xml", { count: 121 })]);
    el("next-page").click();
    vi.spyOn(window, "print").mockImplementation(() => {
      expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(121);
      window.dispatchEvent(new Event("beforeprint"));
      window.dispatchEvent(new Event("afterprint"));
    });
    el("print").click();
    expect(app.state.page).toBe(1);
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(60);
    expect(document.querySelector("#movement-rows tr td").textContent).toBe(
      "61",
    );
  });
  it("aynı adlı değişen belgeyi seçili raporda günceller", async () => {
    await app.importFiles([file("same.xml", { id: "ONE" })]);
    await app.importFiles([file("same.xml", { id: "TWO" })]);
    expect(app.store.docs).toHaveLength(1);
    expect(el("stat-id").textContent).toBe("TWO");
    expect(el("status").textContent).toContain("1 belge güncellendi");
    await app.importFiles([file("same.xml", { id: "TWO" })]);
    expect(el("status").textContent).toContain("aynı içerikteki");
  });
  it("başarısız dosya mevcut raporu silmez ve hata paneli gösterir", async () => {
    await app.importFiles([file("Y.xml")]);
    await app.importFiles([new NodeFile(["<broken"], "bad.xml")]);
    expect(app.state.selected.name).toBe("Y.xml");
    expect(el("errors-panel").classList.contains("hidden")).toBe(false);
    expect(el("status").dataset.tone).toBe("error");
  });
  it("işlem sırasında ikinci yüklemeyi ve temizlemeyi engeller", async () => {
    let release;
    const wait = new Promise((resolve) => {
      release = resolve;
    });
    const original = app.store.importFiles;
    vi.spyOn(app.store, "importFiles").mockImplementation(async (...args) => {
      await wait;
      return original(...args);
    });
    const pending = app.importFiles([file("Y.xml")]);
    expect(el("pick").disabled).toBe(true);
    expect(await app.importFiles([file("ignored.xml")])).toBeUndefined();
    app.clear();
    release();
    await pending;
    expect(app.store.docs).toHaveLength(1);
    expect(el("pick").disabled).toBe(false);
  });
  it("beklenmeyen içe aktarma hatasında da kilitleri kaldırır", async () => {
    vi.spyOn(app.store, "importFiles").mockRejectedValue(
      new Error("Unexpected"),
    );
    await expect(app.importFiles([file("Y.xml")])).rejects.toThrow(
      "Unexpected",
    );
    expect(app.state.busy).toBe(false);
    expect(el("pick").disabled).toBe(false);
  });
  it("CSV tüm belgeyi, kaynak indirmesi ise özgün baytları kullanır", async () => {
    await app.importFiles([file("Y.xml", { count: 61 })]);
    el("export-csv").click();
    expect(download).toHaveBeenLastCalledWith(
      expect.any(Blob),
      "Y-hareketler.csv",
    );
    el("download-xml").click();
    const [blob, name] = download.mock.calls[1];
    expect(name).toBe("Y.xml");
    expect(blob.size).toBe(app.state.selected.sourceBytes.byteLength);
  });
  it("kaynak XML metnini güvenli ve sınırlı gösterir", async () => {
    await app.importFiles([
      file("Y.xml", { comment: '<img id="injected" src="x">' }),
    ]);
    el("raw-xml-details").open = true;
    el("raw-xml-details").dispatchEvent(new Event("toggle"));
    expect(el("raw-xml").textContent).toContain("&lt;img");
    expect(document.getElementById("injected")).toBeNull();
  });
  it("dosya seçici ve sürükle-bırak aynı içe aktarma akışını kullanır", async () => {
    const list = [file("Y.xml")];
    Object.defineProperty(el("file-input"), "files", {
      value: list,
      configurable: true,
    });
    el("file-input").dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(app.store.docs).toHaveLength(1));
    const event = new Event("drop", { cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { files: [file("K.xml", { type: "ledger" })] },
    });
    el("drop-zone").dispatchEvent(event);
    await vi.waitFor(() => expect(app.store.docs).toHaveLength(2));
    expect(event.defaultPrevented).toBe(true);
  });
});

import { File } from "node:buffer";
import JSZip from "jszip";
import { describe, it, expect } from "vitest";
import {
  createDocumentStore,
  IMPORT_LIMITS,
  readZipEntry,
} from "../../src/import/documentStore.js";
import { syntheticLedger } from "../helpers/syntheticLedger.js";
const bytes = (value) => new TextEncoder().encode(value);
const file = (name, xml = syntheticLedger({})) => new File([xml], name);
const options = { yieldUI: async () => {} };
const archive = async (files) => {
  const zip = new JSZip();
  for (const [name, data] of Object.entries(files)) zip.file(name, data);
  return new File(
    [await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })],
    "synthetic.zip",
  );
};
describe("documentStore", () => {
  it("değişen aynı adlı dosyayı günceller, aynı içeriği atlar", () => {
    const store = createDocumentStore(),
      first = bytes(syntheticLedger({ id: "ONE" })),
      second = bytes(syntheticLedger({ id: "UPDATED" }));
    expect(store.storeBytes(first, "same.xml").action).toBe("added");
    expect(store.storeBytes(first, "same.xml").action).toBe("unchanged");
    expect(store.storeBytes(second, "same.xml").action).toBe("updated");
    expect(store.docs).toHaveLength(1);
    expect(store.docs[0].document.uniqueId).toBe("UPDATED");
    expect(store.totalBytes).toBe(second.length);
  });
  it("hatalı güncellemede önceki belgeyi ve byte hesabını korur", () => {
    const store = createDocumentStore(),
      old = store.storeBytes(bytes(syntheticLedger({})), "same.xml").document;
    expect(() => store.storeBytes(bytes("<broken"), "same.xml")).toThrow();
    expect(store.docs[0]).toBe(old);
    expect(store.totalBytes).toBe(old.sizeBytes);
  });
  it("bir toplu yüklemedeki son güncellenmiş örneği seçime döndürür", async () => {
    const store = createDocumentStore();
    const result = await store.importFiles(
      [
        file("same.xml", syntheticLedger({ id: "FIRST" })),
        file("same.xml", syntheticLedger({ id: "SECOND" })),
      ],
      options,
    );
    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.firstChanged).toBe(store.docs[0]);
    expect(result.firstChanged.document.uniqueId).toBe("SECOND");
  });
  it("ZIP içinde aynı adlı farklı klasör belgelerini ayırır ve hatalı belgeyi atlar", async () => {
    const store = createDocumentStore();
    const result = await store.importFiles(
      [
        await archive({
          "a/book.xml": syntheticLedger({}),
          "b/book.xml": syntheticLedger({ kind: "berat" }),
          "bad.xml": "<broken",
          "notes.txt": "ignored",
        }),
      ],
      options,
    );
    expect(result.added).toBe(2);
    expect(store.docs).toHaveLength(2);
    expect(store.docs[0].key).not.toBe(store.docs[1].key);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("bad.xml");
  });
  it.each([
    ["boş ZIP", {}],
    ["XML içermeyen ZIP", { "readme.txt": "x" }],
  ])("%s için anlaşılır hata verir", async (_, files) => {
    const result = await createDocumentStore().importFiles(
      [await archive(files)],
      options,
    );
    expect(result.errors[0]).toContain("XML dosyası bulunamadı");
  });
  it("bozuk ZIP ve desteklenmeyen dosyayı hata olarak raporlar", async () => {
    const result = await createDocumentStore().importFiles(
      [file("broken.zip", "invalid"), file("other.pdf")],
      options,
    );
    expect(result.errors).toHaveLength(2);
  });
  it("boyut ve toplam sınırlarını okumadan uygular", async () => {
    const store = createDocumentStore({
      limits: { ...IMPORT_LIMITS, xml: 100, totalUncompressed: 150 },
    });
    let read = false;
    const fake = {
      name: "large.xml",
      size: 101,
      arrayBuffer() {
        read = true;
        throw Error("must not read");
      },
    };
    expect((await store.importFiles([fake], options)).errors).toHaveLength(1);
    expect(read).toBe(false);
    expect(() => store.storeBytes(bytes(syntheticLedger({})), "x.xml")).toThrow(
      "boyutu",
    );
  });
  it("ZIP sıkıştırılmış boyut ve belge sayısı sınırlarını uygular", async () => {
    const store = createDocumentStore({ limits: { ...IMPORT_LIMITS, zip: 1 } });
    expect(
      (
        await store.importFiles(
          [await archive({ "a.xml": syntheticLedger({}) })],
          options,
        )
      ).errors[0],
    ).toContain("150 MiB");
    const limited = createDocumentStore({
      limits: { ...IMPORT_LIMITS, entries: 1 },
    });
    expect(
      (
        await limited.importFiles(
          [
            await archive({
              "a.xml": syntheticLedger({}),
              "b.xml": syntheticLedger({}),
            }),
          ],
          options,
        )
      ).errors[0],
    ).toContain("500");
  });
  it("toplam sınır doluyken aynı adlı belgeyi güncelleyebilir", () => {
    const source = bytes(syntheticLedger({ id: "ONE" }));
    const store = createDocumentStore({
      limits: { ...IMPORT_LIMITS, totalUncompressed: source.length },
    });
    store.storeBytes(source, "same.xml");
    expect(() => store.storeBytes(source, "other.xml")).toThrow("Toplam");
    expect(
      store.storeBytes(bytes(syntheticLedger({ id: "TWO" })), "same.xml")
        .action,
    ).toBe("updated");
  });
  it("ZIP içeriğinin gerçek açılmış boyutunu sınırlar", async () => {
    const zip = new JSZip();
    zip.file("large.xml", "x".repeat(10000));
    const loaded = await JSZip.loadAsync(
      await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }),
    );
    await expect(readZipEntry(loaded.file("large.xml"), 100)).rejects.toThrow(
      "sınırı",
    );
  });
  it("geçersiz UTF-8 ve DTD içeren XML dosyalarını reddeder", () => {
    const store = createDocumentStore();
    expect(() =>
      store.storeBytes(new Uint8Array([255, 254, 0]), "bad.xml"),
    ).toThrow("UTF-8");
    expect(() =>
      store.storeBytes(bytes("<!DOCTYPE x>" + syntheticLedger({})), "bad.xml"),
    ).toThrow("DTD");
  });
  it("BOM ve satır sonlarını özgün byte değerleriyle saklar", async () => {
    const source = bytes(
      "\ufeff" + syntheticLedger({}).replaceAll("><", ">\r\n<"),
    );
    const store = createDocumentStore();
    await store.importFiles([new File([source], "original.xml")], options);
    expect(Array.from(store.docs[0].sourceBytes)).toEqual(Array.from(source));
    expect(store.docs[0].raw.charCodeAt(0)).toBe(0xfeff);
    store.clear();
    expect(store.docs).toHaveLength(0);
    expect(store.totalBytes).toBe(0);
  });
});

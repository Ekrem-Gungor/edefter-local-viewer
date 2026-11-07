import JSZip from "jszip";
import {
  parseELedgerXml,
  DEFAULT_MAX_XML_BYTES,
} from "../xml/parseELedgerXml.js";
import { extractELedgerData } from "../parser/extractELedgerData.js";

export const IMPORT_LIMITS = Object.freeze({
  xml: DEFAULT_MAX_XML_BYTES,
  zip: 150 * 1024 * 1024,
  totalUncompressed: 300 * 1024 * 1024,
  entries: 500,
});

function decodeBytes(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    throw new Error(
      "UTF-8 olarak okunamıyor. XML karakter kodlamasını kontrol edin.",
    );
  }
}

// Limit actual decompression rather than trusting the archive's declared size.
export function readZipEntry(entry, maxBytes) {
  return new Promise((resolve, reject) => {
    const stream = entry.internalStream("uint8array"),
      chunks = [];
    let size = 0,
      failed = false;
    stream.on("data", (chunk) => {
      if (failed) return;
      size += chunk.byteLength;
      if (size > maxBytes) {
        failed = true;
        stream.pause();
        chunks.length = 0;
        reject(new Error("XML boyut / toplam veri sınırı aşıldı."));
      } else chunks.push(chunk);
    });
    stream.on("error", (error) => {
      if (!failed) {
        failed = true;
        reject(error);
      }
    });
    stream.on("end", () => {
      if (failed) return;
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      resolve(bytes);
    });
    stream.resume();
  });
}

export function createDocumentStore({ limits = IMPORT_LIMITS } = {}) {
  const docs = [];
  let totalBytes = 0;
  const keyFor = (name, origin) => JSON.stringify([origin, name]);
  const find = (name, origin) =>
    docs.find((doc) => doc.key === keyFor(name, origin));
  const availableBytes = (name, origin) =>
    limits.totalUncompressed -
    totalBytes +
    (find(name, origin)?.sizeBytes ?? 0);
  function storeBytes(bytes, name, origin = "") {
    const previous = find(name, origin);
    if (bytes.byteLength > limits.xml)
      throw new Error("XML dosya boyutu sınırı aşıldı (100 MiB).");
    if (bytes.byteLength > availableBytes(name, origin))
      throw new Error("Toplam XML veri sınırı aşıldı (300 MiB).");
    if (!previous && docs.length >= limits.entries)
      throw new Error("En fazla 500 belge yüklenebilir.");
    if (
      previous &&
      bytes.byteLength === previous.sizeBytes &&
      bytes.every((byte, index) => byte === previous.sourceBytes[index])
    )
      return { action: "unchanged", document: previous };
    const raw = decodeBytes(bytes);
    const model = extractELedgerData(
      parseELedgerXml(raw, { maxBytes: limits.xml }).document,
    );
    const document = {
      ...model,
      key: keyFor(name, origin),
      name,
      origin,
      raw,
      sourceBytes: bytes,
      sizeBytes: bytes.byteLength,
    };
    if (previous) docs.splice(docs.indexOf(previous), 1, document);
    else docs.push(document);
    totalBytes += bytes.byteLength - (previous?.sizeBytes ?? 0);
    return { action: previous ? "updated" : "added", document };
  }
  async function importFiles(
    files,
    {
      onProgress = () => {},
      yieldUI = () => new Promise((resolve) => setTimeout(resolve, 0)),
    } = {},
  ) {
    const result = {
      added: 0,
      updated: 0,
      unchanged: 0,
      errors: [],
      firstChanged: null,
    };
    function accept(bytes, name, origin = "") {
      const stored = storeBytes(bytes, name, origin);
      result[stored.action]++;
      if (stored.action !== "unchanged")
        result.firstChanged ??= stored.document;
    }
    for (const file of Array.from(files)) {
      try {
        onProgress(`${file.name} okunuyor…`);
        await yieldUI();
        if (file.name.toLowerCase().endsWith(".xml")) {
          if (
            file.size > limits.xml ||
            file.size > availableBytes(file.name, "")
          )
            throw new Error("XML boyut / toplam veri sınırı aşıldı.");
          accept(new Uint8Array(await file.arrayBuffer()), file.name);
        } else if (file.name.toLowerCase().endsWith(".zip")) {
          if (file.size > limits.zip)
            throw new Error("ZIP 150 MiB sınırını aşıyor.");
          const zip = await JSZip.loadAsync(
            new Uint8Array(await file.arrayBuffer()),
            { createFolders: false },
          );
          const entries = Object.values(zip.files).filter(
            (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".xml"),
          );
          if (!entries.length)
            throw new Error("ZIP içerisinde XML dosyası bulunamadı.");
          if (entries.length > limits.entries)
            throw new Error(
              "ZIP içerisinde izin verilen sayıdan fazla XML dosyası var (500).",
            );
          for (const entry of entries) {
            try {
              const name = entry.name.split("/").pop(),
                origin = `${file.name}:${entry.name}`;
              const maxBytes = Math.min(
                limits.xml,
                availableBytes(name, origin),
              );
              const declaredSize = entry._data?.uncompressedSize;
              if (
                maxBytes <= 0 ||
                (typeof declaredSize === "number" && declaredSize > maxBytes)
              )
                throw new Error("XML boyut / toplam veri sınırı aşıldı.");
              onProgress(`${file.name} → ${name} işleniyor…`);
              await yieldUI();
              accept(await readZipEntry(entry, maxBytes), name, origin);
            } catch (error) {
              result.errors.push(
                `${file.name} / ${entry.name}: ${error.message || "Dosya okunamadı."}`,
              );
            }
          }
        } else throw new Error("Yalnızca .xml ve .zip dosyaları desteklenir.");
      } catch (error) {
        result.errors.push(
          `${file.name}: ${error.message || "Dosya okunamadı."}`,
        );
      }
    }
    // A later file in the same batch may have replaced the first changed document.
    if (result.firstChanged)
      result.firstChanged = docs.find(
        (doc) => doc.key === result.firstChanged.key,
      );
    return result;
  }
  return {
    docs,
    get totalBytes() {
      return totalBytes;
    },
    storeBytes,
    importFiles,
    clear() {
      docs.length = 0;
      totalBytes = 0;
    },
  };
}

import { describe, it, expect } from "vitest";
import { makeCSV } from "../../src/export/makeCSV.js";
import { parseELedgerXml } from "../../src/xml/parseELedgerXml.js";
import { extractELedgerData } from "../../src/parser/extractELedgerData.js";
import { syntheticLedger } from "../helpers/syntheticLedger.js";
describe("CSV dışa aktarımı", () => {
  it("tüm satırları ve üst kayıttan alınan tarih/fişi UTF-8 BOM ile aktarır", () => {
    const doc = extractELedgerData(
        parseELedgerXml(syntheticLedger({ count: 61 })).document,
      ),
      csv = makeCSV(doc);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\r\n")).toHaveLength(62);
    expect(csv).toContain('"2026-11-07"');
    expect(csv).toContain('"FIS-001"');
  });
  it("formül gibi başlayan metni etkisizleştirir ve tırnakları kaçırır", () => {
    const doc = extractELedgerData(
        parseELedgerXml(syntheticLedger({ comment: '=HYPERLINK("x")' }))
          .document,
      ),
      csv = makeCSV(doc);
    expect(csv).toContain('"\'=HYPERLINK(""x"") 1"');
  });
});

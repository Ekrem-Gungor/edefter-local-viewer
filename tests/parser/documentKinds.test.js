import { describe, it, expect } from "vitest";
import { parseELedgerXml } from "../../src/xml/parseELedgerXml.js";
import { extractELedgerData } from "../../src/parser/extractELedgerData.js";
import { syntheticLedger } from "../helpers/syntheticLedger.js";
const read = (options) =>
  extractELedgerData(parseELedgerXml(syntheticLedger(options)).document);
describe("defter ve berat içerikleri", () => {
  it.each(["journal", "ledger"])(
    "dosya adı yerine %s XML içeriğini kullanır",
    (type) => {
      for (const kind of ["defter", "berat"]) {
        const doc = read({ type, kind });
        expect(doc.documentType).toBe(type);
        expect(doc.kind).toBe(kind);
        expect(doc.accounts).toHaveLength(2);
        expect(doc.total).toEqual({ debit: 10.25, credit: 10.25 });
        expect(doc.taxpayer.title).toBe("Sentetik İşletme");
        expect(doc.document.numberOfEntries).toBe("1");
      }
    },
  );
  it("doğrudan XBRL belgesini özet kayıtlarından sınıflandırır", () => {
    expect(read({ wrapper: false, summary: true }).kind).toBe("berat");
    expect(read({ wrapper: false, summary: false }).kind).toBe("defter");
  });
  it("üst kayıt tarihini ve fişini satırlara aktarır", () => {
    const doc = read({});
    expect(doc.rows[0]).toMatchObject({
      date: "2026-11-07",
      reference: "FIS-001",
      documentType: "invoice",
      sub: "01",
    });
    expect(doc.rows[1].date).toBe("2026-11-07");
  });
  it("satır üzerindeki değerleri üst kayıttan önce kullanır", () => {
    const row = read({ detailDate: "2026-11-08", detailReference: "FIS-002" })
      .rows[0];
    expect(row.date).toBe("2026-11-08");
    expect(row.reference).toBe("FIS-002");
  });
  it("bir satırın tarihi kardeş satırlara sızmaz", () => {
    const xml = syntheticLedger({})
      .replace("<c:postingDate>2026-11-07</c:postingDate>", "")
      .replace(
        "<c:lineNumber>1</c:lineNumber>",
        "<c:lineNumber>1</c:lineNumber><c:postingDate>2026-11-09</c:postingDate>",
      );
    const doc = extractELedgerData(parseELedgerXml(xml).document);
    expect(doc.rows[0].date).toBe("2026-11-09");
    expect(doc.rows[1].date).toBe("");
  });
  it("berat hesap toplamına açılış bakiyesi kayıtlarını eklemez", () => {
    const xml = syntheticLedger({ kind: "berat" }).replace(
      "<c:xbrlInclude>period_change</c:xbrlInclude>",
      "<c:xbrlInclude>beginning_balance</c:xbrlInclude>",
    );
    const doc = extractELedgerData(parseELedgerXml(xml).document);
    expect(doc.rows).toHaveLength(2);
    expect(doc.total).toEqual({ debit: 0, credit: 10.25 });
  });
  it.each(["", "invalid"])(
    "geçersiz tutarı sıfır hareket gibi göstermez: %s",
    (amount) => {
      const row = read({ amount }).rows[0];
      expect(row.amount).toBeNull();
      expect(row.debit).toBe(0);
    },
  );
  it("başka namespace içindeki sahte defter kökünü reddeder", () => {
    expect(() =>
      parseELedgerXml(
        syntheticLedger({}).replace(
          "http://www.edefter.gov.tr",
          "urn:unsupported",
        ),
      ),
    ).toThrow();
  });
  it("boş elektronik imza elementi için doğrulama sonucu üretmez", () => {
    const xml = syntheticLedger({}).replace(
      "</e:defter>",
      '<d:Signature xmlns:d="http://www.w3.org/2000/09/xmldsig#"/></e:defter>',
    );
    expect(
      extractELedgerData(parseELedgerXml(xml).document).signatures.primary,
    ).toMatchObject({ present: true, verificationStatus: "not-performed" });
  });
});

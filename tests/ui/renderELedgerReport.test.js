import { readFileSync } from "node:fs";
import { beforeEach, describe, it, expect } from "vitest";
import { parseELedgerXml } from "../../src/xml/parseELedgerXml.js";
import { extractELedgerData } from "../../src/parser/extractELedgerData.js";
import {
  renderELedgerReport,
  clearELedgerReport,
  drawMovements,
} from "../../src/ui/renderELedgerReport.js";
import { syntheticLedger } from "../helpers/syntheticLedger.js";
const page = readFileSync("index.html", "utf8");
const fixture = () =>
  extractELedgerData(
    parseELedgerXml(readFileSync("tests/fixtures/valid-journal.xml", "utf8"))
      .document,
  );
beforeEach(() => {
  document.body.innerHTML = new DOMParser().parseFromString(
    page,
    "text/html",
  ).body.innerHTML;
});
describe("renderELedgerReport", () => {
  it("belge özetini ve taraf bilgilerini gösterir", () => {
    renderELedgerReport("sentetik.xml", fixture());
    expect(document.querySelector("#report").classList.contains("hidden")).toBe(
      false,
    );
    expect(document.querySelector("#report-file").textContent).toBe(
      "sentetik.xml",
    );
    expect(document.querySelector("#stat-type").textContent).toBe(
      "Yevmiye Beratı",
    );
    expect(document.querySelector("#stat-period").textContent).toBe(
      "01.09.2026 – 30.09.2026",
    );
    expect(document.querySelector("#taxpayer-fields").textContent).toContain(
      "Sentetik Teknoloji A.Ş.",
    );
    expect(document.querySelector("#accountant-fields").textContent).toContain(
      "Sentetik Mali Müşavir",
    );
  });
  it("hesap toplamlarını ve doğrulanmamış imza bilgisini gösterir", () => {
    renderELedgerReport("sentetik.xml", fixture());
    expect(document.querySelectorAll("#account-rows tr")).toHaveLength(2);
    expect(document.querySelector("#total-debit").textContent).toBe("1.500,25");
    expect(document.querySelector("#signature-wrap").textContent).toContain(
      "XML içinde mevcut",
    );
    expect(document.querySelector("#document-fields").textContent).toContain(
      "Var (doğrulanmadı)",
    );
    expect(document.body.textContent).toContain(
      "resmi geçerlilik/onay sonucu üretmez",
    );
  });
  it("XML kaynaklı metinleri HTML olarak çalıştırmaz", () => {
    const doc = fixture();
    doc.taxpayer.title = '<img id="injected-content" src="x">';
    renderELedgerReport("sentetik.xml", doc);
    expect(document.querySelector("#injected-content")).toBeNull();
    expect(document.querySelector("#taxpayer-fields").textContent).toContain(
      '<img id="injected-content" src="x">',
    );
  });
  it("temizlendiğinde raporu gizler ve kişisel içeriği kaldırır", () => {
    renderELedgerReport("sentetik.xml", fixture());
    clearELedgerReport();
    expect(document.querySelector("#report").classList.contains("hidden")).toBe(
      true,
    );
    for (const id of [
      "taxpayer-fields",
      "movement-rows",
      "account-rows",
      "signature-wrap",
    ])
      expect(document.getElementById(id).childElementCount).toBe(0);
  });
  it("60 satırlık sayfaları ve Türkçe aramayı uygular", () => {
    const doc = extractELedgerData(
      parseELedgerXml(syntheticLedger({ count: 61, comment: "İŞLEM" }))
        .document,
    );
    renderELedgerReport("defter.xml", doc);
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(60);
    drawMovements(doc, { page: 1 });
    expect(document.querySelectorAll("#movement-rows tr")).toHaveLength(1);
    drawMovements(doc, { query: "işlem 61" });
    expect(document.querySelector("#movement-rows").textContent).toContain(
      "İŞLEM 61",
    );
    drawMovements(doc, { query: "bulunmayan" });
    expect(document.querySelector("#movement-rows").textContent).toContain(
      "Aramanıza uygun kayıt bulunamadı",
    );
  });
  it("boş hesap ve imzasız belgeyi gösterebilir", () => {
    const doc = extractELedgerData(
      parseELedgerXml(syntheticLedger({ count: 0 })).document,
    );
    renderELedgerReport("empty.xml", doc);
    expect(document.querySelector("#account-rows").textContent).toContain(
      "Hesap özeti bulunamadı".toLocaleLowerCase("tr-TR"),
    );
  });
});

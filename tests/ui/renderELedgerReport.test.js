import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearELedgerReport,
  renderELedgerReport,
} from "../../src/ui/renderELedgerReport.js";

const pageSource = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function createReportData() {
  return {
    documentType: "journal",
    documentTypeLabel: "Yevmiye Defteri",
    taxpayer: {
      identifier: "1111111111",
      identifierType: "VKN",
      title: "Sentetik Teknoloji A.Ş.",
      branch: "Merkez",
      phone: "+90 000 000 00 00",
      fax: "",
      email: "synthetic@example.invalid",
    },
    accountant: {
      name: "Sentetik Mali Müşavir",
      phone: "+90 000 000 00 01",
      fax: "",
      email: "accountant@example.invalid",
      contractNumber: "SYNTHETIC-CONTRACT-001",
    },
    document: {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      uniqueId: "SYNTHETIC-JOURNAL-2026-09",
      ettn: "SYNTHETIC-ETTN-JOURNAL-001",
      creationDate: "2026-10-01",
      creator: "Sentetik Teknoloji A.Ş.",
      sourceApplication: "Sentetik Muhasebe Uygulaması",
      fiscalYearStart: "2026-01-01",
      fiscalYearEnd: "2026-12-31",
      description: "Sentetik test verisi",
      numberOfEntries: "2",
    },
    accounts: [
      {
        code: "100",
        description: "Kasa",
        debit: 1500.25,
        credit: 0,
      },
      {
        code: "600",
        description: "Yurt İçi Satışlar",
        debit: 0,
        credit: 1500.25,
      },
    ],
    signatures: {
      primary: {
        present: true,
        subject: "CN=SENTETIK MUKELLEF",
        signingTime: "2026-10-01T10:15:00+03:00",
        value: "SYNTHETIC_MAIN_SIGNATURE_VALUE",
        signatureAlgorithm:
          "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        issuerName: "CN=SYNTHETIC TEST CA",
        serialNumber: "0000000002",
        verificationStatus: "not-performed",
      },
      counterSignature: {
        present: true,
        subject: "CN=GELİR İDARESİ BAŞKANLIĞI TEST",
        signingTime: "2026-10-01T10:16:00+03:00",
        value: "SYNTHETIC_GIB_COUNTER_SIGNATURE_VALUE",
        signatureAlgorithm:
          "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        issuerName: "CN=SYNTHETIC TEST CA",
        serialNumber: "0000000001",
        verificationStatus: "not-performed",
        claimedAuthority: "GIB",
      },
    },
  };
}

function loadPageMarkup() {
  const parsedPage = new DOMParser().parseFromString(pageSource, "text/html");
  const nodes = [...parsedPage.body.childNodes].map((node) =>
    node.cloneNode(true),
  );

  document.body.replaceChildren(...nodes);
}

describe("renderELedgerReport", () => {
  beforeEach(() => {
    loadPageMarkup();
  });

  it("belge özetini ve taraf bilgilerini gösterir", () => {
    renderELedgerReport("sentetik-yevmiye.xml", createReportData());

    expect(document.querySelector("#report").hidden).toBe(false);
    expect(document.querySelector("#selected-file").textContent).toBe(
      "sentetik-yevmiye.xml",
    );
    expect(document.querySelector("#summary-document-type").textContent).toBe(
      "Yevmiye Defteri",
    );
    expect(document.querySelector("#summary-period").textContent).toBe(
      "01.09.2026 – 30.09.2026",
    );
    expect(document.querySelector("#taxpayer-details").textContent).toContain(
      "Sentetik Teknoloji A.Ş.",
    );
    expect(document.querySelector("#accountant-details").textContent).toContain(
      "Sentetik Mali Müşavir",
    );
  });

  it("hesap toplamlarını ve imza metadata'sını doğrulama iddiası olmadan gösterir", () => {
    renderELedgerReport("sentetik-yevmiye.xml", createReportData());

    expect(document.querySelectorAll("#account-rows tr")).toHaveLength(2);
    expect(document.querySelector("#account-summary").textContent).toContain(
      "Toplam borç 1.500,25",
    );
    expect(document.querySelector("#primary-signature-state").dataset.state).toBe(
      "found",
    );
    expect(document.querySelector("#counter-signature-details").textContent).toContain(
      "Kriptografik doğrulamaYapılmadı",
    );
    expect(document.querySelector("#verification-message").textContent).toContain(
      "resmi onay veya imza doğrulaması değildir",
    );
  });

  it("XML kaynaklı metinleri HTML olarak çalıştırmaz", () => {
    const data = createReportData();
    data.taxpayer.title = '<img id="injected-content" src="x">';

    renderELedgerReport("sentetik-yevmiye.xml", data);

    expect(document.querySelector("#injected-content")).toBeNull();
    expect(document.querySelector("#taxpayer-details").textContent).toContain(
      '<img id="injected-content" src="x">',
    );
  });

  it("temizlendiğinde raporu gizler ve dinamik satırları kaldırır", () => {
    renderELedgerReport("sentetik-yevmiye.xml", createReportData());

    clearELedgerReport();

    expect(document.querySelector("#report").hidden).toBe(true);
    expect(document.querySelector("#taxpayer-details").childElementCount).toBe(0);
    expect(document.querySelector("#account-rows").childElementCount).toBe(0);
    expect(document.querySelector("#primary-signature-value").textContent).toBe(
      "",
    );
  });
});

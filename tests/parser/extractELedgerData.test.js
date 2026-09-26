import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractELedgerData } from "../../src/parser/extractELedgerData.js";
import { parseELedgerXml } from "../../src/xml/parseELedgerXml.js";

const readFixture = (fileName) =>
  readFileSync(resolve(process.cwd(), "tests", "fixtures", fileName), "utf8");

const extractFixture = (fileName) =>
  extractELedgerData(parseELedgerXml(readFixture(fileName)).document);

describe("extractELedgerData", () => {
  it("extracts taxpayer and document information from a journal", () => {
    const result = extractFixture("valid-journal.xml");

    expect(result.documentType).toBe("journal");
    expect(result.documentTypeLabel).toBe("Yevmiye Defteri");
    expect(result.taxpayer).toEqual({
      identifier: "1111111111",
      identifierType: "VKN",
      title: "Sentetik Teknoloji A.Ş.",
      branch: "Merkez",
      phone: "+90 000 000 00 00",
      fax: "",
      email: "synthetic@example.invalid",
    });
    expect(result.document).toMatchObject({
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      uniqueId: "SYNTHETIC-JOURNAL-2026-09",
      creationDate: "2026-10-01",
      ettn: "SYNTHETIC-ETTN-JOURNAL-001",
      numberOfEntries: "2",
    });
  });

  it("extracts accountant information", () => {
    const result = extractFixture("valid-journal.xml");

    expect(result.accountant).toEqual({
      name: "Sentetik Mali Müşavir",
      phone: "+90 000 000 00 01",
      fax: "",
      email: "accountant@example.invalid",
      contractNumber: "SYNTHETIC-CONTRACT-001",
    });
  });

  it("aggregates debit and credit totals by account", () => {
    const result = extractFixture("valid-journal.xml");

    expect(result.accounts).toEqual([
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
    ]);
  });

  it("extracts primary signature metadata without claiming verification", () => {
    const result = extractFixture("valid-journal.xml");

    expect(result.signatures.primary).toMatchObject({
      present: true,
      subject: "CN=SENTETIK MUKELLEF",
      signingTime: "2026-10-01T10:15:00+03:00",
      value: "SYNTHETIC_MAIN_SIGNATURE_VALUE",
      signatureAlgorithm:
        "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
      digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
      verificationStatus: "not-performed",
    });
  });

  it("separates GIB counter-signature metadata from the primary signature", () => {
    const result = extractFixture("valid-journal.xml");

    expect(result.signatures.counterSignature).toMatchObject({
      present: true,
      subject: "CN=GELİR İDARESİ BAŞKANLIĞI TEST",
      signingTime: "2026-10-01T10:16:00+03:00",
      value: "SYNTHETIC_GIB_COUNTER_SIGNATURE_VALUE",
      signatureAlgorithm:
        "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
      issuerName: "CN=SYNTHETIC TEST CA",
      serialNumber: "0000000001",
      verificationStatus: "not-performed",
      claimedAuthority: "GIB",
    });
  });

  it("keeps missing optional and signature fields explicit", () => {
    const result = extractFixture("valid-ledger.xml");

    expect(result.documentTypeLabel).toBe("Büyük Defter");
    expect(result.accountant).toEqual({
      name: "",
      phone: "",
      fax: "",
      email: "",
      contractNumber: "",
    });
    expect(result.signatures.primary).toEqual({
      present: false,
      subject: "",
      signingTime: "",
      value: "",
      signatureAlgorithm: "",
      digestAlgorithm: "",
      issuerName: "",
      serialNumber: "",
      verificationStatus: "not-performed",
    });
    expect(result.signatures.counterSignature.claimedAuthority).toBeNull();
  });

  it("reads the signature algorithm from XML instead of hardcoding it", () => {
    const xml = `
      <xbrli:xbrl
        xmlns:xbrli="http://www.xbrl.org/2003/instance"
        xmlns:gl-cor="http://www.xbrl.org/int/gl/cor/2006-10-25"
        xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <gl-cor:entriesType>journal</gl-cor:entriesType>
        <ds:Signature>
          <ds:SignedInfo>
            <ds:SignatureMethod Algorithm="urn:synthetic:ecdsa-sha512" />
            <ds:Reference>
              <ds:DigestMethod Algorithm="urn:synthetic:sha512" />
            </ds:Reference>
          </ds:SignedInfo>
          <ds:SignatureValue>SYNTHETIC_VALUE</ds:SignatureValue>
        </ds:Signature>
      </xbrli:xbrl>
    `;

    const result = extractELedgerData(parseELedgerXml(xml).document);

    expect(result.signatures.primary.signatureAlgorithm).toBe(
      "urn:synthetic:ecdsa-sha512",
    );
    expect(result.signatures.primary.digestAlgorithm).toBe(
      "urn:synthetic:sha512",
    );
  });
});

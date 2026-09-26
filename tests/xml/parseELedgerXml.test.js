import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ELedgerXmlError,
  XML_ERROR_CODES,
} from "../../src/xml/ELedgerXmlError.js";
import {
  DEFAULT_MAX_XML_BYTES,
  parseELedgerXml,
} from "../../src/xml/parseELedgerXml.js";

const readFixture = (fileName) =>
  readFileSync(resolve(process.cwd(), "tests", "fixtures", fileName), "utf8");

function expectXmlError(action, expectedCode) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ELedgerXmlError);
    expect(error.code).toBe(expectedCode);
    return;
  }

  throw new Error(`Expected ${expectedCode} to be thrown.`);
}

describe("parseELedgerXml", () => {
  it.each([
    ["valid-journal.xml", "journal"],
    ["valid-ledger.xml", "ledger"],
  ])("accepts %s as %s", (fileName, expectedType) => {
    const result = parseELedgerXml(readFixture(fileName));

    expect(result.documentType).toBe(expectedType);
    expect(result.document.documentElement.localName).toBe("xbrl");
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("rejects values that are not strings", () => {
    expectXmlError(
      () => parseELedgerXml(null),
      XML_ERROR_CODES.invalidInput,
    );
  });

  it("rejects empty XML content", () => {
    expectXmlError(
      () => parseELedgerXml("   \n  "),
      XML_ERROR_CODES.empty,
    );
  });

  it("rejects XML exceeding the configured byte limit", () => {
    expectXmlError(
      () => parseELedgerXml("<xbrl>çok büyük içerik</xbrl>", { maxBytes: 10 }),
      XML_ERROR_CODES.tooLarge,
    );
  });

  it("uses a defensive default file size limit", () => {
    expect(DEFAULT_MAX_XML_BYTES).toBe(10 * 1024 * 1024);
  });

  it("rejects DTD and external entity declarations before parsing", () => {
    expectXmlError(
      () => parseELedgerXml(readFixture("dtd-entity.xml")),
      XML_ERROR_CODES.forbiddenDeclaration,
    );
  });

  it("rejects malformed XML", () => {
    expectXmlError(
      () => parseELedgerXml(readFixture("invalid.xml")),
      XML_ERROR_CODES.malformed,
    );
  });

  it("rejects documents outside the XBRL instance namespace", () => {
    expectXmlError(
      () => parseELedgerXml(readFixture("unsupported-document.xml")),
      XML_ERROR_CODES.unsupportedRoot,
    );
  });

  it("rejects unsupported e-Ledger document types", () => {
    const xml = `
      <xbrli:xbrl
        xmlns:xbrli="http://www.xbrl.org/2003/instance"
        xmlns:gl-cor="http://www.xbrl.org/int/gl/cor/2006-10-25">
        <gl-cor:entriesType>trial-balance</gl-cor:entriesType>
      </xbrli:xbrl>
    `;

    expectXmlError(
      () => parseELedgerXml(xml),
      XML_ERROR_CODES.unsupportedDocumentType,
    );
  });

  it("rejects an invalid maximum byte configuration", () => {
    expect(() =>
      parseELedgerXml(readFixture("valid-journal.xml"), { maxBytes: 0 }),
    ).toThrow(TypeError);
  });
});

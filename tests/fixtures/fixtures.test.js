import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const fixtureUrl = (fileName) => new URL(fileName, import.meta.url);
const readFixture = (fileName) =>
  readFileSync(fileURLToPath(fixtureUrl(fileName)), "utf8");

const parseXml = (source) =>
  new DOMParser().parseFromString(source, "application/xml");

const hasParserError = (document) =>
  document.getElementsByTagName("parsererror").length > 0;

const namespaces = Object.freeze({
  core: "http://www.xbrl.org/int/gl/cor/2006-10-25",
});

describe("synthetic XML fixtures", () => {
  it.each([
    ["valid-journal.xml", "journal"],
    ["valid-ledger.xml", "ledger"],
  ])("keeps %s as valid %s XML", (fileName, expectedType) => {
    const document = parseXml(readFixture(fileName));

    expect(hasParserError(document)).toBe(false);
    expect(
      document
        .getElementsByTagNameNS(namespaces.core, "entriesType")[0]
        ?.textContent?.trim(),
    ).toBe(expectedType);
  });

  it("keeps the malformed fixture invalid", () => {
    const document = parseXml(readFixture("invalid.xml"));

    expect(hasParserError(document)).toBe(true);
  });

  it("keeps the security fixture equipped with DTD and an external entity", () => {
    const source = readFixture("dtd-entity.xml");

    expect(source).toContain("<!DOCTYPE");
    expect(source).toContain("<!ENTITY");
    expect(source).toContain("SYSTEM");
  });

  it("keeps the unsupported fixture outside the XBRL instance namespace", () => {
    const document = parseXml(readFixture("unsupported-document.xml"));

    expect(hasParserError(document)).toBe(false);
    expect(document.documentElement.localName).toBe("invoice");
    expect(document.documentElement.namespaceURI).toBe(
      "urn:synthetic:invoice",
    );
  });

  it.each([
    "valid-journal.xml",
    "valid-ledger.xml",
    "invalid.xml",
    "dtd-entity.xml",
    "unsupported-document.xml",
  ])("does not contain known production identifiers in %s", (fileName) => {
    const source = readFixture(fileName);

    expect(source).not.toMatch(/realtime\.demo|ekremgungordev|Extra Yazılım/i);
  });
});

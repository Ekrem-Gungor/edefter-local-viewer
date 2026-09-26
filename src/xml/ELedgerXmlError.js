export const XML_ERROR_CODES = Object.freeze({
  invalidInput: "XML_INVALID_INPUT",
  empty: "XML_EMPTY",
  tooLarge: "XML_TOO_LARGE",
  forbiddenDeclaration: "XML_FORBIDDEN_DECLARATION",
  malformed: "XML_MALFORMED",
  unsupportedRoot: "XML_UNSUPPORTED_ROOT",
  unsupportedDocumentType: "XML_UNSUPPORTED_DOCUMENT_TYPE",
});

export class ELedgerXmlError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ELedgerXmlError";
    this.code = code;
  }
}

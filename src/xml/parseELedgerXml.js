import {
  ELedgerXmlError,
  XML_ERROR_CODES,
} from "./ELedgerXmlError.js";
import {
  SUPPORTED_DOCUMENT_TYPES,
  XML_NAMESPACES,
} from "./namespaces.js";

export const DEFAULT_MAX_XML_BYTES = 10 * 1024 * 1024;

const forbiddenXmlDeclarationPattern = /<!\s*(?:DOCTYPE|ENTITY)\b/i;

function createXmlError(code, message) {
  return new ELedgerXmlError(code, message);
}

function getUtf8ByteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

function hasParserError(document) {
  return document.getElementsByTagName("parsererror").length > 0;
}

function validateMaximumSize(maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError("maxBytes pozitif bir tam sayı olmalıdır.");
  }
}

function getDocumentType(document) {
  return document
    .getElementsByTagNameNS(XML_NAMESPACES.glCore, "entriesType")[0]
    ?.textContent?.trim();
}

export function parseELedgerXml(
  xmlSource,
  { maxBytes = DEFAULT_MAX_XML_BYTES } = {},
) {
  validateMaximumSize(maxBytes);

  if (typeof xmlSource !== "string") {
    throw createXmlError(
      XML_ERROR_CODES.invalidInput,
      "XML içeriği metin olarak sağlanmalıdır.",
    );
  }

  if (xmlSource.trim().length === 0) {
    throw createXmlError(
      XML_ERROR_CODES.empty,
      "XML dosyası boş olamaz.",
    );
  }

  const sizeBytes = getUtf8ByteLength(xmlSource);

  if (sizeBytes > maxBytes) {
    throw createXmlError(
      XML_ERROR_CODES.tooLarge,
      `XML dosyası izin verilen ${maxBytes} bayt sınırını aşıyor.`,
    );
  }

  // DOMParser tarayıcıya göre farklı davranabildiği için DTD ve entity
  // bildirimlerini ayrıştırmadan önce açıkça reddediyoruz.
  if (forbiddenXmlDeclarationPattern.test(xmlSource)) {
    throw createXmlError(
      XML_ERROR_CODES.forbiddenDeclaration,
      "DTD ve entity bildirimi içeren XML dosyaları desteklenmiyor.",
    );
  }

  const document = new DOMParser().parseFromString(
    xmlSource,
    "application/xml",
  );

  if (hasParserError(document)) {
    throw createXmlError(
      XML_ERROR_CODES.malformed,
      "XML dosyası okunamadı veya geçersiz.",
    );
  }

  const root = document.documentElement;

  if (
    root.localName !== "xbrl" ||
    root.namespaceURI !== XML_NAMESPACES.xbrlInstance
  ) {
    throw createXmlError(
      XML_ERROR_CODES.unsupportedRoot,
      "Seçilen dosya desteklenen bir e-Defter XBRL belgesi değil.",
    );
  }

  const documentType = getDocumentType(document);

  if (!SUPPORTED_DOCUMENT_TYPES.includes(documentType)) {
    throw createXmlError(
      XML_ERROR_CODES.unsupportedDocumentType,
      "XML belge türü desteklenmiyor. Yevmiye veya büyük defter beratı seçin.",
    );
  }

  return Object.freeze({
    document,
    documentType,
    sizeBytes,
  });
}

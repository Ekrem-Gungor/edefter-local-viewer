import { XML_NAMESPACES } from "../xml/namespaces.js";
import { ledgerStructure, childText } from "../xml/ledgerStructure.js";
import { extractMovements, aggregateAccounts } from "./extractMovements.js";

const documentTypeLabels = Object.freeze({
  journal: "Yevmiye Defteri",
  ledger: "Büyük Defter",
});

const emptySignatureMetadata = Object.freeze({
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

function getElements(root, namespace, localName) {
  if (!root) {
    return [];
  }

  return [...root.getElementsByTagNameNS(namespace, localName)];
}

function getFirstElement(root, namespace, localName) {
  return getElements(root, namespace, localName)[0] ?? null;
}

function getText(root, namespace, localName) {
  return getFirstElement(root, namespace, localName)?.textContent?.trim() ?? "";
}

function getOrganizationIdentifier(document, description) {
  const identifier = getElements(
    document,
    XML_NAMESPACES.glBusiness,
    "organizationIdentifiers",
  ).find(
    (element) =>
      getText(element, XML_NAMESPACES.glBusiness, "organizationDescription") ===
      description,
  );

  return getText(
    identifier,
    XML_NAMESPACES.glBusiness,
    "organizationIdentifier",
  );
}

function getIdentifierType(identifier) {
  const digits = identifier.replace(/\D/g, "");

  if (digits.length === 10) {
    return "VKN";
  }

  if (digits.length === 11) {
    return "TCKN";
  }

  return "Vergi/Kimlik No";
}

function isWithinElement(element, namespace, localName) {
  let current = element.parentElement;

  while (current) {
    if (current.namespaceURI === namespace && current.localName === localName) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function belongsToSignature(element, signature) {
  let current = element.parentElement;

  while (current) {
    if (
      current.namespaceURI === XML_NAMESPACES.xmlSignature &&
      current.localName === "Signature"
    ) {
      return current === signature;
    }

    current = current.parentElement;
  }

  return false;
}

function getOwnedElement(signature, namespace, localName) {
  return getElements(signature, namespace, localName).find((element) =>
    belongsToSignature(element, signature),
  );
}

function getOwnedText(signature, namespace, localName) {
  return (
    getOwnedElement(signature, namespace, localName)?.textContent?.trim() ?? ""
  );
}

function extractSignatureMetadata(signature) {
  if (!signature) {
    return { ...emptySignatureMetadata };
  }

  const signatureMethod = getOwnedElement(
    signature,
    XML_NAMESPACES.xmlSignature,
    "SignatureMethod",
  );
  const digestMethod = getOwnedElement(
    signature,
    XML_NAMESPACES.xmlSignature,
    "DigestMethod",
  );
  const subject = getOwnedText(
    signature,
    XML_NAMESPACES.xmlSignature,
    "X509SubjectName",
  );
  const value = getOwnedText(
    signature,
    XML_NAMESPACES.xmlSignature,
    "SignatureValue",
  );

  return {
    present: true,
    subject,
    signingTime: getOwnedText(signature, XML_NAMESPACES.xades, "SigningTime"),
    value,
    signatureAlgorithm: signatureMethod?.getAttribute("Algorithm") ?? "",
    digestAlgorithm: digestMethod?.getAttribute("Algorithm") ?? "",
    issuerName: getOwnedText(
      signature,
      XML_NAMESPACES.xmlSignature,
      "X509IssuerName",
    ),
    serialNumber: getOwnedText(
      signature,
      XML_NAMESPACES.xmlSignature,
      "X509SerialNumber",
    ),
    verificationStatus: "not-performed",
  };
}

function extractSignatures(document) {
  const signatures = getElements(
    document,
    XML_NAMESPACES.xmlSignature,
    "Signature",
  );
  const primarySignature = signatures.find(
    (signature) =>
      !isWithinElement(signature, XML_NAMESPACES.xades, "CounterSignature"),
  );
  const counterSignatureContainer = getFirstElement(
    document,
    XML_NAMESPACES.xades,
    "CounterSignature",
  );
  const counterSignature = getFirstElement(
    counterSignatureContainer,
    XML_NAMESPACES.xmlSignature,
    "Signature",
  );
  const counterSignatureMetadata = extractSignatureMetadata(counterSignature);

  return {
    primary: extractSignatureMetadata(primarySignature),
    counterSignature: {
      ...counterSignatureMetadata,
      claimedAuthority: /GELİR\s+İDARESİ\s+BAŞKANLIĞI/i.test(
        counterSignatureMetadata.subject,
      )
        ? "GIB"
        : null,
    },
  };
}

export function extractELedgerData(document) {
  const structure = ledgerStructure(document);
  if (!structure) throw new Error("Desteklenen XML yapısı bulunamadı.");
  const {
    root,
    xbrl,
    accounting,
    info: documentInfo,
    documentType,
    kind,
  } = structure;
  const context = getFirstElement(xbrl, XML_NAMESPACES.xbrlInstance, "context");
  const rows = extractMovements(accounting);
  const accounts = aggregateAccounts(rows, kind);
  const signatures = extractSignatures(document);
  signatures.detached = childText(
    root,
    XML_NAMESPACES.xmlSignature,
    "SignatureValue",
  );
  const accountant = getFirstElement(
    accounting,
    XML_NAMESPACES.glBusiness,
    "accountantInformation",
  );
  const identifier = getText(
    context,
    XML_NAMESPACES.xbrlInstance,
    "identifier",
  );

  return {
    kind,
    rows,
    documentType,
    documentTypeLabel: documentTypeLabels[documentType] ?? "Belge",
    taxpayer: {
      identifier,
      identifierType: getIdentifierType(identifier),
      title:
        getOrganizationIdentifier(document, "Kurum Unvanı") ||
        getOrganizationIdentifier(document, "Adı Soyadı") ||
        getOrganizationIdentifier(document, "Ticaret Unvanı") ||
        getOrganizationIdentifier(document, "Unvanı"),
      branch: getOrganizationIdentifier(document, "Şube Adı"),
      phone: getText(accounting, XML_NAMESPACES.glBusiness, "phoneNumber"),
      fax: getText(accounting, XML_NAMESPACES.glBusiness, "entityFaxNumber"),
      email: getText(
        accounting,
        XML_NAMESPACES.glBusiness,
        "entityEmailAddress",
      ),
    },
    accountant: {
      name: getText(accountant, XML_NAMESPACES.glBusiness, "accountantName"),
      phone: getText(
        accountant,
        XML_NAMESPACES.glBusiness,
        "accountantContactPhoneNumber",
      ),
      fax: getText(
        accountant,
        XML_NAMESPACES.glBusiness,
        "accountantContactFaxNumber",
      ),
      email: getText(
        accountant,
        XML_NAMESPACES.glBusiness,
        "accountantContactEmailAddress",
      ),
      contractNumber: getText(
        accountant,
        XML_NAMESPACES.glBusiness,
        "accountantEngagementTypeDescription",
      ),
    },
    document: {
      headerCount: getElements(accounting, XML_NAMESPACES.glCore, "entryHeader")
        .length,
      periodStart: getText(
        documentInfo,
        XML_NAMESPACES.glCore,
        "periodCoveredStart",
      ),
      periodEnd: getText(
        documentInfo,
        XML_NAMESPACES.glCore,
        "periodCoveredEnd",
      ),
      uniqueId: getText(documentInfo, XML_NAMESPACES.glCore, "uniqueID"),
      creationDate: getText(
        documentInfo,
        XML_NAMESPACES.glCore,
        "creationDate",
      ),
      creator: getText(documentInfo, XML_NAMESPACES.glBusiness, "creator"),
      sourceApplication: getText(
        documentInfo,
        XML_NAMESPACES.glBusiness,
        "sourceApplication",
      ),
      description: getText(
        documentInfo,
        XML_NAMESPACES.glCore,
        "entriesComment",
      ),
      fiscalYearStart: getText(
        accounting,
        XML_NAMESPACES.glBusiness,
        "fiscalYearStart",
      ),
      fiscalYearEnd: getText(
        accounting,
        XML_NAMESPACES.glBusiness,
        "fiscalYearEnd",
      ),
      ettn: getText(context, XML_NAMESPACES.glCore, "uniqueID"),
      numberOfEntries:
        getText(context, XML_NAMESPACES.glBusiness, "numberOfEntries") ||
        getText(accounting, XML_NAMESPACES.glBusiness, "numberOfEntries"),
    },
    accounts,
    signatures,
    total: accounts.reduce(
      (sum, account) => ({
        debit: sum.debit + account.debit,
        credit: sum.credit + account.credit,
      }),
      { debit: 0, credit: 0 },
    ),
  };
}

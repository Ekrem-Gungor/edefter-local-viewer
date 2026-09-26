import { XML_NAMESPACES } from "../xml/namespaces.js";

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
      getText(
        element,
        XML_NAMESPACES.glBusiness,
        "organizationDescription",
      ) === description,
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
    if (
      current.namespaceURI === namespace &&
      current.localName === localName
    ) {
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
  return getOwnedElement(signature, namespace, localName)?.textContent?.trim() ?? "";
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
    present: Boolean(subject || value),
    subject,
    signingTime: getOwnedText(
      signature,
      XML_NAMESPACES.xades,
      "SigningTime",
    ),
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
      !isWithinElement(
        signature,
        XML_NAMESPACES.xades,
        "CounterSignature",
      ),
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
      claimedAuthority: /GELİR İDARESİ BAŞKANLIĞI/i.test(
        counterSignatureMetadata.subject,
      )
        ? "GIB"
        : null,
    },
  };
}

function extractAccounts(document) {
  const accounts = new Map();

  getElements(document, XML_NAMESPACES.glCore, "entryDetail")
    .filter(
      (detail) =>
        getText(detail, XML_NAMESPACES.glCore, "xbrlInclude") ===
        "period_change",
    )
    .forEach((detail) => {
      const account = getFirstElement(
        detail,
        XML_NAMESPACES.glCore,
        "account",
      );
      const code = getText(
        account,
        XML_NAMESPACES.glCore,
        "accountMainID",
      );

      if (!code) {
        return;
      }

      const current = accounts.get(code) ?? {
        code,
        description: getText(
          account,
          XML_NAMESPACES.glCore,
          "accountMainDescription",
        ),
        debit: 0,
        credit: 0,
      };
      const amount = Number(
        getText(detail, XML_NAMESPACES.glCore, "amount"),
      );
      const debitCreditCode = getText(
        detail,
        XML_NAMESPACES.glCore,
        "debitCreditCode",
      );

      if (Number.isFinite(amount)) {
        if (debitCreditCode === "D") {
          current.debit += amount;
        } else if (debitCreditCode === "C") {
          current.credit += amount;
        }
      }

      accounts.set(code, current);
    });

  return [...accounts.values()];
}

export function extractELedgerData(document) {
  const documentType = getText(
    document,
    XML_NAMESPACES.glCore,
    "entriesType",
  );
  const documentInfo = getFirstElement(
    document,
    XML_NAMESPACES.glCore,
    "documentInfo",
  );
  const context = getFirstElement(
    document,
    XML_NAMESPACES.xbrlInstance,
    "context",
  );
  const accountant = getFirstElement(
    document,
    XML_NAMESPACES.glBusiness,
    "accountantInformation",
  );
  const identifier = getText(
    document,
    XML_NAMESPACES.xbrlInstance,
    "identifier",
  );

  return {
    documentType,
    documentTypeLabel: documentTypeLabels[documentType] ?? "Belge",
    taxpayer: {
      identifier,
      identifierType: getIdentifierType(identifier),
      title:
        getOrganizationIdentifier(document, "Kurum Unvanı") ||
        getOrganizationIdentifier(document, "Adı Soyadı"),
      branch: getOrganizationIdentifier(document, "Şube Adı"),
      phone: getText(
        document,
        XML_NAMESPACES.glBusiness,
        "phoneNumber",
      ),
      fax: getText(
        document,
        XML_NAMESPACES.glBusiness,
        "entityFaxNumber",
      ),
      email: getText(
        document,
        XML_NAMESPACES.glBusiness,
        "entityEmailAddress",
      ),
    },
    accountant: {
      name: getText(
        accountant,
        XML_NAMESPACES.glBusiness,
        "accountantName",
      ),
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
      uniqueId: getText(
        documentInfo,
        XML_NAMESPACES.glCore,
        "uniqueID",
      ),
      creationDate: getText(
        documentInfo,
        XML_NAMESPACES.glCore,
        "creationDate",
      ),
      creator: getText(
        documentInfo,
        XML_NAMESPACES.glBusiness,
        "creator",
      ),
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
        document,
        XML_NAMESPACES.glBusiness,
        "fiscalYearStart",
      ),
      fiscalYearEnd: getText(
        document,
        XML_NAMESPACES.glBusiness,
        "fiscalYearEnd",
      ),
      ettn: getText(context, XML_NAMESPACES.glCore, "uniqueID"),
      numberOfEntries: getText(
        document,
        XML_NAMESPACES.glBusiness,
        "numberOfEntries",
      ),
    },
    accounts: extractAccounts(document),
    signatures: extractSignatures(document),
  };
}

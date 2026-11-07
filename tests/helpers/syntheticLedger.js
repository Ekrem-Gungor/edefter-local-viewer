const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export function syntheticLedger({
  kind = "defter",
  type = "journal",
  count = 2,
  id = "SYNTHETIC-DOC",
  comment = "Deneme",
  detailDate = "",
  detailReference = "",
  amount = "10.25",
  summary = kind === "berat",
  wrapper = true,
} = {}) {
  const details = Array.from(
    { length: count },
    (_, i) =>
      `<c:entryDetail><c:lineNumber>${i + 1}</c:lineNumber>${detailDate ? `<c:postingDate>${detailDate}</c:postingDate>` : ""}${detailReference ? `<c:documentReference>${detailReference}</c:documentReference>` : ""}${summary ? "<c:xbrlInclude>period_change</c:xbrlInclude>" : ""}<c:account><c:accountMainID>${i % 2 ? "600" : "100"}</c:accountMainID><c:accountMainDescription>${i % 2 ? "Satışlar" : "Kasa"}</c:accountMainDescription><c:accountSubID>01</c:accountSubID><c:accountSubDescription>Merkez</c:accountSubDescription></c:account><c:amount>${amount}</c:amount><c:debitCreditCode>${i % 2 ? "C" : "D"}</c:debitCreditCode><c:detailComment>${escape(comment)} ${i + 1}</c:detailComment><c:documentNumber>FAT-${i + 1}</c:documentNumber><c:documentType>invoice</c:documentType></c:entryDetail>`,
  ).join("");
  const xbrl = `<x:xbrl xmlns:x="http://www.xbrl.org/2003/instance" xmlns:c="http://www.xbrl.org/int/gl/cor/2006-10-25" xmlns:b="http://www.xbrl.org/int/gl/bus/2006-10-25"><x:context id="context-1"><x:entity><x:identifier scheme="urn:synthetic">1111111111</x:identifier></x:entity><c:uniqueID>SYNTHETIC-CONTEXT</c:uniqueID><b:numberOfEntries>1</b:numberOfEntries></x:context><c:accountingEntries><c:documentInfo><c:entriesType>${type}</c:entriesType><c:uniqueID>${id}</c:uniqueID><c:periodCoveredStart>2026-11-01</c:periodCoveredStart><c:periodCoveredEnd>2026-11-30</c:periodCoveredEnd></c:documentInfo><b:organizationIdentifiers><b:organizationDescription>Ticaret Unvanı</b:organizationDescription><b:organizationIdentifier>Sentetik İşletme</b:organizationIdentifier></b:organizationIdentifiers><c:entryHeader><c:postingDate>2026-11-07</c:postingDate><c:documentReference>FIS-001</c:documentReference>${details}</c:entryHeader></c:accountingEntries></x:xbrl>`;
  return wrapper
    ? `<e:${kind} xmlns:e="http://www.edefter.gov.tr">${xbrl}</e:${kind}>`
    : xbrl;
}

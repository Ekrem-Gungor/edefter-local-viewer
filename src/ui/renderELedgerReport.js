const numberFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Arayüz öğesi bulunamadı: #${id}`);
  }

  return element;
}

function displayValue(value) {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

function formatDate(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return displayValue(value);
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

function formatPeriod(start, end) {
  if (!start && !end) {
    return "-";
  }

  return `${formatDate(start)} – ${formatDate(end)}`;
}

function formatAmount(value) {
  return numberFormatter.format(Number(value) || 0);
}

function setText(id, value) {
  getElement(id).textContent = displayValue(value);
}

function renderDetailRows(targetId, rows) {
  const target = getElement(targetId);
  const fragment = document.createDocumentFragment();

  rows.forEach(([label, value]) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    const cell = document.createElement("td");

    heading.scope = "row";
    heading.textContent = label;
    cell.textContent = displayValue(value);
    row.append(heading, cell);
    fragment.append(row);
  });

  target.replaceChildren(fragment);
}

function renderAccounts(accounts) {
  const target = getElement("account-rows");
  const fragment = document.createDocumentFragment();
  const totals = accounts.reduce(
    (current, account) => ({
      debit: current.debit + account.debit,
      credit: current.credit + account.credit,
    }),
    { debit: 0, credit: 0 },
  );

  if (accounts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.className = "empty-cell";
    cell.textContent = "Hesap toplamı kaydı bulunamadı.";
    row.append(cell);
    fragment.append(row);
  } else {
    accounts.forEach((account) => {
      const row = document.createElement("tr");
      const code = document.createElement("td");
      const description = document.createElement("td");
      const debit = document.createElement("td");
      const credit = document.createElement("td");

      code.textContent = displayValue(account.code);
      description.textContent = displayValue(account.description);
      debit.textContent = formatAmount(account.debit);
      credit.textContent = formatAmount(account.credit);
      debit.className = "numeric-cell";
      credit.className = "numeric-cell";
      row.append(code, description, debit, credit);
      fragment.append(row);
    });
  }

  target.replaceChildren(fragment);
  getElement("account-summary").textContent =
    `${accounts.length} hesap · Toplam borç ${formatAmount(totals.debit)} · ` +
    `Toplam alacak ${formatAmount(totals.credit)}`;
}

function renderSignature(prefix, signature, { includeAuthority = false } = {}) {
  const state = getElement(`${prefix}-signature-state`);
  const stateText = signature.present ? "XML içinde bulundu" : "Bulunamadı";

  state.textContent = stateText;
  state.dataset.state = signature.present ? "found" : "missing";

  const rows = [
    ["İmzalayan", signature.subject],
    ["İmza zamanı", signature.signingTime],
    ["İmza algoritması", signature.signatureAlgorithm],
    ["Özet algoritması", signature.digestAlgorithm],
  ];

  if (includeAuthority) {
    rows.push([
      "Beyan edilen otorite",
      signature.claimedAuthority === "GIB" ? "Gelir İdaresi Başkanlığı" : "-",
    ]);
  }

  rows.push(
    ["Sertifika veren", signature.issuerName],
    ["Sertifika seri no", signature.serialNumber],
    ["Kriptografik doğrulama", "Yapılmadı"],
  );

  renderDetailRows(`${prefix}-signature-details`, rows);
  setText(`${prefix}-signature-value`, signature.value);
}

function getVerificationMessage(counterSignature) {
  if (!counterSignature.present) {
    return "XML içinde karşı imza bilgisi bulunamadı.";
  }

  if (counterSignature.claimedAuthority === "GIB") {
    return "XML içinde Gelir İdaresi Başkanlığı adına düzenlenmiş karşı imza metadata'sı bulundu. Bu tespit resmi onay veya imza doğrulaması değildir.";
  }

  return "XML içinde karşı imza metadata'sı bulundu; imzalayan otorite doğrulanmadı.";
}

export function renderELedgerReport(fileName, data) {
  setText("selected-file", fileName);
  setText("document-type-badge", data.documentTypeLabel);
  setText("summary-document-type", data.documentTypeLabel);
  setText(
    "summary-period",
    formatPeriod(data.document.periodStart, data.document.periodEnd),
  );
  setText("summary-unique-id", data.document.uniqueId);
  setText("summary-entry-count", data.document.numberOfEntries);

  renderDetailRows("taxpayer-details", [
    [data.taxpayer.identifierType, data.taxpayer.identifier],
    ["Unvan / Ad Soyad", data.taxpayer.title],
    ["Şube", data.taxpayer.branch],
    ["Telefon", data.taxpayer.phone],
    ["Faks", data.taxpayer.fax],
    ["E-posta", data.taxpayer.email],
  ]);

  renderDetailRows("accountant-details", [
    ["Unvan / Ad Soyad", data.accountant.name],
    ["Telefon", data.accountant.phone],
    ["Faks", data.accountant.fax],
    ["E-posta", data.accountant.email],
    ["Sözleşme no", data.accountant.contractNumber],
  ]);

  renderDetailRows("document-details", [
    ["Doküman türü", data.documentTypeLabel],
    ["Dönem", formatPeriod(data.document.periodStart, data.document.periodEnd)],
    ["Tekil numara", data.document.uniqueId],
    ["ETTN", data.document.ettn],
    ["Oluşturma tarihi", formatDate(data.document.creationDate)],
    ["Oluşturan", data.document.creator],
    ["Kaynak uygulama", data.document.sourceApplication],
    [
      "Hesap dönemi",
      formatPeriod(data.document.fiscalYearStart, data.document.fiscalYearEnd),
    ],
    ["Açıklama", data.document.description],
  ]);

  renderAccounts(data.accounts);
  renderSignature("primary", data.signatures.primary);
  renderSignature("counter", data.signatures.counterSignature, {
    includeAuthority: true,
  });
  setText(
    "verification-message",
    getVerificationMessage(data.signatures.counterSignature),
  );

  getElement("report").hidden = false;
}

export function clearELedgerReport() {
  getElement("report").hidden = true;

  [
    "taxpayer-details",
    "accountant-details",
    "document-details",
    "account-rows",
    "primary-signature-details",
    "counter-signature-details",
  ].forEach((id) => getElement(id).replaceChildren());

  getElement("primary-signature-value").textContent = "";
  getElement("counter-signature-value").textContent = "";
  getElement("account-summary").textContent = "";
}

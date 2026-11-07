function escapeCell(value) {
  let cell = String(value ?? "");
  // Keep text cells from being evaluated as spreadsheet formulas.
  if (/^[\s\u0000-\u001f]*[=+@\-]/.test(cell) && !/^-?\d+(\.\d+)?$/.test(cell))
    cell = "'" + cell;
  return '"' + cell.replaceAll('"', '""') + '"';
}

export function makeCSV(doc) {
  const headers = [
    "Satır",
    "Tarih",
    "Ana hesap kodu",
    "Hesap adı",
    "Alt hesap kodu",
    "Alt hesap adı",
    "Açıklama",
    "Fiş no",
    "Belge no",
    "Belge tarihi",
    "Belge türü",
    "Ödeme yöntemi",
    "Borç",
    "Alacak",
  ];
  const rows = doc.rows.map((row) => [
    row.number,
    row.date,
    row.code,
    row.description,
    row.sub,
    row.subName,
    row.comment,
    row.reference,
    row.documentNo,
    row.documentDate,
    row.documentType,
    row.payment,
    row.dc === "D" && row.amount !== null ? row.amount.toFixed(2) : "",
    row.dc === "C" && row.amount !== null ? row.amount.toFixed(2) : "",
  ]);
  return (
    "\ufeff" +
    [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n")
  );
}

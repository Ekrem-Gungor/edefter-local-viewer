export function documentLabel(doc) {
  const base = doc.documentType === "journal" ? "Yevmiye" : "Büyük Defter";
  return doc.kind === "berat"
    ? `${base} Beratı`
    : `${base}${doc.documentType === "journal" ? " Defteri" : ""}`;
}
export function documentTitle(doc) {
  const label = documentLabel(doc);
  if (doc.kind !== "berat" || !doc.signatures.counterSignature.present)
    return label;
  return `${label} • ${doc.signatures.counterSignature.claimedAuthority === "GIB" ? "GİB adına karşı imza bilgisi mevcut" : "Karşı imza bilgisi mevcut"}`;
}

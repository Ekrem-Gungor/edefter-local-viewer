import { XML_NAMESPACES as NS } from "./namespaces.js";

export const all = (root, ns, name) =>
  root ? Array.from(root.getElementsByTagNameNS(ns, name)) : [];
export const first = (root, ns, name) => all(root, ns, name)[0] ?? null;
export const text = (root, ns, name) =>
  first(root, ns, name)?.textContent?.trim() ?? "";
export const child = (root, ns, name) =>
  Array.from(root?.children ?? []).find(
    (node) => node.namespaceURI === ns && node.localName === name,
  ) ?? null;
export const childText = (root, ns, name) =>
  child(root, ns, name)?.textContent?.trim() ?? "";
export function ancestor(node, ns, name) {
  for (
    let parent = node?.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (parent.namespaceURI === ns && parent.localName === name) return parent;
  }
  return null;
}

// The XML structure is authoritative; filenames are only display metadata.
export function ledgerStructure(document) {
  const root = document.documentElement;
  const wrapped =
    root?.namespaceURI === NS.eLedger &&
    ["defter", "berat"].includes(root.localName);
  const xbrl =
    root?.namespaceURI === NS.xbrlInstance && root.localName === "xbrl"
      ? root
      : wrapped
        ? child(root, NS.xbrlInstance, "xbrl")
        : null;
  if (!xbrl) return null;
  // Legacy standalone XBRL documents can omit accountingEntries.
  const accounting = first(xbrl, NS.glCore, "accountingEntries") ?? xbrl;
  const info = first(accounting, NS.glCore, "documentInfo");
  const documentType =
    text(info, NS.glCore, "entriesType") ||
    text(accounting, NS.glCore, "entriesType");
  const details = all(accounting, NS.glCore, "entryDetail");
  const summary =
    details.length > 0 &&
    details.every(
      (detail) => text(detail, NS.glCore, "xbrlInclude") === "period_change",
    );
  return {
    root,
    xbrl,
    accounting,
    info,
    details,
    documentType,
    kind: wrapped ? root.localName : summary ? "berat" : "defter",
  };
}

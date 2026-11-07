import { XML_NAMESPACES as NS } from "../xml/namespaces.js";
import {
  all,
  first,
  text,
  childText,
  ancestor,
} from "../xml/ledgerStructure.js";

export function extractMovements(accounting) {
  return all(accounting, NS.glCore, "entryDetail").map((entry) => {
    const header = ancestor(entry, NS.glCore, "entryHeader");
    const account = first(entry, NS.glCore, "account");
    const inherited = (name) =>
      text(entry, NS.glCore, name) || childText(header, NS.glCore, name);
    const amountSource = text(entry, NS.glCore, "amount");
    const number = Number(amountSource);
    const amount =
      amountSource !== "" && Number.isFinite(number) ? number : null;
    const dc = text(entry, NS.glCore, "debitCreditCode");
    return {
      number: text(entry, NS.glCore, "lineNumber"),
      date: inherited("postingDate"),
      code: text(account, NS.glCore, "accountMainID"),
      description: text(account, NS.glCore, "accountMainDescription"),
      sub: text(account, NS.glCore, "accountSubID"),
      subName: text(account, NS.glCore, "accountSubDescription"),
      amount,
      dc,
      debit: amount !== null && dc === "D" ? amount : 0,
      credit: amount !== null && dc === "C" ? amount : 0,
      comment:
        text(entry, NS.glCore, "detailComment") ||
        childText(header, NS.glCore, "entryComment"),
      documentNo: inherited("documentNumber"),
      documentDate: inherited("documentDate"),
      documentType:
        inherited("documentTypeDescription") || inherited("documentType"),
      reference: inherited("documentReference"),
      payment:
        text(entry, NS.glBusiness, "paymentMethod") ||
        text(entry, NS.glCore, "paymentMethod"),
      summaryFlag: text(entry, NS.glCore, "xbrlInclude"),
    };
  });
}

export function aggregateAccounts(rows, kind) {
  const accounts = new Map();
  for (const row of rows) {
    if (!row.code || (kind === "berat" && row.summaryFlag !== "period_change"))
      continue;
    const account = accounts.get(row.code) ?? {
      code: row.code,
      description: row.description,
      debit: 0,
      credit: 0,
    };
    account.debit += row.debit;
    account.credit += row.credit;
    accounts.set(row.code, account);
  }
  return [...accounts.values()].sort((a, b) =>
    a.code.localeCompare(b.code, "tr", { numeric: true }),
  );
}

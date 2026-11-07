import { byId, pretty, money, date, period, addText, setText } from "./dom.js";
import { documentLabel, documentTitle } from "../parser/documentLabels.js";
export const PAGE_SIZE = 60;

function tableFields(id, fields) {
  const body = byId(id);
  const frag = document.createDocumentFragment();
  for (const [title, value] of fields) {
    const tr = document.createElement("tr");
    addText(tr, "th", title).scope = "row";
    addText(tr, "td", pretty(value));
    frag.append(tr);
  }
  body.replaceChildren(frag);
}
export function drawAccounts(doc) {
  const body = byId("account-rows");
  const frag = document.createDocumentFragment();
  setText("total-debit", money(doc.total.debit));
  setText("total-credit", money(doc.total.credit));
  byId("account-heading").textContent =
    doc.kind === "berat" ? "Berat hesap özeti" : "Hesap toplamları";
  byId("account-heading-info").textContent = `${doc.accounts.length} hesap`;
  const statement =
    doc.kind === "berat"
      ? "Bu tutarlar berat XML dosyasındaki dönem değişimi özet kayıtlarından hesaplanmıştır. Tam defterin borç/alacak toplamı olarak yorumlanmamalıdır."
      : "Bu tutarlar seçili defter XML dosyasındaki muhasebe hareketlerinden hesaplanmıştır.";
  byId("account-notice").textContent =
    doc.kind === "berat"
      ? "Bu belge muhasebe hareketlerinin tamamını değil, berat amaçlı özet kayıtları içerir. Ayrıntılı yevmiye veya büyük defter hareketleri için ilgili Y/K XML dosyasını açın."
      : "Bu belge gerçek defter hareketlerini içerir. Aşağıdaki hareket tablosunda satırları arayabilir ve CSV olarak dışa aktarabilirsiniz.";
  byId("account-footnote").textContent = statement;
  for (const acc of doc.accounts) {
    const tr = document.createElement("tr");
    addText(tr, "td", acc.code);
    addText(tr, "td", acc.description);
    addText(tr, "td", money(acc.debit), "num");
    addText(tr, "td", money(acc.credit), "num");
    frag.append(tr);
  }
  if (!doc.accounts.length) {
    const tr = document.createElement("tr");
    const td = addText(tr, "td", "Belgede hesap özeti bulunamadı.");
    td.colSpan = 4;
    frag.append(tr);
  }
  body.replaceChildren(frag);
}
function drawSignatures(doc) {
  const container = byId("signature-wrap");
  container.replaceChildren();
  const entries = [
    ["Belgeyi imzalayan", doc.signatures.primary],
    ["Karşı imza bilgileri", doc.signatures.counterSignature],
  ];
  for (const [label, sig] of entries) {
    const slab = document.createElement("div");
    slab.className = "signature-slab";
    const hdr = document.createElement("div");
    hdr.className = "signature-name";
    addText(hdr, "span", label);
    addText(
      hdr,
      "span",
      sig.present ? "XML içinde mevcut" : "Bulunamadı",
      "badge" + (sig.present ? " ok" : ""),
    );
    slab.append(hdr);
    if (sig.present) {
      const grid = document.createElement("div");
      grid.className = "signature-grid";
      for (const [k, v] of [
        ["İmzalayan:", sig.subject],
        ["İmza zamanı:", sig.signingTime],
        ["İmza algoritması:", sig.signatureAlgorithm],
        ["Özet algoritması:", sig.digestAlgorithm],
        ["Sertifika veren:", sig.issuerName],
        ["Sertifika seri numarası:", sig.serialNumber],
      ]) {
        const d = document.createElement("div");
        addText(d, "b", k + " ");
        addText(d, "span", pretty(v));
        grid.append(d);
      }
      slab.append(grid);
      if (sig.value) {
        const details = document.createElement("details");
        details.className = "signature-value";
        addText(details, "summary", "İmza değerini göster");
        addText(details, "pre", sig.value);
        slab.append(details);
      }
    }
    container.append(slab);
  }
  if (doc.signatures.detached) {
    const slab = document.createElement("div");
    slab.className = "signature-slab";
    const det = document.createElement("details");
    det.className = "signature-value";
    addText(
      det,
      "summary",
      "Berat içindeki defter imza değerini göster (ayrı kayıt)",
    );
    addText(det, "pre", doc.signatures.detached);
    slab.append(det);
    container.append(slab);
  }
}
export function getFilteredRows(doc, query = "") {
  if (!query) return doc.rows;
  const q = query.toLocaleLowerCase("tr-TR");
  return doc.rows.filter((r) =>
    [
      r.number,
      r.date,
      r.code,
      r.sub,
      r.description,
      r.subName,
      r.comment,
      r.documentNo,
      r.documentDate,
      r.documentType,
      r.reference,
      r.payment,
      r.summaryFlag,
    ].some((value) => String(value).toLocaleLowerCase("tr-TR").includes(q)),
  );
}
export function drawMovements(
  doc,
  { query = "", page = 0, print = false } = {},
) {
  const all = print ? doc.rows : getFilteredRows(doc, query);
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  page = Math.max(0, Math.min(page, pageCount - 1));
  const start = page * PAGE_SIZE;
  const selected = print ? all : all.slice(start, start + PAGE_SIZE);
  const body = byId("movement-rows");
  const frag = document.createDocumentFragment();
  byId("movement-heading").textContent =
    doc.kind === "berat" ? "Berat özet kayıtları" : "Muhasebe hareketleri";
  byId("movement-count").textContent = `${doc.rows.length} kayıt`;
  byId("movement-search").value = query;
  for (const row of selected) {
    const tr = document.createElement("tr");
    const account = [row.code, row.sub].filter(Boolean).join(" / ");
    const description = [row.description, row.subName]
      .filter(Boolean)
      .join(" · ");
    addText(tr, "td", row.number || "—");
    addText(tr, "td", row.date ? date(row.date) : "—");
    const code = addText(tr, "td", account || "—");
    if (description) addText(code, "div", description, "mini");
    const detail = addText(
      tr,
      "td",
      row.comment ||
        row.documentType ||
        (row.summaryFlag === "period_change"
          ? "Dönem değişimi özeti"
          : row.summaryFlag === "beginning_balance"
            ? "Açılış bakiyesi"
            : row.summaryFlag
              ? "Özet kaydı"
              : "—"),
    );
    if (row.documentNo || row.reference || row.documentType || row.payment) {
      const secondary = [
        row.documentType,
        row.documentNo && `No: ${row.documentNo}`,
        row.reference && `Fiş: ${row.reference}`,
        row.payment,
      ]
        .filter(Boolean)
        .join(" · ");
      addText(detail, "div", secondary, "mini");
    }
    addText(
      tr,
      "td",
      row.dc === "D" && row.amount !== null ? money(row.debit) : "—",
      "num",
    );
    addText(
      tr,
      "td",
      row.dc === "C" && row.amount !== null ? money(row.credit) : "—",
      "num",
    );
    frag.append(tr);
  }
  if (!selected.length) {
    const tr = document.createElement("tr");
    const td = addText(tr, "td", "Aramanıza uygun kayıt bulunamadı.");
    td.colSpan = 6;
    frag.append(tr);
  }
  body.replaceChildren(frag);
  byId("movement-page-info").textContent =
    `${all.length} kayıt · Sayfa ${page + 1} / ${pageCount}`;
  byId("prev-page").disabled = page === 0;
  byId("next-page").disabled = page >= pageCount - 1;
  return { page, pageCount };
}

export function renderELedgerReport(fileName, doc, { origin = "" } = {}) {
  byId("report").classList.remove("hidden");
  byId("no-report").classList.add("hidden");
  setText("report-name", documentTitle(doc));
  setText("report-file", `${fileName}${origin ? ` · ZIP: ${origin}` : ""}`);
  const badge = byId("report-badge");
  badge.textContent = doc.kind === "berat" ? "BERAT" : "DEFTER";
  badge.className = "pill" + (doc.kind === "defter" ? " ledger" : "");
  setText("stat-type", documentLabel(doc));
  setText(
    "stat-period",
    period(doc.document.periodStart, doc.document.periodEnd),
  );
  byId("stat-lines-label").textContent =
    doc.kind === "berat" ? "Berat özet kaydı" : "Muhasebe hareket satırı";
  setText("stat-lines", doc.rows.length);
  setText("stat-id", doc.document.uniqueId);
  tableFields("taxpayer-fields", [
    [doc.taxpayer.identifierType, doc.taxpayer.identifier],
    ["Unvan / Ad soyad", doc.taxpayer.title],
    ["Şube", doc.taxpayer.branch],
    ["Telefon", doc.taxpayer.phone],
    ["Faks", doc.taxpayer.fax],
    ["E-posta", doc.taxpayer.email],
  ]);
  tableFields("accountant-fields", [
    ["Unvan / Ad soyad", doc.accountant.name],
    ["Telefon", doc.accountant.phone],
    ["Faks", doc.accountant.fax],
    ["E-posta", doc.accountant.email],
    ["Sözleşme", doc.accountant.contractNumber],
  ]);
  const info = doc.document;
  const numEntries =
    info.numberOfEntries ||
    (doc.documentType === "journal" && doc.kind === "defter"
      ? String(info.headerCount)
      : "");
  tableFields("document-fields", [
    ["Belgenin içeriği", documentLabel(doc)],
    ["Dönem", period(info.periodStart, info.periodEnd)],
    ["Belge tekil numarası", info.uniqueId],
    ["Bağlam tekil numarası", info.ettn],
    ["Oluşturulma tarihi", date(info.creationDate)],
    ["Oluşturan", info.creator],
    ["Kaynak uygulama", info.sourceApplication],
    ["Hesap dönemi", period(info.fiscalYearStart, info.fiscalYearEnd)],
    [
      doc.documentType === "journal"
        ? "Yevmiye maddesi sayısı"
        : "Belge maddesi bilgisi",
      numEntries,
    ],
    ["Kayıt grubu sayısı (XML)", info.headerCount],
    ["Açıklama", info.description],
    [
      "GİB karşı imza bilgisi",
      doc.signatures.counterSignature.claimedAuthority === "GIB"
        ? "Var (doğrulanmadı)"
        : doc.signatures.counterSignature.present
          ? "Karşı imza var (otorite doğrulanmadı)"
          : "Yok",
    ],
  ]);
  drawAccounts(doc);
  drawMovements(doc);
  drawSignatures(doc);
  byId("raw-xml-details").open = false;
  byId("raw-xml").textContent = "";
}
export function clearELedgerReport() {
  byId("report").classList.add("hidden");
  byId("no-report").classList.remove("hidden");
  for (const id of [
    "taxpayer-fields",
    "accountant-fields",
    "document-fields",
    "account-rows",
    "movement-rows",
    "signature-wrap",
  ])
    byId(id).replaceChildren();
  byId("raw-xml-details").open = false;
  byId("raw-xml").textContent = "";
}

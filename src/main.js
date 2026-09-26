import "./styles.css";
import { extractELedgerData } from "./parser/extractELedgerData.js";
import {
  DEFAULT_MAX_XML_BYTES,
  parseELedgerXml,
} from "./xml/parseELedgerXml.js";

const elements = Object.freeze({
  fileInput: document.querySelector("#xml-file"),
  status: document.querySelector("#status"),
  summary: document.querySelector("#summary"),
  selectedFile: document.querySelector("#selected-file"),
  documentType: document.querySelector("#document-type"),
  taxpayerTitle: document.querySelector("#taxpayer-title"),
  documentPeriod: document.querySelector("#document-period"),
  accountCount: document.querySelector("#account-count"),
  signatureNotice: document.querySelector("#signature-notice"),
});

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function formatPeriod(start, end) {
  if (!start && !end) {
    return "-";
  }

  return `${start || "-"} – ${end || "-"}`;
}

function getSignatureNotice(signatures) {
  if (!signatures.counterSignature.present) {
    return "XML içinde karşı imza bilgisi bulunamadı. Kriptografik doğrulama yapılmadı.";
  }

  if (signatures.counterSignature.claimedAuthority === "GIB") {
    return "XML içinde GİB adına düzenlenmiş karşı imza bilgisi bulundu. Bu ifade kriptografik veya resmi doğrulama sonucu değildir.";
  }

  return "XML içinde karşı imza bilgisi bulundu. İmzanın sahibi ve geçerliliği doğrulanmadı.";
}

function renderSummary(file, data) {
  elements.selectedFile.textContent = file.name;
  elements.documentType.textContent = data.documentTypeLabel;
  elements.taxpayerTitle.textContent = data.taxpayer.title || "-";
  elements.documentPeriod.textContent = formatPeriod(
    data.document.periodStart,
    data.document.periodEnd,
  );
  elements.accountCount.textContent = String(data.accounts.length);
  elements.signatureNotice.textContent = getSignatureNotice(data.signatures);
  elements.summary.hidden = false;
}

function clearSummary() {
  elements.summary.hidden = true;
}

async function handleFileSelection(event) {
  const [file] = event.target.files;

  if (!file) {
    clearSummary();
    setStatus("Henüz bir dosya seçilmedi.");
    return;
  }

  clearSummary();

  if (file.size > DEFAULT_MAX_XML_BYTES) {
    setStatus("XML dosyası izin verilen 10 MiB sınırını aşıyor.", "error");
    return;
  }

  setStatus("XML dosyası cihazınızda işleniyor…", "progress");

  try {
    const xmlSource = await file.text();
    const parsed = parseELedgerXml(xmlSource);
    const data = extractELedgerData(parsed.document);

    renderSummary(file, data);
    setStatus("Dosya başarıyla yerel olarak işlendi.", "success");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "XML dosyası işlenirken beklenmeyen bir hata oluştu.";

    setStatus(message, "error");
  }
}

elements.fileInput.addEventListener("change", handleFileSelection);

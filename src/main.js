import "./styles.css";
import { extractELedgerData } from "./parser/extractELedgerData.js";
import {
  clearELedgerReport,
  renderELedgerReport,
} from "./ui/renderELedgerReport.js";
import {
  DEFAULT_MAX_XML_BYTES,
  parseELedgerXml,
} from "./xml/parseELedgerXml.js";

const elements = Object.freeze({
  fileInput: document.querySelector("#xml-file"),
  dropZone: document.querySelector("#drop-zone"),
  selectFile: document.querySelector("#select-file"),
  resetViewer: document.querySelector("#reset-viewer"),
  printReport: document.querySelector("#print-report"),
  status: document.querySelector("#status"),
});

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function setBusy(isBusy) {
  elements.fileInput.disabled = isBusy;
  elements.dropZone.disabled = isBusy;
  elements.selectFile.disabled = isBusy;
}

function setReportActionsEnabled(isEnabled) {
  elements.resetViewer.disabled = !isEnabled;
  elements.printReport.disabled = !isEnabled;
}

function isXmlFile(file) {
  return file.name.toLocaleLowerCase("tr-TR").endsWith(".xml");
}

function resetViewer() {
  elements.fileInput.value = "";
  clearELedgerReport();
  setReportActionsEnabled(false);
  setStatus("Henüz bir dosya seçilmedi.");
}

async function processFile(file) {
  clearELedgerReport();
  setReportActionsEnabled(false);

  if (!isXmlFile(file)) {
    setStatus("Yalnızca .xml uzantılı dosyalar desteklenir.", "error");
    return;
  }

  if (file.size > DEFAULT_MAX_XML_BYTES) {
    setStatus("XML dosyası izin verilen 10 MiB sınırını aşıyor.", "error");
    return;
  }

  setBusy(true);
  setStatus("XML dosyası cihazınızda işleniyor…", "progress");

  try {
    const xmlSource = await file.text();
    const parsed = parseELedgerXml(xmlSource);
    const data = extractELedgerData(parsed.document);

    renderELedgerReport(file.name, data);
    setReportActionsEnabled(true);
    setStatus("Dosya başarıyla yerel olarak işlendi.", "success");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "XML dosyası işlenirken beklenmeyen bir hata oluştu.";

    setStatus(message, "error");
  } finally {
    setBusy(false);
  }
}

function openFilePicker() {
  elements.fileInput.click();
}

elements.fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;

  if (file) {
    void processFile(file);
  }
});

elements.dropZone.addEventListener("click", openFilePicker);
elements.selectFile.addEventListener("click", openFilePicker);
elements.resetViewer.addEventListener("click", resetViewer);
elements.printReport.addEventListener("click", () => window.print());

elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("drop-zone--active");
});

elements.dropZone.addEventListener("dragleave", () => {
  elements.dropZone.classList.remove("drop-zone--active");
});

elements.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("drop-zone--active");

  const [file] = event.dataTransfer.files;

  if (file) {
    void processFile(file);
  }
});

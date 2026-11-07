import { createDocumentStore } from "../import/documentStore.js";
import { documentTitle } from "../parser/documentLabels.js";
import { byId, addText, period } from "../ui/dom.js";
import {
  renderELedgerReport,
  clearELedgerReport,
  drawMovements,
} from "../ui/renderELedgerReport.js";
import { makeCSV } from "../export/makeCSV.js";
import { downloadBlob } from "../export/downloadBlob.js";

export function createViewer({
  store = createDocumentStore(),
  download = downloadBlob,
} = {}) {
  const state = {
      selected: null,
      page: 0,
      query: "",
      busy: false,
      printing: false,
    },
    listeners = [];
  function listen(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  }
  function status(message, tone = "neutral") {
    byId("status").textContent = message;
    byId("status").dataset.tone = tone;
  }
  function setBusy(value) {
    state.busy = value;
    for (const id of ["file-input", "pick", "drop-zone", "clear"])
      byId(id).disabled = value || (id === "clear" && !store.docs.length);
  }
  function updateList() {
    const list = byId("file-list");
    list.replaceChildren();
    byId("file-count").textContent = String(store.docs.length);
    byId("loaded-count").textContent = store.docs.length
      ? `${store.docs.length} belge yüklendi`
      : "Henüz belge yüklenmedi";
    byId("clear").disabled = state.busy || !store.docs.length;
    if (!store.docs.length)
      addText(
        list,
        "p",
        "Seçtiğiniz belgeler burada listelenecek.",
        "empty-side",
      );
    for (const doc of store.docs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "file-item" + (state.selected === doc ? " active" : "");
      button.setAttribute("aria-pressed", String(state.selected === doc));
      addText(button, "span", doc.name, "filename");
      addText(button, "span", documentTitle(doc), "desc");
      addText(
        button,
        "span",
        period(doc.document.periodStart, doc.document.periodEnd) +
          (doc.origin ? ` · ${doc.origin}` : ""),
        "period",
      );
      button.addEventListener("click", () => select(doc));
      list.append(button);
    }
  }
  function select(doc) {
    Object.assign(state, {
      selected: doc,
      query: "",
      page: 0,
      printing: false,
    });
    renderELedgerReport(doc.name, doc, { origin: doc.origin });
    updateList();
  }
  async function importFiles(files) {
    if (state.busy || !files?.length) return;
    setBusy(true);
    try {
      const result = await store.importFiles(files, {
        onProgress: (message) => status(message, "progress"),
      });
      if (result.firstChanged) select(result.firstChanged);
      const errors = byId("errors-list");
      errors.replaceChildren();
      for (const error of result.errors) addText(errors, "li", error);
      byId("errors-panel").classList.toggle("hidden", !result.errors.length);
      const changed = result.added + result.updated;
      status(
        changed
          ? `${result.added} yeni belge açıldı, ${result.updated} belge güncellendi.${result.errors.length ? " Bazı dosyalar atlandı." : ""}`
          : result.errors.length
            ? "Dosyalar açılamadı; ayrıntıları aşağıda görüntüleyebilirsiniz."
            : "Yeni belge eklenmedi; aynı içerikteki dosyalar zaten yüklü.",
        changed ? "success" : result.errors.length ? "error" : "neutral",
      );
      return result;
    } finally {
      setBusy(false);
      updateList();
    }
  }
  function clear() {
    if (state.busy) return;
    store.clear();
    Object.assign(state, {
      selected: null,
      page: 0,
      query: "",
      printing: false,
    });
    byId("file-input").value = "";
    clearELedgerReport();
    byId("errors-list").replaceChildren();
    byId("errors-panel").classList.add("hidden");
    updateList();
    status("Tüm belgeler temizlendi.");
  }
  function draw() {
    if (state.selected) state.page = drawMovements(state.selected, state).page;
  }
  function preparePrint() {
    if (state.selected) {
      state.printing = true;
      drawMovements(state.selected, { print: true });
    }
  }
  function finishPrint() {
    if (state.printing) {
      state.printing = false;
      draw();
    }
  }
  listen(byId("pick"), "click", () => byId("file-input").click());
  listen(byId("drop-zone"), "click", () => byId("file-input").click());
  listen(byId("file-input"), "change", (event) => {
    void importFiles(event.target.files);
    event.target.value = "";
  });
  listen(byId("drop-zone"), "dragover", (event) => {
    event.preventDefault();
    byId("drop-zone").classList.add("dragging");
  });
  listen(byId("drop-zone"), "dragleave", () =>
    byId("drop-zone").classList.remove("dragging"),
  );
  listen(byId("drop-zone"), "drop", (event) => {
    event.preventDefault();
    byId("drop-zone").classList.remove("dragging");
    void importFiles(event.dataTransfer.files);
  });
  listen(byId("clear"), "click", clear);
  listen(byId("print"), "click", () => {
    preparePrint();
    window.print();
  });
  listen(window, "beforeprint", preparePrint);
  listen(window, "afterprint", finishPrint);
  listen(byId("movement-search"), "input", (event) => {
    state.query = event.target.value;
    state.page = 0;
    draw();
  });
  listen(byId("prev-page"), "click", () => {
    state.page = Math.max(0, state.page - 1);
    draw();
  });
  listen(byId("next-page"), "click", () => {
    state.page++;
    draw();
  });
  listen(byId("export-csv"), "click", () => {
    if (state.selected)
      download(
        new Blob([makeCSV(state.selected)], { type: "text/csv;charset=utf-8" }),
        state.selected.name.replace(/\.xml$/i, "") + "-hareketler.csv",
      );
  });
  listen(byId("download-xml"), "click", () => {
    if (state.selected)
      download(
        new Blob([state.selected.sourceBytes], { type: "application/xml" }),
        state.selected.name,
      );
  });
  listen(byId("raw-xml-details"), "toggle", (event) => {
    if (!event.target.open || !state.selected) return;
    const raw = state.selected.raw;
    byId("raw-xml").textContent =
      raw.slice(0, 80000) +
      (raw.length > 80000
        ? "\n\n[… Devamı için orijinal XML dosyasını indirin …]"
        : "");
  });
  updateList();
  return {
    state,
    store,
    select,
    importFiles,
    clear,
    dispose() {
      for (const remove of listeners) remove();
    },
  };
}

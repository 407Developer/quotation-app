import { computeFlooring, getFlooringPrices } from "./js/calc.js";
import { buildFlooringItem } from "./js/model.js";
import {
  addItem,
  getGrandTotal,
  getItems,
  hasPlaceName,
  removeItem,
  setItems,
} from "./js/state.js";
import {
  deleteQuotation,
  getQuotation,
  loadSavedQuotations,
  renameQuotation,
  saveQuotation,
} from "./js/storage.js";
import { buildAreaCard, setTitle, setTitleText, updateGrandTotal } from "./js/ui.js";

const formEls = {
  userName: document.getElementById("userName"),
  placeName: document.getElementById("placeName"),
  length: document.getElementById("length"),
  breadth: document.getElementById("breadth"),
  doors: document.getElementById("doors"),
  skirtingNeeded: document.getElementById("skirtingNeeded"),
  floorType: document.getElementById("floorType"),
  price: document.getElementById("price"),
  gumPrice: document.getElementById("gumPrice"),
  doorProfilePrice: document.getElementById("doorProfilePrice"),
};

const areasContainer = document.getElementById("areasContainer");
const addAreaBtn = document.getElementById("addAreaBtn");
const printBtn = document.getElementById("printBtn");
const saveQuoteBtn = document.getElementById("saveQuoteBtn");
const historyList = document.getElementById("historyList");
const historyToggleBtn = document.getElementById("historyToggleBtn");
const historySheet = document.getElementById("historySheet");
const historyOverlay = document.getElementById("historyOverlay");
const historyHandle = document.getElementById("historyHandle");

let sheetDrag = null;

function readInputs() {
  return {
    userName: formEls.userName.value.trim(),
    placeName: formEls.placeName.value.trim(),
    length: parseFloat(formEls.length.value),
    breadth: parseFloat(formEls.breadth.value),
    doors: parseInt(formEls.doors.value, 10) || 0,
    skirtingNeeded: formEls.skirtingNeeded.value,
    floorType: formEls.floorType.value,
    price: parseFloat(formEls.price.value),
    gumPrice: parseFloat(formEls.gumPrice.value),
    doorProfilePrice: parseFloat(formEls.doorProfilePrice.value) || 0,
  };
}

function clearInputs() {
  formEls.placeName.value = "";
  formEls.length.value = "";
  formEls.breadth.value = "";
  formEls.doors.value = "";
  formEls.placeName.focus();
}

function validateInputs({ placeName, length, breadth }) {
  if (!placeName || Number.isNaN(length) || Number.isNaN(breadth)) {
    alert("Please fill in place name, length, and breadth correctly.");
    return false;
  }

  if (hasPlaceName(placeName)) {
    alert("This place has already been added to the quotation.");
    return false;
  }

  return true;
}

function addArea() {
  const inputs = readInputs();
  if (!validateInputs(inputs)) return;

  setTitle(inputs.userName);

  const prices = getFlooringPrices({
    floorType: inputs.floorType,
    floorPrice: inputs.price,
    gumPrice: inputs.gumPrice,
    doorProfilePrice: inputs.doorProfilePrice,
  });

  const calculated = computeFlooring({
    length: inputs.length,
    breadth: inputs.breadth,
    doors: inputs.doors,
    skirtingNeeded: inputs.skirtingNeeded,
    floorType: inputs.floorType,
    prices,
  });

  const item = buildFlooringItem(inputs, calculated, prices);
  item.id = addItem(item);

  updateGrandTotal(getGrandTotal());

  const card = buildAreaCard(item);
  areasContainer.appendChild(card);

  clearInputs();
}

function removeArea(card) {
  const name = card.dataset.name;
  const id = Number(card.dataset.id);
  if (!confirm("Remove " + name + " from quotation?")) return;

  card.remove();
  removeItem(id);
  updateGrandTotal(getGrandTotal());
}

function getQuotationTitle() {
  const inputTitle = formEls.userName.value.trim();
  if (inputTitle) return "Quotation for " + inputTitle;
  const headerTitle = document.getElementById("quotationTitle").innerText.trim();
  return headerTitle || "Quotation";
}

function buildQuotationPayload() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: getQuotationTitle(),
    dateISO: new Date().toISOString(),
    items: JSON.parse(JSON.stringify(getItems())),
    total: getGrandTotal(),
  };
}

function renderAllItems(items) {
  areasContainer.innerHTML = "";
  items.forEach((item) => {
    const card = buildAreaCard(item);
    areasContainer.appendChild(card);
  });
}

function renderHistory(list) {
  historyList.innerHTML = "";
  if (list.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-item";
    empty.innerHTML = `<div><p class="history-item-title">No saved quotations</p><p class="history-item-meta">Save to keep a copy on this device.</p></div>`;
    historyList.appendChild(empty);
    return;
  }

  list.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.dataset.id = item.id;

    const date = new Date(item.dateISO);
    const meta = `${date.toLocaleDateString()} • ${item.items.length} items • ₦${item.total.toLocaleString()}`;

    li.innerHTML = `
      <div>
        <p class="history-item-title">${item.title}</p>
        <p class="history-item-meta">${meta}</p>
      </div>
      <div class="history-actions">
        <button class="history-btn" data-action="load">Load</button>
        <button class="history-btn" data-action="rename">Rename</button>
        <button class="history-btn" data-action="delete">Delete</button>
      </div>
    `;

    historyList.appendChild(li);
  });
}

function handleSaveQuotation() {
  if (getGrandTotal() <= 0) {
    alert("Add at least one item before saving.");
    return;
  }

  const payload = buildQuotationPayload();
  const list = saveQuotation(payload);
  renderHistory(list);
}

function loadQuotation(id) {
  const quote = getQuotation(id);
  if (!quote) return;

  setItems(quote.items);
  renderAllItems(quote.items);
  updateGrandTotal(getGrandTotal());
  setTitleText(quote.title);
}

function handleHistoryAction(event) {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const item = btn.closest(".history-item");
  if (!item) return;
  const id = item.dataset.id;
  const action = btn.dataset.action;

  if (action === "load") {
    loadQuotation(id);
    return;
  }

  if (action === "delete") {
    if (!confirm("Delete this saved quotation?")) return;
    const list = deleteQuotation(id);
    renderHistory(list);
    return;
  }

  if (action === "rename") {
    const next = prompt("New title for this quotation?");
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    const list = renameQuotation(id, trimmed);
    renderHistory(list);
  }
}

function setSheetTranslate(valuePx) {
  historySheet.style.setProperty("--sheet-translate", `${valuePx}px`);
}

function getSheetHeight() {
  return historySheet.getBoundingClientRect().height;
}

function openHistorySheet() {
  historySheet.classList.add("is-open");
  historyOverlay.classList.add("is-open");
  historySheet.setAttribute("aria-hidden", "false");
  historyOverlay.setAttribute("aria-hidden", "false");
  setSheetTranslate(0);
}

function closeHistorySheet() {
  historySheet.classList.remove("is-open");
  historyOverlay.classList.remove("is-open");
  historySheet.setAttribute("aria-hidden", "true");
  historyOverlay.setAttribute("aria-hidden", "true");
  setSheetTranslate(getSheetHeight());
}

function toggleHistorySheet() {
  if (historySheet.classList.contains("is-open")) {
    closeHistorySheet();
  } else {
    openHistorySheet();
  }
}

function handleSheetPointerDown(event) {
  const target = event.target.closest("#historyHandle, .history-header");
  if (!target) return;
  const startY = event.clientY;
  sheetDrag = {
    startY,
    startTranslate: historySheet.classList.contains("is-open") ? 0 : getSheetHeight(),
  };
  historySheet.style.transition = "none";
  historySheet.setPointerCapture(event.pointerId);
}

function handleSheetPointerMove(event) {
  if (!sheetDrag) return;
  const delta = event.clientY - sheetDrag.startY;
  const height = getSheetHeight();
  const next = Math.min(Math.max(sheetDrag.startTranslate + delta, 0), height);
  setSheetTranslate(next);
}

function handleSheetPointerUp(event) {
  if (!sheetDrag) return;
  historySheet.releasePointerCapture(event.pointerId);
  historySheet.style.transition = "";
  const height = getSheetHeight();
  const current = parseFloat(
    getComputedStyle(historySheet).getPropertyValue("--sheet-translate")
  );
  sheetDrag = null;
  if (current > height * 0.35) {
    closeHistorySheet();
  } else {
    openHistorySheet();
  }
}

addAreaBtn.addEventListener("click", addArea);
printBtn.addEventListener("click", () => window.print());
saveQuoteBtn.addEventListener("click", handleSaveQuotation);
historyToggleBtn.addEventListener("click", toggleHistorySheet);
historyOverlay.addEventListener("click", closeHistorySheet);
historySheet.addEventListener("pointerdown", handleSheetPointerDown);
historySheet.addEventListener("pointermove", handleSheetPointerMove);
historySheet.addEventListener("pointerup", handleSheetPointerUp);
historySheet.addEventListener("pointercancel", handleSheetPointerUp);

areasContainer.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action='remove']");
  if (!btn) return;
  const card = btn.closest(".area-card");
  if (!card) return;
  removeArea(card);
});

historyList.addEventListener("click", handleHistoryAction);

function init() {
  updateGrandTotal(getGrandTotal());
  renderHistory(loadSavedQuotations());
  closeHistorySheet();
}

init();

import {
  computeFlooring,
  computePaint,
  computeTiles,
  computeWallpaper,
  getTileArea,
  getFlooringPrices,
  getPaintPrices,
  getTilePrices,
  getWallpaperRollCoverage,
  getWallpaperPrices,
} from "./js/calc.js";
import { buildCustomItem, buildFlooringItem, buildGuidedItem } from "./js/model.js";
import {
  addItem,
  getGrandTotal,
  getItems,
  hasPlaceName,
  removeItem,
  setItems,
  updateItem,
} from "./js/state.js";
import {
  deleteQuotation,
  getQuotation,
  loadSavedQuotations,
  renameQuotation,
  saveQuotation,
} from "./js/storage.js";
import { buildItemCard, setTitle, setTitleText, updateGrandTotal } from "./js/ui.js";

const formEls = {
  userName: document.getElementById("userName"),
  placeName: document.getElementById("placeName"),
  length: document.getElementById("length"),
  breadth: document.getElementById("breadth"),
  areaInput: document.getElementById("areaInput"),
  inputStyle: document.getElementById("inputStyle"),
  guidedCategory: document.getElementById("guidedCategory"),
  guidedQty: document.getElementById("guidedQty"),
  guidedUnit: document.getElementById("guidedUnit"),
  doors: document.getElementById("doors"),
  skirtingNeeded: document.getElementById("skirtingNeeded"),
  floorType: document.getElementById("floorType"),
  price: document.getElementById("price"),
  gumPrice: document.getElementById("gumPrice"),
  doorProfilePrice: document.getElementById("doorProfilePrice"),
  tilePrice: document.getElementById("tilePrice"),
  tileSize: document.getElementById("tileSize"),
  paintPrice: document.getElementById("paintPrice"),
  paintCoats: document.getElementById("paintCoats"),
  wallpaperPrice: document.getElementById("wallpaperPrice"),
  wallpaperGluePrice: document.getElementById("wallpaperGluePrice"),
  customName: document.getElementById("customName"),
  customQty: document.getElementById("customQty"),
  customUnit: document.getElementById("customUnit"),
  customUnitPrice: document.getElementById("customUnitPrice"),
  customNotes: document.getElementById("customNotes"),
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
const modeToggle = document.getElementById("modeToggle");
const dimensionsRow = document.getElementById("dimensionsRow");
const areaGroup = document.getElementById("areaGroup");
const quantityRow = document.getElementById("quantityRow");
const flooringConfig = document.getElementById("flooringConfig");
const flooringExtras = document.getElementById("flooringExtras");
const tilesConfig = document.getElementById("tilesConfig");
const paintConfig = document.getElementById("paintConfig");
const wallpaperConfig = document.getElementById("wallpaperConfig");
const lineEditorSection = document.getElementById("lineEditorSection");
const lineEditorBody = document.getElementById("lineEditorBody");
const lineEditorTotal = document.getElementById("lineEditorTotal");
const lineEditorEmpty = document.getElementById("lineEditorEmpty");
const formSection = document.querySelector(".form-section");

let sheetDrag = null;
let editingId = null;
let draftOverrides = {};

function setMode(mode) {
  document.body.dataset.mode = mode;
  modeToggle
    .querySelectorAll(".toggle-btn")
    .forEach((btn) => btn.classList.toggle("is-active", btn.dataset.mode === mode));
  if (mode !== "guided") {
    clearLineEditor();
  } else {
    refreshLineEditor();
  }
}

function getMode() {
  return document.body.dataset.mode || "guided";
}

function setCategory(category) {
  formEls.guidedCategory.value = category;
  flooringConfig.classList.toggle("is-hidden", category !== "flooring");
  flooringExtras.classList.toggle("is-hidden", category !== "flooring");
  tilesConfig.classList.toggle("is-hidden", category !== "tiles");
  paintConfig.classList.toggle("is-hidden", category !== "paint");
  wallpaperConfig.classList.toggle("is-hidden", category !== "wallpaper");
  refreshLineEditor();
}

function setInputStyle(style) {
  formEls.inputStyle.value = style;
  dimensionsRow.classList.toggle("is-hidden", style !== "dimensions");
  areaGroup.classList.toggle("is-hidden", style !== "area");
  quantityRow.classList.toggle("is-hidden", style !== "quantity");
  refreshLineEditor();
}

function readInputs() {
  return {
    userName: formEls.userName.value.trim(),
    placeName: formEls.placeName.value.trim(),
    length: parseFloat(formEls.length.value),
    breadth: parseFloat(formEls.breadth.value),
    areaInput: parseFloat(formEls.areaInput.value),
    inputStyle: formEls.inputStyle.value,
    guidedCategory: formEls.guidedCategory.value,
    guidedQty: parseFloat(formEls.guidedQty.value),
    guidedUnit: formEls.guidedUnit.value.trim(),
    doors: parseInt(formEls.doors.value, 10) || 0,
    skirtingNeeded: formEls.skirtingNeeded.value,
    floorType: formEls.floorType.value,
    price: parseFloat(formEls.price.value),
    gumPrice: parseFloat(formEls.gumPrice.value),
    doorProfilePrice: parseFloat(formEls.doorProfilePrice.value) || 0,
    tilePrice: parseFloat(formEls.tilePrice.value),
    tileSize: parseFloat(formEls.tileSize.value),
    paintPrice: parseFloat(formEls.paintPrice.value),
    paintCoats: parseInt(formEls.paintCoats.value, 10),
    wallpaperPrice: parseFloat(formEls.wallpaperPrice.value),
    wallpaperGluePrice: parseFloat(formEls.wallpaperGluePrice.value),
    customName: formEls.customName.value.trim(),
    customQty: parseFloat(formEls.customQty.value),
    customUnit: formEls.customUnit.value.trim(),
    customUnitPrice: parseFloat(formEls.customUnitPrice.value),
    customNotes: formEls.customNotes.value.trim(),
  };
}

function clearInputs() {
  formEls.placeName.value = "";
  formEls.length.value = "";
  formEls.breadth.value = "";
  formEls.areaInput.value = "";
  formEls.doors.value = "";
  formEls.guidedQty.value = "";
  formEls.guidedUnit.value = "";
  formEls.customName.value = "";
  formEls.customQty.value = "";
  formEls.customUnit.value = "";
  formEls.customUnitPrice.value = "";
  formEls.customNotes.value = "";
  draftOverrides = {};
  clearLineEditor();
  if (getMode() === "custom") {
    formEls.customName.focus();
  } else {
    formEls.placeName.focus();
  }
}

function validateGuidedInputs(inputs, ignoreId = null) {
  if (!inputs.placeName) {
    alert("Please fill in place name.");
    return false;
  }

  if (inputs.inputStyle === "dimensions") {
    if (
      Number.isNaN(inputs.length) ||
      Number.isNaN(inputs.breadth) ||
      inputs.length <= 0 ||
      inputs.breadth <= 0
    ) {
      alert("Please fill in length and breadth correctly.");
      return false;
    }
  }

  if (inputs.inputStyle === "area") {
    if (Number.isNaN(inputs.areaInput) || inputs.areaInput <= 0) {
      alert("Please fill in area correctly.");
      return false;
    }
  }

  if (inputs.inputStyle === "quantity") {
    if (Number.isNaN(inputs.guidedQty) || inputs.guidedQty <= 0) {
      alert("Please fill in quantity correctly.");
      return false;
    }
    if (!inputs.guidedUnit) {
      alert("Please fill in unit.");
      return false;
    }
  }

  if (hasPlaceName(inputs.placeName, ignoreId)) {
    alert("This place has already been added to the quotation.");
    return false;
  }

  return true;
}

function validateCustomInputs(inputs) {
  if (!inputs.customName) {
    alert("Please fill in item name.");
    return false;
  }
  if (Number.isNaN(inputs.customQty) || inputs.customQty <= 0) {
    alert("Please fill in quantity correctly.");
    return false;
  }
  if (Number.isNaN(inputs.customUnitPrice) || inputs.customUnitPrice < 0) {
    alert("Please fill in unit price correctly.");
    return false;
  }
  if (!inputs.customUnit) {
    alert("Please fill in unit.");
    return false;
  }
  return true;
}

function computeArea(inputs) {
  if (inputs.inputStyle === "area") {
    const area = inputs.areaInput;
    const side = Math.sqrt(area || 0);
    return { area, length: side, breadth: side };
  }
  if (inputs.inputStyle === "quantity") {
    const unit = inputs.guidedUnit.toLowerCase();
    if (unit === "sqm" || unit === "m2") {
      return { area: inputs.guidedQty, length: null, breadth: null };
    }
    if (inputs.guidedCategory === "tiles") {
      const tileArea = getTileArea(inputs.tileSize);
      const area = inputs.guidedQty * tileArea;
      return { area, length: null, breadth: null };
    }
    if (inputs.guidedCategory === "wallpaper") {
      const area = inputs.guidedQty * getWallpaperRollCoverage();
      return { area, length: null, breadth: null };
    }
    return { area: null, length: null, breadth: null };
  }
  const area = inputs.length * inputs.breadth;
  return { area, length: inputs.length, breadth: inputs.breadth };
}

function normalizeOverrides(overrides = {}) {
  const normalized = {};
  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof value === "number" && !Number.isNaN(value) && value >= 0) {
      normalized[key] = { subtotal: value };
      return;
    }
    if (!value || typeof value !== "object") return;

    const next = {};
    if (typeof value.qty === "number" && !Number.isNaN(value.qty) && value.qty >= 0) {
      next.qty = value.qty;
    }
    if (
      typeof value.unitPrice === "number" &&
      !Number.isNaN(value.unitPrice) &&
      value.unitPrice >= 0
    ) {
      next.unitPrice = value.unitPrice;
    }
    if (
      typeof value.subtotal === "number" &&
      !Number.isNaN(value.subtotal) &&
      value.subtotal >= 0
    ) {
      next.subtotal = value.subtotal;
    }
    if (Object.keys(next).length > 0) {
      normalized[key] = next;
    }
  });
  return normalized;
}

function getOverrideSubtotal(override, fallback = 0) {
  if (typeof override === "number" && !Number.isNaN(override)) return override;
  if (
    override &&
    typeof override === "object" &&
    typeof override.subtotal === "number" &&
    !Number.isNaN(override.subtotal)
  ) {
    return override.subtotal;
  }
  return fallback;
}

function clearLineEditor() {
  lineEditorSection.classList.add("is-hidden");
  lineEditorBody.innerHTML = "";
  lineEditorTotal.textContent = "₦0";
  lineEditorEmpty.textContent = "Fill inputs above to preview editable items.";
  lineEditorEmpty.classList.remove("is-hidden");
}

function pruneDraftOverrides(lines) {
  const allowed = new Set(lines.map((line) => line.key));
  Object.keys(draftOverrides).forEach((key) => {
    if (!allowed.has(key)) {
      delete draftOverrides[key];
    }
  });
}

function renderLineEditor(lines, message = "") {
  lineEditorSection.classList.remove("is-hidden");
  if (!lines.length) {
    lineEditorBody.innerHTML = "";
    lineEditorTotal.textContent = "₦0";
    lineEditorEmpty.textContent = message || "Fill inputs above to preview editable items.";
    lineEditorEmpty.classList.remove("is-hidden");
    return;
  }

  lineEditorEmpty.classList.add("is-hidden");
  lineEditorBody.innerHTML = lines
    .map((line) => {
      const qty = Number.isFinite(line.qty) && line.qty >= 0 ? line.qty : 0;
      const subtotal = Number.isFinite(line.subtotal) && line.subtotal >= 0 ? line.subtotal : 0;
      const unitPrice = qty > 0 ? subtotal / qty : 0;
      return `
      <div class="line-editor-row" data-key="${line.key}" data-subtotal="${subtotal}">
        <div class="line-editor-label">
          ${line.label}
          <small>${line.unit}</small>
        </div>
        <input type="number" min="0" step="0.01" data-field="qty" value="${qty}" />
        <input type="number" min="0" step="0.01" data-field="unitPrice" value="${unitPrice}" />
        <div class="line-editor-subtotal">₦${subtotal.toLocaleString()}</div>
      </div>
    `;
    })
    .join("");
  updateLineEditorTotal();
}

function updateLineEditorTotal() {
  const rows = lineEditorBody.querySelectorAll(".line-editor-row");
  const total = Array.from(rows).reduce((sum, row) => {
    const subtotal = parseFloat(row.dataset.subtotal);
    return sum + (Number.isNaN(subtotal) ? 0 : subtotal);
  }, 0);
  lineEditorTotal.textContent = `₦${total.toLocaleString()}`;
}

function computeGuidedDraft(inputs, overrides = {}) {
  const { area, length, breadth } = computeArea(inputs);
  if (!area || Number.isNaN(area) || area <= 0) return null;

  const guidedInputs = { ...inputs, area, length, breadth };
  const category = inputs.guidedCategory;

  if (category === "flooring") {
    const prices = getFlooringPrices({
      floorType: guidedInputs.floorType,
      floorPrice: guidedInputs.price,
      gumPrice: guidedInputs.gumPrice,
      doorProfilePrice: guidedInputs.doorProfilePrice,
    });
    return computeFlooring({
      length: guidedInputs.length,
      breadth: guidedInputs.breadth,
      doors: guidedInputs.doors,
      skirtingNeeded: guidedInputs.skirtingNeeded,
      floorType: guidedInputs.floorType,
      prices,
      overrides,
    });
  }

  if (category === "tiles") {
    const prices = getTilePrices({ tilePrice: guidedInputs.tilePrice });
    return computeTiles({
      area: guidedInputs.area,
      tileSizeCm: guidedInputs.tileSize,
      prices,
      overrides,
    });
  }

  if (category === "paint") {
    const prices = getPaintPrices({ paintPrice: guidedInputs.paintPrice });
    return computePaint({
      area: guidedInputs.area,
      coats: guidedInputs.paintCoats,
      prices,
      overrides,
    });
  }

  if (category === "wallpaper") {
    const prices = getWallpaperPrices({
      rollPrice: guidedInputs.wallpaperPrice,
      adhesivePrice: guidedInputs.wallpaperGluePrice,
    });
    return computeWallpaper({
      area: guidedInputs.area,
      prices,
      overrides,
    });
  }

  return null;
}

function refreshLineEditor() {
  if (getMode() !== "guided") {
    clearLineEditor();
    return;
  }

  const inputs = readInputs();
  const calculated = computeGuidedDraft(inputs, draftOverrides);
  if (!calculated) {
    renderLineEditor([], "Fill valid measurement inputs to preview editable items.");
    return;
  }
  const lines = calculated.lines || [];
  pruneDraftOverrides(lines);
  renderLineEditor(lines);
}

function addItemFromForm() {
  const mode = getMode();
  const inputs = readInputs();
  const existingItem = editingId
    ? getItems().find((entry) => entry.id === editingId)
    : null;
  const existingOverrides = existingItem?.overrides || {};

  if (mode === "custom") {
    if (!validateCustomInputs(inputs)) return;
    const overrides = existingOverrides;
    const item = buildCustomItem(inputs, overrides);
    let id = editingId;
    if (editingId) {
      updateItem(editingId, item);
    } else {
      id = addItem(item);
    }
    item.id = id;
    updateGrandTotal(getGrandTotal());
    const card = buildItemCard(item);
    upsertCard(card);
    clearInputs();
    resetEditing();
    return;
  }

  if (!validateGuidedInputs(inputs, editingId)) return;
  const overrides =
    Object.keys(draftOverrides).length > 0
      ? normalizeOverrides(draftOverrides)
      : normalizeOverrides(existingOverrides);

  setTitle(inputs.userName);

  const { area, length, breadth } = computeArea(inputs);
  if (!area) {
    alert("Quantity input not supported for this category/unit.");
    return;
  }
  const guidedInputs = { ...inputs, area, length, breadth };

  let item;
  const category = inputs.guidedCategory;
  if (category === "flooring") {
    const prices = getFlooringPrices({
      floorType: guidedInputs.floorType,
      floorPrice: guidedInputs.price,
      gumPrice: guidedInputs.gumPrice,
      doorProfilePrice: guidedInputs.doorProfilePrice,
    });
    const calculated = computeFlooring({
      length: guidedInputs.length,
      breadth: guidedInputs.breadth,
      doors: guidedInputs.doors,
      skirtingNeeded: guidedInputs.skirtingNeeded,
      floorType: guidedInputs.floorType,
      prices,
      overrides,
    });
    item = buildFlooringItem(guidedInputs, calculated, prices, overrides);
  } else if (category === "tiles") {
    const prices = getTilePrices({ tilePrice: guidedInputs.tilePrice });
    const calculated = computeTiles({
      area: guidedInputs.area,
      tileSizeCm: guidedInputs.tileSize,
      prices,
      overrides,
    });
    item = buildGuidedItem("tiles", guidedInputs, calculated, prices, overrides);
  } else if (category === "paint") {
    const prices = getPaintPrices({ paintPrice: guidedInputs.paintPrice });
    const calculated = computePaint({
      area: guidedInputs.area,
      coats: guidedInputs.paintCoats,
      prices,
      overrides,
    });
    item = buildGuidedItem("paint", guidedInputs, calculated, prices, overrides);
  } else if (category === "wallpaper") {
    const prices = getWallpaperPrices({
      rollPrice: guidedInputs.wallpaperPrice,
      adhesivePrice: guidedInputs.wallpaperGluePrice,
    });
    const calculated = computeWallpaper({
      area: guidedInputs.area,
      prices,
      overrides,
    });
    item = buildGuidedItem("wallpaper", guidedInputs, calculated, prices, overrides);
  } else {
    alert("Unsupported category.");
    return;
  }

  let id = editingId;
  if (editingId) {
    updateItem(editingId, item);
  } else {
    id = addItem(item);
  }
  item.id = id;

  updateGrandTotal(getGrandTotal());
  const card = buildItemCard(item);
  upsertCard(card);

  clearInputs();
  resetEditing();
}

function removeArea(card) {
  const name = card.dataset.name;
  const id = Number(card.dataset.id);
  if (!confirm("Remove " + name + " from quotation?")) return;

  card.remove();
  removeItem(id);
  updateGrandTotal(getGrandTotal());

  if (editingId === id) {
    resetEditing();
  }
}

function upsertCard(card) {
  const existing = areasContainer.querySelector(
    `.area-card[data-id='${card.dataset.id}']`
  );
  if (existing) {
    existing.replaceWith(card);
    return;
  }
  areasContainer.appendChild(card);
}

function resetEditing() {
  editingId = null;
  draftOverrides = {};
  clearLineEditor();
  addAreaBtn.innerHTML =
    '<i class="ph ph-plus-circle" style="font-size: 20px; color: white;"></i> Add Item';
}

function startEditing(item) {
  editingId = item.id;
  draftOverrides = normalizeOverrides(item.overrides || {});
  if (item.mode === "custom") {
    setMode("custom");
    formEls.customName.value = item.name || item.inputs.customName || "";
    formEls.customQty.value = item.inputs.customQty || "";
    formEls.customUnit.value = item.inputs.customUnit || "";
    formEls.customUnitPrice.value = item.inputs.customUnitPrice || "";
    formEls.customNotes.value = item.inputs.customNotes || "";
    addAreaBtn.innerHTML =
      '<i class="ph ph-check-circle" style="font-size: 20px; color: white;"></i> Update Item';
    formEls.customName.focus();
    return;
  }

  setMode("guided");
  setCategory(item.kind || "flooring");
  const inputStyle = item.inputs.inputStyle || "dimensions";
  setInputStyle(inputStyle);

  formEls.userName.value = item.inputs.userName || "";
  formEls.placeName.value = item.placeName || "";
  formEls.length.value = item.inputs.length || "";
  formEls.breadth.value = item.inputs.breadth || "";
  formEls.areaInput.value = item.inputs.areaInput || item.inputs.area || "";
  formEls.guidedQty.value = item.inputs.guidedQty || "";
  formEls.guidedUnit.value = item.inputs.guidedUnit || "";
  formEls.doors.value = item.inputs.doors || 0;
  formEls.skirtingNeeded.value = item.inputs.skirtingNeeded || "yes";
  formEls.floorType.value = item.inputs.floorType || "vinyl";
  formEls.price.value = item.inputs.price || "";
  formEls.gumPrice.value = item.inputs.gumPrice || "";
  formEls.doorProfilePrice.value = item.inputs.doorProfilePrice || "";
  formEls.tilePrice.value = item.inputs.tilePrice || "";
  formEls.tileSize.value = item.inputs.tileSize || "";
  formEls.paintPrice.value = item.inputs.paintPrice || "";
  formEls.paintCoats.value = item.inputs.paintCoats || "";
  formEls.wallpaperPrice.value = item.inputs.wallpaperPrice || "";
  formEls.wallpaperGluePrice.value = item.inputs.wallpaperGluePrice || "";

  addAreaBtn.innerHTML =
    '<i class="ph ph-check-circle" style="font-size: 20px; color: white;"></i> Update Item';
  formEls.placeName.focus();
  refreshLineEditor();
}

function rebuildItem(item, overrides) {
  if (item.mode === "custom") {
    return buildCustomItem(item.inputs, overrides);
  }

  const inputs = { ...item.inputs };
  const computed = computeArea(inputs);
  const area = computed.area || inputs.area || item.calculated?.area || 0;
  const guidedInputs = { ...inputs, area };

  if (item.kind === "flooring") {
    const prices = getFlooringPrices({
      floorType: guidedInputs.floorType,
      floorPrice: guidedInputs.price,
      gumPrice: guidedInputs.gumPrice,
      doorProfilePrice: guidedInputs.doorProfilePrice,
    });
    const calculated = computeFlooring({
      length: guidedInputs.length,
      breadth: guidedInputs.breadth,
      doors: guidedInputs.doors,
      skirtingNeeded: guidedInputs.skirtingNeeded,
      floorType: guidedInputs.floorType,
      prices,
      overrides,
    });
    return buildFlooringItem(guidedInputs, calculated, prices, overrides);
  }

  if (item.kind === "tiles") {
    const prices = getTilePrices({ tilePrice: guidedInputs.tilePrice });
    const calculated = computeTiles({
      area: guidedInputs.area,
      tileSizeCm: guidedInputs.tileSize,
      prices,
      overrides,
    });
    return buildGuidedItem("tiles", guidedInputs, calculated, prices, overrides);
  }

  if (item.kind === "paint") {
    const prices = getPaintPrices({ paintPrice: guidedInputs.paintPrice });
    const calculated = computePaint({
      area: guidedInputs.area,
      coats: guidedInputs.paintCoats,
      prices,
      overrides,
    });
    return buildGuidedItem("paint", guidedInputs, calculated, prices, overrides);
  }

  if (item.kind === "wallpaper") {
    const prices = getWallpaperPrices({
      rollPrice: guidedInputs.wallpaperPrice,
      adhesivePrice: guidedInputs.wallpaperGluePrice,
    });
    const calculated = computeWallpaper({
      area: guidedInputs.area,
      prices,
      overrides,
    });
    return buildGuidedItem("wallpaper", guidedInputs, calculated, prices, overrides);
  }

  return item;
}

function adjustItemLines(item) {
  const lines = item.calculated?.lines || [];
  if (!lines.length) return;

  const nextOverrides = normalizeOverrides(item.overrides || {});

  for (const line of lines) {
    const current = getOverrideSubtotal(nextOverrides[line.key], line.subtotal);
    const raw = prompt(
      `Override ${line.label} subtotal (current ₦${current.toLocaleString()}). Leave blank to reset.`,
      String(current)
    );
    if (raw === null) return;
    const trimmed = raw.trim();
    if (!trimmed) {
      delete nextOverrides[line.key];
      continue;
    }
    const value = parseFloat(trimmed);
    if (Number.isNaN(value) || value < 0) {
      alert("Invalid amount.");
      return;
    }
    const existing = nextOverrides[line.key];
    if (existing && typeof existing === "object") {
      nextOverrides[line.key] = { ...existing, subtotal: value };
    } else {
      nextOverrides[line.key] = { subtotal: value };
    }
  }

  const rebuilt = rebuildItem(item, nextOverrides);
  rebuilt.id = item.id;
  updateItem(item.id, rebuilt);
  updateGrandTotal(getGrandTotal());
  upsertCard(buildItemCard(rebuilt));
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
    const card = buildItemCard(item);
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
  clearInputs();
  resetEditing();
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
  document.body.classList.add("sheet-open");
  historySheet.setAttribute("aria-hidden", "false");
  historyOverlay.setAttribute("aria-hidden", "false");
  setSheetTranslate(0);
}

function closeHistorySheet() {
  historySheet.classList.remove("is-open");
  historyOverlay.classList.remove("is-open");
  document.body.classList.remove("sheet-open");
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
  if (event.cancelable) event.preventDefault();
  const startY = event.clientY;
  sheetDrag = {
    startY,
    startTranslate: historySheet.classList.contains("is-open") ? 0 : getSheetHeight(),
  };
  historySheet.style.transition = "none";
  historySheet.classList.add("is-dragging");
  historySheet.setPointerCapture(event.pointerId);
}

function handleSheetPointerMove(event) {
  if (!sheetDrag) return;
  if (event.cancelable) event.preventDefault();
  const delta = event.clientY - sheetDrag.startY;
  const height = getSheetHeight();
  const next = Math.min(Math.max(sheetDrag.startTranslate + delta, 0), height);
  setSheetTranslate(next);
}

function handleSheetPointerUp(event) {
  if (!sheetDrag) return;
  if (event.cancelable) event.preventDefault();
  historySheet.releasePointerCapture(event.pointerId);
  historySheet.style.transition = "";
  historySheet.classList.remove("is-dragging");
  const height = getSheetHeight();
  const raw = getComputedStyle(historySheet).getPropertyValue("--sheet-translate");
  const current = Number.isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);
  sheetDrag = null;
  if (current > height * 0.35) {
    closeHistorySheet();
  } else {
    openHistorySheet();
  }
}

addAreaBtn.addEventListener("click", addItemFromForm);
printBtn.addEventListener("click", () => window.print());
saveQuoteBtn.addEventListener("click", handleSaveQuotation);
historyToggleBtn.addEventListener("click", toggleHistorySheet);
historyOverlay.addEventListener("click", closeHistorySheet);
historySheet.addEventListener("pointerdown", handleSheetPointerDown);
historySheet.addEventListener("pointermove", handleSheetPointerMove);
historySheet.addEventListener("pointerup", handleSheetPointerUp);
historySheet.addEventListener("pointercancel", handleSheetPointerUp);
modeToggle.addEventListener("click", (event) => {
  const btn = event.target.closest(".toggle-btn");
  if (!btn) return;
  setMode(btn.dataset.mode);
});
formEls.guidedCategory.addEventListener("change", (event) => {
  setCategory(event.target.value);
});
formEls.inputStyle.addEventListener("change", (event) => {
  setInputStyle(event.target.value);
});
formSection.addEventListener("input", (event) => {
  if (event.target.closest("#lineEditorSection")) return;
  refreshLineEditor();
});
formSection.addEventListener("change", (event) => {
  if (event.target.closest("#lineEditorSection")) return;
  refreshLineEditor();
});
lineEditorBody.addEventListener("input", (event) => {
  const input = event.target;
  const row = input.closest(".line-editor-row");
  if (!row) return;

  const qtyInput = row.querySelector('input[data-field="qty"]');
  const unitPriceInput = row.querySelector('input[data-field="unitPrice"]');
  const qtyRaw = parseFloat(qtyInput.value);
  const unitPriceRaw = parseFloat(unitPriceInput.value);
  const qty = Number.isNaN(qtyRaw) || qtyRaw < 0 ? 0 : qtyRaw;
  const unitPrice = Number.isNaN(unitPriceRaw) || unitPriceRaw < 0 ? 0 : unitPriceRaw;
  const subtotal = qty * unitPrice;

  row.dataset.subtotal = String(subtotal);
  const subtotalEl = row.querySelector(".line-editor-subtotal");
  if (subtotalEl) {
    subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
  }

  const key = row.dataset.key;
  draftOverrides[key] = { qty, unitPrice, subtotal };
  updateLineEditorTotal();
});

areasContainer.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const card = btn.closest(".area-card");
  if (!card) return;
  const action = btn.dataset.action;
  if (action === "remove") {
    removeArea(card);
    return;
  }
  if (action === "edit") {
    const id = Number(card.dataset.id);
    const item = getItems().find((entry) => entry.id === id);
    if (!item) return;
    startEditing(item);
    return;
  }
  if (action === "adjust") {
    const id = Number(card.dataset.id);
    const item = getItems().find((entry) => entry.id === id);
    if (!item) return;
    adjustItemLines(item);
  }
});

historyList.addEventListener("click", handleHistoryAction);

function init() {
  updateGrandTotal(getGrandTotal());
  renderHistory(loadSavedQuotations());
  closeHistorySheet();
  resetEditing();
  setMode("guided");
  setCategory(formEls.guidedCategory.value || "flooring");
  setInputStyle("dimensions");
}

init();

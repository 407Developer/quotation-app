import { computeFlooring, getFlooringPrices } from "./js/calc.js";
import { buildFlooringItem } from "./js/model.js";
import { addItem, getGrandTotal, hasPlaceName, removeItem } from "./js/state.js";
import { buildAreaCard, setTitle, updateGrandTotal } from "./js/ui.js";

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

addAreaBtn.addEventListener("click", addArea);
printBtn.addEventListener("click", () => window.print());

areasContainer.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action='remove']");
  if (!btn) return;
  const card = btn.closest(".area-card");
  if (!card) return;
  removeArea(card);
});

updateGrandTotal(getGrandTotal());

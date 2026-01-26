export const quotationState = {
  grandTotal: 0,
  areaNames: [],
};

export function addAreaName(name) {
  quotationState.areaNames.push(name.toLowerCase());
}

export function hasAreaName(name) {
  return quotationState.areaNames.includes(name.toLowerCase());
}

export function removeAreaName(name) {
  quotationState.areaNames = quotationState.areaNames.filter(
    (n) => n !== name.toLowerCase()
  );
}

export function addToGrandTotal(amount) {
  quotationState.grandTotal += amount;
}

export function subtractFromGrandTotal(amount) {
  quotationState.grandTotal -= amount;
}

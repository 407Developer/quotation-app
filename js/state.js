export const quotationState = {
  items: [],
  nextId: 1,
};

export function addItem(item) {
  const id = quotationState.nextId++;
  quotationState.items.push({ ...item, id });
  return id;
}

export function removeItem(id) {
  quotationState.items = quotationState.items.filter((item) => item.id !== id);
}

export function hasPlaceName(name) {
  const nameLower = name.toLowerCase();
  return quotationState.items.some(
    (item) => item.placeName?.toLowerCase() === nameLower
  );
}

export function getGrandTotal() {
  return quotationState.items.reduce(
    (total, item) => total + (item.calculated?.areaTotal || 0),
    0
  );
}

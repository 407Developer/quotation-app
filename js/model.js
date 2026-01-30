export function buildFlooringItem(inputs, calculated, prices, overrides = {}) {
  return {
    kind: "flooring",
    placeName: inputs.placeName,
    mode: "guided",
    inputs: {
      userName: inputs.userName,
      length: inputs.length,
      breadth: inputs.breadth,
      doors: inputs.doors,
      skirtingNeeded: inputs.skirtingNeeded,
      floorType: inputs.floorType,
      price: inputs.price,
      gumPrice: inputs.gumPrice,
      doorProfilePrice: inputs.doorProfilePrice,
    },
    prices,
    calculated,
    overrides,
  };
}

export function buildGuidedItem(kind, inputs, calculated, prices, overrides = {}) {
  return {
    kind,
    placeName: inputs.placeName,
    mode: "guided",
    inputs: { ...inputs },
    prices,
    calculated,
    overrides,
  };
}

import { applyOverrides } from "./calc.js";

export function buildCustomItem(inputs, overrides = {}) {
  const qty = inputs.customQty;
  const unitPrice = inputs.customUnitPrice;
  const subtotal = qty * unitPrice;
  const baseLines = [
    {
      key: "custom",
      label: inputs.customName,
      qty,
      unit: inputs.customUnit,
      subtotal,
    },
  ];
  const applied = applyOverrides(baseLines, overrides);
  return {
    kind: "custom",
    mode: "custom",
    name: inputs.customName,
    inputs: { ...inputs },
    calculated: {
      areaTotal: applied.areaTotal,
      lines: applied.lines,
    },
    overrides,
  };
}

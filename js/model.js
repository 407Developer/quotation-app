export function buildFlooringItem(inputs, calculated, prices) {
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
  };
}

export function buildGuidedItem(kind, inputs, calculated, prices) {
  return {
    kind,
    placeName: inputs.placeName,
    mode: "guided",
    inputs: { ...inputs },
    prices,
    calculated,
  };
}

export function buildCustomItem(inputs) {
  const qty = inputs.customQty;
  const unitPrice = inputs.customUnitPrice;
  const subtotal = qty * unitPrice;
  return {
    kind: "custom",
    mode: "custom",
    name: inputs.customName,
    inputs: { ...inputs },
    calculated: {
      areaTotal: subtotal,
      lines: [
        {
          label: inputs.customName,
          qty,
          unit: inputs.customUnit,
          subtotal,
        },
      ],
    },
  };
}

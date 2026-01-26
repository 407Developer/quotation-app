export function getFlooringPrices({ floorType, floorPrice, gumPrice, doorProfilePrice }) {
  return {
    vinyl: floorPrice ? floorPrice : 9000,
    spc: 17000,
    skirting: 10000,
    floorGum: gumPrice ? gumPrice : 4000,
    filler: 4000,
    skirtingGum: 4000,
    doorProfile: doorProfilePrice,
    floorType,
  };
}

export function computeFlooring({ length, breadth, doors, skirtingNeeded, floorType, prices }) {
  const floorArea = length * breadth;

  let skirtingQty = 0;
  let fillerQty = 0;
  let skirtingGumQty = 0;

  if (skirtingNeeded === "yes") {
    const perimeter = (length + breadth) * 2;
    const perimeterAdjusted = perimeter - doors * 0.9;
    skirtingQty = Math.ceil(Math.max(perimeterAdjusted, 0) / 2.9);
    fillerQty = Math.ceil(skirtingQty / 2);
    skirtingGumQty = Math.ceil(fillerQty / 3);
  }

  const floorGum = floorType === "vinyl" ? Math.ceil(floorArea / 20) : 0;
  const doorEndProfiles = doors > 0 ? Math.ceil((doors * 0.9) / 2.4) : 0;

  const floorUnitPrice = prices[floorType] || 0;
  const floorSubtotal = floorArea * floorUnitPrice;
  const skirtingSubtotal = skirtingQty * prices.skirting;
  const floorGumSubtotal = floorGum * prices.floorGum;
  const fillerSubtotal = fillerQty * prices.filler;
  const skirtingGumSubtotal = skirtingGumQty * prices.skirtingGum;
  const doorProfileSubtotal = doorEndProfiles * prices.doorProfile;

  const areaTotal =
    floorSubtotal +
    skirtingSubtotal +
    floorGumSubtotal +
    fillerSubtotal +
    skirtingGumSubtotal +
    doorProfileSubtotal;

  return {
    floorArea,
    skirtingQty,
    fillerQty,
    skirtingGumQty,
    floorGum,
    doorEndProfiles,
    floorSubtotal,
    skirtingSubtotal,
    floorGumSubtotal,
    fillerSubtotal,
    skirtingGumSubtotal,
    doorProfileSubtotal,
    areaTotal,
  };
}

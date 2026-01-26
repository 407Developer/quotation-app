import { flooringRules } from "./rules.js";

export function getFlooringPrices({ floorType, floorPrice, gumPrice, doorProfilePrice }) {
  const defaults = flooringRules.defaults;
  return {
    vinyl: floorPrice ? floorPrice : defaults.vinylPrice,
    spc: defaults.spcPrice,
    skirting: defaults.skirtingPrice,
    floorGum: gumPrice ? gumPrice : defaults.floorGumPrice,
    filler: defaults.fillerPrice,
    skirtingGum: defaults.skirtingGumPrice,
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
    const perimeterAdjusted = perimeter - doors * flooringRules.measures.doorWidth;
    skirtingQty = Math.ceil(
      Math.max(perimeterAdjusted, 0) / flooringRules.measures.skirtingBoardLength
    );
    fillerQty = Math.ceil(skirtingQty / 2);
    skirtingGumQty = Math.ceil(fillerQty / 3);
  }

  const floorGum =
    floorType === "vinyl"
      ? Math.ceil(floorArea / flooringRules.measures.floorGumCoverage)
      : 0;
  const doorEndProfiles =
    doors > 0
      ? Math.ceil(
          (doors * flooringRules.measures.doorWidth) /
            flooringRules.measures.doorProfileCoverage
        )
      : 0;

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

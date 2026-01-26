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

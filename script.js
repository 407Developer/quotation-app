
let grandTotal = 0;
let area = []

function addArea() {
  const userName = document.getElementById("userName").value.trim();
  const placeName = document.getElementById("placeName").value.trim();
  const length = parseFloat(document.getElementById("length").value);
  const breadth = parseFloat(document.getElementById("breadth").value);
  const doors = parseInt(document.getElementById("doors").value) || 0;
  const skirtingNeeded = document.getElementById("skirtingNeeded").value;
  const floorType = document.getElementById("floorType").value;
  const price = document.getElementById("price").value;
  const gumPrice = document.getElementById("gumPrice").value;
  const doorProfilePrice = document.getElementById("doorProfilePrice").value;

  let prices = {
    vinyl: price? price : 9000,
    spc: 17000,
    skirting: 10000,
    floorGum: gumPrice,
    filler: 4000,
    skirtingGum: 4000,
    doorProfile: doorProfilePrice
  };

  if (!placeName || !length || !breadth) {
    alert("Please fill in place name, length and breadth.");
    return;
  }


  if (userName) {
    document.getElementById("quotationTitle").innerText = userName;
  }

  /* ---------------- CALCULATIONS ---------------- */

  // Floor area
  const floorArea = length * breadth;

  // Skirting
  let skirtingQty = 0;
  let fillerQty = 0;
  let skirtingGumQty = 0;

  if (placeName in area) {
    alert("this place has already been recorded")
  }


  if (skirtingNeeded === "yes") {
    skirtingQty = Math.ceil(((length + breadth) * 2) / 2.9);

    if (doors > 0) {
      skirtingQty = Math.ceil(skirtingQty - (doors * 0.9));
    }

    // Prevent negative values
    skirtingQty = Math.max(skirtingQty, 0);

    fillerQty = Math.ceil(skirtingQty / 2);
    skirtingGumQty = Math.ceil(fillerQty / 3);
  }

  // Floor gum (VINYL ONLY)
  const floorGum =
    floorType === "vinyl"
      ? Math.ceil(floorArea / 20)
      : 0;

  // Door end profiles
  const doorEndProfiles = Math.ceil((doors * 0.9) / 2.4);

  /* ---------------- PRICING ---------------- */

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

  /* ---------------- GRAND TOTAL ---------------- */

  grandTotal += areaTotal;
  document.getElementById("grandTotal").innerText =
    `Grand Total: ₦${grandTotal.toLocaleString()}`;

  /* ---------------- DISPLAY CARD ---------------- */

  const card = document.createElement("div");
  card.className = "area-card";

  card.innerHTML = `
    <h3>${placeName}</h3>

    <p>
      ${floorArea.toFixed(2)} sqm (${floorType.toUpperCase()})
      × ₦${floorUnitPrice.toLocaleString()}
      = <em>₦${floorSubtotal.toLocaleString()}</em>
    </p>

    ${skirtingNeeded === "yes"
      ? `
        <p>
          Skirting: ${skirtingQty}
          × ₦${prices.skirting.toLocaleString()}
          = <em>₦${skirtingSubtotal.toLocaleString()}</em>
        </p>

        <p>
          Filler: ${fillerQty}
          × ₦${prices.filler.toLocaleString()}
          = <em>₦${fillerSubtotal.toLocaleString()}</em>
        </p>

        <p>
          Skirting Gum: ${skirtingGumQty}
          × ₦${prices.skirtingGum.toLocaleString()}
          = <em>₦${skirtingGumSubtotal.toLocaleString()}</em>
        </p>
        `
      : ""
    }

    ${floorType === "vinyl"
      ? `
        <p>
          Floor Gum: ${floorGum}
          × ₦${prices.floorGum.toLocaleString()}
          = <em>₦${floorGumSubtotal.toLocaleString()}</em>
        </p>
        `
      : ""
    }

    ${doorEndProfiles != 0 ? 
      `
    <p>
      Door Profiles: ${doorEndProfiles}
      × ₦${prices.doorProfile.toLocaleString()}
      = <em>₦${doorProfileSubtotal.toLocaleString()}</em>
    </p>`
    : ""
    }

    <hr>
    <strong>Total (${placeName}): ₦${areaTotal.toLocaleString()}</strong>
  `;

  document.getElementById("areasContainer").appendChild(card);
}
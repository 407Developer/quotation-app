let grandTotal = 0;
let areaNames = []; // Store names to check for duplicates

function addArea() {
  const userName = document.getElementById("userName").value.trim();
  const placeName = document.getElementById("placeName").value.trim();
  const length = parseFloat(document.getElementById("length").value);
  const breadth = parseFloat(document.getElementById("breadth").value);
  const doors = parseInt(document.getElementById("doors").value) || 0;
  const skirtingNeeded = document.getElementById("skirtingNeeded").value;
  const floorType = document.getElementById("floorType").value;
  const price = parseFloat(document.getElementById("price").value);
  const gumPrice = parseFloat(document.getElementById("gumPrice").value);
  const doorProfilePrice = parseFloat(document.getElementById("doorProfilePrice").value) || 0; // Default to 0 if empty

  // Validation
  if (!placeName || isNaN(length) || isNaN(breadth)) {
    alert("Please fill in place name, length, and breadth correctly.");
    return;
  }
  
  if (areaNames.includes(placeName.toLowerCase())) {
    alert("This place has already been added to the quotation.");
    return;
  }

  // Update Title if provided
  if (userName) {
    document.getElementById("quotationTitle").innerText = "Quotation for " + userName;
  }

  // Default Prices if not provided
  let prices = {
    vinyl: price ? price : 9000,
    spc: 17000, // Default SPC price
    skirting: 10000,
    floorGum: gumPrice ? gumPrice : 4000, // Default gum price if not set
    filler: 4000,
    skirtingGum: 4000,
    doorProfile: doorProfilePrice
  };

  /* ---------------- CALCULATIONS ---------------- */

  // Floor area
  const floorArea = length * breadth;

  // Skirting
  let skirtingQty = 0;
  let fillerQty = 0;
  let skirtingGumQty = 0;

  if (skirtingNeeded === "yes") {
    // Standard calculation: Perimeter / length of skirting board (approx 2.9m)
    let perimeter = (length + breadth) * 2;
    // Subtract door width (approx 0.9m per door)
    let perimeterAdjusted = perimeter - (doors * 0.9);
    
    skirtingQty = Math.ceil(Math.max(perimeterAdjusted, 0) / 2.9);
    
    fillerQty = Math.ceil(skirtingQty / 2);
    skirtingGumQty = Math.ceil(fillerQty / 3);
  }

  // Floor gum (VINYL ONLY) - 1 bucket per 20sqm
  const floorGum = (floorType === "vinyl") ? Math.ceil(floorArea / 20) : 0;

  // Door end profiles - 1 profile covers approx 2.4m, door is 0.9m
  const doorEndProfiles = (doors > 0) ? Math.ceil((doors * 0.9) / 2.4) : 0;

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

  /* ---------------- UPDATE STATE ---------------- */

  grandTotal += areaTotal;
  areaNames.push(placeName.toLowerCase());
  
  updateGrandTotal();

  /* ---------------- DISPLAY CARD ---------------- */

  const card = document.createElement("div");
  card.className = "area-card";
  card.id = `card-${placeName.replace(/\s+/g, '-')}`;

  // Helper to format currency
  const fmt = (n) => "₦" + n.toLocaleString();

  // Construct HTML
  let html = `
    <div class="area-header">
      <h3><i class="ph ph-house-line"></i> ${placeName}</h3>
      <button onclick="removeArea('${placeName}', ${areaTotal})" class="remove-btn" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Remove Item">
        <i class="ph ph-trash" style="font-size: 18px;"></i>
      </button>
    </div>

    <div class="area-details">
      <div class="detail-row">
        <span>Flooring (${floorType.toUpperCase()}) - ${floorArea.toFixed(2)} sqm</span>
        <em>${fmt(floorSubtotal)}</em>
      </div>
  `;

  if (skirtingNeeded === "yes") {
    html += `
      <div class="detail-row">
        <span>Skirting (${skirtingQty} pcs)</span>
        <em>${fmt(skirtingSubtotal)}</em>
      </div>
      <div class="detail-row">
        <span>Filler (${fillerQty} bags)</span>
        <em>${fmt(fillerSubtotal)}</em>
      </div>
      <div class="detail-row">
        <span>Skirting Gum (${skirtingGumQty} pcs)</span>
        <em>${fmt(skirtingGumSubtotal)}</em>
      </div>
    `;
  }

  if (floorType === "vinyl" && floorGum > 0) {
    html += `
      <div class="detail-row">
        <span>Floor Gum (${floorGum} pcs)</span>
        <em>${fmt(floorGumSubtotal)}</em>
      </div>
    `;
  }

  if (doorEndProfiles > 0) {
    html += `
      <div class="detail-row">
        <span>Door Profiles (${doorEndProfiles} pcs)</span>
        <em>${fmt(doorProfileSubtotal)}</em>
      </div>
    `;
  }

  html += `
    </div>
    <div class="area-total">
      <span>Total</span>
      <span>${fmt(areaTotal)}</span>
    </div>
  `;

  card.innerHTML = html;
  document.getElementById("areasContainer").appendChild(card);

  // Clear inputs for next entry
  document.getElementById("placeName").value = "";
  document.getElementById("length").value = "";
  document.getElementById("breadth").value = "";
  document.getElementById("doors").value = "";
  document.getElementById("placeName").focus();
}

function updateGrandTotal() {
  document.getElementById("grandTotal").innerHTML = 
    `<span class="total-label">Grand Total</span> ₦${grandTotal.toLocaleString()}`;
}

function removeArea(name, amount) {
  if(!confirm("Remove " + name + " from quotation?")) return;

  // Remove from DOM
  const cardId = `card-${name.replace(/\s+/g, '-')}`;
  const card = document.getElementById(cardId);
  if(card) card.remove();

  // Update state
  grandTotal -= amount;
  areaNames = areaNames.filter(n => n !== name.toLowerCase());
  
  updateGrandTotal();
}
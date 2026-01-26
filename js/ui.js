const currency = new Intl.NumberFormat("en-NG");

export function fmtCurrency(n) {
  return "₦" + currency.format(n);
}

export function setTitle(userName) {
  if (!userName) return;
  const el = document.getElementById("quotationTitle");
  el.innerText = "Quotation for " + userName;
}

export function setTitleText(title) {
  if (!title) return;
  const el = document.getElementById("quotationTitle");
  el.innerText = title;
}

export function updateGrandTotal(total) {
  const el = document.getElementById("grandTotal");
  el.innerHTML = `<span class="total-label">Grand Total</span> ₦${total.toLocaleString()}`;
}

function buildLinesMarkup(lines) {
  return lines
    .map(
      (line) => `
      <div class="detail-row">
        <span>${line.label} (${line.qty} ${line.unit})</span>
        <em>${fmtCurrency(line.subtotal)}</em>
      </div>
    `
    )
    .join("");
}

export function buildAreaCard(item) {
  const {
    id,
    placeName,
    inputs: { floorType, skirtingNeeded },
    calculated: {
      floorArea,
      floorSubtotal,
      skirtingQty,
      skirtingSubtotal,
      fillerQty,
      fillerSubtotal,
      skirtingGumQty,
      skirtingGumSubtotal,
      floorGum,
      floorGumSubtotal,
      doorEndProfiles,
      doorProfileSubtotal,
      areaTotal,
    },
  } = item;

  const card = document.createElement("div");
  card.className = "area-card";
  card.id = `card-${placeName.replace(/\s+/g, "-")}`;
  card.dataset.name = placeName;
  card.dataset.amount = String(areaTotal);
  card.dataset.id = String(id);

  let html = `
    <div class="area-header">
      <h3><i class="ph ph-house-line"></i> ${placeName}</h3>
      <div class="card-actions">
        <button data-action="edit" class="remove-btn" style="background:none; border:none; color: #0f172a; cursor:pointer;" title="Edit Item">
          <i class="ph ph-pencil-simple" style="font-size: 18px;"></i>
        </button>
        <button data-action="remove" class="remove-btn" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Remove Item">
          <i class="ph ph-trash" style="font-size: 18px;"></i>
        </button>
      </div>
    </div>

    <div class="area-details">
      <div class="detail-row">
        <span>Flooring (${floorType.toUpperCase()}) - ${floorArea.toFixed(2)} sqm</span>
        <em>${fmtCurrency(floorSubtotal)}</em>
      </div>
  `;

  if (skirtingNeeded === "yes") {
    html += `
      <div class="detail-row">
        <span>Skirting (${skirtingQty} pcs)</span>
        <em>${fmtCurrency(skirtingSubtotal)}</em>
      </div>
      <div class="detail-row">
        <span>Filler (${fillerQty} bags)</span>
        <em>${fmtCurrency(fillerSubtotal)}</em>
      </div>
      <div class="detail-row">
        <span>Skirting Gum (${skirtingGumQty} pcs)</span>
        <em>${fmtCurrency(skirtingGumSubtotal)}</em>
      </div>
    `;
  }

  if (floorType === "vinyl" && floorGum > 0) {
    html += `
      <div class="detail-row">
        <span>Floor Gum (${floorGum} pcs)</span>
        <em>${fmtCurrency(floorGumSubtotal)}</em>
      </div>
    `;
  }

  if (doorEndProfiles > 0) {
    html += `
      <div class="detail-row">
        <span>Door Profiles (${doorEndProfiles} pcs)</span>
        <em>${fmtCurrency(doorProfileSubtotal)}</em>
      </div>
    `;
  }

  html += `
    </div>
    <div class="area-total">
      <span>Total</span>
      <span>${fmtCurrency(areaTotal)}</span>
    </div>
  `;

  card.innerHTML = html;
  return card;
}

export function buildItemCard(item) {
  if (item.kind === "flooring") {
    return buildAreaCard(item);
  }

  const title = item.placeName || item.name || "Item";
  const lines = item.calculated?.lines || [];
  const total = item.calculated?.areaTotal || 0;

  const card = document.createElement("div");
  card.className = "area-card";
  card.id = `card-${(title || "item").replace(/\\s+/g, "-")}`;
  card.dataset.name = title;
  card.dataset.amount = String(total);
  card.dataset.id = String(item.id);

  card.innerHTML = `
    <div class="area-header">
      <h3><i class="ph ph-squares-four"></i> ${title}</h3>
      <div class="card-actions">
        <button data-action="edit" class="remove-btn" style="background:none; border:none; color: #0f172a; cursor:pointer;" title="Edit Item">
          <i class="ph ph-pencil-simple" style="font-size: 18px;"></i>
        </button>
        <button data-action="remove" class="remove-btn" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Remove Item">
          <i class="ph ph-trash" style="font-size: 18px;"></i>
        </button>
      </div>
    </div>
    <div class="area-details">
      ${buildLinesMarkup(lines)}
    </div>
    <div class="area-total">
      <span>Total</span>
      <span>${fmtCurrency(total)}</span>
    </div>
  `;

  return card;
}

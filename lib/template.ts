import Handlebars from "handlebars";

export const PDF_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: A4;
            margin: 15mm 15mm;
            background-color: #fcfbfa;
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 8pt;
                color: #8c857b;
            }
            @bottom-left {
                content: "JOBON INTERNATIONAL LTD • 09165208580";
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 8pt;
                color: #8c857b;
            }
        }

        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #2c2a29;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }

        .header {
            border-bottom: 3px solid #b89047;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }

        .company-name {
            font-size: 24pt;
            font-weight: bold;
            letter-spacing: 1px;
            color: #1a2e40;
            margin: 0;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 9.5pt;
            color: #8c857b;
            margin-top: 4px;
            margin-bottom: 0;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .contact-info {
            font-size: 10.5pt;
            color: #1a2e40;
            margin-top: 4px;
            font-weight: 500;
        }

        .client-info {
            margin-top: -15px;
            text-align: right;
            font-size: 10pt;
            color: #4a4540;
        }

        .report-title-box {
            background-color: #1a2e40;
            color: #ffffff;
            padding: 10px 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }

        .report-title-box h1 {
            margin: 0;
            font-size: 13pt;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .section-title {
            font-size: 11pt;
            color: #1a2e40;
            border-left: 4px solid #b89047;
            padding-left: 8px;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            background-color: #ffffff;
        }

        th {
            background-color: #2a3e50;
            color: #ffffff;
            text-align: left;
            padding: 8px 10px;
            font-size: 8.5pt;
            text-transform: uppercase;
            font-weight: 600;
            border: 1px solid #2a3e50;
        }

        td {
            padding: 8px 10px;
            font-size: 8.5pt;
            border-bottom: 1px solid #e1dbd6;
            border-left: 1px solid #e1dbd6;
            border-right: 1px solid #e1dbd6;
        }

        tr:nth-child(even) td {
            background-color: #fcfbf9;
        }

        .num { text-align: right; }
        .bold { font-weight: bold; }
        .highlight { color: #b89047; font-weight: bold; }

        .summary-card {
            background-color: #f0ede6;
            border: 1px solid #e1dbd6;
            border-radius: 4px;
            padding: 12px;
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .summary-grid { display: table; width: 100%; }
        .summary-row { display: table-row; }
        .summary-cell {
            display: table-cell;
            padding: 5px 10px;
            width: 25%;
            vertical-align: top;
        }
        .summary-cell:not(:last-child) { border-right: 1.5px solid #e1dbd6; }
        .summary-label {
            font-size: 8pt;
            text-transform: uppercase;
            color: #8c857b;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .summary-val { font-size: 13pt; font-weight: bold; color: #1a2e40; }
        .summary-val-sub { font-size: 8pt; color: #8c857b; margin-top: 1px; }

        .notes-section {
            margin-top: 20px;
            font-size: 8pt;
            color: #6e6861;
            line-height: 1.35;
            border-top: 1px dashed #d1cac4;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company.name}}</div>
        <div class="subtitle">{{company.subtitle}}</div>
        <div class="contact-info">Phone: {{company.phone}}</div>
        <div class="client-info">
            <strong>Client:</strong> {{client_name}}<br>
            <strong>Date:</strong> {{date}}
        </div>
    </div>

    <div class="report-title-box">
        <h1>{{title}}</h1>
    </div>

    <div class="section-title">Bill of Quantities & Materials Breakdown</div>
    <table>
        <thead>
            <tr>
                <th style="width: 45%;">Item Description</th>
                <th style="text-align: right; width: 15%;">Quantity</th>
                <th style="text-align: right; width: 10%;">Unit</th>
                <th style="text-align: right; width: 15%;">Rate (₦)</th>
                <th style="text-align: right; width: 15%;">Amount (₦)</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td class="bold">{{description}}</td>
                <td class="num">{{qty}}</td>
                <td class="num">{{unit}}</td>
                <td class="num">₦{{rate}}</td>
                <td class="num bold">₦{{amount}}</td>
            </tr>
            {{/each}}
            <tr style="background-color: #e1dbd6; font-weight: bold;">
                <td colspan="3">TOTAL ESTIMATED COST</td>
                <td>-</td>
                <td class="num highlight">₦{{summary.grand_total}}</td>
            </tr>
        </tbody>
    </table>

    <div class="summary-card">
        <div class="summary-grid">
            <div class="summary-row">
                <div class="summary-cell">
                    <div class="summary-label">Flooring Material</div>
                    <div class="summary-val">₦{{summary.material_total}}</div>
                    <div class="summary-val-sub">{{summary.material_sub}}</div>
                </div>
                <div class="summary-cell">
                    <div class="summary-label">Accessories & Adhesives</div>
                    <div class="summary-val">₦{{summary.accessories_total}}</div>
                    <div class="summary-val-sub">{{summary.accessories_sub}}</div>
                </div>
                <div class="summary-cell">
                    <div class="summary-label">Workmanship</div>
                    <div class="summary-val">₦{{summary.workmanship_total}}</div>
                    <div class="summary-val-sub">{{summary.workmanship_sub}}</div>
                </div>
                <div class="summary-cell" style="background-color: #1a2e40; color: #ffffff; padding: 10px; border-radius: 3px;">
                    <div class="summary-label" style="color: #b89047; font-weight: bold;">Grand Total</div>
                    <div class="summary-val" style="color: #ffffff; font-size: 14pt;">₦{{summary.grand_total}}</div>
                    <div class="summary-val-sub" style="color: #e1dbd6;">{{client_name}}'s Quote</div>
                </div>
            </div>
        </div>
    </div>

    <div class="notes-section">
        <strong>Notes and Terms:</strong><br>
        1. <strong>Surface Preparation:</strong> Subfloor must be completely clean, flat, and dry prior to installation.<br>
        2. <strong>Validity:</strong> Quotation reflects current market pricing for materials and workmanship.<br>
        3. <strong>Contact:</strong> For inquiries or approval, please call JOBON INTERNATIONAL LTD at {{company.phone}}.
    </div>
</body>
</html>`;

export function compileTemplate(data: Record<string, unknown>): string {
  const template = Handlebars.compile(PDF_TEMPLATE);
  return template(data);
}

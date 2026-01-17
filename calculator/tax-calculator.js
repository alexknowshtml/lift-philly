// Shared LIFT Tax Calculator Logic
// Used by: calculator/index.html, calculator/test-results/index.html

(function() {
    // Tax rates by year (from Jigar's model)
    const TAX_RATES = {
        2021: { birtNI: 0.0599, birtGR: 0.001415, npt: 0.0379 },
        2022: { birtNI: 0.0599, birtGR: 0.001415, npt: 0.0379 },
        2023: { birtNI: 0.0581, birtGR: 0.00141, npt: 0.0375 },
        2024: { birtNI: 0.0581, birtGR: 0.001415, npt: 0.0375 },
        2025: { birtNI: 0.0571, birtGR: 0.00141, npt: 0.0374 },
        2026: { birtNI: 0.0565, birtGR: 0.001395, npt: 0.03735 },
        2027: { birtNI: 0.056, birtGR: 0.00139, npt: 0.0373 }
    };

    // Exemption by year (removed starting 2025)
    const EXEMPTION_BY_YEAR = {
        2021: 100000,
        2022: 100000,
        2023: 100000,
        2024: 100000,
        2025: 0,
        2026: 0,
        2027: 0
    };

    const BIRT_CREDIT_RATE = 0.6;
    const NPT_ESTIMATED_RATE = 0.5;

    // Format currency
    function formatCurrency(amount) {
        return '$' + Math.round(amount).toLocaleString();
    }

    // Format currency with commas but no decimals
    function formatNumber(amount) {
        return Math.round(amount).toLocaleString();
    }

    // Parse currency input
    function parseCurrency(str) {
        return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    }

    // Calculate taxable amounts for a year
    function calculateTaxableAmounts(netIncome, grossReceipts, year, businessExisted) {
        if (!businessExisted) {
            return { taxableGR: 0, taxableNI_NPT: 0, taxableNI_BIRT: 0, statutoryDeduction: 0 };
        }

        const exemption = EXEMPTION_BY_YEAR[year];

        // Taxable Gross Receipts = max(0, grossReceipts - exemption)
        const taxableGR = Math.max(0, grossReceipts - exemption);

        // Taxable Net Income (NPT basis) = full net income (no exemption for NPT)
        const taxableNI_NPT = netIncome;

        // Taxable Net Income (BIRT basis) - uses statutory deduction formula
        let statutoryDeduction = 0;
        if (exemption > 0 && grossReceipts > 0) {
            const ratio = Math.min(netIncome / grossReceipts, 1.0);
            if (grossReceipts < exemption) {
                statutoryDeduction = ratio * grossReceipts;
            } else {
                statutoryDeduction = ratio * exemption;
            }
        }
        const taxableNI_BIRT = Math.max(0, netIncome - statutoryDeduction);

        return { taxableGR, taxableNI_NPT, taxableNI_BIRT, statutoryDeduction };
    }

    // Calculate tax liability for a year
    function calculateTaxLiability(netIncome, grossReceipts, year, businessExisted) {
        const rates = TAX_RATES[year];
        const { taxableGR, taxableNI_NPT, taxableNI_BIRT, statutoryDeduction } = calculateTaxableAmounts(netIncome, grossReceipts, year, businessExisted);

        // BIRT taxes
        const birtGR = taxableGR * rates.birtGR;
        const birtNI = taxableNI_BIRT * rates.birtNI;
        const birtTotal = birtGR + birtNI;

        // NPT tax
        const nptGross = taxableNI_NPT * rates.npt;

        // BIRT credit against NPT (60% of BIRT Net Income portion)
        const birtCredit = birtNI * BIRT_CREDIT_RATE;

        // NPT after credit (cannot go below 0)
        const nptAfterCredit = Math.max(0, nptGross - birtCredit);

        // Total tax liability
        const totalTax = birtTotal + nptAfterCredit;

        return {
            year,
            businessExisted,
            taxableGR,
            taxableNI_BIRT,
            taxableNI_NPT,
            statutoryDeduction,
            birtGR,
            birtNI,
            birtTotal,
            nptGross,
            birtCredit,
            nptAfterCredit,
            totalTax,
            rates,
            exemption: EXEMPTION_BY_YEAR[year],
            grossReceipts,
            netIncome
        };
    }

    // Generate flowchart HTML for a scenario comparing two years
    function generateFlowchartHTML(grossReceipts, netIncome, yearWith, yearWithout) {
        const withExemption = calculateTaxLiability(netIncome, grossReceipts, yearWith, true);
        const withoutExemption = calculateTaxLiability(netIncome, grossReceipts, yearWithout, true);

        const ratesWith = TAX_RATES[yearWith];
        const ratesWithout = TAX_RATES[yearWithout];
        const exemption = EXEMPTION_BY_YEAR[yearWith];

        // Format helpers
        const fmtK = (val) => val >= 1000 ? `$${Math.round(val/1000)}K` : `$${formatNumber(val)}`;
        const fmtPct = (rate) => (rate * 100).toFixed(rate < 0.01 ? 3 : 2) + '%';

        let html = `<h4>${yearWith} (With $${exemption/1000}K Exemption)</h4>`;

        // With exemption section
        html += `<div class="flowchart-step"><span class="label">Taxable GR:</span><span class="formula">max(0, ${fmtK(grossReceipts)} - ${fmtK(exemption)})</span><span class="value">${formatCurrency(withExemption.taxableGR)}</span></div>`;

        if (grossReceipts <= exemption) {
            html += `<div class="flowchart-step"><span class="label">Stat. Deduction:</span><span class="formula">(${fmtK(netIncome)}/${fmtK(grossReceipts)}) × ${fmtK(grossReceipts)}</span><span class="value">${formatCurrency(withExemption.statutoryDeduction)}</span></div>`;
        } else {
            html += `<div class="flowchart-step"><span class="label">Stat. Deduction:</span><span class="formula">(${fmtK(netIncome)}/${fmtK(grossReceipts)}) × ${fmtK(exemption)}</span><span class="value">${formatCurrency(withExemption.statutoryDeduction)}</span></div>`;
        }

        html += `<div class="flowchart-step"><span class="label">Taxable NI (BIRT):</span><span class="formula">max(0, ${fmtK(netIncome)} - ${formatCurrency(withExemption.statutoryDeduction)})</span><span class="value">${formatCurrency(withExemption.taxableNI_BIRT)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">Taxable NI (NPT):</span><span class="formula">${fmtK(netIncome)} (full)</span><span class="value">${formatCurrency(withExemption.taxableNI_NPT)}</span></div>`;
        html += `<div class="flowchart-divider"></div>`;

        html += `<div class="flowchart-step"><span class="label">BIRT (GR):</span><span class="formula">${formatCurrency(withExemption.taxableGR)} × ${fmtPct(ratesWith.birtGR)}</span><span class="value">${formatCurrency(withExemption.birtGR)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">BIRT (NI):</span><span class="formula">${formatCurrency(withExemption.taxableNI_BIRT)} × ${fmtPct(ratesWith.birtNI)}</span><span class="value">${formatCurrency(withExemption.birtNI)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">Total BIRT:</span><span class="formula">${formatCurrency(withExemption.birtGR)} + ${formatCurrency(withExemption.birtNI)}</span><span class="value">${formatCurrency(withExemption.birtTotal)}</span></div>`;
        html += `<div class="flowchart-divider"></div>`;

        html += `<div class="flowchart-step"><span class="label">NPT (before credit):</span><span class="formula">${fmtK(netIncome)} × ${fmtPct(ratesWith.npt)}</span><span class="value">${formatCurrency(withExemption.nptGross)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">BIRT Credit (60%):</span><span class="formula">${formatCurrency(withExemption.birtNI)} × 60%</span><span class="value">${formatCurrency(withExemption.birtCredit)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">NPT (after credit):</span><span class="formula">max(0, ${formatCurrency(withExemption.nptGross)} - ${formatCurrency(withExemption.birtCredit)})</span><span class="value">${formatCurrency(withExemption.nptAfterCredit)}</span></div>`;
        html += `<div class="flowchart-divider"></div>`;
        html += `<div class="flowchart-step flowchart-result"><span class="label">Total Tax ${yearWith}:</span><span class="formula">${formatCurrency(withExemption.birtTotal)} + ${formatCurrency(withExemption.nptAfterCredit)}</span><span class="value">${formatCurrency(withExemption.totalTax)}</span></div>`;

        // Without exemption section
        html += `<h4 style="margin-top: 16px;">${yearWithout} (Without Exemption)</h4>`;

        html += `<div class="flowchart-step"><span class="label">Taxable GR:</span><span class="formula">max(0, ${fmtK(grossReceipts)} - $0)</span><span class="value">${formatCurrency(withoutExemption.taxableGR)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">Stat. Deduction:</span><span class="formula">No exemption</span><span class="value">$0</span></div>`;
        html += `<div class="flowchart-step"><span class="label">Taxable NI (BIRT):</span><span class="formula">max(0, ${fmtK(netIncome)} - $0)</span><span class="value">${formatCurrency(withoutExemption.taxableNI_BIRT)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">Taxable NI (NPT):</span><span class="formula">${fmtK(netIncome)} (full)</span><span class="value">${formatCurrency(withoutExemption.taxableNI_NPT)}</span></div>`;
        html += `<div class="flowchart-divider"></div>`;

        html += `<div class="flowchart-step"><span class="label">BIRT (GR):</span><span class="formula">${fmtK(grossReceipts)} × ${fmtPct(ratesWithout.birtGR)}</span><span class="value">${formatCurrency(withoutExemption.birtGR)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">BIRT (NI):</span><span class="formula">${fmtK(netIncome)} × ${fmtPct(ratesWithout.birtNI)}</span><span class="value">${formatCurrency(withoutExemption.birtNI)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">Total BIRT:</span><span class="formula">${formatCurrency(withoutExemption.birtGR)} + ${formatCurrency(withoutExemption.birtNI)}</span><span class="value">${formatCurrency(withoutExemption.birtTotal)}</span></div>`;
        html += `<div class="flowchart-divider"></div>`;

        html += `<div class="flowchart-step"><span class="label">NPT (before credit):</span><span class="formula">${fmtK(netIncome)} × ${fmtPct(ratesWithout.npt)}</span><span class="value">${formatCurrency(withoutExemption.nptGross)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">BIRT Credit (60%):</span><span class="formula">${formatCurrency(withoutExemption.birtNI)} × 60%</span><span class="value">${formatCurrency(withoutExemption.birtCredit)}</span></div>`;
        html += `<div class="flowchart-step"><span class="label">NPT (after credit):</span><span class="formula">max(0, ${formatCurrency(withoutExemption.nptGross)} - ${formatCurrency(withoutExemption.birtCredit)})</span><span class="value">${formatCurrency(withoutExemption.nptAfterCredit)}</span></div>`;
        html += `<div class="flowchart-divider"></div>`;
        html += `<div class="flowchart-step flowchart-result"><span class="label">Total Tax ${yearWithout}:</span><span class="formula">${formatCurrency(withoutExemption.birtTotal)} + ${formatCurrency(withoutExemption.nptAfterCredit)}</span><span class="value">${formatCurrency(withoutExemption.totalTax)}</span></div>`;

        // Tax increase note
        const taxIncrease = withoutExemption.totalTax - withExemption.totalTax;
        html += `<p class="flowchart-note">Tax increase: ${formatCurrency(withoutExemption.totalTax)} - ${formatCurrency(withExemption.totalTax)} = ${formatCurrency(taxIncrease)}/year</p>`;

        return html;
    }

    // Export for use in other files
    window.TaxCalculator = {
        TAX_RATES,
        EXEMPTION_BY_YEAR,
        BIRT_CREDIT_RATE,
        NPT_ESTIMATED_RATE,
        formatCurrency,
        formatNumber,
        parseCurrency,
        calculateTaxableAmounts,
        calculateTaxLiability,
        generateFlowchartHTML
    };
})();

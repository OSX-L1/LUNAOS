// ===== PVC HEIGHT ADJUSTMENT =====
const adjustPVCHeight = (h) => {
  if (h <= 2.01) return 2.0; if (h <= 2.20 || h === 2.21) return 2.2;
  if (h <= 2.40 || h === 2.41) return 2.4; if (h <= 2.60 || h === 2.61) return 2.6;
  if (h <= 2.80 || h === 2.81) return 2.8; if (h <= 3.00 || h === 3.01) return 3.0;
  if (h <= 3.30 || h === 3.31) return 3.3; if (h <= 3.50 || h === 3.51) return 3.5;
  if (h <= 3.70) return 3.7; return h;
};

// PVC formula: width * adjustedHeight * 1.2 * price * qty
const pvcFormula = (w, hAdjusted, price, qty=1) => {
  if (!w || !hAdjusted || !price || !qty) return 0;
  return w * hAdjusted * 1.2 * price * qty;
};

// Wood blind with minimum size rule (w>=0.80, h>=1.0)
const woodBlindFormula = (w, h, price, qty=1) => {
  if (!w || !h || !price || !qty) return 0;
  const wEff = Math.max(0.80, w);
  const hEff = Math.max(1.0, h);
  return wEff * hEff * 1.2 * price * qty;
};

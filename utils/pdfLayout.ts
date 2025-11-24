export type PdfLayoutScale = {
  fontScale: number;
  spacingScale: number;
  contentScale: number;
};

type PdfLayoutOptions = {
  /**
   * Counts additional blocks (headers, footers, notices, etc.) that also take up space.
   */
  extraSections?: number;
  /**
   * Base number of rows that comfortably fit without scaling.
   */
  baseRows?: number;
};

/**
 * Computes scale factors that keep receipt HTML constrained to a single PDF page.
 */
export const getPdfLayoutScale = (
  rowCount: number,
  options: PdfLayoutOptions = {},
): PdfLayoutScale => {
  const { extraSections = 0, baseRows = 12 } = options;
  const effectiveRows = rowCount + extraSections * 1.5;

  let contentScale = 1;

  if (effectiveRows > baseRows + 12) {
    contentScale = 0.82;
  } else if (effectiveRows > baseRows + 8) {
    contentScale = 0.86;
  } else if (effectiveRows > baseRows + 4) {
    contentScale = 0.9;
  } else if (effectiveRows > baseRows + 1) {
    contentScale = 0.95;
  }

  const fontScale = Math.max(0.85, contentScale);
  const spacingScale = Math.max(0.78, contentScale - 0.05);

  return {
    fontScale: Number(fontScale.toFixed(3)),
    spacingScale: Number(spacingScale.toFixed(3)),
    contentScale: Number(contentScale.toFixed(3)),
  };
};

export const scaleValue = (value: number, scale: number, precision = 2): string =>
  (value * scale).toFixed(precision);



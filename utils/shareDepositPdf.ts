import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { getPdfLayoutScale } from './pdfLayout';

type DetailRow = {
  label: string;
  value?: string | null;
};

export type DepositSharePayload = {
  tokenSymbol: string;
  tokenName?: string;
  networkDisplay?: string;
  address: string;
  minDeposit?: string;
  walletReferenceId?: string | null;
  qrCodeDataUrl?: string | null;
  extraDetails?: DetailRow[];
  extraWarnings?: string[];
};

const escapeHtml = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildDetailRows = (details: DetailRow[]) =>
  details
    .filter(detail => detail.value)
    .map(
      detail => `
        <div class="detail-row">
          <span class="detail-label">${escapeHtml(detail.label)}</span>
          <span class="detail-value">${escapeHtml(detail.value)}</span>
        </div>
      `,
    )
    .join('\n');

const defaultWarnings = (tokenSymbol: string, networkDisplay?: string) => [
  `Only send ${tokenSymbol} using ${networkDisplay || 'the specified network'}.`,
  'Sending funds on any other network may result in permanent loss.',
  'Always verify the wallet address before initiating a transfer.',
];

const buildWarningBlock = (warnings: string[]) =>
  warnings.length
    ? `
        <div class="warning">
          <strong>Important:</strong>
          <ul>
            ${warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join('')}
          </ul>
        </div>
      `
    : '';

const generateDepositHtml = ({
  tokenSymbol,
  tokenName,
  networkDisplay,
  address,
  details,
  qrCodeDataUrl,
  warnings,
}: {
  tokenSymbol: string;
  tokenName?: string;
  networkDisplay?: string;
  address: string;
  details: DetailRow[];
  qrCodeDataUrl?: string | null;
  warnings: string[];
}) => {
  const prettyTokenName = tokenName ?? tokenSymbol;
  const title = `${prettyTokenName} Deposit`;
  const subtitle = networkDisplay ? `${networkDisplay} Deposit Details` : 'Deposit Details';
  const layoutScale = getPdfLayoutScale(details.length, {
    extraSections: warnings.length + (qrCodeDataUrl ? 4 : 2),
    baseRows: 9,
  });
  const fontScale = layoutScale.fontScale.toFixed(3);
  const spacingScale = layoutScale.spacingScale.toFixed(3);
  const contentScale = layoutScale.contentScale.toFixed(3);

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          :root {
            --font-scale: ${fontScale};
            --spacing-scale: ${spacingScale};
            --content-scale: ${contentScale};
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          html, body { height: 100%; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: calc(24px * var(--spacing-scale));
            background-color: #f4f4f5;
            color: #1f2937;
            line-height: calc(1.5 * var(--font-scale));
            min-height: 100vh;
            overflow: hidden;
            display: flex;
            justify-content: center;
          }
          .scaled-card {
            width: calc(100% / var(--content-scale));
            transform: scale(var(--content-scale));
            transform-origin: top center;
          }
          .card {
            background-color: #ffffff;
            border-radius: 18px;
            padding: calc(24px * var(--spacing-scale));
            box-shadow: 0 20px 45px rgba(17, 24, 39, 0.08);
            max-width: 640px;
            border: 1px solid #ede9fe;
          }
          .header {
            text-align: center;
            margin-bottom: calc(24px * var(--spacing-scale));
          }
          .title {
            font-size: calc(22px * var(--font-scale));
            font-weight: 700;
            color: #35297F;
            margin: 0;
          }
          .subtitle {
            font-size: calc(14px * var(--font-scale));
            color: #6b7280;
            margin-top: calc(4px * var(--spacing-scale));
          }
          .qr-container {
            text-align: center;
            margin: calc(24px * var(--spacing-scale)) 0;
          }
          .qr-image {
            width: 180px;
            height: 180px;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            padding: calc(12px * var(--spacing-scale));
            background-color: #fafafa;
          }
          .details {
            background-color: #f9fafb;
            border-radius: 12px;
            padding: calc(16px * var(--spacing-scale));
            border: 1px solid #ede9fe;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: calc(10px * var(--spacing-scale)) 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #6b7280;
            font-weight: 500;
            font-size: calc(14px * var(--font-scale));
          }
          .detail-value {
            color: #111827;
            font-weight: 600;
            font-size: calc(14px * var(--font-scale));
            max-width: 65%;
            word-break: break-word;
            text-align: right;
          }
          .address-block {
            margin-top: calc(24px * var(--spacing-scale));
            background-color: #ede9fe;
            border-radius: 12px;
            padding: calc(16px * var(--spacing-scale));
            border: 1px solid #ddd6fe;
          }
          .address-block h3 {
            margin: 0 0 calc(8px * var(--spacing-scale)) 0;
            font-size: calc(14px * var(--font-scale));
            color: #4c1d95;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .address-block p {
            margin: 0;
            font-size: calc(15px * var(--font-scale));
            font-weight: 600;
            color: #1f2937;
            word-break: break-word;
          }
          .warning {
            margin-top: calc(24px * var(--spacing-scale));
            border-radius: 12px;
            padding: calc(16px * var(--spacing-scale));
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            font-size: calc(13px * var(--font-scale));
          }
          .warning ul {
            padding-left: calc(18px * var(--spacing-scale));
            margin: calc(8px * var(--spacing-scale)) 0 0 0;
          }
          .warning li {
            margin-bottom: calc(6px * var(--spacing-scale));
          }
          .footer {
            margin-top: calc(32px * var(--spacing-scale));
            font-size: calc(11px * var(--font-scale));
            color: #9ca3af;
            text-align: center;
          }
          @media print {
            body { background: #f4f4f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="card scaled-card">
          <div class="header">
            <h1 class="title">${escapeHtml(title)}</h1>
            <p class="subtitle">${escapeHtml(subtitle)}</p>
          </div>

          ${
            qrCodeDataUrl
              ? `
            <div class="qr-container">
              <img src="${qrCodeDataUrl}" class="qr-image" alt="Deposit QR Code" />
            </div>`
              : ''
          }

          <div class="address-block">
            <h3>Wallet Address</h3>
            <p>${escapeHtml(address)}</p>
          </div>

          <div class="details">
            ${buildDetailRows(details)}
          </div>

          ${buildWarningBlock(warnings)}

          <div class="footer">
            <p>Generated by ZeusODX</p>
            <p>Please contact support if you need assistance.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export async function shareDepositPdf({
  tokenSymbol,
  tokenName,
  networkDisplay,
  address,
  minDeposit,
  walletReferenceId,
  qrCodeDataUrl,
  extraDetails = [],
  extraWarnings = [],
}: DepositSharePayload) {
  const details: DetailRow[] = [
    { label: 'Token', value: tokenName ?? tokenSymbol },
    { label: 'Network', value: networkDisplay ?? 'Not specified' },
    { label: 'Minimum Deposit', value: minDeposit },
    { label: 'Wallet ID', value: walletReferenceId ?? undefined },
    ...extraDetails,
  ];

  const warnings = [...defaultWarnings(tokenSymbol, networkDisplay), ...extraWarnings];

  const html = generateDepositHtml({
    tokenSymbol,
    tokenName,
    networkDisplay,
    address,
    details,
    qrCodeDataUrl,
    warnings,
  });

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      width: 612,
      height: 792,
      base64: false,
    });

    if (!uri) {
      throw new Error('Failed to generate PDF file');
    }

    const sharingAvailable = await Sharing.isAvailableAsync();
    if (sharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${tokenSymbol} Deposit`,
        UTI: 'com.adobe.pdf',
      });
      return;
    }

    await Share.share({
      title: `${tokenSymbol} Deposit`,
      message: `${tokenSymbol} deposit details attached.`,
      url: Platform.OS === 'ios' ? uri : `file://${uri}`,
    });
  } catch (error) {
    console.error('shareDepositPdf error', error);
    throw error;
  }
}





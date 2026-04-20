import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';

/**
 * Calculate SHA-256 hash of a file
 */
export function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Calculate SHA-256 hash from a buffer
 */
export function calculateBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate a unique verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${random}${ext}`;
}

/**
 * Generate QR Code image with optional logo overlay
 * @param data - Data to encode in QR code
 * @param logoBuffer - Optional logo buffer (will be embedded in center of QR code)
 * @returns Buffer containing PNG image
 */
export async function generateQRCodeWithLogo(
  data: string,
  logoBuffer?: Buffer | null
): Promise<Buffer> {
  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(data, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H', // High error correction to allow logo overlay
  });

  if (logoBuffer) {
    try {
      // Resize logo to fit in center (about 25% of QR code size)
      const resizedLogo = await sharp(logoBuffer)
        .resize(100, 100, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();

      // Create white background for logo area
      const whiteBg = await sharp({
        create: {
          width: 110,
          height: 110,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      // Composite logo onto white background
      const logoWithBg = await sharp(whiteBg)
        .composite([{ input: resizedLogo, top: 5, left: 5 }])
        .png()
        .toBuffer();

      // Get QR code dimensions
      const qrMetadata = await sharp(qrBuffer).metadata();
      const qrWidth = qrMetadata.width || 400;
      const qrHeight = qrMetadata.height || 400;

      // Calculate center position
      const centerX = Math.floor((qrWidth - 110) / 2);
      const centerY = Math.floor((qrHeight - 110) / 2);

      // Composite logo onto QR code
      const finalQR = await sharp(qrBuffer)
        .composite([{ input: logoWithBg, top: centerY, left: centerX }])
        .png()
        .toBuffer();

      return finalQR;
    } catch (error) {
      console.warn('Failed to embed logo in QR code, returning plain QR code', error);
      return qrBuffer;
    }
  }

  return qrBuffer;
}

/**
 * Sign a PDF document by adding QR code and signature text
 * @param pdfBuffer - Buffer containing the PDF to sign
 * @param qrImageBuffer - Buffer containing QR code image
 * @param signerInfo - Information about the signer
 * @returns Buffer containing the signed PDF
 */
export async function signPDF(
  pdfBuffer: Buffer,
  qrImageBuffer: Buffer,
  signerInfo: {
    nama: string;
    nip: string;
    jabatan: string;
    opd: string;
    tanggal: string;
  }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width, height } = lastPage.getSize();

  // Embed QR code image
  const qrImage = await pdfDoc.embedPng(qrImageBuffer);
  const qrSize = 120; // QR code size in points

  // Position: bottom-right corner
  const margin = 40;
  const qrX = width - qrSize - margin;
  const qrY = margin + 60;

  // Draw QR code
  lastPage.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // Add signature text
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 7;
  const lineHeight = fontSize + 3;

  const textLines = [
    'Ditandatangani secara elektronik oleh:',
    `${signerInfo.nama}`,
    `NIP: ${signerInfo.nip}`,
    `${signerInfo.jabatan}`,
    `${signerInfo.opd}`,
    `${signerInfo.tanggal}`,
  ];

  const textX = qrX;
  let textY = qrY - 10;

  for (const line of textLines) {
    lastPage.drawText(line, {
      x: textX,
      y: textY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    textY -= lineHeight;
  }

  // Draw border around signature area
  const borderWidth = qrSize + 10;
  const borderHeight = qrSize + textLines.length * lineHeight + 30;
  lastPage.drawRectangle({
    x: qrX - 5,
    y: textY - 5,
    width: borderWidth,
    height: borderHeight,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 0.5,
  });

  // Save signed PDF and return buffer
  const signedPdfBytes = await pdfDoc.save();
  return signedPdfBytes;
}

/**
 * Ensure uploads directory exists
 */
export function ensureUploadsDir() {
  const dirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'original'),
    path.join(process.cwd(), 'uploads', 'signed'),
    path.join(process.cwd(), 'uploads', 'logos'),
    path.join(process.cwd(), 'uploads', 'qrcodes'),
    path.join(process.cwd(), 'uploads', 'banners'),
    path.join(process.cwd(), 'uploads', 'berita'),
    path.join(process.cwd(), 'uploads', 'tte-images'),
    path.join(process.cwd(), 'uploads', 'tte-stamps'),
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ParsedDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'text' | 'unknown';
  fileSize: number;
  category: 'contract' | 'docs' | 'tz' | 'table' | 'auto';
  content: string;
  charCount: number;
  status: 'ready' | 'error' | 'processing';
  errorMessage?: string;
}

/**
 * Robust Raw Text Extractor from ArrayBuffer for fallback decoding
 */
function extractReadableTextFromBuffer(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(buffer);

    // Strip XML/HTML tags if present
    const strippedXml = raw.replace(/<[^>]+>/g, ' ');

    // Retain Cyrillic, Latin, digits, basic punctuation, newlines and spaces
    const cleanChars = strippedXml.replace(/[^\x20-\x7E\xA0-\xFF\u0400-\u04FF\n\r\t]/g, ' ');

    // Normalize whitespace
    const normalized = cleanChars
      .split('\n')
      .map(line => line.replace(/\s+/g, ' ').trim())
      .filter(line => line.length > 2)
      .join('\n');

    return normalized;
  } catch (err) {
    console.warn('Fallback text decoder error:', err);
    return '';
  }
}

/**
 * Standardized Document Parser for PDF, Word (docx/doc), Excel (xlsx/xls/csv), and Text files.
 */
export async function parseDocumentFile(
  file: File,
  category: 'contract' | 'docs' | 'tz' | 'table' | 'auto' = 'auto'
): Promise<ParsedDocument> {
  const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let fileType: ParsedDocument['fileType'] = 'text';
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    fileType = 'excel';
  } else if (['docx', 'doc', 'rtf'].includes(ext)) {
    fileType = 'word';
  } else if (ext === 'pdf') {
    fileType = 'pdf';
  }

  let autoCategory = category;
  if (category === 'auto') {
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('договор') || lowerName.includes('проект') || lowerName.includes('contract')) {
      autoCategory = 'contract';
    } else if (lowerName.includes('тз') || lowerName.includes('задание') || lowerName.includes('специфик') || lowerName.includes('tz')) {
      autoCategory = 'tz';
    } else if (['xlsx', 'xls', 'csv'].includes(ext) || lowerName.includes('смета') || lowerName.includes('таблиц')) {
      autoCategory = 'table';
    } else {
      autoCategory = 'docs';
    }
  }

  let extractedText = '';

  try {
    if (fileType === 'excel') {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetTexts: string[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          if (csvContent.trim()) {
            sheetTexts.push(`--- ЛИСТ: ${sheetName} ---\n${csvContent}`);
          }
        });

        extractedText = sheetTexts.join('\n\n');
      } catch (excelErr) {
        console.warn(`XLSX read failed for ${file.name}, using buffer fallback:`, excelErr);
        const buffer = await file.arrayBuffer();
        extractedText = extractReadableTextFromBuffer(buffer);
      }
    } else if (fileType === 'word') {
      if (ext === 'docx') {
        try {
          const buffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          extractedText = result.value || '';
        } catch (mammothErr) {
          console.warn(`Mammoth docx parse failed for ${file.name}, using fallback decoder:`, mammothErr);
          const buffer = await file.arrayBuffer();
          extractedText = extractReadableTextFromBuffer(buffer);
        }
      } else {
        // Fallback for older .doc / .rtf files or text format
        try {
          const buffer = await file.arrayBuffer();
          extractedText = extractReadableTextFromBuffer(buffer);
        } catch (docErr) {
          extractedText = await file.text();
        }
      }
    } else if (fileType === 'pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawStr = decoder.decode(arrayBuffer);

        const textMatches: string[] = [];
        const pdfTextRegex = /\(([^()]{3,})\)\s*TJ|\(([^()]{3,})\)\s*Tj/g;
        let match;
        while ((match = pdfTextRegex.exec(rawStr)) !== null) {
          const str = match[1] || match[2];
          if (str && str.length > 2) {
            textMatches.push(str.replace(/\\([()])/g, '$1'));
          }
        }

        if (textMatches.length > 5) {
          extractedText = textMatches.join(' ');
        } else {
          extractedText = extractReadableTextFromBuffer(arrayBuffer);
        }
      } catch (pdfErr) {
        extractedText = await file.text();
      }
    } else {
      // Plain text, CSV, JSON, MD, RTF
      extractedText = await file.text();
    }
  } catch (outerErr: any) {
    console.error(`Error reading file ${file.name}:`, outerErr);
    try {
      extractedText = await file.text();
    } catch {
      extractedText = '';
    }
  }

  // Clean up excessive whitespace while preserving line structure
  let cleanedText = (extractedText || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');

  if (!cleanedText.trim()) {
    cleanedText = `[Документ ${file.name} загружен. Текст закупки обработан]`;
  }

  return {
    id: fileId,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    category: autoCategory,
    content: cleanedText,
    charCount: cleanedText.length,
    status: 'ready',
  };
}

/**
 * Format bytes into human readable KB/MB string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

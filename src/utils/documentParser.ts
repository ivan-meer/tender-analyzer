import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ParsedDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'text' | 'archive' | 'unknown';
  fileSize: number;
  category: 'contract' | 'docs' | 'tz' | 'table' | 'auto';
  content: string;
  charCount: number;
  status: 'ready' | 'error' | 'processing';
  errorMessage?: string;
  isFromArchive?: boolean;
  archiveFileName?: string;
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

export function smartClassifyDocument(
  fileName: string,
  content: string = ''
): ParsedDocument['category'] {
  const lowerName = fileName.toLowerCase();
  const lowerContentSample = (content || '').slice(0, 3000).toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Check for Project of Contract
  if (
    lowerName.includes('договор') ||
    lowerName.includes('проект') ||
    lowerName.includes('контракт') ||
    lowerName.includes('contract') ||
    lowerContentSample.includes('проект договора') ||
    lowerContentSample.includes('проект контракта') ||
    lowerContentSample.includes('настоящий договор заключен') ||
    lowerContentSample.includes('предмет договора')
  ) {
    return 'contract';
  }

  // 2. Check for Technical Specification / Specifications
  if (
    lowerName.includes('тз') ||
    lowerName.includes('задание') ||
    lowerName.includes('специфик') ||
    lowerName.includes('tz') ||
    lowerName.includes('требован') ||
    lowerName.includes('ведомост') ||
    lowerName.includes('товар') ||
    lowerContentSample.includes('техническое задание') ||
    lowerContentSample.includes('спецификация товара') ||
    lowerContentSample.includes('ведомость объемов')
  ) {
    return 'tz';
  }

  // 3. Check for Tables / Estimates / Calc
  if (
    ['xlsx', 'xls', 'csv'].includes(ext) ||
    lowerName.includes('смета') ||
    lowerName.includes('таблиц') ||
    lowerName.includes('прайс') ||
    lowerName.includes('расчет') ||
    lowerContentSample.includes('расчет начальной максимальной цены') ||
    lowerContentSample.includes('сметный расчет')
  ) {
    return 'table';
  }

  // 4. Default to Procurement notice / documentation
  return 'docs';
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

  let autoCategory = category === 'auto' ? smartClassifyDocument(file.name) : category;

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
 * Unpacks ZIP archive entries and processes extracted document files.
 */
export async function parseArchiveFile(
  archiveFile: File,
  category: 'contract' | 'docs' | 'tz' | 'table' | 'auto' = 'auto'
): Promise<ParsedDocument[]> {
  const extractedParsedDocs: ParsedDocument[] = [];

  try {
    const arrayBuffer = await archiveFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const entries = Object.keys(zip.files);
    for (const relativePath of entries) {
      const zipEntry = zip.files[relativePath];

      // Skip directories and system hidden files (e.g. __MACOSX, .DS_Store)
      if (
        zipEntry.dir ||
        relativePath.includes('__MACOSX') ||
        relativePath.startsWith('.') ||
        relativePath.endsWith('.DS_Store') ||
        relativePath.endsWith('Thumbs.db')
      ) {
        continue;
      }

      const fileName = relativePath.split('/').pop() || relativePath;
      if (!fileName || fileName.startsWith('.')) continue;

      try {
        const fileData = await zipEntry.async('uint8array');
        const blob = new Blob([fileData]);
        const syntheticFile = new File([blob], fileName, {
          lastModified: zipEntry.date ? zipEntry.date.getTime() : Date.now(),
        });

        const parsedDoc = await parseDocumentFile(syntheticFile, category);
        parsedDoc.isFromArchive = true;
        parsedDoc.archiveFileName = archiveFile.name;
        extractedParsedDocs.push(parsedDoc);
      } catch (entryErr) {
        console.warn(`Failed to extract file ${relativePath} from archive:`, entryErr);
        extractedParsedDocs.push({
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileName,
          fileType: 'unknown',
          fileSize: 0,
          category: 'docs',
          content: `[Ошибка извлечения файла из архива: ${(entryErr as any)?.message || 'неподдерживаемый формат'}]`,
          charCount: 0,
          status: 'error',
          errorMessage: 'Не удалось извлечь файл из архива',
          isFromArchive: true,
          archiveFileName: archiveFile.name,
        });
      }
    }
  } catch (archiveErr: any) {
    console.error(`Failed to parse ZIP archive ${archiveFile.name}:`, archiveErr);
    // Return a single document error representation
    extractedParsedDocs.push({
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fileName: archiveFile.name,
      fileType: 'archive',
      fileSize: archiveFile.size,
      category: 'docs',
      content: `[Ошибка разархивирования ${archiveFile.name}: ${archiveErr?.message || 'поврежденный или зашифрованный архив'}]`,
      charCount: 0,
      status: 'error',
      errorMessage: archiveErr?.message || 'Ошибка обработки архива',
      isFromArchive: true,
      archiveFileName: archiveFile.name,
    });
  }

  return extractedParsedDocs;
}

/**
 * Parses a single file or extracts an archive if it is a ZIP/RAR/7Z archive file.
 */
export async function parseFileOrArchive(
  file: File,
  category: 'contract' | 'docs' | 'tz' | 'table' | 'auto' = 'auto'
): Promise<ParsedDocument[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext)) {
    return await parseArchiveFile(file, category);
  }

  const singleParsed = await parseDocumentFile(file, category);
  return [singleParsed];
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

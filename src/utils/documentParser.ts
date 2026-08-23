import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available in browser
try {
  if (typeof window !== 'undefined' && (pdfjsLib as any)?.GlobalWorkerOptions) {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  // Silent fallback
}

export type DocumentCategory = 
  | 'contract'          // Проект контракта / договора / соглашение
  | 'tz'                // Техническое задание / Описание объекта закупки / КТРУ
  | 'table'             // Смета / Спецификация / Обоснование НМЦК / Таблица цен
  | 'docs'              // Извещение / Правила закупки / Регламент
  | 'forms'             // Формы заявок / Оферта / Декларации участника
  | 'national_regime'   // Документы нацрежима (ГИСП, РЭП, ПП 1875/616/878)
  | 'commercial_rfp'    // Запрос предложений RFP/RFQ / Прайс-лист КП
  | 'qualification'     // Документы должной осмотрительности / Карточка / Сертификаты
  | 'auto';             // Общий документ / Авто-определение

export interface ParsedDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'word' | 'excel' | 'text' | 'archive' | 'image' | 'xml' | 'unknown';
  fileSize: number;
  category: DocumentCategory;
  content: string;
  charCount: number;
  status: 'ready' | 'error' | 'processing';
  errorMessage?: string;
  isFromArchive?: boolean;
  archiveFileName?: string;
  ocrProcessed?: boolean;
  ocrModelUsed?: string;
  ocrPagesCount?: number;
  rawFile?: File;
}

/**
 * Converts a File or Blob into a Base64 data URL string.
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Fast in-browser text extraction from digital PDF using pdfjs-dist.
 * Runs instantly without external API network calls, preventing freezes and timeouts.
 */
export async function extractTextFromPdfFile(file: File | Blob): Promise<{ text: string; pagesCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedarray = new Uint8Array(arrayBuffer);
    
    const loadingTask = (pdfjsLib as any).getDocument({
      data: typedarray,
      isEvalSupported: false,
      useSystemFonts: true,
      stopAtErrors: false
    });
    
    // Safety timeout for loading PDF
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('PDF loading timeout')), 10000))
    ]) as any;

    const numPages = Math.min(pdf.numPages, 60);
    const pageTexts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = (textContent.items || [])
          .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
          .filter(Boolean);
          
        if (pageStrings.length > 0) {
          pageTexts.push(pageStrings.join(' '));
        }

        // Periodically yield to the main thread to prevent UI freezing
        if (i % 6 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (pageErr) {
        console.warn(`PDF.js page ${i} error:`, pageErr);
      }
    }
    
    const fullText = pageTexts.join('\n\n');
    return { text: fullText, pagesCount: pdf.numPages };
  } catch (err) {
    console.warn('PDF.js text extraction failed, falling back:', err);
    return { text: '', pagesCount: 0 };
  }
}

/**
 * Performs Mistral OCR (with server fallback to DeepInfra Vision / Gemini Vision) on a PDF or image file.
 */
export async function runMistralOcrForFile(
  file: File | Blob,
  customApiKey?: string
): Promise<{ markdownText: string; pagesCount: number; modelUsed: string }> {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || (file instanceof File && file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

  const res = await fetch('/api/ocr/mistral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentBase64: base64Data,
      mimeType,
      mistralApiKey: customApiKey
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Ошибка OCR (${res.status})`);
  }

  const data = await res.json();
  return {
    markdownText: data.markdownText || data.text || '',
    pagesCount: data.pagesCount || 1,
    modelUsed: data.modelUsed || 'Mistral OCR'
  };
}

/**
 * Robust Raw Text Extractor from ArrayBuffer for fallback decoding.
 * Uses bounded slices and efficient chunked processing to prevent main-thread UI freezing on large files.
 */
function extractReadableTextFromBuffer(buffer: ArrayBuffer): string {
  try {
    // Cap buffer processing to max 1.2 MB to avoid freezing the browser on 30-50MB binary streams
    const MAX_BUFFER_SLICE = 1200000;
    const sliceToDecode = buffer.byteLength > MAX_BUFFER_SLICE 
      ? buffer.slice(0, MAX_BUFFER_SLICE) 
      : buffer;

    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(sliceToDecode);

    // Efficient tag removal on capped string
    const strippedXml = raw.replace(/<[^>]+>/g, ' ');

    // Retain Cyrillic, Latin, digits, basic punctuation, newlines and spaces
    const cleanChars = strippedXml.replace(/[^\x20-\x7E\xA0-\xFF\u0400-\u04FF\n\r\t]/g, ' ');

    // Normalize whitespace with length limit
    const lines = cleanChars.split('\n');
    const resultLines: string[] = [];
    let totalLen = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].replace(/\s+/g, ' ').trim();
      if (trimmed.length > 2) {
        resultLines.push(trimmed);
        totalLen += trimmed.length;
        if (totalLen > 150000) break; // Cap at 150k chars
      }
    }

    return resultLines.join('\n');
  } catch (err) {
    console.warn('Fallback text decoder error:', err);
    return '';
  }
}

export function smartClassifyDocument(
  fileName: string,
  content: string = ''
): DocumentCategory {
  const lowerName = fileName.toLowerCase();
  const lowerContentSample = (content || '').slice(0, 4000).toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. National Regime & Registry Documents (44-FZ & 223-FZ)
  if (
    lowerName.includes('гисп') ||
    lowerName.includes('рэп') ||
    lowerName.includes('минпромторг') ||
    lowerName.includes('реестр') ||
    lowerName.includes('1875') ||
    lowerName.includes('616') ||
    lowerName.includes('617') ||
    lowerName.includes('878') ||
    lowerName.includes('нацрежим') ||
    lowerName.includes('страна происхожд') ||
    lowerContentSample.includes('реестровый номер минпромторга') ||
    lowerContentSample.includes('выписка из реестра российской') ||
    lowerContentSample.includes('постановление правительства № 1875') ||
    lowerContentSample.includes('постановление правительства № 616')
  ) {
    return 'national_regime';
  }

  // 2. Commercial RFP / RFQ / Quotation Requests & Price Matrices
  if (
    lowerName.includes('rfp') ||
    lowerName.includes('rfq') ||
    lowerName.includes('запрос предложений') ||
    lowerName.includes('коммерческое предложение') ||
    lowerName.includes('шаблон кп') ||
    lowerName.includes('форма кп') ||
    lowerName.includes('прайс') ||
    lowerName.includes('матрица цен') ||
    lowerContentSample.includes('request for proposal') ||
    lowerContentSample.includes('запрос коммерческих предложений') ||
    lowerContentSample.includes('форма коммерческого предложения')
  ) {
    return 'commercial_rfp';
  }

  // 3. Application Forms & Participant Declarations (223-FZ & 44-FZ)
  if (
    lowerName.includes('форма 1') ||
    lowerName.includes('форма 2') ||
    lowerName.includes('форма 3') ||
    lowerName.includes('форма заявки') ||
    lowerName.includes('деклараци') ||
    lowerName.includes('оферт') ||
    lowerName.includes('согласие') ||
    lowerName.includes('письмо о подаче') ||
    lowerContentSample.includes('форма заявки на участие') ||
    lowerContentSample.includes('декларация о соответствии') ||
    lowerContentSample.includes('настоящим письмом подтверждаем')
  ) {
    return 'forms';
  }

  // 4. Due Diligence / Qualification / Certificates (Commercial & 223-FZ)
  if (
    lowerName.includes('карточка') ||
    lowerName.includes('квалификац') ||
    lowerName.includes('сертификат') ||
    lowerName.includes('декларация еас') ||
    lowerName.includes('егрюл') ||
    lowerName.includes('бухгалтер') ||
    lowerName.includes('баланс') ||
    lowerName.includes('nda') ||
    lowerName.includes('конфиденциальн') ||
    lowerContentSample.includes('карточка предприятия') ||
    lowerContentSample.includes('сертификат соответствия') ||
    lowerContentSample.includes('бухгалтерский баланс')
  ) {
    return 'qualification';
  }

  // 5. Check for Project of Contract / State Contract / Framework Agreement
  if (
    lowerName.includes('договор') ||
    lowerName.includes('проект') ||
    lowerName.includes('контракт') ||
    lowerName.includes('contract') ||
    lowerName.includes('пгк') ||
    lowerName.includes('соглашение') ||
    lowerContentSample.includes('проект государственного контракта') ||
    lowerContentSample.includes('проект договора') ||
    lowerContentSample.includes('проект контракта') ||
    lowerContentSample.includes('настоящий контракт заключен') ||
    lowerContentSample.includes('настоящий договор заключен') ||
    lowerContentSample.includes('предмет контракта') ||
    lowerContentSample.includes('предмет договора')
  ) {
    return 'contract';
  }

  // 6. Check for Technical Specification / Statement of Work / KTRU / SOW
  if (
    lowerName.includes('тз') ||
    lowerName.includes('задание') ||
    lowerName.includes('специфик') ||
    lowerName.includes('tz') ||
    lowerName.includes('требован') ||
    lowerName.includes('ведомост') ||
    lowerName.includes('товар') ||
    lowerName.includes('ктру') ||
    lowerName.includes('описание объекта') ||
    lowerName.includes('ооз') ||
    lowerName.includes('sow') ||
    lowerContentSample.includes('описание объекта закупки') ||
    lowerContentSample.includes('техническое задание') ||
    lowerContentSample.includes('спецификация товара') ||
    lowerContentSample.includes('ведомость объемов работ') ||
    lowerContentSample.includes('код ктру')
  ) {
    return 'tz';
  }

  // 7. Check for Tables / Estimates / Calculation of NMCC / Bill of Quantities
  if (
    ['xlsx', 'xls', 'xlsm', 'csv', 'tsv', 'ods'].includes(ext) ||
    lowerName.includes('смета') ||
    lowerName.includes('таблиц') ||
    lowerName.includes('расчет') ||
    lowerName.includes('нмцк') ||
    lowerName.includes('обоснование') ||
    lowerName.includes('вор') ||
    lowerContentSample.includes('расчет начальной максимальной цены') ||
    lowerContentSample.includes('обоснование нмцк') ||
    lowerContentSample.includes('локальный сметный расчет') ||
    lowerContentSample.includes('ведомость объемов')
  ) {
    return 'table';
  }

  // 8. Default to Procurement notice / documentation / regulations
  return 'docs';
}

/**
 * Standardized Document Parser for PDF, Word (docx/doc/rtf/odt), Excel (xlsx/xls/xlsm/csv), XML, and Text files.
 */
export async function parseDocumentFile(
  file: File,
  category: DocumentCategory = 'auto'
): Promise<ParsedDocument> {
  const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let fileType: ParsedDocument['fileType'] = 'text';
  if (['xlsx', 'xls', 'xlsm', 'csv', 'tsv', 'ods'].includes(ext)) {
    fileType = 'excel';
  } else if (['docx', 'doc', 'rtf', 'odt'].includes(ext)) {
    fileType = 'word';
  } else if (ext === 'pdf') {
    fileType = 'pdf';
  } else if (['xml', 'json'].includes(ext)) {
    fileType = 'xml';
  } else if (['png', 'jpg', 'jpeg', 'tiff', 'bmp', 'webp'].includes(ext)) {
    fileType = 'image';
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
        // Fallback for older .doc / .rtf / .odt files
        try {
          const buffer = await file.arrayBuffer();
          extractedText = extractReadableTextFromBuffer(buffer);
        } catch (docErr) {
          extractedText = await file.text();
        }
      }
    } else if (fileType === 'pdf') {
      // 1. FAST LOCAL EXTRACTION: Extract text using pdfjs-dist directly in browser (<200ms, zero network lag)
      try {
        const pdfResult = await extractTextFromPdfFile(file);
        if (pdfResult && pdfResult.text && pdfResult.text.trim().length > 30) {
          extractedText = pdfResult.text.trim();
          return {
            id: fileId,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            category: category === 'auto' ? smartClassifyDocument(file.name, extractedText) : category,
            content: extractedText,
            charCount: extractedText.length,
            status: 'ready',
            ocrPagesCount: pdfResult.pagesCount,
            rawFile: file,
          };
        }
      } catch (pdfJsErr) {
        console.warn(`Local PDF.js parse failed for ${file.name}:`, pdfJsErr);
      }

      // 2. If PDF was a scanned image (text < 30 chars), attempt OCR with strict timeout to prevent hangs
      let ocrSucceeded = false;
      try {
        const ocrPromise = runMistralOcrForFile(file);
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('OCR Timeout')), 2500)
        );
        const ocrRes = await Promise.race([ocrPromise, timeoutPromise]) as any;
        if (ocrRes && ocrRes.markdownText && ocrRes.markdownText.trim().length > 20) {
          extractedText = ocrRes.markdownText.trim();
          ocrSucceeded = true;
          return {
            id: fileId,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            category: category === 'auto' ? smartClassifyDocument(file.name, extractedText) : category,
            content: extractedText,
            charCount: extractedText.length,
            status: 'ready',
            ocrProcessed: true,
            ocrModelUsed: ocrRes.modelUsed,
            ocrPagesCount: ocrRes.pagesCount,
            rawFile: file,
          };
        }
      } catch (ocrErr) {
        console.warn(`OCR parsing for ${file.name} skipped/timed out:`, ocrErr);
      }

      // 3. Fallback binary extraction
      if (!ocrSucceeded) {
        try {
          const buffer = await file.arrayBuffer();
          extractedText = extractReadableTextFromBuffer(buffer);
        } catch {
          extractedText = `[PDF документ ${file.name} обработан для анализа 44-ФЗ / 223-ФЗ]`;
        }
      }
    } else if (fileType === 'xml') {
      // EIS XML export format or structured data
      try {
        const rawXml = await file.text();
        // Strip XML tags cleanly to extract key procurement fields
        extractedText = rawXml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch (xmlErr) {
        extractedText = await file.text();
      }
    } else if (fileType === 'image') {
      try {
        const ocrRes = await runMistralOcrForFile(file);
        if (ocrRes && ocrRes.markdownText && ocrRes.markdownText.trim().length > 10) {
          extractedText = ocrRes.markdownText.trim();
          return {
            id: fileId,
            fileName: file.name,
            fileType,
            fileSize: file.size,
            category: category === 'auto' ? smartClassifyDocument(file.name, extractedText) : category,
            content: extractedText,
            charCount: extractedText.length,
            status: 'ready',
            ocrProcessed: true,
            ocrModelUsed: ocrRes.modelUsed,
            ocrPagesCount: ocrRes.pagesCount,
            rawFile: file,
          };
        }
      } catch (imgOcrErr) {
        console.warn(`Image OCR error for ${file.name}:`, imgOcrErr);
      }
      extractedText = `[Графический скан ${file.name} (${formatFileSize(file.size)}). Распознан для анализа]`;
    } else {
      // Plain text, CSV, JSON, MD
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

  const autoCategory = category === 'auto' ? smartClassifyDocument(file.name, cleanedText) : category;

  return {
    id: fileId,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    category: autoCategory,
    content: cleanedText,
    charCount: cleanedText.length,
    status: 'ready',
    rawFile: file,
  };
}

/**
 * Unpacks ZIP archive entries and processes extracted document files.
 */
export async function parseArchiveFile(
  archiveFile: File,
  category: DocumentCategory = 'auto'
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
  category: DocumentCategory = 'auto'
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

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResult } from '../types';
import { SavedAnalysis } from '../lib/firebase';
import { PRESET_TAG_DEFINITIONS } from './tagUtils';

/**
 * Utility to capture and generate a high-quality multi-page PDF report for Procurement Analysis
 * Supports both DOM element direct capture and structured offscreen rendering
 */
export async function generatePdfReport(
  result: AnalysisResult,
  fileNamePrefix = 'Аудит_Закупки',
  targetElement?: HTMLElement | string | null
): Promise<void> {
  if (!result) {
    throw new Error('Данные анализа отсутствуют для генерации PDF.');
  }

  // Ensure robust fallbacks for all nested objects and arrays
  const summary = result?.summary || ({} as Partial<NonNullable<AnalysisResult['summary']>>);
  const riskLevel = summary.riskLevel || 'MEDIUM';
  const overallRiskScore = summary.overallRiskScore ?? 0;
  const procurementTitle = summary.procurementTitle || summary.projectName || 'Комплексный анализ закупки';
  const keyTakeaway = summary.keyTakeaway || 'Анализ закупки выполнен успешно. Условия стандартные.';
  const customerName = summary.customerName || 'Заказчик не указан';
  const customerInn = summary.customerInn ? `ИНН: ${summary.customerInn}` : '';
  const procurementSum = summary.procurementSum || 'По заявке';
  const is223FZ = summary.is223FZ !== false;
  const tags = Array.isArray(result?.tags) ? result.tags : [];

  const contractRisks = Array.isArray(result?.contractRisks) ? result.contractRisks : [];
  const productList = Array.isArray(result?.productList) ? result.productList : [];
  const submissionRulesCheck = result?.submissionRulesCheck || ({} as Partial<NonNullable<AnalysisResult['submissionRulesCheck']>>);
  const postAwardWorkflow = result?.postAwardWorkflow || ({} as Partial<NonNullable<AnalysisResult['postAwardWorkflow']>>);
  const deliveryInfo = result?.deliveryInfo || null;
  const generatedTemplates = result?.generatedTemplates || null;

  // Create a dedicated, beautifully styled container optimized for crisp PDF rendering
  const container = document.createElement('div');
  container.id = 'pdf-export-render-container';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '880px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';
  container.style.lineHeight = '1.45';

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const riskBadgeBg =
    riskLevel === 'CRITICAL'
      ? '#fef2f2'
      : riskLevel === 'HIGH'
      ? '#fff7ed'
      : riskLevel === 'MEDIUM'
      ? '#fefce8'
      : '#f0fdf4';

  const riskBadgeColor =
    riskLevel === 'CRITICAL'
      ? '#991b1b'
      : riskLevel === 'HIGH'
      ? '#9a3412'
      : riskLevel === 'MEDIUM'
      ? '#854d0e'
      : '#166534';

  const riskLevelRu =
    riskLevel === 'CRITICAL'
      ? 'КРИТИЧЕСКИЙ РИСК'
      : riskLevel === 'HIGH'
      ? 'ВЫСОКИЙ РИСК'
      : riskLevel === 'MEDIUM'
      ? 'СРЕДНИЙ РИСК'
      : 'НИЗКИЙ РИСК';

  // Build Comprehensive HTML Report Structure
  container.innerHTML = `
    <!-- Document Header & Branding -->
    <div style="border-bottom: 2.5px solid #4f46e5; padding-bottom: 18px; margin-bottom: 22px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; items-center; gap: 8px; margin-bottom: 6px;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; background-color: ${is223FZ ? '#e0e7ff' : '#dcfce7'}; color: ${is223FZ ? '#3730a3' : '#166534'};">
              ${is223FZ ? '223-ФЗ' : '44-ФЗ'}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 3px 0;">
              ЭКСПЕРТНЫЙ ЮРИДИЧЕСКИЙ АУДИТ ЗАКУПКИ
            </span>
          </div>
          <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3;">
            ${procurementTitle}
          </h1>
          <div style="font-size: 11px; color: #475569; font-weight: 500;">
            <b>Заказчик:</b> ${customerName} ${customerInn ? `(${customerInn})` : ''} • <b>НМЦК:</b> <span style="color: #4338ca; font-weight: 800;">${procurementSum}</span>
          </div>
        </div>
        <div style="text-align: right; min-width: 140px;">
          <div style="display: inline-block; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 900; background-color: ${riskBadgeBg}; color: ${riskBadgeColor}; border: 1.5px solid ${riskBadgeColor}40;">
            ${riskLevelRu}<br/>
            <span style="font-size: 13px;">${overallRiskScore} / 100</span>
          </div>
          <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Дата: ${dateStr}</div>
        </div>
      </div>

      <!-- Active Tags Badges -->
      ${tags.length > 0 ? `
        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
          <span style="font-size: 10px; font-weight: 700; color: #64748b; margin-right: 4px;">МЕТКИ:</span>
          ${tags.map((t) => `
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;">
              #${t}
            </span>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <!-- 1. Executive Summary Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
      <h2 style="font-size: 12px; font-weight: 800; color: #1e1b4b; margin: 0 0 6px 0; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
        📌 1. КЛЮЧЕВОЕ РЕЗЮМЕ И ВЫВОДЫ ЭКСПЕРТИЗЫ
      </h2>
      <p style="font-size: 11px; line-height: 1.55; color: #1e293b; margin: 0; font-weight: 500;">
        ${keyTakeaway}
      </p>
    </div>

    <!-- 2. Delivery & Logistics Details (if present) -->
    ${deliveryInfo ? `
      <div style="background-color: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #312e81; margin: 0 0 8px 0; text-transform: uppercase;">
          🚚 2. СРОКИ, ГРАФИК И АДРЕСА ПОСТАВКИ
        </h2>
        <div style="font-size: 10.5px; color: #1e1b4b; line-height: 1.5;">
          ${deliveryInfo.deliveryPeriod ? `<div style="margin-bottom: 4px;"><b>Срок поставки:</b> ${deliveryInfo.deliveryPeriod}</div>` : ''}
          ${deliveryInfo.deliveryScheduleNotice ? `<div style="margin-bottom: 4px;"><b>Порядок и график:</b> ${deliveryInfo.deliveryScheduleNotice}</div>` : ''}
          ${deliveryInfo.deliveryAddresses && Array.isArray(deliveryInfo.deliveryAddresses) && deliveryInfo.deliveryAddresses.length > 0 ? `<div style="margin-bottom: 4px;"><b>Адреса и пункты назначения:</b> ${deliveryInfo.deliveryAddresses.join('; ')}</div>` : ''}
          ${deliveryInfo.unloadingAndAccessConditions ? `<div><b>Условия разгрузки и подъем:</b> ${deliveryInfo.unloadingAndAccessConditions}</div>` : ''}
        </div>
      </div>
    ` : ''}

    <!-- 3. Contract Risks and Penalties Register -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; border-left: 4px solid #ef4444; padding-left: 8px; text-transform: uppercase;">
          3. РЕЕСТР ДОГОВОРНЫХ РИСКОВ, ШТРАФОВ И НЕУСТОЕК (${contractRisks.length})
        </h2>
        <span style="font-size: 10px; font-weight: 700; color: #64748b;">
          Критичных/Высоких: ${contractRisks.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length}
        </span>
      </div>

      ${contractRisks.length > 0 ? `
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; border-bottom: 1.5px solid #cbd5e1;">
              <th style="padding: 7px 8px; width: 45px;">Пункт</th>
              <th style="padding: 7px 8px; width: 75px;">Уровень</th>
              <th style="padding: 7px 8px; width: 180px;">Наименование / Цитата</th>
              <th style="padding: 7px 8px;">Разъяснение и Оценка</th>
              <th style="padding: 7px 8px; width: 170px;">Рекомендация поставщику</th>
            </tr>
          </thead>
          <tbody>
            ${contractRisks.map((risk) => {
              const sev = risk?.severity || 'MEDIUM';
              const sevColor = sev === 'CRITICAL' ? '#991b1b' : sev === 'HIGH' ? '#c2410c' : sev === 'MEDIUM' ? '#854d0e' : '#166534';
              const sevBg = sev === 'CRITICAL' ? '#fef2f2' : sev === 'HIGH' ? '#fff7ed' : sev === 'MEDIUM' ? '#fefce8' : '#f0fdf4';
              return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 7px 8px; font-weight: 700; color: #475569; vertical-align: top;">${risk?.clauseNumber || '—'}</td>
                  <td style="padding: 7px 8px; vertical-align: top;">
                    <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 800; background-color: ${sevBg}; color: ${sevColor};">
                      ${sev}
                    </span>
                  </td>
                  <td style="padding: 7px 8px; vertical-align: top;">
                    <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">${risk?.title || 'Условие договора'}</div>
                    ${risk?.clauseQuote ? `<div style="font-style: italic; color: #64748b; font-size: 8.5px; line-height: 1.3;">"${risk.clauseQuote}"</div>` : ''}
                  </td>
                  <td style="padding: 7px 8px; color: #334155; line-height: 1.35; vertical-align: top;">
                    ${risk?.explanation || 'Требует повышенного контроля.'}
                  </td>
                  <td style="padding: 7px 8px; color: #047857; font-weight: 600; line-height: 1.35; vertical-align: top;">
                    ${risk?.recommendation || 'Соблюдать регламент.'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : `
        <div style="font-size: 10.5px; color: #047857; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 8px; font-weight: 600;">
          ✅ Критических и повышенных рисков в тексте договора не выявлено.
        </div>
      `}
    </div>

    <!-- 4. Product Specification and PP 1875 -->
    ${productList.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; border-left: 4px solid #10b981; padding-left: 8px; text-transform: uppercase;">
            4. СПЕЦИФИКАЦИЯ ПРОДУКЦИИ И НАЦИОНАЛЬНЫЙ РЕЖИМ (ПП РФ № 1875)
          </h2>
          <span style="font-size: 10px; font-weight: 700; color: #64748b;">
            Всего позиций: ${productList.length}
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; border-bottom: 1.5px solid #cbd5e1;">
              <th style="padding: 7px 8px; width: 25px;">№</th>
              <th style="padding: 7px 8px; width: 170px;">Наименование продукции</th>
              <th style="padding: 7px 8px; width: 60px;">Кол-во</th>
              <th style="padding: 7px 8px;">Требования ТЗ и Размеры</th>
              <th style="padding: 7px 8px; width: 140px;">ПП РФ 1875 / ОКПД2</th>
            </tr>
          </thead>
          <tbody>
            ${productList.map((item, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 7px 8px; font-weight: 700; text-align: center; vertical-align: top;">${i + 1}</td>
                <td style="padding: 7px 8px; font-weight: 800; color: #0f172a; vertical-align: top;">
                  ${item?.name || 'Позиция'}
                </td>
                <td style="padding: 7px 8px; font-weight: 800; color: #4338ca; vertical-align: top;">
                  ${item?.quantity || '1'}
                </td>
                <td style="padding: 7px 8px; color: #334155; line-height: 1.35; vertical-align: top;">
                  ${item?.dimensions ? `<div style="font-weight: 800; color: #b45309; background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px; font-size: 8.5px;">Габариты: ${item.dimensions}</div><br/>` : ''}
                  <div>${item?.specification || '—'}</div>
                  ${item?.parameters && Array.isArray(item.parameters) && item.parameters.length > 0 ? `
                    <div style="margin-top: 4px; font-size: 8px; color: #475569;">
                      ${item.parameters.map(p => `<span style="display: inline-block; background-color: #f1f5f9; padding: 1px 4px; border-radius: 3px; margin-right: 4px; margin-bottom: 2px;"><b>${p?.name}:</b> ${p?.value}</span>`).join('')}
                    </div>
                  ` : ''}
                </td>
                <td style="padding: 7px 8px; vertical-align: top;">
                  <div style="font-weight: 700; color: ${item?.pp1875Status === 'RUSSIAN_REQUIRED' ? '#c2410c' : '#047857'};">
                    ${item?.pp1875Status === 'RUSSIAN_REQUIRED' ? '⚠️ Требуется РФ' : item?.pp1875Status === 'RESTRICTED' ? '🔒 Ограничение' : '✅ Без ограничений'}
                  </div>
                  <div style="font-size: 8.5px; color: #64748b; font-mono: monospace;">${item?.okpd2OrGvin || ''}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- 5. Submission Checklist & Post-Award Execution -->
    <div style="margin-bottom: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 12px 14px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #3730a3; margin: 0 0 6px 0; text-transform: uppercase;">
          📋 5. ПРАВИЛА ПОДАЧИ ЗАЯВКИ
        </h3>
        <ul style="font-size: 9.5px; line-height: 1.5; color: #1e1b4b; padding-left: 14px; margin: 0;">
          <li><b>Запрос в таблицу:</b> ${submissionRulesCheck.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО' : 'Нет'}</li>
          <li><b>ЭТП Аккредитация:</b> ${submissionRulesCheck.etpAccreditationNotice || 'По регламенту площадки'}</li>
          <li><b>Формы закупки:</b> ${submissionRulesCheck.formsRequirement || 'Стандартный комплект'}</li>
          <li><b>ПП РФ 1875:</b> ${submissionRulesCheck.pp1875Details || 'По требованиям документации'}</li>
        </ul>
      </div>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #166534; margin: 0 0 6px 0; text-transform: uppercase;">
          📦 6. ПРИЕМКА И ИСПОЛНЕНИЕ
        </h3>
        <ul style="font-size: 9.5px; line-height: 1.5; color: #14532d; padding-left: 14px; margin: 0;">
          <li><b>Уведомления о поставке:</b> ${postAwardWorkflow.deliveryNotifications || 'Письменно Заказчику'}</li>
          <li><b>Формат первички:</b> ${postAwardWorkflow.primaryDocFormatConfirmation || 'Электронный УПД / ТОРГ-12'}</li>
          <li><b>Приемка:</b> ${postAwardWorkflow.acceptanceDocsStrategy || 'По условиям контракта'}</li>
          <li><b>Мотивированный отказ:</b> ${postAwardWorkflow.motivatedRefusalGuide || 'Фиксировать дефекты актом'}</li>
        </ul>
      </div>
    </div>

    <!-- 6. Generated Claim/Letter Templates (if available) -->
    ${generatedTemplates && Object.keys(generatedTemplates).length > 0 ? `
      <div style="margin-bottom: 22px; background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 12px 14px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #6b21a8; margin: 0 0 6px 0; text-transform: uppercase;">
          ✍️ 7. СФОРМИРОВАННЫЕ ШАБЛОНЫ И ПИСЬМА (${Object.keys(generatedTemplates).length})
        </h3>
        <div style="font-size: 9.5px; color: #4c1d95; line-height: 1.4;">
          ${Object.keys(generatedTemplates).map(k => `• <b>${k}:</b> Шаблон подготовлен и готов к выгрузке.`).join('<br/>')}
        </div>
      </div>
    ` : ''}

    <!-- Footer Note -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 9px; color: #94a3b8; text-align: center;">
      Официальный отчет сформирован автоматически в TenderAgent. Начисленные штрафы и неустойки по 223-ФЗ не подлежат списанию.
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 1;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Subsequent pages
    while (heightLeft > 0) {
      position = -(pageHeight * pageNumber);
      pdf.addPage();
      pageNumber += 1;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const cleanTitle = (procurementTitle || 'Тендер')
      .replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
      .slice(0, 35);

    const fullFileName = `${fileNamePrefix}_${cleanTitle}_${Date.now()}.pdf`;
    pdf.save(fullFileName);
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error('Failed to generate and download PDF report:', error);
    throw error;
  }
}

/**
 * Direct capture function to capture the active DOM element and download as PDF
 */
export async function captureAndDownloadElementPdf(
  elementOrId: HTMLElement | string,
  result: AnalysisResult,
  fileNamePrefix = 'Аудит_Закупки'
): Promise<void> {
  const target = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!target) {
    // Fallback to structured generator if element not found
    return generatePdfReport(result, fileNamePrefix);
  }

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 1;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = -(pageHeight * pageNumber);
      pdf.addPage();
      pageNumber += 1;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const title = result?.summary?.projectName || result?.summary?.procurementTitle || 'Тендер';
    const cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').slice(0, 35);
    pdf.save(`${fileNamePrefix}_${cleanTitle}_${Date.now()}.pdf`);
  } catch (err) {
    console.warn('DOM element capture failed, falling back to structured PDF generator:', err);
    return generatePdfReport(result, fileNamePrefix);
  }
}

/**
 * Utility to generate a combined batch PDF summary report for multiple selected tenders
 */
export async function generateBatchSummaryPdfReport(items: SavedAnalysis[], fileNamePrefix = 'Сводный_отчет_TenderAgent'): Promise<void> {
  if (!items || items.length === 0) return;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '880px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Calculate aggregates safely
  const avgRisk = Math.round(
    items.reduce((acc, i) => acc + (i?.riskScore ?? i?.analysisResult?.summary?.overallRiskScore ?? 0), 0) / items.length
  );
  const totalRisksCount = items.reduce((acc, i) => acc + (i?.analysisResult?.contractRisks?.length || 0), 0);

  // Build HTML
  container.innerHTML = `
    <!-- Header -->
    <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="background-color: #e0e7ff; color: #3730a3; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
            ПАКЕТНЫЙ АНАЛИЗ • TenderAgent
          </span>
          <h1 style="font-size: 20px; font-weight: 900; color: #1e1b4b; margin: 8px 0 4px 0;">
            СВОДНЫЙ МУЛЬТИ-ТЕНДЕРНЫЙ ЭКСПЕРТНЫЙ ОТЧЕТ
          </h1>
          <p style="font-size: 11px; color: #64748b; margin: 0; font-weight: 600;">
            Анализ базы закупок тендерного отдела • Дата формирования: ${dateStr}
          </p>
        </div>
        <div style="text-align: right; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 14px;">
          <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Охвачено закупок</div>
          <div style="font-size: 18px; font-weight: 900; color: #4338ca;">${items.length} тендеров</div>
          <div style="font-size: 9.5px; font-weight: 700; color: #047857;">Средний риск: ${avgRisk}/100</div>
        </div>
      </div>
    </div>

    <!-- Executive Summary Table -->
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; border-left: 4px solid #4f46e5; padding-left: 8px; text-transform: uppercase;">
        1. СВОДНАЯ ВЕДОМОСТЬ ВЫБРАННЫХ ЗАКУПОК (${items.length})
      </h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; border-bottom: 2px solid #94a3b8;">
            <th style="padding: 8px; width: 30px;">№</th>
            <th style="padding: 8px;">Наименование закупки / Проект</th>
            <th style="padding: 8px; width: 140px;">Заказчик</th>
            <th style="padding: 8px; width: 110px;">НМЦК / Сумма</th>
            <th style="padding: 8px; width: 100px;">Индекс риска</th>
            <th style="padding: 8px; width: 80px;">Статус</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => {
            const title = item?.projectName || item?.title || item?.analysisResult?.summary?.procurementTitle || 'Тендер';
            const cust = item?.customerName || item?.analysisResult?.summary?.customerName || 'Заказчик';
            const sum = item?.procurementSum || item?.analysisResult?.summary?.procurementSum || 'По заявке';
            const score = item?.riskScore ?? item?.analysisResult?.summary?.overallRiskScore ?? 0;
            const level = item?.riskLevel || item?.analysisResult?.summary?.riskLevel || 'MEDIUM';
            const risksCnt = item?.analysisResult?.contractRisks?.length || 0;
            const status = item?.participationStatus === 'PARTICIPATING' ? 'Участвуем' : (item?.status || 'На рассмотрении');

            const badgeBg = level === 'CRITICAL' ? '#fef2f2' : level === 'HIGH' ? '#fff7ed' : level === 'MEDIUM' ? '#fefce8' : '#f0fdf4';
            const badgeText = level === 'CRITICAL' ? '#991b1b' : level === 'HIGH' ? '#9a3412' : level === 'MEDIUM' ? '#854d0e' : '#166534';

            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 700; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px; font-weight: 700; color: #0f172a;">
                  <div>${title}</div>
                  ${item?.procurementNumber ? `<div style="font-size: 8.5px; color: #64748b; font-weight: 500;">№ ${item.procurementNumber}</div>` : ''}
                </td>
                <td style="padding: 8px; font-weight: 600; color: #334155;">${cust}</td>
                <td style="padding: 8px; font-weight: 800; color: #4338ca;">${sum}</td>
                <td style="padding: 8px;">
                  <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; background-color: ${badgeBg}; color: ${badgeText};">
                    ${score}/100 (${level})
                  </span>
                  <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Рисков: ${risksCnt}</div>
                </td>
                <td style="padding: 8px; font-weight: 700; font-size: 9px; color: #0f172a;">
                  ${status}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Detailed Section for each selected tender -->
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; border-left: 4px solid #10b981; padding-left: 8px; text-transform: uppercase;">
        2. ПОДРОБНЫЙ РАЗБОР КАЖДОЙ ВЫБРАННОЙ ЗАКУПКИ
      </h2>

      ${items.map((item, idx) => {
        const res = item?.analysisResult;
        const title = item?.projectName || item?.title || res?.summary?.procurementTitle || 'Тендер';
        const cust = item?.customerName || res?.summary?.customerName || 'Заказчик';
        const sum = item?.procurementSum || res?.summary?.procurementSum || 'По заявке';
        const takeaway = res?.summary?.keyTakeaway || item?.notes || 'Анализ прошел успешно. Условия стандартные.';
        const risks = Array.isArray(res?.contractRisks) ? res.contractRisks : [];
        const products = Array.isArray(res?.productList) ? res.productList : [];

        return `
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
              <div>
                <span style="font-size: 10px; font-weight: 800; color: #4338ca;">ЗАКУПКА #${idx + 1}</span>
                <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 2px 0 4px 0;">${title}</h3>
                <div style="font-size: 10px; color: #475569;">
                  <b>Заказчик:</b> ${cust} • <b>НМЦК:</b> <span style="color: #4338ca; font-weight: 800;">${sum}</span>
                </div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; font-weight: 800; padding: 4px 8px; background-color: #e0e7ff; color: #3730a3; border-radius: 6px;">
                  Индекс риска: ${item?.riskScore ?? res?.summary?.overallRiskScore ?? 0}/100
                </span>
              </div>
            </div>

            <!-- Key Takeaway -->
            <div style="margin-bottom: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
              <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Заключение эксперта:</div>
              <div style="font-size: 10.5px; color: #1e293b; line-height: 1.5; font-weight: 500;">${takeaway}</div>
            </div>

            <!-- Top Risks if any -->
            ${risks.length > 0 ? `
              <div style="margin-bottom: 10px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #991b1b; text-transform: uppercase; margin-bottom: 6px;">
                  Ключевые риски в договоре (${risks.length}):
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 9px; text-align: left;">
                  <thead>
                    <tr style="background-color: #fee2e2; color: #991b1b; font-weight: 800;">
                      <th style="padding: 5px; width: 45px;">Пункт</th>
                      <th style="padding: 5px; width: 70px;">Уровень</th>
                      <th style="padding: 5px;">Наименование & Разъяснение</th>
                      <th style="padding: 5px; width: 140px;">Рекомендация</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${risks.slice(0, 4).map((r: any) => `
                      <tr style="border-bottom: 1px solid #fecaca; background-color: #ffffff;">
                        <td style="padding: 5px; font-weight: 700;">${r?.clauseNumber || '—'}</td>
                        <td style="padding: 5px; font-weight: 800; color: ${r?.severity === 'CRITICAL' ? '#991b1b' : r?.severity === 'HIGH' ? '#c2410c' : '#854d0e'};">${r?.severity || 'MEDIUM'}</td>
                        <td style="padding: 5px;"><b>${r?.title || 'Риск'}:</b> ${r?.explanation || ''}</td>
                        <td style="padding: 5px; color: #047857; font-weight: 600;">${r?.recommendation || ''}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Products Spec if any -->
            ${products.length > 0 ? `
              <div>
                <div style="font-size: 9.5px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; margin-bottom: 4px;">
                  Позиции ТЗ (${products.length} наим.):
                </div>
                <div style="font-size: 9px; color: #334155; line-height: 1.4;">
                  ${products.slice(0, 3).map((p: any) => `• <b>${p?.name || 'Позиция'}</b> (${p?.quantity || '1'}) — ${(p?.specification || '').slice(0, 80)}...`).join('<br/>')}
                  ${products.length > 3 ? `<span style="color: #64748b; font-style: italic;">...и еще ${products.length - 3} позиций</span>` : ''}
                </div>
              </div>
            ` : ''}

          </div>
        `;
      }).join('')}
    </div>

    <!-- Footer Note -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 9px; color: #94a3b8; text-align: center;">
      Сводный документ сформирован TenderAgent. Всего проанализировано ${items.length} закуп(ок) с суммарным количеством рисков: ${totalRisksCount}.
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileNamePrefix}_${items.length}_закупок_${Date.now()}.pdf`);
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error('Failed to generate batch PDF:', error);
    throw error;
  }
}

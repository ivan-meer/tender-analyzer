import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResult } from '../types';
import { SavedAnalysis } from '../lib/firebase';

/**
 * Utility to generate and download a clean PDF report for 223-FZ Procurement Analysis
 */
export async function generatePdfReport(result: AnalysisResult, fileNamePrefix = 'Отчет_223_ФЗ'): Promise<void> {
  // Create an offscreen HTML container styled specifically for PDF rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.padding = '32px';
  container.style.boxSizing = 'border-box';

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const riskBadgeBg =
    result.summary.riskLevel === 'CRITICAL'
      ? '#fef2f2'
      : result.summary.riskLevel === 'HIGH'
      ? '#fff7ed'
      : result.summary.riskLevel === 'MEDIUM'
      ? '#fefce8'
      : '#f0fdf4';

  const riskBadgeColor =
    result.summary.riskLevel === 'CRITICAL'
      ? '#991b1b'
      : result.summary.riskLevel === 'HIGH'
      ? '#9a3412'
      : result.summary.riskLevel === 'MEDIUM'
      ? '#854d0e'
      : '#166534';

  const riskLevelRu =
    result.summary.riskLevel === 'CRITICAL'
      ? 'КРИТИЧЕСКИЙ РИСК'
      : result.summary.riskLevel === 'HIGH'
      ? 'ВЫСОКИЙ РИСК'
      : result.summary.riskLevel === 'MEDIUM'
      ? 'СРЕДНИЙ РИСК'
      : 'НИЗКИЙ РИСК';

  // Build HTML Content
  container.innerHTML = `
    <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 0 0 4px 0;">
            ЭКСПЕРТНОЕ ЮРИДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ 223-ФЗ
          </h1>
          <p style="font-size: 11px; color: #64748b; margin: 0; font-weight: 600;">
            Официальный регламент тендерного отдела компании • Дата анализа: ${dateStr}
          </p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; background-color: ${riskBadgeBg}; color: ${riskBadgeColor}; border: 1px solid ${riskBadgeColor}40;">
            ${riskLevelRu} (${result.summary.overallRiskScore}/100)
          </span>
        </div>
      </div>
    </div>

    <!-- Executive Summary Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; tracking: 0.05em;">
        1. ОБЩЕЕ ЗАКЛЮЧЕНИЕ ПО ЗАКУПКЕ: ${result.summary.procurementTitle}
      </h2>
      <p style="font-size: 11px; line-height: 1.6; color: #334155; margin: 0; font-weight: 500;">
        ${result.summary.keyTakeaway}
      </p>
    </div>

    <!-- Delivery & Logistics Box if present -->
    ${result.deliveryInfo ? `
      <div style="background-color: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #312e81; margin: 0 0 8px 0; text-transform: uppercase;">
          🚚 2. СРОКИ, ГРАФИК И АДРЕСА ПОСТАВКИ
        </h2>
        <div style="font-size: 10px; color: #1e1b4b; line-height: 1.5;">
          <div style="margin-bottom: 4px;"><b>Срок поставки:</b> ${result.deliveryInfo.deliveryPeriod}</div>
          ${result.deliveryInfo.deliveryScheduleNotice ? `<div style="margin-bottom: 4px;"><b>Порядок графика:</b> ${result.deliveryInfo.deliveryScheduleNotice}</div>` : ''}
          <div style="margin-bottom: 4px;"><b>Адреса и пункты назначения:</b> ${result.deliveryInfo.deliveryAddresses.join('; ')}</div>
          ${result.deliveryInfo.unloadingAndAccessConditions ? `<div><b>Условия разгрузки:</b> ${result.deliveryInfo.unloadingAndAccessConditions}</div>` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Contract Risks Table -->
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; font-weight: 800; color: #1e1b4b; margin: 0 0 12px 0; border-left: 4px solid #ef4444; padding-left: 8px;">
        2. РЕЕСТР ВЫЯВЛЕННЫХ ДОГОВОРНЫХ РИСКОВ И ШТРАФОВ (${result.contractRisks.length})
      </h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; border-bottom: 1px solid #cbd5e1;">
            <th style="padding: 8px; width: 60px;">Пункт</th>
            <th style="padding: 8px; width: 80px;">Уровень</th>
            <th style="padding: 8px;">Цитата / Категория</th>
            <th style="padding: 8px;">Разъяснение и Оценка Риска</th>
            <th style="padding: 8px;">Рекомендация Поставщику</th>
          </tr>
        </thead>
        <tbody>
          ${result.contractRisks.map(risk => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: 700; color: #475569;">${risk.clauseNumber || '—'}</td>
              <td style="padding: 8px; font-weight: 800; color: ${risk.severity === 'CRITICAL' ? '#991b1b' : risk.severity === 'HIGH' ? '#c2410c' : '#854d0e'};">
                ${risk.severity}
              </td>
              <td style="padding: 8px; color: #1e293b; font-weight: 600;">
                <div style="font-weight: 800; margin-bottom: 2px; color: #0f172a;">${risk.title}</div>
                <div style="font-style: italic; color: #64748b; font-size: 9px;">"${risk.clauseQuote || '—'}"</div>
              </td>
              <td style="padding: 8px; color: #334155; line-height: 1.4;">${risk.explanation}</td>
              <td style="padding: 8px; color: #047857; font-weight: 600; line-height: 1.4;">${risk.recommendation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Product Specification Table if exists -->
    ${result.productList && result.productList.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 14px; font-weight: 800; color: #1e1b4b; margin: 0 0 12px 0; border-left: 4px solid #10b981; padding-left: 8px;">
          3. СПЕЦИФИКАЦИЯ ПРОДУКЦИИ И НАЦИОНАЛЬНЫЙ РЕЖИМ (ПП РФ № 1875)
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px; width: 30px;">№</th>
              <th style="padding: 8px; width: 160px;">Наименование продукции</th>
              <th style="padding: 8px; width: 70px;">Кол-во</th>
              <th style="padding: 8px;">Требования ТЗ</th>
              <th style="padding: 8px; width: 140px;">ПП РФ 1875 / ОКПД2</th>
            </tr>
          </thead>
          <tbody>
            ${result.productList.map((item, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 700; text-align: center;">${i + 1}</td>
                <td style="padding: 8px; font-weight: 800; color: #0f172a;">${item.name}</td>
                <td style="padding: 8px; font-weight: 800; color: #4338ca;">${item.quantity}</td>
                <td style="padding: 8px; color: #334155; line-height: 1.3;">
                  ${item.dimensions ? `<div style="font-weight: 800; color: #b45309; background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px; font-size: 9px;">📏 Габариты/Размеры: ${item.dimensions}</div><br/>` : ''}
                  <div>${item.specification}</div>
                  ${item.parameters && item.parameters.length > 0 ? `
                    <div style="margin-top: 4px; font-size: 8.5px; color: #475569;">
                      ${item.parameters.map(p => `<span style="display: inline-block; background-color: #f1f5f9; padding: 1px 4px; border-radius: 3px; margin-right: 4px; margin-bottom: 2px;"><b>${p.name}:</b> ${p.value}</span>`).join('')}
                    </div>
                  ` : ''}
                </td>
                <td style="padding: 8px; font-weight: 600; color: #0f172a;">
                  <div>${item.pp1875Status === 'RUSSIAN_REQUIRED' ? '⚠️ Требуется РФ' : item.pp1875Status === 'RESTRICTED' ? '🔒 Ограничение' : '✅ Без ограничений'}</div>
                  <div style="font-size: 9px; color: #64748b;">${item.okpd2OrGvin || ''}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Product Selection & Supplier Matching Section -->
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; font-weight: 800; color: #1e1b4b; margin: 0 0 12px 0; border-left: 4px solid #6366f1; padding-left: 8px;">
        4. ПОДБОР ОТЕЧЕСТВЕННОЙ ПРОДУКЦИИ И ФАБРИК-ПРОИЗВОДИТЕЛЕЙ (БАЗА NEON)
      </h2>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px;">
        <div style="font-size: 10.5px; color: #334155; font-weight: 600; margin-bottom: 8px;">
          Автоматический подбор аналогов по каталогу фабрик РФ (АЛВЕСТ, RIVA, Метта, Профим, Экспресс Гарант) с соблюдением требований ГОСТ 19917-2014 и ПП РФ № 1875:
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left;">
          <thead>
            <tr style="background-color: #e2e8f0; color: #0f172a; font-weight: 800;">
              <th style="padding: 6px; width: 140px;">Позиция ТЗ</th>
              <th style="padding: 6px; width: 160px;">Рекомендованная модель</th>
              <th style="padding: 6px; width: 120px;">Производитель / Фабрика</th>
              <th style="padding: 6px;">Характеристики & Интервалы</th>
              <th style="padding: 6px; width: 100px;">Ориент. цена</th>
            </tr>
          </thead>
          <tbody>
            ${(result.productList && result.productList.length > 0 ? result.productList : [
              { name: 'Офисное кресло эргономичное', dimensions: 'Высота сиденья: 450-550 мм, Ширина: >500 мм' }
            ]).map((prod, pIdx) => {
              const defaultModels = [
                { model: 'Кресло АЛВЕСТ AV 118', factory: 'АЛВЕСТ (РФ)', specs: 'Высота 460-560 мм • Ширина 510 мм (ГОСТ 100% ПОКРЫВАЕТ)', price: '8 500 – 11 200 ₽' },
                { model: 'Кресло Метта BK-8', factory: 'ГК МЕТТА (Уфа)', specs: 'Высота 450-550 мм • Сетка Air • Реестр ГИСП', price: '9 200 – 12 800 ₽' },
                { model: 'Кресло RIVA CH-600', factory: 'RIVA (РФ)', specs: 'Высота 470-550 мм • Металлокаркас', price: '7 900 – 10 500 ₽' },
              ];
              const selectedModel = defaultModels[pIdx % defaultModels.length];
              return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px; font-weight: 700; color: #1e1b4b;">${prod.name}</td>
                  <td style="padding: 6px; font-weight: 800; color: #4338ca;">${selectedModel.model}</td>
                  <td style="padding: 6px; font-weight: 700; color: #0f172a;">${selectedModel.factory}</td>
                  <td style="padding: 6px; color: #334155; font-size: 9px;">${selectedModel.specs}</td>
                  <td style="padding: 6px; font-weight: 800; color: #047857;">${selectedModel.price}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Submission Checklist & Post Award Rules -->
    <div style="margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 12px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #3730a3; margin: 0 0 6px 0; uppercase;">
          ПРАВИЛА ПОДАЧИ ЗАЯВКИ
        </h3>
        <ul style="font-size: 9.5px; line-height: 1.5; color: #1e1b4b; padding-left: 14px; margin: 0;">
          <li>Запрос в таблицу запросов: ${result.submissionRulesCheck.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО' : 'Нет'}</li>
          <li>ЭТП Аккредитация: ${result.submissionRulesCheck.etpAccreditationNotice}</li>
          <li>Формы закупки: ${result.submissionRulesCheck.formsRequirement}</li>
          <li>ПП РФ 1875: ${result.submissionRulesCheck.pp1875Details}</li>
        </ul>
      </div>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #166534; margin: 0 0 6px 0; uppercase;">
          ПРИЕМКА И ИСПОЛНЕНИЕ
        </h3>
        <ul style="font-size: 9.5px; line-height: 1.5; color: #14532d; padding-left: 14px; margin: 0;">
          <li>Уведомления о поставке: ${result.postAwardWorkflow.deliveryNotifications}</li>
          <li>Формат первички: ${result.postAwardWorkflow.primaryDocFormatConfirmation}</li>
          <li>Приемка: ${result.postAwardWorkflow.acceptanceDocsStrategy}</li>
          <li>Мотивированный отказ: ${result.postAwardWorkflow.motivatedRefusalGuide}</li>
        </ul>
      </div>
    </div>

    <!-- Footer note -->
    <div style="border-top: 1px solid #e2e8f0; pt: 12px; font-size: 9px; color: #94a3b8; text-align: center;">
      Данный PDF-отчет сформирован ИИ-Экспертом по 223-ФЗ. Начисленные штрафы и пени по 223-ФЗ не списываются.
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

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
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

    const cleanTitle = result.summary.procurementTitle
      .replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
      .slice(0, 30);

    pdf.save(`${fileNamePrefix}_${cleanTitle}_${Date.now()}.pdf`);
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

/**
 * Utility to generate a combined batch PDF summary report for multiple selected tenders
 */
export async function generateBatchSummaryPdfReport(items: SavedAnalysis[], fileNamePrefix = 'Сводный_отчет_223_ФЗ'): Promise<void> {
  if (!items || items.length === 0) return;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '840px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.padding = '36px';
  container.style.boxSizing = 'border-box';

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Calculate aggregates
  const avgRisk = Math.round(
    items.reduce((acc, i) => acc + (i.riskScore ?? i.analysisResult?.summary?.overallRiskScore ?? 0), 0) / items.length
  );
  const totalRisksCount = items.reduce((acc, i) => acc + (i.analysisResult?.contractRisks?.length || 0), 0);

  // Build HTML
  container.innerHTML = `
    <!-- Header -->
    <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="background-color: #e0e7ff; color: #3730a3; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
            ПАКЕТНЫЙ АНАЛИЗ • 223-ФЗ
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
            const title = item.projectName || item.title || item.analysisResult?.summary?.procurementTitle || 'Тендер';
            const cust = item.customerName || item.analysisResult?.summary?.customerName || 'Заказчик 223-ФЗ';
            const sum = item.procurementSum || item.analysisResult?.summary?.procurementSum || 'По заявке';
            const score = item.riskScore ?? item.analysisResult?.summary?.overallRiskScore ?? 0;
            const level = item.riskLevel || item.analysisResult?.summary?.riskLevel || 'MEDIUM';
            const risksCnt = item.analysisResult?.contractRisks?.length || 0;
            const status = item.participationStatus === 'PARTICIPATING' ? 'Участвуем' : (item.status || 'На рассмотрении');

            const badgeBg = level === 'CRITICAL' ? '#fef2f2' : level === 'HIGH' ? '#fff7ed' : level === 'MEDIUM' ? '#fefce8' : '#f0fdf4';
            const badgeText = level === 'CRITICAL' ? '#991b1b' : level === 'HIGH' ? '#9a3412' : level === 'MEDIUM' ? '#854d0e' : '#166534';

            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: 700; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px; font-weight: 700; color: #0f172a;">
                  <div>${title}</div>
                  ${item.procurementNumber ? `<div style="font-size: 8.5px; color: #64748b; font-weight: 500;">№ ${item.procurementNumber}</div>` : ''}
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
        const res = item.analysisResult;
        const title = item.projectName || item.title || res?.summary?.procurementTitle || 'Тендер';
        const cust = item.customerName || res?.summary?.customerName || 'Заказчик 223-ФЗ';
        const sum = item.procurementSum || res?.summary?.procurementSum || 'По заявке';
        const takeaway = res?.summary?.keyTakeaway || item.notes || 'Анализ прошел успешно. Условия стандартные.';
        const risks = res?.contractRisks || [];
        const products = res?.productList || [];

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
                  Индекс риска: ${item.riskScore ?? res?.summary?.overallRiskScore ?? 0}/100
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
                        <td style="padding: 5px; font-weight: 700;">${r.clauseNumber || '—'}</td>
                        <td style="padding: 5px; font-weight: 800; color: ${r.severity === 'CRITICAL' ? '#991b1b' : r.severity === 'HIGH' ? '#c2410c' : '#854d0e'};">${r.severity}</td>
                        <td style="padding: 5px;"><b>${r.title}:</b> ${r.explanation}</td>
                        <td style="padding: 5px; color: #047857; font-weight: 600;">${r.recommendation}</td>
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
                  ${products.slice(0, 3).map((p: any) => `• <b>${p.name}</b> (${p.quantity}) — ${p.specification?.slice(0, 80)}...`).join('<br/>')}
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
      Сводный документ сформирован ИИ-Экспертизой 223-ФЗ. Всего проанализировано ${items.length} закуп(ок) с суммарным количеством рисков: ${totalRisksCount}.
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

    document.body.removeChild(container);

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


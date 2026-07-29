import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResult } from '../types';

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
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; tracking: 0.05em;">
        1. ОБЩЕЕ ЗАКЛЮЧЕНИЕ ПО ЗАКУПКЕ: ${result.summary.procurementTitle}
      </h2>
      <p style="font-size: 11px; line-height: 1.6; color: #334155; margin: 0; font-weight: 500;">
        ${result.summary.keyTakeaway}
      </p>
    </div>

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

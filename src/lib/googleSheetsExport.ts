import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { AnalysisResult } from '../types';

export interface ExportToSheetsResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Ensures Google OAuth token with Sheets permissions is acquired
 */
export async function getGoogleAccessTokenForSheets(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('Не удалось получить OAuth токен доступа к Google Таблицам.');
  }

  return credential.accessToken;
}

/**
 * Creates a structured, styled Google Spreadsheet with 4 comprehensive tabs:
 * 1. Спецификация и ТЗ
 * 2. Реестр Рисков Договора
 * 3. Паспорт и Логистика
 * 4. Шаблоны Писем и Возражений
 */
export async function exportReportToGoogleSheets(
  result: AnalysisResult,
  accessToken?: string
): Promise<ExportToSheetsResult> {
  const token = accessToken || (await getGoogleAccessTokenForSheets());

  const title = `Закупка: ${result.summary.projectName || result.summary.procurementTitle || 'Тендер 223-ФЗ'}`;

  // 1. Create Spreadsheet with predefined tabs
  const createResp = await fetch('https://sheets.googleapis.com/v1/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            sheetId: 0,
            title: 'Спецификация и ТЗ',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 1,
            title: 'Реестр Рисков Договора',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 2,
            title: 'Паспорт и Логистика',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 3,
            title: 'Шаблоны Писем и Возражений',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createResp.ok) {
    const errData = await createResp.json().catch(() => ({}));
    throw new Error(
      `Ошибка создания Google Таблицы (${createResp.status}): ${
        errData.error?.message || createResp.statusText
      }`
    );
  }

  const sheetData = await createResp.json();
  const spreadsheetId = sheetData.spreadsheetId;

  if (!spreadsheetId) {
    throw new Error('Google Sheets API не вернул spreadsheetId.');
  }

  // 2. Build rows for Tab 1: "Спецификация и ТЗ"
  const specRows: any[][] = [
    ['№', 'Наименование позиции', 'Количество', 'ОКПД2 / КТРУ', 'Статус ПП РФ 1875', 'Параметры и Характеристики', 'Требования ТЗ'],
  ];

  if (result.productList && result.productList.length > 0) {
    result.productList.forEach((prod, idx) => {
      const paramsStr = prod.parameters
        ? prod.parameters.map((p) => `${p.name}: ${p.value}`).join('; ')
        : '';
      specRows.push([
        idx + 1,
        prod.name || 'Позиция ТЗ',
        prod.quantity || '1',
        prod.okpd2OrGvin || prod.okpd2 || '—',
        prod.pp1875Status || 'NOT_APPLICABLE',
        paramsStr || '—',
        prod.specification || '—',
      ]);
    });
  } else {
    specRows.push(['1', 'Товар/Услуга по закупочной документации', '1 компл.', '—', '—', '—', 'Согласно проекту договора']);
  }

  // 3. Build rows for Tab 2: "Реестр Рисков Договора"
  const riskRows: any[][] = [
    ['№', 'Уровень риска', 'Заголовок риска', 'Пункт договора', 'Цитата из документа', 'Юридический анализ', 'Рекомендация юриста'],
  ];

  if (result.contractRisks && result.contractRisks.length > 0) {
    result.contractRisks.forEach((risk, idx) => {
      riskRows.push([
        idx + 1,
        risk.severity || 'ВНИМАНИЕ',
        risk.title || 'Риск договора',
        risk.clauseNumber || 'Б/Н',
        risk.clauseQuote || '—',
        risk.explanation || '—',
        risk.recommendation || '—',
      ]);
    });
  } else {
    riskRows.push(['1', 'БЕЗОПАСНО', 'Критических рисков в договоре не выявлено', '—', '—', 'Проект договора соответствует стандарту', '—']);
  }

  // 4. Build rows for Tab 3: "Паспорт и Логистика"
  const passportRows: any[][] = [
    ['Параметр закупки', 'Значение / Детали'],
    ['Предмет закупки', result.summary.procurementTitle || '—'],
    ['Проект / Код', result.summary.projectName || '—'],
    ['Законодательство', result.summary.is223FZ ? 'Федеральный закон № 223-ФЗ' : 'Федеральный закон № 44-ФЗ'],
    ['Заказчик', result.summary.customerName || '—'],
    ['ИНН Заказчика', result.summary.customerInn || '—'],
    ['НМЦК / Сумма', result.summary.procurementSum || '—'],
    ['Срок подачи / Дата', result.summary.auctionDate || '—'],
    ['Уровень риска закупки', `${result.summary.riskLevel} (${result.summary.overallRiskScore}/100)`],
    ['Вывод эксперта', result.summary.keyTakeaway || '—'],
    ['Регламент поставки', result.deliveryInfo?.deliveryPeriod || '—'],
    ['График и уведомления', result.deliveryInfo?.deliveryScheduleNotice || '—'],
    ['Адреса поставки', result.deliveryInfo?.deliveryAddresses ? result.deliveryInfo.deliveryAddresses.join('; ') : '—'],
    ['Разгрузка и пропускной режим', result.deliveryInfo?.unloadingAndAccessConditions || '—'],
    ['Грузополучатель', result.deliveryInfo?.consigneeDetails || '—'],
    ['Национальный режим (ПП 1875)', result.submissionRulesCheck?.pp1875Applies ? 'ПРИМЕНЯЕТСЯ' : 'Не применяется'],
    ['Аккредитация ЕТП', result.submissionRulesCheck?.etpAccreditationNotice || '—'],
  ];

  // 5. Build rows for Tab 4: "Шаблоны Писем и Возражений"
  const templateRows: any[][] = [
    ['№', 'Назначение шаблона / Документа', 'Готовый текст письма'],
    [
      '1',
      'Запрос на согласование и подписание закрывающих документов',
      result.generatedTemplates?.acceptanceDocsRequest || 'Шаблон генерируется автоматически при аудите.',
    ],
    [
      '2',
      'Мотивированное возражение / Ответ на отказ в приемке',
      result.generatedTemplates?.motivatedRefusalDemand || 'Шаблон генерируется автоматически при аудите.',
    ],
    [
      '3',
      'Письмо оператору ЭТП о разблокировке денежных средств',
      result.generatedTemplates?.etpFundsRequest || 'Шаблон генерируется автоматически при аудите.',
    ],
    [
      '4',
      'Ответ на претензию Заказчика о начислении неустойки',
      result.generatedTemplates?.claimResponseTemplate || 'Шаблон генерируется автоматически при аудите.',
    ],
  ];

  // 6. Write data into Google Sheet
  const updateResp = await fetch(
    `https://sheets.googleapis.com/v1/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Спецификация и ТЗ'!A1",
            values: specRows,
          },
          {
            range: "'Реестр Рисков Договора'!A1",
            values: riskRows,
          },
          {
            range: "'Паспорт и Логистика'!A1",
            values: passportRows,
          },
          {
            range: "'Шаблоны Писем и Возражений'!A1",
            values: templateRows,
          },
        ],
      }),
    }
  );

  if (!updateResp.ok) {
    const errData = await updateResp.json().catch(() => ({}));
    throw new Error(
      `Ошибка занесения данных в Google Таблицу (${updateResp.status}): ${
        errData.error?.message || updateResp.statusText
      }`
    );
  }

  // 7. Apply styling (Auto-resize & formatting)
  try {
    await fetch(`https://sheets.googleapis.com/v1/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: 1,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Styling batchUpdate non-blocking error:', fmtErr);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

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
 * Creates a structured, styled Google Spreadsheet with 5 comprehensive tabs:
 * 1. Паспорт и Логистика
 * 2. Спецификация и ТЗ
 * 3. Реестр Рисков Договора
 * 4. Регламент и Подача Заявки
 * 5. Шаблоны Писем и Возражений
 */
export async function exportReportToGoogleSheets(
  result: AnalysisResult,
  accessToken?: string
): Promise<ExportToSheetsResult> {
  const token = accessToken || (await getGoogleAccessTokenForSheets());

  const title = `Аудит закупки: ${result.summary.projectName || result.summary.procurementTitle || 'Тендерная документация'}`;

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
            title: 'Паспорт и Логистика',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 1,
            title: 'Спецификация и ТЗ',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 2,
            title: 'Реестр Рисков Договора',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 3,
            title: 'Регламент и Подача Заявки',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            sheetId: 4,
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

  // 2. Build rows for Tab 0: "Паспорт и Логистика"
  const passportRows: any[][] = [
    ['Параметр закупки', 'Значение из документации', 'Правовое примечание / Анализ'],
    ['Наименование закупки', result.summary.procurementTitle || '—', 'Предмет договора'],
    ['Номер / Код закупки', result.summary.projectName || '—', 'Реестровый номер ЕИС / ЭТП'],
    ['Заказчик', result.summary.customerName || '—', result.summary.customerInn ? `ИНН: ${result.summary.customerInn}` : ''],
    ['Начальная цена (НМЦК)', result.summary.procurementSum || '—', 'Сумма контракта'],
    ['Регулирующий закон', result.summary.is223FZ ? 'Федеральный закон № 223-ФЗ' : 'Федеральный закон № 44-ФЗ', result.summary.is223FZ ? 'Штрафы не списываются по ПП 783' : 'Обязательное списание неустоек до 5%'],
    ['Дата окончания подачи / Аукцион', result.summary.auctionDate || 'По извещению', 'Регламентный срок'],
    ['Индекс риска договора', `${result.summary.overallRiskScore} / 100`, `Уровень: ${result.summary.riskLevel}`],
    ['Срок поставки', result.deliveryInfo?.deliveryPeriod || 'По договору', 'Контроль календарных/рабочих дней'],
    ['Порядок поставки', result.deliveryInfo?.deliveryScheduleNotice || 'По графику/заявкам', 'Уведомление за 24-48 часов'],
    ['Адреса складов / разгрузки', result.deliveryInfo?.deliveryAddresses?.join('; ') || 'По адресу Заказчика', 'Разгрузка и занос включены'],
    ['Условия разгрузки / подъем', result.deliveryInfo?.unloadingAndAccessConditions || 'Стандартные', 'Пропускной режим'],
    ['Грузополучатель / Контакты', result.deliveryInfo?.consigneeDetails || 'Уполномоченное лицо Заказчика', 'Подписание накладных'],
    ['Логистический риск', result.deliveryInfo?.riskWarning || 'Не выявлен', 'Особое внимание'],
  ];

  // 3. Build rows for Tab 1: "Спецификация и ТЗ"
  const specRows: any[][] = [
    ['№', 'Наименование позиции', 'Количество', 'Габариты / Размеры', 'ОКПД2 / КТРУ', 'Статус Нацрежима (ПП 1875)', 'Ключевые характеристики', 'Технические требования ТЗ'],
  ];

  if (result.productList && result.productList.length > 0) {
    result.productList.forEach((prod, idx) => {
      const paramsStr = prod.parameters
        ? prod.parameters.map((p) => `${p.name}: ${p.value}`).join('; ')
        : '';
      
      let natModeLabel = 'Без ограничений';
      if (prod.pp1875Status === 'RUSSIAN_REQUIRED') {
        natModeLabel = '⚠️ Требуется РФ (Реестр Минпромторга / ГИСП)';
      } else if (prod.pp1875Status === 'RESTRICTED') {
        natModeLabel = '⚡ Ограничение допуска (ПП 1875 / ПП 878)';
      }

      specRows.push([
        idx + 1,
        prod.name || 'Позиция ТЗ',
        prod.quantity || '1',
        prod.dimensions || 'По ТЗ',
        prod.okpd2OrGvin || prod.okpd2 || '—',
        natModeLabel,
        paramsStr || '—',
        prod.specification || '—',
      ]);
    });
  } else {
    specRows.push(['1', 'Товар/Услуга по закупочной документации', '1 компл.', 'По ТЗ', '—', 'Без ограничений', '—', 'Согласно проекту договора']);
  }

  // 4. Build rows for Tab 2: "Реестр Рисков Договора"
  const riskRows: any[][] = [
    ['№', 'Уровень риска', 'Категория', 'Заголовок риска', 'Пункт договора', 'Цитата из документа', 'Юридический анализ риска', 'Рекомендация поставщику'],
  ];

  if (result.contractRisks && result.contractRisks.length > 0) {
    result.contractRisks.forEach((risk, idx) => {
      let sevLabel: string = String(risk.severity || 'INFO');
      if (risk.severity === 'CRITICAL') sevLabel = '🔴 КРИТИЧЕСКИЙ';
      else if (risk.severity === 'HIGH') sevLabel = '🟠 ВЫСОКИЙ';
      else if (risk.severity === 'MEDIUM') sevLabel = '🟡 УМЕРЕННЫЙ';
      else if (risk.severity === 'INFO') sevLabel = '🟢 ИНФО';

      riskRows.push([
        idx + 1,
        sevLabel,
        risk.category || 'OTHER',
        risk.title || 'Риск договора',
        risk.clauseNumber || 'Б/Н',
        risk.clauseQuote || '—',
        risk.explanation || '—',
        risk.recommendation || '—',
      ]);
    });
  } else {
    riskRows.push(['1', '🟢 ИНФО', 'INFO', 'Критических рисков не выявлено', '—', '—', 'Условия договора соответствуют стандартной практике', 'Контролировать сроки исполнения']);
  }

  // 5. Build rows for Tab 3: "Регламент и Подача Заявки"
  const workflowRows: any[][] = [
    ['Раздел регламента', 'Требование / Правило', 'Порядок исполнения'],
    ['Способ закупки', result.submissionRulesCheck?.procedureType || 'Электронный аукцион', 'Подача через функционал ЭТП'],
    ['Форма подачи заявки', result.submissionRulesCheck?.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО табличная форма Заказчика' : 'По стандарту площадки', 'Согласие и конкретные показатели'],
    ['Аккредитация на ЭТП', result.submissionRulesCheck?.etpAccreditationNotice || 'ЕРУЗ ЕИС', 'Проверить баланс спецсчета'],
    ['Национальный режим', result.submissionRulesCheck?.pp1875Applies ? 'ПРИМЕНЯЕТСЯ ПП РФ № 1875' : 'Не применяется', result.submissionRulesCheck?.pp1875Details || '—'],
    ['Состав документов заявки', result.submissionRulesCheck?.requiredFilesStructure?.join('\n') || 'Стандартный комплект', 'Без указания наименования участника в 1 части'],
    ['Финансовые документы', result.submissionRulesCheck?.accountingItems?.join(', ') || 'Не требуются', 'Справка об отсутствии задолженности'],
    ['Формат закрывающих документов', result.postAwardWorkflow?.primaryDocFormatConfirmation || (result.summary.is223FZ ? 'УПД через ЭДО' : 'Электронный УПД в ЕИС'), 'Срок подписания до 20 р.д.'],
    ['Сопроводительный комплект', result.postAwardWorkflow?.accompanyingDocs?.join(', ') || 'УПД, накладная, сертификат', 'Передача при доставке'],
    ['Действия при отказе в приемке', result.postAwardWorkflow?.motivatedRefusalGuide || 'Требовать письменный мотивированный отказ', 'Фиксация замечаний в акте'],
  ];

  // 6. Build rows for Tab 4: "Шаблоны Писем и Возражений"
  const templateRows: any[][] = [
    ['Тип юридического документа', 'Готовый текст документа для копирования и отправки'],
  ];

  if (result.generatedTemplates) {
    if (result.generatedTemplates.acceptanceDocsRequest) {
      templateRows.push([
        'Уведомление о поставке и направлении электронного УПД',
        result.generatedTemplates.acceptanceDocsRequest,
      ]);
    }
    if (result.generatedTemplates.motivatedRefusalDemand) {
      templateRows.push([
        'Требование о предоставлении мотивированного отказа в ЕИС',
        result.generatedTemplates.motivatedRefusalDemand,
      ]);
    }
    if (result.generatedTemplates.claimResponseTemplate) {
      templateRows.push([
        'Ответ на претензию / Заявление о списании неустойки по ПП РФ № 783',
        result.generatedTemplates.claimResponseTemplate,
      ]);
    }
    if (result.generatedTemplates.etpFundsRequest) {
      templateRows.push([
        'Заявление о разблокировании обеспечения заявки на ЭТП',
        result.generatedTemplates.etpFundsRequest,
      ]);
    }
    if (result.generatedTemplates.accountingDataRequest) {
      templateRows.push([
        'Служебная записка в бухгалтерию для участия в закупке',
        result.generatedTemplates.accountingDataRequest,
      ]);
    }
  }

  // 7. Write data to all sheets via values:batchUpdate
  const updateDataResp = await fetch(
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
            range: "'Паспорт и Логистика'!A1",
            values: passportRows,
          },
          {
            range: "'Спецификация и ТЗ'!A1",
            values: specRows,
          },
          {
            range: "'Реестр Рисков Договора'!A1",
            values: riskRows,
          },
          {
            range: "'Регламент и Подача Заявки'!A1",
            values: workflowRows,
          },
          {
            range: "'Шаблоны Писем и Возражений'!A1",
            values: templateRows,
          },
        ],
      }),
    }
  );

  if (!updateDataResp.ok) {
    const errData = await updateDataResp.json().catch(() => ({}));
    throw new Error(
      `Ошибка наполнения Google Таблицы данными (${updateDataResp.status}): ${
        errData.error?.message || updateDataResp.statusText
      }`
    );
  }

  // 8. Apply professional styling to headers
  try {
    await fetch(`https://sheets.googleapis.com/v1/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Style headers on all 5 sheets
          ...[0, 1, 2, 3, 4].map((sId) => ({
            repeatCell: {
              range: {
                sheetId: sId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.12,
                    green: 0.16,
                    blue: 0.24,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                    },
                    fontSize: 11,
                    bold: true,
                  },
                  horizontalAlignment: 'LEFT',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          })),
        ],
      }),
    });
  } catch (styleErr) {
    console.warn('Google Sheets styling warning:', styleErr);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

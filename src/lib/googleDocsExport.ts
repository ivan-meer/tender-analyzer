import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { AnalysisResult } from '../types';

export interface ExportToDocsResult {
  documentId: string;
  documentUrl: string;
}

/**
 * Ensures Google OAuth token with Drive/Docs permissions is acquired
 */
export async function getGoogleAccessTokenForDocs(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/documents');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  
  if (!credential?.accessToken) {
    throw new Error('Не удалось получить OAuth токен доступа к Google Документам.');
  }

  return credential.accessToken;
}

/**
 * Formats AnalysisResult into a clear structured text document for Google Docs
 */
function buildReportDocumentText(result: AnalysisResult): string {
  const { summary, deliveryInfo, contractRisks, submissionRulesCheck, postAwardWorkflow, productList, generatedTemplates } = result;

  const lines: string[] = [];

  // Title
  lines.push(`ОТЧЕТ ПО ЭКСПЕРТИЗЕ ЗАКУПКИ И ДОГОВОРА (223-ФЗ / 44-ФЗ)`);
  lines.push(`========================================================================\n`);

  lines.push(`Проект / Предмет: ${summary.projectName || summary.procurementTitle}`);
  lines.push(`Заказчик: ${summary.customerName || 'Не указан'} ${summary.customerInn ? `(ИНН ${summary.customerInn})` : ''}`);
  lines.push(`НМЦК / Сумма закупки: ${summary.procurementSum || 'Не указана'}`);
  lines.push(`Дата окончания / Аукцион: ${summary.auctionDate || 'Не указана'}`);
  lines.push(`Уровень риска: ${summary.riskLevel} (Оценка: ${summary.overallRiskScore}/100)`);
  lines.push(`Краткий вывод: ${summary.keyTakeaway}\n`);

  // Delivery & Logistics
  if (deliveryInfo) {
    lines.push(`--- 1. ЛОГИСТИКА И СРОКИ ПОСТАВКИ ---`);
    lines.push(`Срок и регламент поставки: ${deliveryInfo.deliveryPeriod || 'Стандартные условия'}`);
    if (deliveryInfo.deliveryScheduleNotice) {
      lines.push(`Порядок/график: ${deliveryInfo.deliveryScheduleNotice}`);
    }
    if (deliveryInfo.deliveryAddresses && deliveryInfo.deliveryAddresses.length > 0) {
      lines.push(`Адреса поставки:`);
      deliveryInfo.deliveryAddresses.forEach((addr, idx) => {
        lines.push(`  ${idx + 1}. ${addr}`);
      });
    }
    if (deliveryInfo.unloadingAndAccessConditions) {
      lines.push(`Разгрузка и пропускной режим: ${deliveryInfo.unloadingAndAccessConditions}`);
    }
    if (deliveryInfo.riskWarning) {
      lines.push(`ВНИМАНИЕ (Риски поставки): ${deliveryInfo.riskWarning}`);
    }
    lines.push(``);
  }

  // Contract Risks
  lines.push(`--- 2. РИСКИ И ДЕФЕКТЫ ПРОЕКТА ДОГОВОРА (${contractRisks.length} поз.) ---`);
  if (contractRisks.length === 0) {
    lines.push(`Критических рисков в проекте договора не выявлено.`);
  } else {
    contractRisks.forEach((risk, idx) => {
      lines.push(`${idx + 1}. [${risk.severity}] ${risk.title}`);
      lines.push(`   Пункт договора: ${risk.clauseNumber || 'Б/Н'}`);
      lines.push(`   Цитата: "${risk.clauseQuote}"`);
      lines.push(`   Разъяснение: ${risk.explanation}`);
      lines.push(`   Рекомендация: ${risk.recommendation}`);
      lines.push(``);
    });
  }

  // Submission Rules Check
  lines.push(`--- 3. ПРАВИЛА ПОДАЧИ ЗАЯВКИ И НАЦИОНАЛЬНЫЙ РЕЖИМ ---`);
  lines.push(`Тип процедуры: ${submissionRulesCheck.procedureType}`);
  lines.push(`Заявка по форме таблицы: ${submissionRulesCheck.requestInTableRequired ? 'ДА (Обязательно)' : 'Нет'}`);
  lines.push(`Аккредитация ЕТП: ${submissionRulesCheck.etpAccreditationNotice}`);
  lines.push(`Национальный режим (ПП 1875): ${submissionRulesCheck.pp1875Applies ? 'ПРИМЕНЯЕТСЯ' : 'Не применяется'}`);
  if (submissionRulesCheck.pp1875Details) {
    lines.push(`   Детали ПП 1875: ${submissionRulesCheck.pp1875Details}`);
  }
  lines.push(`Состав документов: ${submissionRulesCheck.requiredFilesStructure.join(', ')}`);
  lines.push(``);

  // Products List
  if (productList && productList.length > 0) {
    lines.push(`--- 4. СПЕЦИФИКАЦИЯ И ТЕХНИЧЕСКОЕ ЗАДАНИЕ (${productList.length} наимен.) ---`);
    productList.forEach((prod, idx) => {
      lines.push(`${idx + 1}. ${prod.name}`);
      lines.push(`   Количество: ${prod.quantity}`);
      if (prod.okpd2OrGvin || prod.okpd2) {
        lines.push(`   ОКПД2/КТРУ: ${prod.okpd2OrGvin || prod.okpd2}`);
      }
      lines.push(`   Требования ТЗ: ${prod.specification}`);
      if (prod.parameters && prod.parameters.length > 0) {
        lines.push(`   Параметры: ${prod.parameters.map(p => `${p.name}: ${p.value}`).join('; ')}`);
      }
      lines.push(``);
    });
  }

  // Generated Templates
  if (generatedTemplates) {
    lines.push(`--- 5. ГОТОВЫЕ ШАБЛОНЫ И ПИСЬМА ---`);
    if (generatedTemplates.acceptanceDocsRequest) {
      lines.push(`\n[Запрос на согласование первичных документов]`);
      lines.push(generatedTemplates.acceptanceDocsRequest);
    }
    if (generatedTemplates.motivatedRefusalDemand) {
      lines.push(`\n[Мотивированный отказ / Разногласия]`);
      lines.push(generatedTemplates.motivatedRefusalDemand);
    }
    if (generatedTemplates.etpFundsRequest) {
      lines.push(`\n[Письмо по разблокировке денежных средств ЕТП]`);
      lines.push(generatedTemplates.etpFundsRequest);
    }
    if (generatedTemplates.claimResponseTemplate) {
      lines.push(`\n[Ответ на претензию Заказчика]`);
      lines.push(generatedTemplates.claimResponseTemplate);
    }
  }

  lines.push(`\n------------------------------------------------------------------------`);
  lines.push(`Отчет сгенерирован автоматически в интеллектуальной системе TenderAgent (223-ФЗ / 44-ФЗ)`);
  lines.push(`Дата создания: ${new Date().toLocaleString('ru-RU')}`);

  return lines.join('\n');
}

/**
 * Creates a Google Document in the user's Google Drive and inserts the analysis report text
 */
export async function exportReportToGoogleDocs(
  result: AnalysisResult,
  accessToken?: string
): Promise<ExportToDocsResult> {
  const token = accessToken || (await getGoogleAccessTokenForDocs());

  const title = `Анализ закупки: ${result.summary.projectName || result.summary.procurementTitle || 'Тендер 223-ФЗ'}`;

  // Step 1: Create empty Google Document
  const createResp = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!createResp.ok) {
    const errData = await createResp.json().catch(() => ({}));
    throw new Error(
      `Ошибка создания Google Документа (${createResp.status}): ${
        errData.error?.message || createResp.statusText
      }`
    );
  }

  const docData = await createResp.json();
  const documentId = docData.documentId;

  if (!documentId) {
    throw new Error('Google Docs API не вернул documentId.');
  }

  // Step 2: Insert text into the created Google Document
  const reportText = buildReportDocumentText(result);

  const updateResp = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: reportText,
            },
          },
        ],
      }),
    }
  );

  if (!updateResp.ok) {
    const errData = await updateResp.json().catch(() => ({}));
    throw new Error(
      `Ошибка записи отчета в Google Документ (${updateResp.status}): ${
        errData.error?.message || updateResp.statusText
      }`
    );
  }

  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    documentId,
    documentUrl,
  };
}

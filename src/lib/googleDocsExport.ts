import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
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
 * Formats AnalysisResult into a clear structured executive legal report for Google Docs
 */
function buildReportDocumentText(result: AnalysisResult): string {
  const { summary, deliveryInfo, contractRisks, submissionRulesCheck, postAwardWorkflow, productList, generatedTemplates } = result;

  const lines: string[] = [];

  // Title & Header
  lines.push(`ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ И ЮРИДИЧЕСКИЙ АУДИТ ЗАКУПКИ`);
  lines.push(`Порядок применения: ${summary.is223FZ ? 'Федеральный закон № 223-ФЗ' : 'Федеральный закон № 44-ФЗ'}`);
  lines.push(`Дата и время аудита: ${new Date().toLocaleString('ru-RU')}`);
  lines.push(`========================================================================\n`);

  // Section 1: Executive Summary
  lines.push(`1. ПАСПОРТ ЗАКУПКИ И ОБЩИЙ РИСК-ПРОФИЛЬ`);
  lines.push(`------------------------------------------------------------------------`);
  lines.push(`• Предмет закупки: ${summary.procurementTitle || 'Не указан'}`);
  lines.push(`• Проект / Номер: ${summary.projectName || 'Б/Н'}`);
  lines.push(`• Заказчик: ${summary.customerName || 'Не указан'} ${summary.customerInn ? `(ИНН: ${summary.customerInn})` : ''}`);
  lines.push(`• НМЦК / Сумма: ${summary.procurementSum || 'Не указана'}`);
  lines.push(`• Дата аукциона / подачи: ${summary.auctionDate || 'Не указана'}`);
  lines.push(`• ИНДЕКС РИСКА: ${summary.overallRiskScore} / 100 [Уровень: ${summary.riskLevel}]`);
  lines.push(`• Ключевой вывод эксперта: ${summary.keyTakeaway}\n`);

  // Section 2: Delivery & Logistics
  lines.push(`2. ЛОГИСТИКА, СРОКИ И УСЛОВИЯ ПОСТАВКИ`);
  lines.push(`------------------------------------------------------------------------`);
  if (deliveryInfo) {
    lines.push(`• Срок и период поставки: ${deliveryInfo.deliveryPeriod || 'Согласно договору'}`);
    if (deliveryInfo.deliveryScheduleNotice) {
      lines.push(`• Порядок вызова/график: ${deliveryInfo.deliveryScheduleNotice}`);
    }
    if (deliveryInfo.deliveryAddresses && deliveryInfo.deliveryAddresses.length > 0) {
      lines.push(`• Адреса поставки и складов:`);
      deliveryInfo.deliveryAddresses.forEach((addr, idx) => {
        lines.push(`   ${idx + 1}. ${addr}`);
      });
    }
    if (deliveryInfo.unloadingAndAccessConditions) {
      lines.push(`• Разгрузка, подъем и пропускной режим: ${deliveryInfo.unloadingAndAccessConditions}`);
    }
    if (deliveryInfo.consigneeDetails) {
      lines.push(`• Грузополучатель: ${deliveryInfo.consigneeDetails}`);
    }
    if (deliveryInfo.riskWarning) {
      lines.push(`• ⚠️ ВНИМАНИЕ (Риски логистики): ${deliveryInfo.riskWarning}`);
    }
  } else {
    lines.push(`Специальные условия логистики не выделены.`);
  }
  lines.push(``);

  // Section 3: Contract Risks Register
  lines.push(`3. РЕЕСТР ВЫЯВЛЕННЫХ РИСКОВ И КАБАЛЬНЫХ УСЛОВИЙ ДОГОВОРА (${contractRisks.length} поз.)`);
  lines.push(`------------------------------------------------------------------------`);
  if (contractRisks.length === 0) {
    lines.push(`Критических рисков и кабальных неустоек в проекте договора не обнаружено.`);
  } else {
    contractRisks.forEach((risk, idx) => {
      lines.push(`[${idx + 1}] УРОВЕНЬ: ${risk.severity} | ${risk.title}`);
      lines.push(`    Пункт договора: ${risk.clauseNumber || 'Б/Н'}`);
      lines.push(`    Цитата из документа: «${risk.clauseQuote}»`);
      lines.push(`    Юридический анализ: ${risk.explanation}`);
      lines.push(`    Рекомендация поставщику: ${risk.recommendation}`);
      lines.push(``);
    });
  }

  // Section 4: Specifications & Technical Task
  lines.push(`4. СПЕЦИФИКАЦИЯ ТОВАРОВ И ТРЕБОВАНИЯ ТЗ (${productList?.length || 0} наимен.)`);
  lines.push(`------------------------------------------------------------------------`);
  if (productList && productList.length > 0) {
    productList.forEach((prod, idx) => {
      lines.push(`[Позиция ${idx + 1}] ${prod.name}`);
      lines.push(`    Количество: ${prod.quantity}`);
      if (prod.okpd2OrGvin || prod.okpd2) {
        lines.push(`    ОКПД2 / КТРУ: ${prod.okpd2OrGvin || prod.okpd2}`);
      }
      if (prod.pp1875Status) {
        lines.push(`    Национальный режим (ПП 1875): ${prod.pp1875Status}`);
      }
      lines.push(`    Требования спецификации: ${prod.specification}`);
      if (prod.parameters && prod.parameters.length > 0) {
        lines.push(`    Ключевые параметры: ${prod.parameters.map(p => `${p.name}: ${p.value}`).join('; ')}`);
      }
      lines.push(``);
    });
  } else {
    lines.push(`Спецификация поставляется по условиям договора.`);
    lines.push(``);
  }

  // Section 5: Submission Rules & Check
  lines.push(`5. ПРАВИЛА ПОДАЧИ ЗАЯВКИ И НАЦИОНАЛЬНЫЙ РЕЖИМ`);
  lines.push(`------------------------------------------------------------------------`);
  if (submissionRulesCheck) {
    lines.push(`• Тип процедуры: ${submissionRulesCheck.procedureType}`);
    lines.push(`• Заявка по установленной табличной форме: ${submissionRulesCheck.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО' : 'В свободной форме'}`);
    lines.push(`• Аккредитация на ЭТП: ${submissionRulesCheck.etpAccreditationNotice}`);
    lines.push(`• Применение ПП РФ № 1875 / Нацрежим: ${submissionRulesCheck.pp1875Applies ? 'ПРИМЕНЯЕТСЯ (' + submissionRulesCheck.pp1875Details + ')' : 'Не применяется'}`);
    lines.push(`• Необходимый состав документов: ${submissionRulesCheck.requiredFilesStructure.join(', ')}`);
    if (submissionRulesCheck.accountingInfoNeeded) {
      lines.push(`• Требования к бухгалтерским данным: ${submissionRulesCheck.accountingItems?.join(', ')}`);
    }
  }
  lines.push(``);

  // Section 6: Workflow & Acceptance
  lines.push(`6. РЕГЛАМЕНТ ПРИЕМКИ И ЗАКРЫВАЮЩИХ ДОКУМЕНТОВ`);
  lines.push(`------------------------------------------------------------------------`);
  if (postAwardWorkflow) {
    lines.push(`• Стратегия работы с актами приемки: ${postAwardWorkflow.acceptanceDocsStrategy}`);
    lines.push(`• Обязательные сопроводительные документы: ${postAwardWorkflow.accompanyingDocs.join(', ')}`);
    lines.push(`• Порядок при мотивированном отказе Заказчика: ${postAwardWorkflow.motivatedRefusalGuide}`);
  }
  lines.push(``);

  // Section 7: Pre-drafted Templates
  if (generatedTemplates) {
    lines.push(`7. ГОТОВЫЕ ШАБЛОНЫ ЮРИДИЧЕСКИХ ПИСЕМ И ЗАПРОСОВ`);
    lines.push(`------------------------------------------------------------------------`);
    
    if (generatedTemplates.acceptanceDocsRequest) {
      lines.push(`\n[7.1 Запрос на согласование и подписание закрывающих документов]\n`);
      lines.push(generatedTemplates.acceptanceDocsRequest);
    }
    if (generatedTemplates.motivatedRefusalDemand) {
      lines.push(`\n[7.2 Мотивированное возражение / Ответ на отказ в приемке]\n`);
      lines.push(generatedTemplates.motivatedRefusalDemand);
    }
    if (generatedTemplates.etpFundsRequest) {
      lines.push(`\n[7.3 Письмо оператору ЭТП о разблокировке денежных средств]\n`);
      lines.push(generatedTemplates.etpFundsRequest);
    }
    if (generatedTemplates.claimResponseTemplate) {
      lines.push(`\n[7.4 Ответ на претензию Заказчика о начислении неустойки]\n`);
      lines.push(generatedTemplates.claimResponseTemplate);
    }
  }

  lines.push(`\n========================================================================`);
  lines.push(`Экспертное заключение сформировано системой TenderAgent AI на базе норм ГК РФ, 223-ФЗ и 44-ФЗ.`);

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

  const docTitle = `Аудит закупки: ${result.summary.projectName || result.summary.procurementTitle || 'Тендер 223-ФЗ'}`;

  // Step 1: Create empty Google Document
  const createResp = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
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

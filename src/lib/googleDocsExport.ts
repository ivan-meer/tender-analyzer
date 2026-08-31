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
 * Formats AnalysisResult into a professional, structured executive legal audit report for Google Docs
 */
function buildReportDocumentText(result: AnalysisResult): string {
  const { summary, deliveryInfo, contractRisks, submissionRulesCheck, postAwardWorkflow, productList, generatedTemplates } = result;

  const lines: string[] = [];

  // Document Title & Main Meta
  lines.push(`ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ И ЮРИДИЧЕСКИЙ АУДИТ ЗАКУПКИ`);
  lines.push(`Объект аудита: ${summary.procurementTitle || summary.projectName || 'Тендерная документация'}`);
  lines.push(`Регулирование: ${summary.is223FZ ? 'Федеральный закон № 223-ФЗ (Корпоративные закупки)' : 'Федеральный закон № 44-ФЗ (Контрактная система РФ)'}`);
  lines.push(`Дата формирования заключения: ${new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
  lines.push(`========================================================================================\n`);

  // Section 1: Executive Passport & Risk Profile
  lines.push(`1. ПАСПОРТ ЗАКУПКИ И ИНДЕКС БЕЗОПАСНОСТИ`);
  lines.push(`----------------------------------------------------------------------------------------`);
  lines.push(`• Наименование закупки: ${summary.procurementTitle || 'Не указано'}`);
  lines.push(`• Реестровый номер / Код: ${summary.projectName || 'Б/Н'}`);
  lines.push(`• Заказчик: ${summary.customerName || 'Не указан'} ${summary.customerInn ? `(ИНН: ${summary.customerInn})` : ''}`);
  lines.push(`• Начальная (максимальная) цена / Сумма контракта: ${summary.procurementSum || 'Не указана'}`);
  lines.push(`• Срок подачи заявок / Дата аукциона: ${summary.auctionDate || 'По извещению в ЕИС'}`);
  lines.push(`• ИНДЕКС РИСКА ДОГОВОРА: ${summary.overallRiskScore} из 100 [Уровень критичности: ${summary.riskLevel}]`);
  lines.push(`• Ключевой правовой вывод эксперта:\n  ${summary.keyTakeaway}\n`);

  // Section 2: Delivery & Logistics
  lines.push(`2. ЛОГИСТИКА, СРОКИ И УСЛОВИЯ ПОСТАВКИ`);
  lines.push(`----------------------------------------------------------------------------------------`);
  if (deliveryInfo) {
    lines.push(`• Регламентный срок поставки: ${deliveryInfo.deliveryPeriod || 'Согласно условиям проекта контракта'}`);
    if (deliveryInfo.deliveryScheduleNotice) {
      lines.push(`• Порядок вызова партий и направления заявок: ${deliveryInfo.deliveryScheduleNotice}`);
    }
    if (deliveryInfo.deliveryAddresses && deliveryInfo.deliveryAddresses.length > 0) {
      lines.push(`• Адреса складов / мест разгрузки:`);
      deliveryInfo.deliveryAddresses.forEach((addr, idx) => {
        lines.push(`   ${idx + 1}. ${addr}`);
      });
    }
    if (deliveryInfo.unloadingAndAccessConditions) {
      lines.push(`• Разгрузка, подъем на этаж и пропускной режим: ${deliveryInfo.unloadingAndAccessConditions}`);
    }
    if (deliveryInfo.consigneeDetails) {
      lines.push(`• Грузополучатель / Ответственные лица: ${deliveryInfo.consigneeDetails}`);
    }
    if (deliveryInfo.riskWarning) {
      lines.push(`• ⚠️ ВНИМАНИЕ (ЛОГИСТИЧЕСКИЙ РИСК): ${deliveryInfo.riskWarning}`);
    }
  } else {
    lines.push(`Специальные условия логистики определяются общим порядком проекта контракта.`);
  }
  lines.push(``);

  // Section 3: Contract Risks Register
  lines.push(`3. РЕЕСТР ВЫЯВЛЕННЫХ РИСКОВ И КАБАЛЬНЫХ УСЛОВИЙ ДОГОВОРА (${contractRisks?.length || 0} позиций)`);
  lines.push(`----------------------------------------------------------------------------------------`);
  if (!contractRisks || contractRisks.length === 0) {
    lines.push(`Критических рисков, скрытых ловушек и завышенных неустоек в проекте договора не обнаружено.`);
  } else {
    contractRisks.forEach((risk, idx) => {
      const sevBadge = risk.severity === 'CRITICAL' ? '🔴 КРИТИЧЕСКИЙ' : risk.severity === 'HIGH' ? '🟠 ВЫСОКИЙ' : risk.severity === 'MEDIUM' ? '🟡 УМЕРЕННЫЙ' : '🟢 ИНФО';
      lines.push(`[${idx + 1}] ${sevBadge} | ${risk.title}`);
      if (risk.category) {
        lines.push(`    Категория условия: ${risk.category}`);
      }
      lines.push(`    Пункт проекта договора: ${risk.clauseNumber || 'Б/Н'}`);
      lines.push(`    Цитата из документа: «${risk.clauseQuote}»`);
      lines.push(`    Правовой анализ: ${risk.explanation}`);
      lines.push(`    Рекомендация поставщику: ${risk.recommendation}`);
      lines.push(``);
    });
  }

  // Section 4: Specifications & Technical Task
  lines.push(`4. СПЕЦИФИКАЦИЯ ТОВАРОВ И ТРЕБОВАНИЯ ТЗ (${productList?.length || 0} позиций)`);
  lines.push(`----------------------------------------------------------------------------------------`);
  if (productList && productList.length > 0) {
    productList.forEach((prod, idx) => {
      lines.push(`[Позиция ${idx + 1}] ${prod.name}`);
      lines.push(`    Количество: ${prod.quantity || '1'}`);
      if (prod.dimensions && prod.dimensions !== 'По ТЗ') {
        lines.push(`    Габариты / Размеры: ${prod.dimensions}`);
      }
      if (prod.okpd2OrGvin || prod.okpd2) {
        lines.push(`    ОКПД2 / КТРУ: ${prod.okpd2OrGvin || prod.okpd2}`);
      }
      if (prod.pp1875Status) {
        const statusLabel = prod.pp1875Status === 'RUSSIAN_REQUIRED' 
          ? 'Обязательно продукция РФ (Реестр Минпромторга / ГИСП)' 
          : prod.pp1875Status === 'RESTRICTED' 
          ? 'Ограничение допуска (ПП 1875 / ПП 878)' 
          : 'Без ограничений';
        lines.push(`    Национальный режим: ${statusLabel}`);
      }
      if (prod.parameters && prod.parameters.length > 0) {
        lines.push(`    Технические параметры: ${prod.parameters.map(p => `${p.name}: ${p.value}`).join('; ')}`);
      }
      if (prod.specification) {
        lines.push(`    Требования ТЗ: ${prod.specification}`);
      }
      lines.push(``);
    });
  } else {
    lines.push(`Спецификация поставляется согласно приложению к проекту контракта.`);
    lines.push(``);
  }

  // Section 5: Submission Rules & Check
  lines.push(`5. ПРАВИЛА ПОДАЧИ ЗАЯВКИ И НАЦИОНАЛЬНЫЙ РЕЖИМ`);
  lines.push(`----------------------------------------------------------------------------------------`);
  if (submissionRulesCheck) {
    lines.push(`• Способ закупки: ${submissionRulesCheck.procedureType}`);
    lines.push(`• Табличная форма заявки: ${submissionRulesCheck.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО (по структурированной форме Заказчика)' : 'В свободной форме / по регламенту ЭТП'}`);
    lines.push(`• Регистрация и обеспечение: ${submissionRulesCheck.etpAccreditationNotice}`);
    lines.push(`• Нацрежим (ПП 1875 / ПП 616 / ПП 878): ${submissionRulesCheck.pp1875Applies ? 'ПРИМЕНЯЕТСЯ (' + submissionRulesCheck.pp1875Details + ')' : 'Не применяется'}`);
    if (submissionRulesCheck.requiredFilesStructure && submissionRulesCheck.requiredFilesStructure.length > 0) {
      lines.push(`• Обязательный состав заявки:`);
      submissionRulesCheck.requiredFilesStructure.forEach((file, idx) => {
        lines.push(`   ${idx + 1}. ${file}`);
      });
    }
    if (submissionRulesCheck.accountingInfoNeeded && submissionRulesCheck.accountingItems) {
      lines.push(`• Финансовые и бухгалтерские документы: ${submissionRulesCheck.accountingItems.join(', ')}`);
    }
  }
  lines.push(``);

  // Section 6: Acceptance & Electronic Document Workflow
  lines.push(`6. РЕГЛАМЕНТ ПРИЕМКИ И ЗАКРЫВАЮЩИХ ДОКУМЕНТОВ`);
  lines.push(`----------------------------------------------------------------------------------------`);
  if (postAwardWorkflow) {
    lines.push(`• Порядок актирования: ${postAwardWorkflow.primaryDocFormatConfirmation || (summary.is223FZ ? 'УПД через ЭДО или на бумажном носителе' : 'Электронный УПД в ЕИС')}`);
    lines.push(`• Стратегия подписания актов: ${postAwardWorkflow.acceptanceDocsStrategy}`);
    if (postAwardWorkflow.accompanyingDocs && postAwardWorkflow.accompanyingDocs.length > 0) {
      lines.push(`• Сопроводительные документы: ${postAwardWorkflow.accompanyingDocs.join(', ')}`);
    }
    lines.push(`• Порядок действий при мотивированном отказе: ${postAwardWorkflow.motivatedRefusalGuide}`);
  }
  lines.push(``);

  // Section 7: Pre-drafted Legal Templates
  if (generatedTemplates) {
    lines.push(`7. ГОТОВЫЕ ШАБЛОНЫ ЮРИДИЧЕСКИХ ПИСЕМ И ЗАПРОСОВ`);
    lines.push(`----------------------------------------------------------------------------------------`);
    
    if (generatedTemplates.acceptanceDocsRequest) {
      lines.push(`\n[7.1 Уведомление о готовности поставки и направлении УПД]\n`);
      lines.push(generatedTemplates.acceptanceDocsRequest);
    }
    if (generatedTemplates.motivatedRefusalDemand) {
      lines.push(`\n[7.2 Требование о предоставлении мотивированного отказа при замечаниях]\n`);
      lines.push(generatedTemplates.motivatedRefusalDemand);
    }
    if (generatedTemplates.claimResponseTemplate) {
      lines.push(`\n[7.3 Ответ на претензию Заказчика / Ходатайство о списании неустоек по ПП РФ № 783]\n`);
      lines.push(generatedTemplates.claimResponseTemplate);
    }
    if (generatedTemplates.etpFundsRequest) {
      lines.push(`\n[7.4 Заявление оператору ЭТП о разблокировании обеспечения заявки]\n`);
      lines.push(generatedTemplates.etpFundsRequest);
    }
  }

  lines.push(`\n========================================================================================`);
  lines.push(`Экспертное заключение сформировано TenderAgent AI на базе положений Гражданского кодекса РФ, Федерального закона № 44-ФЗ и № 223-ФЗ.`);

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

  const docTitle = `Юридический аудит: ${result.summary.projectName || result.summary.procurementTitle || 'Тендерная документация'}`;

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

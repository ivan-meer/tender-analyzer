export type LLMProvider = 
  | 'gemini'
  | 'deepinfra'
  | 'mistral' 
  | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  mistralApiKey?: string;
  temperature?: number;
  useMistralOcrForPdf?: boolean;
}

export interface MistralOcrPage {
  index: number;
  markdown: string;
  images?: string[];
}

export interface MistralOcrResult {
  markdownText: string;
  pagesCount: number;
  pages?: MistralOcrPage[];
  modelUsed: string;
  processingTimeMs?: number;
}

export type ProcedureType = 
  | '223_FZ_QUOTATION' 
  | '223_FZ_AUCTION' 
  | '223_FZ_TENDER'
  | '44_FZ_AUCTION' 
  | '44_FZ_QUOTATION' 
  | '44_FZ_TENDER' 
  | 'COMMERCIAL' 
  | 'OTHER';

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export interface ContractRiskItem {
  id: string;
  category: 'PENALTIES' | 'DELIVERY_TERMS' | 'TERMINATION' | 'THIRD_PARTY_PURCHASE' | 'DOCUMENTS' | 'OTHER';
  clauseNumber: string;
  clauseQuote: string;
  severity: RiskSeverity;
  title: string;
  explanation: string;
  recommendation: string;
  isNew?: boolean; // Флаг: новый риск, обнаруженный при повторном сканировании
  versionAdded?: number; // Номер версии анализа, в которой впервые обнаружен риск
  isResolved?: boolean; // Флаг: риск устранен в текущей версии
}

export interface AnalysisVersion {
  version: number;
  id: string;
  createdAt: string;
  note?: string; // Напр.: "Первоначальный сканирование", "Правки проекта договора Извещение №2"
  overallRiskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  contractRisksCount: number;
  newRisksCount: number;
  resolvedRisksCount: number;
  analysisResultSnapshot?: AnalysisResult;
}

export interface CustomerVerificationReport {
  customerName: string;
  inn: string;
  ogrn?: string;
  kpp?: string;
  status: 'ACTIVE' | 'LIQUIDATION' | 'BANKRUPT';
  statusText: string;
  registrationDate?: string;
  address?: string;
  ceoName?: string;
  capital?: string;
  rnpStatus: boolean; // Включен ли в РНП
  rnpDetails: string;
  arbitrationSummary: {
    totalCases: number;
    asDefendantCount: number;
    asPlaintiffCount: number;
    claimsSum: string;
  };
  fsspSummary: {
    activeExecutionsCount: number;
    totalDebtSum: string;
  };
  fnsTaxDebts: string;
  reliabilityScore: number; // 0..100
  reliabilityLevel: 'HIGH' | 'MEDIUM' | 'RISKY' | 'CRITICAL';
  paymentDelayStats: {
    avgDelayDays: number;
    onTimePaymentRatePct: number;
    delayRiskNote: string;
  };
  riskMarkers: string[];
  recommendation: string;
  verifiedAt?: string;
}

export interface SubmissionRulesCheck {
  procedureType: ProcedureType;
  requestInTableRequired: boolean;
  etpAccreditationNotice: string;
  requiredFilesStructure: string[];
  formsRequirement: string;
  pp1875Applies: boolean;
  pp1875Details: string;
  accountingInfoNeeded: boolean;
  accountingItems: string[];
}

export interface PostAwardWorkflow {
  deliveryNotifications: string;
  primaryDocFormatConfirmation: string;
  accompanyingDocs: string[];
  acceptanceDocsStrategy: string;
  motivatedRefusalGuide: string;
}

export interface GeneratedTemplates {
  acceptanceDocsRequest: string;
  motivatedRefusalDemand: string;
  etpFundsRequest: string;
  accountingDataRequest: string;
  yougileTaskSummary: string;
  claimResponseTemplate: string;
}

export interface ProductParameter {
  name: string; // Название параметра (например: "Размеры / Габариты", "Материал", "Масса", "Мощность", "Гарантия")
  value: string; // Значение параметра (например: "1200x800x600 мм", "Сталь 09Г2С", "15 кг")
}

export interface SuggestedModel {
  modelName: string;
  manufacturer: string;
  country: string;
  dimensionsMatch: string;
  estimatedPrice: string;
  description: string;
  gispRegistryStatus?: string;
  url?: string;
  imageUrl?: string; // Прямая ссылка на изображение товара
  productUrl?: string; // Прямая ссылка на карточку/страницу товара
  productFeatures?: string[];
}

export interface SupplierItem {
  companyName: string;
  region: string;
  specialization: string;
  contactsOrWebsite: string;
  inGispRegistry?: boolean;
  websiteUrl?: string; // Прямой веб-сайт компании
  logoUrl?: string; // Логотип или фото фабрики
}

export interface SupplierSearchResult {
  searchQueryUsed: string;
  suggestedModels: SuggestedModel[];
  suppliers: SupplierItem[];
  complianceNote: string;
  priceRangeEstimate: string;
  groundingSources?: Array<{ web?: { uri?: string; title?: string } }>;
  webSearchQueries?: string[];
  fromCache?: boolean;
  cachedAt?: string;
  cacheHits?: number;
}

export interface DeliveryInfo {
  deliveryPeriod: string; // Сроки и регламент поставки (напр. "В течение 15 рабочих дней с даты заключения Договора, но не позднее 14.05.2024")
  deliveryScheduleNotice?: string; // Порядок и график поставки (напр. "Поставка осуществляется строго по письменным заявкам Заказчика за 5 рабочих дней")
  deliveryAddresses: string[]; // Адреса и места поставки (напр. ["141000, Московская обл., г. Мытищи, ул. Промышленная, д. 12, склад № 4"])
  unloadingAndAccessConditions?: string; // Условия разгрузки и доступа (напр. "Разгрузка силами Поставщика. Оформление пропусков на АТС за 24 часа")
  consigneeDetails?: string; // Грузополучатель (напр. "ГУП 'Центр материально-технического обеспечения'")
  riskWarning?: string; // Оценка рисков просрочки поставки
}

export interface ProductItem {
  id: string;
  name: string; // Наименование товара/работы/услуги
  quantity: string; // Количество с единицами измерения
  dimensions?: string; // Размеры / Габариты из ТЗ (если есть)
  specification: string; // Основное описание / технические требования из ТЗ
  rawRequirementText?: string;
  parameters?: ProductParameter[]; // Список ключевых физико-технических параметров
  okpd2OrGvin?: string; // Код ОКПД2 / КТРУ
  okpd2?: string;
  pp1875Status: 'RUSSIAN_REQUIRED' | 'RESTRICTED' | 'NOT_APPLICABLE' | 'UNKNOWN';
  registryNumberNote?: string; // Описание реестровых номеров / баллов по ПП 1875
  deliveryAddress?: string; // Конкретный адрес поставки для данной позиции (если отличается)
  deliveryDeadline?: string; // Конкретный срок поставки для данной позиции
}

export interface AnalysisResult {
  version?: number; // Номер текущей версии документации (1, 2, 3...)
  versionTimestamp?: string;
  versionNote?: string; // Описание версии (напр., "Повторный скан Извещения №2")
  previousVersionScore?: number; // Предыдущий риск-балл для сравнения
  newRisksCount?: number; // Кол-во новых рисков
  resolvedRisksCount?: number; // Кол-во устраненных рисков
  versionHistory?: AnalysisVersion[]; // Полная история прошлых версий анализа
  summary: {
    procurementTitle: string;
    projectName?: string; // Понятное название проекта (напр. "Проект №223-894: Поставка офисной мебели")
    customerName?: string; // Заказчик (напр. "ГУП Мосгортранс", "ПАО Газпром")
    customerInn?: string; // ИНН заказчика (напр. "7707083893")
    procurementSum?: string; // НМЦК / Сумма закупки (напр. "12 450 000 ₽")
    auctionDate?: string; // Дата аукциона / окончания подачи (напр. "15.08.2026")
    overallRiskScore: number; // 0 to 100
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    keyTakeaway: string;
    is223FZ: boolean;
  };
  deliveryInfo?: DeliveryInfo; // Извлеченные и акцентированные данные о логистике, сроках и адресах
  contractRisks: ContractRiskItem[];
  submissionRulesCheck: SubmissionRulesCheck;
  postAwardWorkflow: PostAwardWorkflow;
  productList?: ProductItem[];
  generatedTemplates: GeneratedTemplates;
}

export interface AnalysisInput {
  procedureType: ProcedureType;
  contractText: string;
  documentationText: string;
  tzText: string;
  additionalNotes?: string;
}

export interface VerifiedSupplierProduct {
  name: string;
  dimensions?: string;
  priceRange?: string;
  okpd2?: string;
}

export interface VerifiedSupplier {
  id: string;
  brandName: string;
  website: string;
  description: string;
  contacts: string;
  category: string;
  isDomesticProducer: boolean;
  region: string;
  note?: string;
  sampleProducts?: VerifiedSupplierProduct[];
}


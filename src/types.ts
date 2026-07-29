export type ProcedureType = '223_FZ_QUOTATION' | '223_FZ_AUCTION' | 'COMMERCIAL' | 'OTHER';

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
}

export interface SupplierItem {
  companyName: string;
  region: string;
  specialization: string;
  contactsOrWebsite: string;
  inGispRegistry?: boolean;
}

export interface SupplierSearchResult {
  searchQueryUsed: string;
  suggestedModels: SuggestedModel[];
  suppliers: SupplierItem[];
  complianceNote: string;
  priceRangeEstimate: string;
  groundingSources?: Array<{ web?: { uri?: string; title?: string } }>;
  webSearchQueries?: string[];
}

export interface ProductItem {
  id: string;
  name: string; // Наименование товара/работы/услуги
  quantity: string; // Количество с единицами измерения
  dimensions?: string; // Размеры / Габариты из ТЗ (если есть)
  specification: string; // Основное описание / технические требования из ТЗ
  parameters?: ProductParameter[]; // Список ключевых физико-технических параметров
  okpd2OrGvin?: string; // Код ОКПД2 / КТРУ
  pp1875Status: 'RUSSIAN_REQUIRED' | 'RESTRICTED' | 'NOT_APPLICABLE' | 'UNKNOWN';
  registryNumberNote?: string; // Описание реестровых номеров / баллов по ПП 1875
}

export interface AnalysisResult {
  summary: {
    procurementTitle: string;
    overallRiskScore: number; // 0 to 100
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    keyTakeaway: string;
    is223FZ: boolean;
  };
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


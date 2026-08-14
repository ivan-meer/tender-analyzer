import React from 'react';
import { AnalysisResult, ProcedureType } from '../types';
import { User } from 'firebase/auth';
import { GuideModal } from './GuideModal';
import { TenderChatModal } from './TenderChatModal';
import { LegalSearchModal } from './LegalSearchModal';
import { DeepAuditModal } from './DeepAuditModal';
import { ScanAnalyzerModal } from './ScanAnalyzerModal';
import { AuthAndHistoryDrawer } from './AuthAndHistoryDrawer';
import { TenderDeadlinesCalendarModal } from './TenderDeadlinesCalendarModal';
import { SuppliersCatalogModal } from './SuppliersCatalogModal';
import { PdfReportPreviewModal } from './PdfReportPreviewModal';
import { CustomerInnVerificationModal } from './CustomerInnVerificationModal';
import { AISettingsModal } from './AISettingsModal';
import { GoogleAuthGateModal } from './GoogleAuthGateModal';
import { ContractDiffModal } from './ContractDiffModal';
import { FasComplaintModal } from './FasComplaintModal';
import { BankGuaranteeCalculatorModal } from './BankGuaranteeCalculatorModal';

interface AppModalsProps {
  currentUser: User | null;
  isAuthGateOpen: boolean;
  onCloseAuthGate: () => void;

  // Analysis
  analysisResult: AnalysisResult | null;
  onSelectSavedAnalysis: (result: AnalysisResult) => void;
  activeProcedureType: ProcedureType;
  onScanAnalyze: (extractedText: string) => void;

  // Modal Visibility State
  isGuideOpen: boolean;
  onCloseGuide: () => void;

  isChatOpen: boolean;
  onCloseChat: () => void;

  isSearchOpen: boolean;
  onCloseSearch: () => void;

  isDeepAuditOpen: boolean;
  onCloseDeepAudit: () => void;

  isScanOpen: boolean;
  onCloseScan: () => void;

  isHistoryOpen: boolean;
  onCloseHistory: () => void;
  onOpenCalendarFromHistory: () => void;

  isCalendarOpen: boolean;
  onCloseCalendar: () => void;

  isSuppliersCatalogOpen: boolean;
  onCloseSuppliersCatalog: () => void;

  isPdfPreviewOpen: boolean;
  onClosePdfPreview: () => void;

  isCustomerVerificationOpen: boolean;
  onCloseCustomerVerification: () => void;
  verificationInn: string;
  verificationCustomerName: string;

  isAISettingsOpen: boolean;
  onCloseAISettings: () => void;

  isContractDiffOpen?: boolean;
  onCloseContractDiff?: () => void;
  contractDiffOriginalText?: string;

  isFasComplaintOpen?: boolean;
  onCloseFasComplaint?: () => void;

  isBankGuaranteeOpen?: boolean;
  onCloseBankGuarantee?: () => void;

  // Exports
  isExportingPdf: boolean;
  isExportingGoogleDocs: boolean;
  isExportingGoogleSheets: boolean;
  onDownloadPdf: () => Promise<void> | void;
  onExportTxt: () => void;
  onExportGoogleDocs: () => Promise<void> | void;
  onExportGoogleSheets: () => Promise<void> | void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  currentUser,
  isAuthGateOpen,
  onCloseAuthGate,
  analysisResult,
  onSelectSavedAnalysis,
  activeProcedureType,
  onScanAnalyze,
  isGuideOpen,
  onCloseGuide,
  isChatOpen,
  onCloseChat,
  isSearchOpen,
  onCloseSearch,
  isDeepAuditOpen,
  onCloseDeepAudit,
  isScanOpen,
  onCloseScan,
  isHistoryOpen,
  onCloseHistory,
  onOpenCalendarFromHistory,
  isCalendarOpen,
  onCloseCalendar,
  isSuppliersCatalogOpen,
  onCloseSuppliersCatalog,
  isPdfPreviewOpen,
  onClosePdfPreview,
  isCustomerVerificationOpen,
  onCloseCustomerVerification,
  verificationInn,
  verificationCustomerName,
  isAISettingsOpen,
  onCloseAISettings,
  isContractDiffOpen = false,
  onCloseContractDiff = () => {},
  contractDiffOriginalText = '',
  isFasComplaintOpen = false,
  onCloseFasComplaint = () => {},
  isBankGuaranteeOpen = false,
  onCloseBankGuarantee = () => {},
  isExportingPdf,
  isExportingGoogleDocs,
  isExportingGoogleSheets,
  onDownloadPdf,
  onExportTxt,
  onExportGoogleDocs,
  onExportGoogleSheets,
}) => {
  return (
    <>
      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={onCloseGuide}
        activeProcedureType={activeProcedureType}
      />

      {/* AI Tender Chatbot Modal */}
      <TenderChatModal
        isOpen={isChatOpen}
        onClose={onCloseChat}
        activeAnalysisContext={
          analysisResult
            ? `Закупка: ${analysisResult.summary.procurementTitle}. Индекс риска: ${analysisResult.summary.overallRiskScore}/100. Резюме: ${analysisResult.summary.keyTakeaway}`
            : undefined
        }
      />

      {/* Legal Search Grounding Modal */}
      <LegalSearchModal
        isOpen={isSearchOpen}
        onClose={onCloseSearch}
      />

      {/* High Thinking Deep Legal Audit Modal */}
      <DeepAuditModal
        isOpen={isDeepAuditOpen}
        onClose={onCloseDeepAudit}
        procurementContext={analysisResult?.summary.procurementTitle}
      />

      {/* Multimodal Scan / Photo OCR Modal */}
      <ScanAnalyzerModal
        isOpen={isScanOpen}
        onClose={onCloseScan}
        onExtractedTextReady={onScanAnalyze}
      />

      {/* Firestore DB & Auth Drawer */}
      <AuthAndHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={onCloseHistory}
        currentAnalysisResult={analysisResult}
        onSelectAnalysis={onSelectSavedAnalysis}
        onOpenCalendar={onOpenCalendarFromHistory}
      />

      {/* Tender Deadlines & Delivery Calendar Modal */}
      <TenderDeadlinesCalendarModal
        isOpen={isCalendarOpen}
        onClose={onCloseCalendar}
        onSelectAnalysis={onSelectSavedAnalysis}
      />

      {/* Domestic Furniture & Products Suppliers Catalog Modal */}
      <SuppliersCatalogModal
        isOpen={isSuppliersCatalogOpen}
        onClose={onCloseSuppliersCatalog}
      />

      {/* Contract Diff & Redactions Comparison Modal */}
      <ContractDiffModal
        isOpen={isContractDiffOpen}
        onClose={onCloseContractDiff}
        initialOriginalText={contractDiffOriginalText}
      />

      {/* FAS Complaints & Clarification Requests Generator Modal */}
      <FasComplaintModal
        isOpen={isFasComplaintOpen}
        onClose={onCloseFasComplaint}
        analysisResult={analysisResult}
      />

      {/* Bank Guarantee & Anti-Dumping Financing Calculator Modal */}
      <BankGuaranteeCalculatorModal
        isOpen={isBankGuaranteeOpen}
        onClose={onCloseBankGuarantee}
        initialNmck={analysisResult ? 4250000 : 3500000}
      />

      {/* PDF Report Preview Modal */}
      <PdfReportPreviewModal
        isOpen={isPdfPreviewOpen}
        onClose={onClosePdfPreview}
        analysisResult={analysisResult}
        onDownloadPdf={onDownloadPdf}
        onExportTxt={onExportTxt}
        onExportGoogleDocs={onExportGoogleDocs}
        onExportGoogleSheets={onExportGoogleSheets}
        isExportingPdf={isExportingPdf}
        isExportingGoogleDocs={isExportingGoogleDocs}
        isExportingGoogleSheets={isExportingGoogleSheets}
      />

      {/* Customer Reliability INN Verification Modal */}
      <CustomerInnVerificationModal
        isOpen={isCustomerVerificationOpen}
        onClose={onCloseCustomerVerification}
        initialInn={verificationInn}
        initialCustomerName={verificationCustomerName}
      />

      {/* Universal Multi-Provider AI Settings Modal */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={onCloseAISettings}
      />

      {/* Mandatory Google Account Auth Gate Overlay Modal */}
      <GoogleAuthGateModal
        isOpen={isAuthGateOpen || !currentUser || currentUser.isAnonymous}
        currentUser={currentUser}
        onSuccess={onCloseAuthGate}
      />
    </>
  );
};

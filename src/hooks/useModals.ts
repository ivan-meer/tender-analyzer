import { useState } from 'react';

export function useModals() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDeepAuditOpen, setIsDeepAuditOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSuppliersCatalogOpen, setIsSuppliersCatalogOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCustomerVerificationOpen, setIsCustomerVerificationOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isContractDiffOpen, setIsContractDiffOpen] = useState(false);
  const [contractDiffOriginalText, setContractDiffOriginalText] = useState('');
  const [isFasComplaintOpen, setIsFasComplaintOpen] = useState(false);
  const [isBankGuaranteeOpen, setIsBankGuaranteeOpen] = useState(false);
  const [verificationInn, setVerificationInn] = useState('');
  const [verificationCustomerName, setVerificationCustomerName] = useState('');

  const openContractDiff = (initialText?: string) => {
    setContractDiffOriginalText(initialText || '');
    setIsContractDiffOpen(true);
  };

  const closeContractDiff = () => {
    setIsContractDiffOpen(false);
  };

  const openCustomerVerification = (inn?: string, name?: string) => {
    setVerificationInn(inn || '');
    setVerificationCustomerName(name || '');
    setIsCustomerVerificationOpen(true);
  };

  const closeCustomerVerification = () => {
    setIsCustomerVerificationOpen(false);
  };

  return {
    isGuideOpen,
    setIsGuideOpen,
    isChatOpen,
    setIsChatOpen,
    isSearchOpen,
    setIsSearchOpen,
    isDeepAuditOpen,
    setIsDeepAuditOpen,
    isScanOpen,
    setIsScanOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    isSuppliersCatalogOpen,
    setIsSuppliersCatalogOpen,
    isPdfPreviewOpen,
    setIsPdfPreviewOpen,
    isCalendarOpen,
    setIsCalendarOpen,
    isCustomerVerificationOpen,
    setIsCustomerVerificationOpen,
    isAISettingsOpen,
    setIsAISettingsOpen,
    isContractDiffOpen,
    setIsContractDiffOpen,
    contractDiffOriginalText,
    openContractDiff,
    closeContractDiff,
    isFasComplaintOpen,
    setIsFasComplaintOpen,
    isBankGuaranteeOpen,
    setIsBankGuaranteeOpen,
    verificationInn,
    verificationCustomerName,
    openCustomerVerification,
    closeCustomerVerification,
  };
}

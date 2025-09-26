import { useState, useRef } from 'react';
import { CRMComment, MergeMode, ChangeMarker, AlertState } from '../../types/opr-review';
import { authTokenService } from '@/lib/authTokenService';

export const useFeedbackProcessing = (documentId: string) => {
  const [selectedFeedback, setSelectedFeedback] = useState<CRMComment | null>(null);
  const [mergeMode, setMergeMode] = useState<MergeMode>('manual');
  const [selectAll, setSelectAll] = useState(false);
  const [processingMerge, setProcessingMerge] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [changeMarkers, setChangeMarkers] = useState<ChangeMarker[]>([]);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeResult, setMergeResult] = useState<string>('');
  const [mergeResultContent, setMergeResultContent] = useState<string>('');
  const [showCriticalBlockedDialog, setShowCriticalBlockedDialog] = useState(false);
  const [phoneCallMade, setPhoneCallMade] = useState(false);
  const [downgradedType, setDowngradedType] = useState<string>('M');
  const [phoneCallNotes, setPhoneCallNotes] = useState<string>('');

  const handleFeedbackClick = (comment: CRMComment) => {
    setSelectedFeedback(comment);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    return newSelectAll;
  };

  const handleToggleSelect = (id: string) => {
    return id;
  };

  const handleMergeModeChange = (mode: MergeMode) => {
    setMergeMode(mode);
  };

  const navigateToNextChange = () => {
    if (changeMarkers.length > 0) {
      const nextIndex = (currentChangeIndex + 1) % changeMarkers.length;
      setCurrentChangeIndex(nextIndex);
      scrollToChange(changeMarkers[nextIndex]);
    }
  };

  const navigateToPreviousChange = () => {
    if (changeMarkers.length > 0) {
      const prevIndex = currentChangeIndex === 0 ? changeMarkers.length - 1 : currentChangeIndex - 1;
      setCurrentChangeIndex(prevIndex);
      scrollToChange(changeMarkers[prevIndex]);
    }
  };

  const scrollToChange = (marker: ChangeMarker) => {
    const element = document.getElementById(`change-${marker.id}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleAcceptAllChanges = async () => {
    // Implementation would be here
    console.log('Accept all changes');
  };

  const handleRejectAllChanges = () => {
    // Implementation would be here
    console.log('Reject all changes');
  };

  const applySelectedFeedback = async () => {
    // Implementation would be here
    console.log('Apply selected feedback');
  };

  const applyAllFeedback = async () => {
    // Implementation would be here
    console.log('Apply all feedback');
  };

  const handleMergeFeedback = async () => {
    if (!selectedFeedback) return;

    if (selectedFeedback.commentType === 'C') {
      setShowCriticalBlockedDialog(true);
      return;
    }

    setProcessingMerge(true);
    try {
      // Implementation for merge processing
      console.log('Processing merge for:', selectedFeedback);
    } catch (error) {
      console.error('Error processing merge:', error);
    } finally {
      setProcessingMerge(false);
    }
  };

  const handleAcceptMerge = () => {
    setShowMergeDialog(false);
    setMergeResult('');
    setMergeResultContent('');
  };

  const handleRejectMerge = () => {
    setShowMergeDialog(false);
    setMergeResult('');
    setMergeResultContent('');
  };

  const handleCloseCriticalDialog = () => {
    setShowCriticalBlockedDialog(false);
    setPhoneCallMade(false);
    setPhoneCallNotes('');
    setDowngradedType('M');
  };

  const handleProceedWithCritical = () => {
    if (phoneCallMade && phoneCallNotes.trim()) {
      // Log the coordination
      console.log('Critical comment coordinated:', {
        phoneCallNotes,
        downgradedType,
        originalFeedback: selectedFeedback
      });
      setShowCriticalBlockedDialog(false);
      // Continue with merge processing
    }
  };

  return {
    selectedFeedback,
    setSelectedFeedback,
    mergeMode,
    selectAll,
    processingMerge,
    highlightedText,
    setHighlightedText,
    changeMarkers,
    setChangeMarkers,
    currentChangeIndex,
    showMergeDialog,
    setShowMergeDialog,
    mergeResult,
    setMergeResult,
    mergeResultContent,
    setMergeResultContent,
    showCriticalBlockedDialog,
    phoneCallMade,
    setPhoneCallMade,
    downgradedType,
    setDowngradedType,
    phoneCallNotes,
    setPhoneCallNotes,
    handleFeedbackClick,
    handleSelectAll,
    handleToggleSelect,
    handleMergeModeChange,
    navigateToNextChange,
    navigateToPreviousChange,
    handleAcceptAllChanges,
    handleRejectAllChanges,
    applySelectedFeedback,
    applyAllFeedback,
    handleMergeFeedback,
    handleAcceptMerge,
    handleRejectMerge,
    handleCloseCriticalDialog,
    handleProceedWithCritical
  };
};
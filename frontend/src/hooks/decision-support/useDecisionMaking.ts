import { useState } from 'react';
import { DecisionResult, DecisionAnalysis, DecisionOption } from '../../types/decision-support';

export const useDecisionMaking = (onDecisionMade?: (decision: DecisionResult) => void) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionConditions, setDecisionConditions] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const makeDecision = async (analysis: DecisionAnalysis) => {
    if (!selectedOption || !analysis) return;

    try {
      setLoading(true);

      const selectedOptionData = analysis.options.find(opt => opt.id === selectedOption);
      if (!selectedOptionData) return;

      const result: DecisionResult = {
        optionId: selectedOption,
        rationale: decisionRationale || `Selected option: ${selectedOptionData.title}`,
        confidence: selectedOptionData.confidence,
        conditions: decisionConditions,
        nextSteps: selectedOptionData.implementation.steps
      };

      if (onDecisionMade) {
        onDecisionMade(result);
      }

      setConfirmDialogOpen(false);

    } catch (error) {
      console.error('Failed to make decision:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const calculateWeightedScore = (option: DecisionOption) => {
    // Simplified weighted scoring based on criteria
    const baseScore = option.overallScore;
    const confidenceAdjustment = (option.confidence - 50) / 10; // -5 to +5
    return Math.max(0, Math.min(100, baseScore + confidenceAdjustment));
  };

  return {
    selectedOption,
    setSelectedOption,
    decisionRationale,
    setDecisionRationale,
    decisionConditions,
    setDecisionConditions,
    confirmDialogOpen,
    setConfirmDialogOpen,
    loading,
    makeDecision,
    calculateWeightedScore
  };
};
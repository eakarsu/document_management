import { useState, useCallback } from 'react';
import { Recommendation, RecommendationFeedback } from '../../types/recommendation-engine';

interface UseRecommendationActionsProps {
  onRecommendationApplied?: (recommendation: Recommendation) => void;
}

export const useRecommendationActions = ({ onRecommendationApplied }: UseRecommendationActionsProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyRecommendation = useCallback(async (recommendation: Recommendation) => {
    try {
      setLoading(true);

      // Mock implementation - in real app, this would apply the recommendation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onRecommendationApplied) {
        onRecommendationApplied(recommendation);
      }

    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply recommendation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onRecommendationApplied]);

  const submitFeedback = useCallback(async (feedback: RecommendationFeedback) => {
    try {
      // Mock feedback submission
      console.log('Submitting feedback:', feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit feedback');
    }
  }, []);

  return {
    loading,
    error,
    setError,
    applyRecommendation,
    submitFeedback
  };
};
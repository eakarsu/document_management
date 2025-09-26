import { useState } from 'react';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment, AIFeedbackItem } from '../../types/review';

export const useAIFeedback = (
  documentId: string,
  documentContent: string,
  isAIGeneratedDoc: boolean,
  comments: CRMComment[],
  setComments: (comments: CRMComment[]) => void
) => {
  const [generatingAIFeedback, setGeneratingAIFeedback] = useState(false);
  const [aiFeedbackCount, setAiFeedbackCount] = useState<number>(10);

  const generateAIFeedback = async () => {
    if (aiFeedbackCount < 1 || aiFeedbackCount > 50) {
      window.alert('Please enter a number between 1 and 50 for feedback count');
      return;
    }

    setGeneratingAIFeedback(true);
    try {
      const response = await authTokenService.authenticatedFetch('/api/generate-ai-feedback', {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          documentContent: documentContent,
          documentType: 'Review',
          feedbackCount: aiFeedbackCount
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Convert AI feedback to CRM format
        const aiFeedback = result.feedback.map((item: AIFeedbackItem, index: number) => ({
          id: `ai_${Date.now()}_${index}`,
          component: item.category || 'AI Generated',
          pocName: 'AI Assistant',
          pocPhone: '',
          pocEmail: '',
          commentType: item.severity === 'CRITICAL' ? 'C' :
                      item.severity === 'MAJOR' ? 'M' :
                      item.severity === 'SUBSTANTIVE' ? 'S' : 'A',
          page: item.page?.toString() || '1',
          paragraphNumber: item.paragraph?.toString() || '1',
          lineNumber: item.line?.toString() || '1',
          coordinatorComment: item.comment,
          changeFrom: item.originalText || '',
          changeTo: item.suggestedText || '',
          coordinatorJustification: `AI Analysis: ${item.category}`,
          selected: false
        }));

        setComments([...comments, ...aiFeedback]);

        // Save the AI feedback to database
        const allFeedback = [...comments, ...aiFeedback];

        // Prepare update fields based on document type
        const updateFields: any = {
          lastAIFeedbackGenerated: new Date().toISOString()
        };

        // For AI-generated documents, save to both crmFeedback and draftFeedback
        if (isAIGeneratedDoc) {
          updateFields.crmFeedback = allFeedback;
          updateFields.draftFeedback = allFeedback;
        } else {
          updateFields.draftFeedback = allFeedback;
        }

        const saveResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            customFields: updateFields
          })
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          window.alert(`Generated ${aiFeedback.length} AI feedback items but failed to save to database`);
        } else {
          window.alert(`Generated ${aiFeedback.length} AI feedback items and saved to database`);
        }
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      window.alert('Failed to generate AI feedback');
    } finally {
      setGeneratingAIFeedback(false);
    }
  };

  return {
    generatingAIFeedback,
    aiFeedbackCount,
    setAiFeedbackCount,
    generateAIFeedback
  };
};
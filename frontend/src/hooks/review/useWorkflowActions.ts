import { useRouter } from 'next/navigation';
import { authTokenService } from '@/lib/authTokenService';
import { CRMComment } from '../../types/review';

export const useWorkflowActions = (documentId: string) => {
  const router = useRouter();

  const handleSubmitForSecondCoordination = async () => {
    try {
      // Transition from Stage 4 to Stage 5
      const response = await fetch('/api/workflow-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenService.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'advance',
          workflowId: documentId,
          fromStage: '4',
          toStage: '5',
          requiredRole: 'ACTION_OFFICER'
        })
      });

      if (response.ok) {
        alert('Successfully submitted for second coordination!');
        router.push('/dashboard');
      } else {
        alert('Failed to submit for second coordination');
      }
    } catch (error) {
      console.error('Error submitting for second coordination:', error);
      alert('Error submitting for second coordination');
    }
  };

  const handleSubmitFeedbackToOPR = async (comments: CRMComment[]) => {
    if (comments.length === 0) {
      alert('Please add at least one comment before submitting');
      return;
    }

    try {
      // First, save the feedback to the comment matrix
      const patchResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            commentMatrix: comments,
            lastCommentUpdate: new Date().toISOString()
          }
        })
      });

      if (!patchResponse.ok) {
        alert('Failed to save feedback');
        return;
      }

      // Find active workflow task for this user
      const taskResponse = await authTokenService.authenticatedFetch(`/api/workflow-instances/${documentId}`);
      if (taskResponse.ok) {
        const workflowData = await taskResponse.json();

        // Find the active task for the current user
        const activeTask = workflowData.activeTasks?.find((task: any) =>
          task.status === 'active' || task.status === 'pending'
        );

        if (activeTask) {
          // Complete the task
          const completeResponse = await authTokenService.authenticatedFetch(
            `/api/workflow-instances/${documentId}/tasks/${activeTask.id}/complete`,
            {
              method: 'POST',
              body: JSON.stringify({
                decision: 'approved',
                comments: `Submitted ${comments.length} feedback item(s) for OPR review`
              })
            }
          );

          if (completeResponse.ok) {
            alert('Feedback successfully submitted to OPR!');
            router.push('/dashboard');
          } else {
            alert('Feedback saved but could not complete workflow task');
            router.push('/dashboard');
          }
        } else {
          alert('Feedback saved successfully!');
          router.push('/dashboard');
        }
      } else {
        alert('Feedback saved successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback to OPR');
    }
  };

  return {
    handleSubmitForSecondCoordination,
    handleSubmitFeedbackToOPR
  };
};
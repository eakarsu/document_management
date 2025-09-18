import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OPRReviewPage from '../app/documents/[id]/opr-review/page';
import { authTokenService } from '../lib/authTokenService';

// Mock the router
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-doc-id' }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock auth service
jest.mock('../lib/authTokenService', () => ({
  authTokenService: {
    authenticatedFetch: jest.fn(),
  },
}));

describe('OPR Review Page - Comprehensive Integration Test', () => {
  let mockFetch: jest.MockedFunction<typeof authTokenService.authenticatedFetch>;
  
  beforeEach(() => {
    mockFetch = authTokenService.authenticatedFetch as jest.MockedFunction<typeof authTokenService.authenticatedFetch>;
    mockFetch.mockClear();
    
    // Mock console methods
    global.console.log = jest.fn();
    global.console.error = jest.fn();
  });
  
  const mockDocument = {
    id: 'test-doc-id',
    title: 'Test Document',
    category: 'Technical',
    currentVersion: '1.0',
    status: 'In Review',
    customFields: {
      content: '<p>This is test content sdlgsdfgsdfgsdfgsdf that needs review</p>',
      draftFeedback: [
        {
          id: '1757330488227',
          component: 'AF',
          pocName: 'Col',
          pocPhone: '555-0000',
          pocEmail: 'smith@af.com',
          commentType: 'S',
          page: '1',
          paragraphNumber: '1.1.2',
          lineNumber: '2',
          coordinatorComment: 'dgsdfgahsdkfahsldhf',
          changeFrom: 'sdlgsdfgsdfgsdfgsdf',
          changeTo: 'Replace wit test',
          coordinatorJustification: 'dfgsdfgsdfgsdf'
        }
      ]
    }
  };
  
  const setupMocks = () => {
    // Mock document fetch
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/documents/test-doc-id')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ document: mockDocument }),
        } as Response);
      }
      
      if (url.includes('/api/documents/test-doc-id/feedback')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ feedback: [] }),
        } as Response);
      }
      
      if (url.includes('/api/feedback-processor/merge')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            mergedContent: '<p>This is test content Replace wit test that needs review</p>',
          }),
        } as Response);
      }
      
      return Promise.resolve({
        ok: false,
        status: 404,
      } as Response);
    });
  };
  
  describe('1. Page Loading and Initial State', () => {
    test('should load document and display feedback', async () => {
      setupMocks();
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument();
      });
      
      // Check feedback is loaded
      await waitFor(() => {
        expect(screen.getByText(/dgsdfgahsdkfahsldhf/)).toBeInTheDocument();
      });
      
      // Check console logs
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Loaded'),
        expect.any(Number),
        expect.stringContaining('feedback')
      );
    });
  });
  
  describe('2. Feedback Selection and Display', () => {
    test('should select feedback and show details', async () => {
      setupMocks();
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        const feedbackItem = screen.getByText(/dgsdfgahsdkfahsldhf/);
        fireEvent.click(feedbackItem);
      });
      
      // Check if feedback details are displayed
      expect(screen.getByDisplayValue('sdlgsdfgsdfgsdfgsdf')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Replace wit test')).toBeInTheDocument();
    });
  });
  
  describe('3. Merge Mode Selection', () => {
    test('should switch between merge modes', async () => {
      setupMocks();
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Manual')).toBeInTheDocument();
      });
      
      // Switch to AI mode
      const aiButton = screen.getByText('AI-Assisted');
      fireEvent.click(aiButton);
      
      await waitFor(() => {
        expect(screen.getByText(/AI will process this feedback/)).toBeInTheDocument();
      });
      
      // Switch to Hybrid mode
      const hybridButton = screen.getByText('Hybrid');
      fireEvent.click(hybridButton);
    });
  });
  
  describe('4. Merge Process - Manual Mode', () => {
    test('should perform manual merge successfully', async () => {
      setupMocks();
      render(<OPRReviewPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument();
      });
      
      // Select feedback
      const feedbackItem = screen.getByText(/dgsdfgahsdkfahsldhf/);
      fireEvent.click(feedbackItem);
      
      // Click merge button
      const mergeButton = screen.getByText('Merge Selected Feedback');
      fireEvent.click(mergeButton);
      
      // Check console logs
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('=== FRONTEND MERGE DEBUG ===');
        expect(console.log).toHaveBeenCalledWith('Merge Mode:', 'manual');
        expect(console.log).toHaveBeenCalledWith(
          'Sending to backend:',
          expect.objectContaining({
            mode: 'manual',
            hasChangeFrom: true,
            hasChangeTo: true,
            page: '1',
            paragraph: '1.1.2',
            line: '2'
          })
        );
      });
      
      // Check merge dialog appears
      await waitFor(() => {
        expect(screen.getByText('Merge Result')).toBeInTheDocument();
        expect(screen.getByText(/Manual merge completed successfully/)).toBeInTheDocument();
      });
    });
  });
  
  describe('5. Merge Process - AI Mode', () => {
    test('should perform AI merge and update document', async () => {
      setupMocks();
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument();
      });
      
      // Switch to AI mode
      const aiButton = screen.getByText('AI-Assisted');
      fireEvent.click(aiButton);
      
      // Select feedback
      const feedbackItem = screen.getByText(/dgsdfgahsdkfahsldhf/);
      fireEvent.click(feedbackItem);
      
      // Click merge button
      const mergeButton = screen.getByText('Merge Selected Feedback');
      fireEvent.click(mergeButton);
      
      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/feedback-processor/merge',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"mode":"ai"')
          })
        );
      });
      
      // Check success message
      await waitFor(() => {
        expect(screen.getByText(/AI merge completed successfully/)).toBeInTheDocument();
      });
    });
  });
  
  describe('6. Error Handling', () => {
    test('should handle merge failure gracefully', async () => {
      // Mock failed response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/feedback-processor/merge')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ document: mockDocument }),
        } as Response);
      });
      
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        const feedbackItem = screen.getByText(/dgsdfgahsdkfahsldhf/);
        fireEvent.click(feedbackItem);
      });
      
      // Switch to AI mode
      const aiButton = screen.getByText('AI-Assisted');
      fireEvent.click(aiButton);
      
      // Click merge
      const mergeButton = screen.getByText('Merge Selected Feedback');
      fireEvent.click(mergeButton);
      
      // Check error logging
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'AI Merge failed:',
          500,
          'Internal Server Error'
        );
      });
    });
  });
  
  describe('7. Document Editing', () => {
    test('should toggle edit mode and save document', async () => {
      setupMocks();
      
      // Mock PATCH request for saving
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/documents/test-doc-id') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ document: mockDocument }),
        } as Response);
      });
      
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Document')).toBeInTheDocument();
      });
      
      // Toggle edit mode
      const editButton = screen.getByText('Edit Document');
      fireEvent.click(editButton);
      
      // Save button should appear
      await waitFor(() => {
        expect(screen.getByText('Save Document')).toBeInTheDocument();
      });
      
      // Click save
      const saveButton = screen.getByText('Save Document');
      fireEvent.click(saveButton);
      
      // Verify save API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/documents/test-doc-id',
          expect.objectContaining({
            method: 'PATCH'
          })
        );
      });
    });
  });
  
  describe('8. Export Functionality', () => {
    test('should export document in different formats', async () => {
      setupMocks();
      
      // Mock export endpoint
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/documents/test-doc-id/export')) {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['test content'])),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ document: mockDocument }),
        } as Response);
      });
      
      render(<OPRReviewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
      
      // Open export menu
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      // Click PDF export
      await waitFor(() => {
        const pdfOption = screen.getByText('Export as PDF');
        fireEvent.click(pdfOption);
      });
      
      // Verify export API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/documents/test-doc-id/export',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"format":"pdf"')
          })
        );
      });
    });
  });
});
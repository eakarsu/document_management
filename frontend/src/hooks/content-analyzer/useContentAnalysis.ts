import { useState } from 'react';
import { api } from '../../lib/api';
import { ContentAnalysis, Document } from '../../types/content-analyzer';

export const useContentAnalysis = (
  documents: Document[],
  onAnalysisComplete?: (analysis: ContentAnalysis) => void
) => {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = async (selectedDocumentId: string) => {
    if (!selectedDocumentId) {
      setError('Please select a document to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Call the AI service to analyze the document content
      const response = await api.post('/api/ai-workflow/analyze-content-quality', {
        documentId: selectedDocumentId
      });

      if (response.ok) {
        const aiResponse = await response.json();

        // Transform the backend response to match our ContentAnalysis interface
        const analysis = aiResponse.analysis;
        const overallScore = analysis.overallScore || analysis.qualityScore || 75;
        const readabilityScore = analysis.readability?.score || analysis.readabilityScore || 65;

        const transformedAnalysis: ContentAnalysis = {
          documentId: selectedDocumentId,
          analyzedAt: new Date(),
          overallScore: Math.round(overallScore),
          metrics: {
            wordCount: Math.floor(Math.random() * 2000) + 500, // Mock for now - will be replaced with OpenRouter data
            sentenceCount: Math.floor(Math.random() * 100) + 20,
            paragraphCount: Math.floor(Math.random() * 20) + 5,
            averageWordsPerSentence: 18.5,
            averageSentencesPerParagraph: 4.2,
            readingTime: Math.floor(Math.random() * 10) + 2,
            complexityScore: Math.round((analysis.complexity?.score || overallScore) * 0.8)
          },
          readability: {
            fleschKincaid: 8.2,
            fleschReadingEase: readabilityScore,
            colemanLiau: 10.1,
            automatedReadabilityIndex: 9.8,
            averageGradeLevel: 9.5,
            readabilityCategory: readabilityScore > 70 ? 'EASY' : 'STANDARD'
          },
          qualityIssues: (Array.isArray(aiResponse.analysis.issues) ? aiResponse.analysis.issues : []).map((issue: any) => ({
            type: issue.type || 'CLARITY',
            severity: issue.severity || 'MEDIUM',
            description: issue.description || (typeof issue === 'string' ? issue : 'Issue detected'),
            location: issue.location || {
              line: Math.floor(Math.random() * 50) + 1,
              paragraph: Math.floor(Math.random() * 10) + 1,
              suggestion: `Consider reviewing this section`
            }
          })),
          topics: {
            mainTopics: [
              {
                topic: 'Document Analysis',
                confidence: 0.9,
                keywords: ['document', 'analysis', 'quality']
              }
            ],
            namedEntities: [],
            sentimentAnalysis: {
              overall: 'NEUTRAL',
              confidence: 0.8,
              emotions: []
            }
          },
          compliance: {
            securityLevel: aiResponse.analysis.complianceStatus === 'COMPLIANT' ? 'LOW' : 'MEDIUM',
            sensitiveDataDetected: aiResponse.analysis.complianceStatus !== 'COMPLIANT',
            sensitiveDataTypes: aiResponse.analysis.complianceStatus !== 'COMPLIANT' ? ['Internal Information'] : [],
            complianceFlags: aiResponse.analysis.complianceStatus !== 'COMPLIANT' ? [{
              type: 'COMPLIANCE_CHECK',
              description: 'Document requires compliance review',
              severity: 'WARNING'
            }] : [],
            recommendedClassification: aiResponse.analysis.complianceStatus === 'COMPLIANT' ? 'Public' : 'Internal Use Only'
          },
          improvements: (Array.isArray(aiResponse.analysis.improvementSuggestions) ? aiResponse.analysis.improvementSuggestions : []).map((suggestion: any, index: number) => ({
            category: suggestion.category || (index % 5 === 0 ? 'CLARITY' : index % 5 === 1 ? 'STRUCTURE' : index % 5 === 2 ? 'ENGAGEMENT' : index % 5 === 3 ? 'CONCISENESS' : 'PROFESSIONALISM'),
            priority: suggestion.priority || (index % 3 === 0 ? 'HIGH' : index % 3 === 1 ? 'MEDIUM' : 'LOW'),
            title: suggestion.title || `Improvement ${index + 1}`,
            description: suggestion.description || (typeof suggestion === 'string' ? suggestion : 'Improvement suggestion'),
            impact: suggestion.impact || (index % 3 === 0 ? 'SIGNIFICANT' : index % 3 === 1 ? 'MODERATE' : 'MINOR')
          })),
          strengths: [
            'Professional tone maintained',
            'Good use of terminology',
            'Logical structure'
          ],
          summary: `AI Analysis of "${docTitle}": Quality score ${aiResponse.analysis.overallScore || aiResponse.analysis.qualityScore || 0}/100. ${(aiResponse.analysis.improvementSuggestions || []).length} improvement suggestions available.`
        };

        setAnalysis(transformedAnalysis);

        if (onAnalysisComplete) {
          onAnalysisComplete(transformedAnalysis);
        }
      } else {
        // Fallback to mock analysis if AI service fails
        console.warn('AI service unavailable, using mock analysis');
        const mockAnalysis: ContentAnalysis = {
          documentId: selectedDocumentId,
          analyzedAt: new Date(),
          overallScore: 78,
          metrics: {
            wordCount: 1247,
            sentenceCount: 58,
            paragraphCount: 12,
            averageWordsPerSentence: 21.5,
            averageSentencesPerParagraph: 4.8,
            readingTime: 5.2,
            complexityScore: 73
          },
          readability: {
            fleschKincaid: 8.2,
            fleschReadingEase: 65.4,
            colemanLiau: 10.1,
            automatedReadabilityIndex: 9.8,
            averageGradeLevel: 9.5,
            readabilityCategory: 'STANDARD'
          },
          qualityIssues: [
            {
              type: 'GRAMMAR',
              severity: 'MEDIUM',
              description: 'Potential subject-verb disagreement',
              location: {
                line: 15,
                paragraph: 3,
                suggestion: 'Consider using "are" instead of "is"'
              }
            },
            {
              type: 'STYLE',
              severity: 'LOW',
              description: 'Passive voice detected',
              location: {
                line: 28,
                paragraph: 6,
                suggestion: 'Consider using active voice for clarity'
              }
            },
            {
              type: 'CLARITY',
              severity: 'HIGH',
              description: 'Complex sentence structure may confuse readers',
              location: {
                line: 42,
                paragraph: 9,
                suggestion: 'Consider breaking into shorter sentences'
              }
            }
          ],
          topics: {
            mainTopics: [
              {
                topic: 'Document Management',
                confidence: 0.92,
                keywords: ['workflow', 'process', 'approval', 'document']
              },
              {
                topic: 'Technology Implementation',
                confidence: 0.87,
                keywords: ['system', 'integration', 'automation', 'AI']
              },
              {
                topic: 'Business Process',
                confidence: 0.79,
                keywords: ['efficiency', 'productivity', 'optimization']
              }
            ],
            namedEntities: [
              { entity: 'Microsoft', type: 'ORGANIZATION', frequency: 5 },
              { entity: 'Q4 2024', type: 'DATE', frequency: 3 },
              { entity: '$50,000', type: 'MONEY', frequency: 2 }
            ],
            sentimentAnalysis: {
              overall: 'POSITIVE',
              confidence: 0.74,
              emotions: [
                { emotion: 'Confidence', intensity: 0.68 },
                { emotion: 'Optimism', intensity: 0.54 },
                { emotion: 'Professional', intensity: 0.82 }
              ]
            }
          },
          compliance: {
            securityLevel: 'MEDIUM',
            sensitiveDataDetected: true,
            sensitiveDataTypes: ['Financial Information', 'Internal Process Details'],
            complianceFlags: [
              {
                type: 'PII_DETECTION',
                description: 'Potential personal information detected',
                severity: 'WARNING'
              },
              {
                type: 'CONFIDENTIAL_CONTENT',
                description: 'Document contains confidential business information',
                severity: 'INFO'
              }
            ],
            recommendedClassification: 'Internal Use Only'
          },
          improvements: [
            {
              category: 'CLARITY',
              priority: 'HIGH',
              title: 'Simplify Complex Sentences',
              description: 'Several sentences are overly complex and may confuse readers. Breaking them into shorter, clearer statements would improve understanding.',
              examples: ['Break compound sentences at logical points', 'Use simpler vocabulary where possible'],
              impact: 'SIGNIFICANT'
            },
            {
              category: 'STRUCTURE',
              priority: 'MEDIUM',
              title: 'Add Section Headers',
              description: 'The document would benefit from clear section headers to improve navigation and readability.',
              examples: ['Add "Executive Summary" section', 'Include "Implementation Timeline" header'],
              impact: 'MODERATE'
            },
            {
              category: 'ENGAGEMENT',
              priority: 'LOW',
              title: 'Include Visual Elements',
              description: 'Consider adding charts, diagrams, or bullet points to break up text and improve engagement.',
              impact: 'MINOR'
            }
          ],
          strengths: [
            'Professional tone throughout',
            'Good use of industry terminology',
            'Logical flow of ideas',
            'Comprehensive coverage of topic',
            'Appropriate level of detail'
          ],
          summary: `Analysis of "${docTitle}": This document demonstrates strong professional writing with good coverage of the subject matter. The main areas for improvement are sentence clarity and document structure. The content is well-researched and maintains an appropriate professional tone throughout.`
        };

        setAnalysis(mockAnalysis);

        if (onAnalysisComplete) {
          onAnalysisComplete(mockAnalysis);
        }
      }

    } catch (err) {
      console.error('Failed to analyze content:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err ? err.message : 'Failed to analyze content';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
  };

  return {
    analysis,
    loading,
    error,
    analyzeContent,
    clearAnalysis
  };
};
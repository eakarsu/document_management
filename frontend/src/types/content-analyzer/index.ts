export interface AIContentAnalyzerProps {
  documentId?: string;
  content?: string;
  onAnalysisComplete?: (analysis: ContentAnalysis) => void;
}

export interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  readingTime: number; // minutes
  complexityScore: number; // 0-100
}

export interface ReadabilityScores {
  fleschKincaid: number;
  fleschReadingEase: number;
  colemanLiau: number;
  automatedReadabilityIndex: number;
  averageGradeLevel: number;
  readabilityCategory: 'VERY_EASY' | 'EASY' | 'FAIRLY_EASY' | 'STANDARD' | 'FAIRLY_DIFFICULT' | 'DIFFICULT' | 'VERY_DIFFICULT';
}

export interface QualityIssue {
  type: 'GRAMMAR' | 'SPELLING' | 'STYLE' | 'CLARITY' | 'CONSISTENCY' | 'STRUCTURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  location: {
    line?: number;
    paragraph?: number;
    suggestion?: string;
  };
}

export interface ContentTopics {
  mainTopics: {
    topic: string;
    confidence: number;
    keywords: string[];
  }[];
  namedEntities: {
    entity: string;
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'MISC';
    frequency: number;
  }[];
  sentimentAnalysis: {
    overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    confidence: number;
    emotions: {
      emotion: string;
      intensity: number;
    }[];
  };
}

export interface ComplianceAnalysis {
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sensitiveDataDetected: boolean;
  sensitiveDataTypes: string[];
  complianceFlags: {
    type: string;
    description: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }[];
  recommendedClassification: string;
}

export interface ImprovementSuggestion {
  category: 'CLARITY' | 'CONCISENESS' | 'STRUCTURE' | 'ENGAGEMENT' | 'PROFESSIONALISM';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  examples?: string[];
  impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT';
}

export interface ContentAnalysis {
  documentId: string;
  analyzedAt: Date;
  overallScore: number; // 0-100
  metrics: ContentMetrics;
  readability: ReadabilityScores;
  qualityIssues: QualityIssue[];
  topics: ContentTopics;
  compliance: ComplianceAnalysis;
  improvements: ImprovementSuggestion[];
  strengths: string[];
  summary: string;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}
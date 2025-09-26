import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    organizationId: string;
  };
}

export interface DocumentGenerationRequest {
  template: string;
  pages: number;
  feedbackCount: number;
  sealImage?: string;
  headerData?: CustomHeaderData;
}

export interface CustomHeaderData {
  byOrderOf?: string;
  secretary?: string;
  organization?: string;
  documentType?: string;
  documentDate?: string;
  subject?: string;
  category?: string;
  compliance?: string;
  accessibility?: string;
  accessibilityUrl?: string;
  releasability?: string;
  opr?: string;
  certifiedBy?: string;
  certifiedByName?: string;
  supersedes?: string;
  totalPages?: number;
  classification?: string;
  distributionStatement?: string;
  changeNumber?: string;
  versionNumber?: string;
  effectiveDate?: string;
  reviewDate?: string;
  pocName?: string;
  pocDSN?: string;
  pocCommercial?: string;
  pocEmail?: string;
}

export interface TemplateDefaults {
  organization: string;
  secretary: string;
  documentType: string;
  subject: string;
  category: string;
}

export interface DocumentStructureItem {
  text: string;
  paragraphNumber: string;
  page: number;
  line: number;
  index: number;
}

export interface SectionInfo {
  number: string;
  title: string;
  position: number;
}

export interface FeedbackItem {
  id: string;
  component: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  commentType: 'A' | 'S' | 'C';
  page: string;
  paragraphNumber: string;
  lineNumber: string;
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  resolution: string;
  originatorJustification: string;
  status: string;
  createdAt: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface TOCEntry {
  title: string;
  number: string;
  page: number;
}

export interface DocumentGenerationResult {
  content: string;
  feedback: FeedbackItem[];
  title: string;
}

export interface HeaderConfig {
  byOrderOf: string;
  secretary: string;
  organization: string;
  documentType: string;
  documentDate: string;
  subject: string;
  category: string;
  compliance: string;
  accessibility: string;
  accessibilityUrl: string;
  releasability: string;
  opr: string;
  certifiedBy: string;
  certifiedByName: string;
  supersedes: string;
  pages: number;
  classification: string;
  distributionStatement: string;
  changeNumber: string;
  versionNumber: string;
  effectiveDate: string;
  reviewDate: string;
  pocName: string;
  pocDSN: string;
  pocCommercial: string;
  pocEmail: string;
}

export type ValidTemplate =
  | 'technical' | 'policy' | 'training' | 'sop'
  | 'af-manual' | 'afi' | 'afpd' | 'afman' | 'afjqs' | 'afto' | 'afva' | 'afh' | 'afgm' | 'afmd'
  | 'dafi' | 'dafman' | 'dafpd'
  | 'army' | 'navy' | 'marine' | 'spaceforce'
  | 'dodd' | 'dodi' | 'cjcs'
  | 'oplan' | 'opord' | 'conops' | 'ttp';

export type ClassificationLevel = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
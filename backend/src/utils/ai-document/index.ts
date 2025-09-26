// Export all utility functions from a central location
export { getTemplateDefaults } from './template-defaults';
export { extractParagraphsWithNumbers } from './content-parser';
export { generateAIFeedback } from './feedback-generator';
export {
  generateTableOfContents,
  generateReferencesSection,
  generateGlossarySection,
  generateAttachmentsSection,
  generateDistributionList,
  addPortionMarkings
} from './document-sections';
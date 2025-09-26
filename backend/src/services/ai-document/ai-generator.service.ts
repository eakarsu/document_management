import * as fs from 'fs';
import * as path from 'path';
import {
  DocumentGenerationResult,
  CustomHeaderData,
  HeaderConfig,
  ValidTemplate,
  ClassificationLevel
} from '../../types/ai-document';
import {
  getTemplateDefaults,
  generateAIFeedback,
  generateTableOfContents,
  generateReferencesSection,
  generateGlossarySection,
  generateAttachmentsSection,
  generateDistributionList,
  addPortionMarkings
} from '../../utils/ai-document';

const fetch = require('node-fetch');

// Get OpenRouter API key from environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

/**
 * Service class for AI document generation
 */
export class AIGeneratorService {
  /**
   * Generates an AI document with the specified parameters
   * @param template - Document template type
   * @param pages - Number of pages to generate
   * @param feedbackCount - Number of feedback items to generate
   * @param customSealImage - Optional custom seal image
   * @param customHeaderData - Optional custom header data
   * @returns Promise resolving to document generation result
   */
  async generateDocument(
    template: ValidTemplate,
    pages: number,
    feedbackCount: number,
    customSealImage?: string,
    customHeaderData?: CustomHeaderData
  ): Promise<DocumentGenerationResult> {
    try {
      const content = await this.generateAIContent(template, pages, customSealImage, customHeaderData);
      const feedback = generateAIFeedback(content, feedbackCount, pages);
      const title = this.getDocumentTitle(template);

      return {
        content,
        feedback,
        title
      };
    } catch (error: any) {
      console.error('Error in AIGeneratorService.generateDocument:', error);
      throw error;
    }
  }

  /**
   * Generates the actual AI content using OpenRouter API
   * @param template - Document template type
   * @param pages - Number of pages
   * @param customSealImage - Optional custom seal image
   * @param customHeaderData - Optional custom header data
   * @returns Promise resolving to generated content
   */
  private async generateAIContent(
    template: ValidTemplate,
    pages: number,
    customSealImage?: string,
    customHeaderData?: CustomHeaderData
  ): Promise<string> {
    const prompt = this.buildPrompt(template, pages);

    const messages = [
      {
        role: 'system',
        content: `You are an expert technical writer for the US Air Force. Generate well-structured technical documentation with deep hierarchical numbering following military standards.

MANDATORY MILITARY DOCUMENT STRUCTURE:
1. ALWAYS start with an Introduction Paragraph (data-paragraph="0.1")
2. ALWAYS include a SUMMARY OF CHANGES section immediately after the introduction
3. ONLY THEN proceed with numbered sections (1., 2., 3., etc.)

These two sections are REQUIRED for ALL military documents per Air Force standards.

CRITICAL LENGTH REQUIREMENT: You MUST generate exactly ${pages} pages of content. Each page needs 600-700 words. Total minimum: ${pages * 650} words (not characters). DO NOT include any header or table of contents - these will be added automatically by the system.

For a 10-page document, you MUST produce at least 6,500 words.
For a 5-page document, you MUST produce at least 3,250 words.

Continue adding sections and detailed paragraphs until you reach the required word count.

CRITICAL PARAGRAPH NUMBERING RULE:
- Paragraph numbers are ONE LEVEL DEEPER than their heading
- If heading is 1.1.1.1.1 (5 levels), paragraphs are 1.1.1.1.1.1, 1.1.1.1.1.2 (6 levels)
- If heading is 1.1.1.1 (4 levels), paragraphs are 1.1.1.1.1, 1.1.1.1.2 (5 levels)
- NEVER use the same depth for paragraph numbers as the heading number
- Each section must have 2-3 numbered paragraphs of at least 80-120 words each.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Document Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // Use GPT-4o (ChatGPT 5) for best performance
        messages: messages,
        temperature: 0.7,
        max_tokens: Math.min(16000, pages * 2000)  // Dynamic based on pages, up to 16k tokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    let content = data.choices[0]?.message?.content || '';

    // Log the AI response for debugging
    console.log('=== AI RESPONSE DEBUG ===');
    console.log('Response length:', content.length);
    console.log('Has level 5 pattern (X.X.X.X.X):', /\d+\.\d+\.\d+\.\d+\.\d+/.test(content));
    console.log('Has h6 tags:', content.includes('<h6'));
    console.log('Has margin-left styles:', content.includes('margin-left:'));
    console.log('First 500 chars:', content.substring(0, 500));

    // Clean up the content
    const cleanedContent = content
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    // Generate the complete document with header and sections
    return this.assembleCompleteDocument(cleanedContent, template, pages, customSealImage, customHeaderData);
  }

  /**
   * Builds the prompt for AI content generation
   * @param template - Document template type
   * @param pages - Number of pages
   * @returns Formatted prompt string
   */
  private buildPrompt(template: ValidTemplate, pages: number): string {
    const deepStructurePrompt = `
IMPORTANT: DO NOT include any document headers, table of contents, or title pages - these will be added automatically by the system.

CRITICAL MILITARY DOCUMENT STRUCTURE REQUIREMENTS:
Your document MUST begin with these TWO MANDATORY sections BEFORE any numbered content:

1. INTRODUCTION PARAGRAPH (Required for ALL military documents):
   - Start with: <div style="margin-bottom: 20px; padding: 15px; background-color: #fafafa;">
   - Include: <p data-paragraph="0.1" data-line="1" style="text-indent: 20px; line-height: 1.6;">
   - Content: Write a COMPREHENSIVE 150-200 word introduction paragraph that includes:
     * "This [document type] provides [detailed purpose and scope]..."
     * Explain the document's primary objectives and intended outcomes
     * Detail the responsibilities and procedures it establishes
     * Specify all applicable organizations and personnel
     * Describe the implementation framework and compliance requirements
     * Reference any superseded documents or related directives
     * State "Compliance with this publication is mandatory" at the end
   - Make it substantive and informative, providing readers with a complete overview
   - End with: </p></div>

2. SUMMARY OF CHANGES (Required for ALL military documents):
   - Start with: <div style="margin-bottom: 30px; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #333;">
   - Include heading: <h3 style="margin-top: 0; color: #333; font-size: 14px; font-weight: bold;">SUMMARY OF CHANGES</h3>
   - Include: <p data-paragraph="0.2" data-line="1" style="margin-bottom: 10px; text-align: justify; line-height: 1.6;">
   - Content: Write a DETAILED 100-150 word paragraph (NOT a bulleted list) that flows naturally:
     * "This document has been substantially revised and requires complete review. Major changes include..."
     * Continue with flowing prose describing updates to policy requirements, organizational structure revisions, enhanced reporting procedures, clarified compliance measures, new definitions and terminology, updated references to current regulations, modifications to operational procedures, additions to safety protocols, refinements in accountability frameworks, and improvements to implementation guidance.
     * Write as a cohesive paragraph with proper transitions between topics
   - End with: </p></div>

THEN start your main content with the first numbered section (e.g., <h2>1. First Section</h2>).

CRITICAL: Create a document with DEEP HIERARCHICAL STRUCTURE using the following numbering system WITH PROPER INDENTATION:
- Level 1: <h2>1. Main Section</h2> (no indent)
- Level 2: <h3 style="margin-left: 20px;">1.1 Subsection</h3> (20px indent)
- Level 3: <h4 style="margin-left: 40px;">1.1.1 Sub-subsection</h4> (40px indent)
- Level 4: <h5 style="margin-left: 60px;">1.1.1.1 Detail Level</h5> (60px indent)
- Level 5: <h6 style="margin-left: 80px;">1.1.1.1.1 Fine Detail</h6> (80px indent)

LENGTH REQUIREMENTS - CRITICAL:
- MINIMUM TOTAL CONTENT: ${pages * 650} words (NOT characters)
- Each page MUST contain 600-700 words of content
- Document MUST be ${pages} full pages long
- If generating 10 pages, you MUST produce at least 6,500 words
- Continue adding sections and content until you reach the required word count

PARAGRAPH NUMBERING AND HTML STRUCTURE:
- EACH SECTION (including subsections) MUST have 2-3 numbered paragraphs
- CRITICAL: Paragraphs must be indented 20px MORE than their parent heading

STRUCTURE REQUIREMENTS:
1. Each main section (1, 2, 3) must have at least 2-3 subsections (1.1, 1.2, 1.3)
2. Each subsection must have at least 2 sub-subsections (1.1.1, 1.1.2)
3. ALL sections MUST go to level 5 depth (1.1.1.1.1) - MANDATORY for every branch
4. CRITICAL: Numbers must INCREMENT properly
5. Use proper HTML heading tags (h2 through h6) for hierarchy
6. Each level should have meaningful content in <p> tags WITH SAME INDENTATION and PARAGRAPH NUMBERS
7. Add MORE main sections (4, 5, 6, 7, 8, 9, 10+) as needed to reach ${pages} pages

PARAGRAPH CONTENT REQUIREMENTS:
- IMPORTANT: Each paragraph MUST be 4-6 sentences long (approximately 80-120 words)
- Provide comprehensive details, explanations, and context
- Include specific examples, requirements, or procedures
- Use complete, detailed sentences that fully explain the topic
- Do NOT use short, single-sentence paragraphs
- Each paragraph starts with its number (e.g., "1.1.1.1. ")`;

    const templatePrompts: Record<string, string> = {
      'af-manual': `Generate exactly ${pages} pages of Air Force technical manual with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS FOR AIR FORCE MANUAL:
- Use military terminology and formal language
- Include compliance statements and regulatory references
- Add "Table" references where appropriate
- Include "Note:", "WARNING:", and "CAUTION:" statements
- Each paragraph MUST be 4-6 sentences (80-120 words)
- Total content: ${pages * 650} words`,

      'technical': `Generate exactly ${pages} pages of technical documentation with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Focus on software/system architecture
- Include implementation details at deeper levels
- Add configuration examples at level 5 (mandatory)
- Use technical terminology
- Include code snippets in <pre><code> blocks at deeper levels`,

      'policy': `Generate exactly ${pages} pages of organizational policy with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Include compliance requirements at deeper levels
- Add specific procedures at levels 3-4
- Include enforcement details at level 5 (mandatory for all branches)
- Use formal policy language`,

      'training': `Generate exactly ${pages} pages of training manual with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Learning objectives at level 2
- Detailed lessons at level 3
- Exercises at level 4
- Assessment criteria at level 5 (mandatory for all branches)`,

      'sop': `Generate exactly ${pages} pages of SOP with DEEP HIERARCHICAL STRUCTURE.

${deepStructurePrompt}

SPECIFIC REQUIREMENTS:
- Main procedures at level 1
- Detailed steps at level 2-3
- Specific actions at level 4
- Quality checks at level 5 (mandatory for all branches)`
    };

    // Add additional military document templates
    const additionalTemplates: Record<string, string> = {
      'afi': `Generate exactly ${pages} pages of Air Force Instruction (AFI) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Regulatory guidance and mandatory procedures
- Compliance requirements and standards
- Implementation instructions
- Responsibilities and authorities
- Use formal military language and terminology`,

      'afpd': `Generate exactly ${pages} pages of Air Force Policy Directive (AFPD) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- High-level policy statements
- Strategic objectives and goals
- Organizational responsibilities
- Policy implementation framework
- Executive-level guidance`,

      'afman': `Generate exactly ${pages} pages of Air Force Manual (AFMAN) with DEEP HIERARCHICAL STRUCTURE.
${deepStructurePrompt}
SPECIFIC REQUIREMENTS:
- Detailed procedural guidance
- Step-by-step instructions
- Technical specifications
- Implementation procedures
- Operational guidelines`
    };

    const allTemplates = { ...templatePrompts, ...additionalTemplates };
    return allTemplates[template] || allTemplates.technical;
  }

  /**
   * Assembles the complete document with header, TOC, and sections
   * @param aiContent - The AI-generated content
   * @param template - Document template type
   * @param pages - Number of pages
   * @param customSealImage - Optional custom seal image
   * @param customHeaderData - Optional custom header data
   * @returns Complete assembled document
   */
  private assembleCompleteDocument(
    aiContent: string,
    template: ValidTemplate,
    pages: number,
    customSealImage?: string,
    customHeaderData?: CustomHeaderData
  ): string {
    // Load seal image
    const sealBase64 = this.loadSealImage(customSealImage);

    // Build header configuration
    const headerConfig = this.buildHeaderConfig(template, pages, customHeaderData);

    // Generate header HTML
    const headerHtml = this.generateHeaderHtml(sealBase64, headerConfig);

    // Generate document sections
    const tocHtml = generateTableOfContents(aiContent);
    const referencesHtml = generateReferencesSection(template);
    const glossaryHtml = generateGlossarySection(template);
    const attachmentsHtml = generateAttachmentsSection();
    const distributionHtml = generateDistributionList(template);

    // Add portion markings
    const markedContent = addPortionMarkings(aiContent, headerConfig.classification as ClassificationLevel);

    // Assemble final document
    return headerHtml + tocHtml + markedContent + referencesHtml + glossaryHtml + attachmentsHtml + distributionHtml;
  }

  /**
   * Loads seal image (custom or default)
   * @param customSealImage - Optional custom seal image
   * @returns Base64 encoded seal image
   */
  private loadSealImage(customSealImage?: string): string {
    if (customSealImage) {
      return customSealImage;
    }

    try {
      const sealPath = path.join(__dirname, '../../../frontend/public/images/air-force-seal.png');
      if (fs.existsSync(sealPath)) {
        const sealBuffer = fs.readFileSync(sealPath);
        return `data:image/png;base64,${sealBuffer.toString('base64')}`;
      }
    } catch (err) {
      console.error('Failed to load Air Force seal image:', err);
    }

    // Fallback seal
    return 'data:image/svg+xml;base64,' + Buffer.from(`
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="58" fill="#FFD700" stroke="#FFD700" stroke-width="4"/>
        <circle cx="60" cy="60" r="54" fill="#002F6C"/>
        <text x="60" y="65" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">USAF</text>
      </svg>
    `).toString('base64');
  }

  /**
   * Builds header configuration from template defaults and custom data
   * @param template - Document template type
   * @param pages - Number of pages
   * @param customHeaderData - Optional custom header data
   * @returns Header configuration object
   */
  private buildHeaderConfig(template: ValidTemplate, pages: number, customHeaderData?: CustomHeaderData): HeaderConfig {
    const defaults = getTemplateDefaults(template);

    return {
      byOrderOf: customHeaderData?.byOrderOf || 'BY ORDER OF THE',
      secretary: customHeaderData?.secretary || defaults.secretary,
      organization: customHeaderData?.organization || defaults.organization,
      documentType: customHeaderData?.documentType || defaults.documentType,
      documentDate: customHeaderData?.documentDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      subject: customHeaderData?.subject || defaults.subject,
      category: customHeaderData?.category || defaults.category,
      compliance: customHeaderData?.compliance || 'COMPLIANCE WITH THIS PUBLICATION IS MANDATORY',
      accessibility: customHeaderData?.accessibility || 'Publications and forms are available on the e-Publishing website at',
      accessibilityUrl: customHeaderData?.accessibilityUrl || 'http://www.e-publishing.af.mil',
      releasability: customHeaderData?.releasability || 'There are no releasability restrictions on this publication.',
      opr: customHeaderData?.opr || 'SF/S5S',
      certifiedBy: customHeaderData?.certifiedBy || 'SF/S5/8',
      certifiedByName: customHeaderData?.certifiedByName || '(Lt Gen Philip Garrant)',
      supersedes: customHeaderData?.supersedes || '',
      pages: customHeaderData?.totalPages || pages,
      classification: customHeaderData?.classification || 'UNCLASSIFIED',
      distributionStatement: customHeaderData?.distributionStatement || 'DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited',
      changeNumber: customHeaderData?.changeNumber || '',
      versionNumber: customHeaderData?.versionNumber || '1.0',
      effectiveDate: customHeaderData?.effectiveDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      reviewDate: customHeaderData?.reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      pocName: customHeaderData?.pocName || 'Lt Col Smith, John A.',
      pocDSN: customHeaderData?.pocDSN || '555-1234',
      pocCommercial: customHeaderData?.pocCommercial || '(555) 555-1234',
      pocEmail: customHeaderData?.pocEmail || 'john.a.smith@us.af.mil'
    };
  }

  /**
   * Generates the HTML header for the document
   * @param sealBase64 - Base64 encoded seal image
   * @param headerConfig - Header configuration
   * @returns HTML header string
   */
  private generateHeaderHtml(sealBase64: string, headerConfig: HeaderConfig): string {
    return `<style>
  .classification-header {
    text-align: center;
    font-weight: bold;
    font-size: 12pt;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: ${headerConfig.classification === 'SECRET' ? '#FFD700' :
                        headerConfig.classification === 'TOP SECRET' ? '#FF6B6B' :
                        headerConfig.classification === 'CONFIDENTIAL' ? '#87CEEB' : '#F0F0F0'};
    color: ${headerConfig.classification === 'UNCLASSIFIED' ? '#000' : '#000'};
    border: 2px solid #000;
  }

  .classification-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    padding: 0.25rem;
    background-color: white;
    border-top: 1px solid #000;
  }

  .page-footer {
    position: fixed;
    bottom: 30px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 1in;
    font-size: 10pt;
  }

  .air-force-document-header {
    font-family: 'Times New Roman', serif;
    width: 100%;
    margin: 0 0 2rem 0;
    padding: 1in;
    box-sizing: border-box;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 3rem;
  }

  .header-left {
    flex: 0 0 45%;
    text-align: center;
  }

  .header-right {
    flex: 0 0 50%;
    text-align: right;
  }

  .by-order {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .secretary {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .seal {
    width: 120px;
    height: 120px;
    margin: 0.5rem auto;
    display: block;
    border-radius: 50%;
  }

  .organization {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-bottom: 0.25rem;
  }

  .document-type {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .date {
    font-size: 10pt;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .subject {
    font-size: 10pt;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .category {
    font-size: 11pt;
    font-weight: bold;
    font-style: italic;
    text-transform: uppercase;
  }

  .compliance {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    text-transform: uppercase;
    margin: 2rem 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #000;
  }

  .info-section {
    display: flex;
    margin: 0.75rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #000;
    font-size: 10pt;
  }

  .section-label {
    font-weight: bold;
    margin-right: 2rem;
    min-width: 130px;
  }

  .section-content {
    flex: 1;
  }

  .footer-section {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #000;
    font-size: 10pt;
  }

  .opr {
    flex: 0 0 30%;
  }

  .certified {
    flex: 0 0 65%;
    text-align: right;
  }

  .supersedes-section {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 10pt;
  }

  .pages-only {
    text-align: right;
    margin-top: 0.5rem;
    font-size: 10pt;
  }

  .pages {
    float: right;
  }

  /* Page layout */
  @page {
    size: 8.5in 11in;
    margin: 0;
  }

  /* Content styles */
  h1 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin: 2rem 0 1rem 0;
    text-transform: uppercase;
  }

  h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  h4 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 0.8rem;
    margin-bottom: 0.4rem;
  }

  h5, h6 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 0.6rem;
    margin-bottom: 0.3rem;
  }

  p {
    font-size: 11pt;
    margin-bottom: 10px;
    text-align: justify;
  }

  .toc-section {
    page-break-after: always;
    margin-bottom: 2rem;
  }

  .toc-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1rem;
  }

  .toc-entry {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #000;
    margin: 0 0.5rem;
  }

  .change-bar {
    border-left: 3px solid #FF0000;
    padding-left: 10px;
    margin-left: -13px;
  }

  .portion-marking {
    font-weight: bold;
    color: #0066CC;
  }
</style>

<!-- Classification Header -->
<div class="classification-header">
  ${headerConfig.classification}
</div>

<div class="air-force-document-header">
  <div class="header-top">
    <div class="header-left">
      <div class="by-order">${headerConfig.byOrderOf}</div>
      <div class="secretary">${headerConfig.secretary}</div>
      <img src="${sealBase64}" alt="Air Force Seal" class="seal" />
    </div>
    <div class="header-right">
      <div class="organization">${headerConfig.organization}</div>
      <div class="document-type">${headerConfig.documentType}</div>
      <div class="date">${headerConfig.documentDate}</div>
      <div class="subject">${headerConfig.subject}</div>
      <div class="category">${headerConfig.category}</div>
      ${headerConfig.changeNumber ? `<div style="font-size: 10pt; color: red;">CHANGE ${headerConfig.changeNumber}</div>` : ''}
      ${headerConfig.versionNumber ? `<div style="font-size: 10pt;">Version ${headerConfig.versionNumber}</div>` : ''}
    </div>
  </div>

  <div class="compliance">
    ${headerConfig.compliance}
  </div>

  <div class="info-section">
    <span class="section-label">DISTRIBUTION:</span>
    <span class="section-content">${headerConfig.distributionStatement}</span>
  </div>

  <div class="info-section">
    <span class="section-label">ACCESSIBILITY:</span>
    <span class="section-content">${headerConfig.accessibility} <a href="${headerConfig.accessibilityUrl}" style="color: #0066CC;">${headerConfig.accessibilityUrl}</a>.</span>
  </div>

  <div class="info-section">
    <span class="section-label">RELEASABILITY:</span>
    <span class="section-content">${headerConfig.releasability}</span>
  </div>

  <div class="info-section">
    <span class="section-label">EFFECTIVE DATE:</span>
    <span class="section-content">${headerConfig.effectiveDate}</span>
    <span style="margin-left: 2rem;"><strong>REVIEW DATE:</strong> ${headerConfig.reviewDate}</span>
  </div>

  <div class="info-section">
    <span class="section-label">POC:</span>
    <span class="section-content">
      ${headerConfig.pocName}<br />
      DSN: ${headerConfig.pocDSN} | Commercial: ${headerConfig.pocCommercial}<br />
      Email: ${headerConfig.pocEmail}
    </span>
  </div>

  <div class="footer-section">
    <div class="opr">
      <span class="section-label">OPR:</span> ${headerConfig.opr}
    </div>
    <div class="certified">
      Certified by: ${headerConfig.certifiedBy}<br />
      ${headerConfig.certifiedByName}
    </div>
  </div>
  ${headerConfig.supersedes ? `
  <div class="supersedes-section">
    <span class="section-label">Supersedes:</span> ${headerConfig.supersedes}
    <span class="pages">Pages: ${headerConfig.pages}</span>
  </div>` : `
  <div class="pages-only">
    <span class="pages">Pages: ${headerConfig.pages}</span>
  </div>`}
</div>

<!-- Page Footer Template -->
<div class="page-footer" style="display: none;">
  <span>${headerConfig.documentType}</span>
  <span>${headerConfig.effectiveDate}</span>
  <span>Page <span class="page-number">1</span> of ${headerConfig.pages}</span>
</div>

<!-- Classification Footer -->
<div class="classification-footer">
  ${headerConfig.classification}
</div>
`;
  }

  /**
   * Gets the document title for a given template
   * @param template - Document template type
   * @returns Document title
   */
  private getDocumentTitle(template: ValidTemplate): string {
    const titles: Record<string, string> = {
      'af-manual': 'AIR FORCE INSTRUCTION 36-2903',
      'technical': 'Technical Documentation',
      'policy': 'Organizational Policy',
      'training': 'Training Manual',
      'sop': 'Standard Operating Procedures',
      'afi': 'Air Force Instruction',
      'afpd': 'Air Force Policy Directive',
      'afman': 'Air Force Manual'
    };

    return titles[template] || 'Document';
  }
}
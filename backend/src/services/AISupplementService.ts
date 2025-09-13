import OpenAI from 'openai';

interface SupplementSuggestion {
  action: 'ADD' | 'MODIFY' | 'REPLACE' | 'DELETE';
  content: string;
  rationale: string;
  sectionNumber?: string;
  confidence: number;
}

interface OrganizationContext {
  name: string;
  type: 'MAJCOM' | 'BASE' | 'UNIT';
  location?: string;
  climate?: string;
  mission?: string;
  size?: string;
  specialRequirements?: string[];
}

export class AISupplementService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Document Management System'
      }
    });
  }

  /**
   * Generate AI suggestions for supplementing a document section
   */
  async generateSupplementSuggestions(
    selectedText: string,
    parentDocumentTitle: string,
    organization: OrganizationContext,
    sectionNumber?: string
  ): Promise<SupplementSuggestion[]> {
    try {
      const prompt = this.buildSupplementPrompt(selectedText, parentDocumentTitle, organization, sectionNumber);
      
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert in military document management and supplemental guidance creation. 
                     You understand the hierarchy of military documents and how supplements should enhance, 
                     not contradict, parent documents. You provide specific, actionable supplement suggestions 
                     based on organizational context.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseSupplementSuggestions(content);
    } catch (error) {
      console.error('Error generating supplement suggestions:', error);
      throw error;
    }
  }

  /**
   * Analyze a document and suggest sections that need supplements
   */
  async analyzeForSupplements(
    documentContent: string,
    organization: OrganizationContext
  ): Promise<Array<{ sectionNumber: string; reason: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing military documents for supplement requirements.'
          },
          {
            role: 'user',
            content: `Analyze this document for sections that likely need supplements for ${organization.name}:
                     
                     Organization Context:
                     - Type: ${organization.type}
                     - Location: ${organization.location || 'Not specified'}
                     - Climate: ${organization.climate || 'Not specified'}
                     - Mission: ${organization.mission || 'Standard'}
                     
                     Document Content:
                     ${documentContent.substring(0, 5000)}
                     
                     Identify sections that need supplements and explain why. 
                     Return as JSON array with: sectionNumber, reason, priority`
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content || '[]';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing document for supplements:', error);
      return [];
    }
  }

  /**
   * Generate complete supplement content for a section
   */
  async generateSupplementContent(
    action: 'ADD' | 'MODIFY' | 'REPLACE' | 'DELETE',
    originalContent: string,
    organization: OrganizationContext,
    userGuidance?: string
  ): Promise<{ content: string; rationale: string }> {
    try {
      const actionPrompts = {
        ADD: `Generate additional requirements that should be added after this section for ${organization.name}. 
              Consider local conditions, mission requirements, and organizational needs.`,
        MODIFY: `Generate clarifications and additional restrictions for this section specific to ${organization.name}. 
                The original content remains but needs local clarification.`,
        REPLACE: `Generate replacement content for this section specific to ${organization.name}. 
                 The original doesn't apply, provide complete alternative guidance.`,
        DELETE: `Explain why this section should be marked as not applicable for ${organization.name}.`
      };

      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating military supplemental guidance documents.'
          },
          {
            role: 'user',
            content: `${actionPrompts[action]}
                     
                     Original Content:
                     ${originalContent}
                     
                     Organization Context:
                     - Name: ${organization.name}
                     - Type: ${organization.type}
                     - Location: ${organization.location || 'Not specified'}
                     - Climate: ${organization.climate || 'Not specified'}
                     - Mission: ${organization.mission || 'Standard'}
                     ${userGuidance ? `\nAdditional Guidance: ${userGuidance}` : ''}
                     
                     Generate:
                     1. The supplement content (be specific and actionable)
                     2. A clear rationale for this supplement
                     
                     Format as JSON: { "content": "...", "rationale": "..." }`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const result = response.choices[0]?.message?.content || '{}';
      return JSON.parse(result);
    } catch (error) {
      console.error('Error generating supplement content:', error);
      throw error;
    }
  }

  /**
   * Build a detailed prompt for supplement generation
   */
  private buildSupplementPrompt(
    selectedText: string,
    parentDocumentTitle: string,
    organization: OrganizationContext,
    sectionNumber?: string
  ): string {
    return `Analyze this section from "${parentDocumentTitle}" and suggest appropriate supplements for ${organization.name}:

Section ${sectionNumber || '(unnumbered)'}:
"${selectedText}"

Organization Context:
- Name: ${organization.name}
- Type: ${organization.type}
- Location: ${organization.location || 'Not specified'}
- Climate: ${organization.climate || 'Not specified'}  
- Mission: ${organization.mission || 'Standard'}
- Special Requirements: ${organization.specialRequirements?.join(', ') || 'None'}

Please suggest up to 3 supplement options. For each suggestion:
1. Determine the best action type (ADD, MODIFY, REPLACE, or DELETE)
2. Provide specific supplement content
3. Give a clear rationale based on the organization's context
4. Rate confidence (0-100)

Consider factors like:
- Local climate and geography
- Mission-specific requirements
- Organization size and structure
- Regulatory compliance needs
- Practical implementation challenges

Return as JSON array with this structure:
[
  {
    "action": "ADD|MODIFY|REPLACE|DELETE",
    "content": "Specific supplement text...",
    "rationale": "Clear explanation...",
    "sectionNumber": "${sectionNumber || ''}",
    "confidence": 85
  }
]`;
  }

  /**
   * Parse AI response into structured suggestions
   */
  private parseSupplementSuggestions(aiResponse: string): SupplementSuggestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions.map((s: any) => ({
          action: s.action || 'MODIFY',
          content: s.content || '',
          rationale: s.rationale || '',
          sectionNumber: s.sectionNumber,
          confidence: s.confidence || 70
        }));
      }
      
      // Fallback: create a single suggestion from the text
      return [{
        action: 'MODIFY',
        content: aiResponse,
        rationale: 'AI-generated suggestion',
        confidence: 50
      }];
    } catch (error) {
      console.error('Error parsing AI suggestions:', error);
      return [];
    }
  }

  /**
   * Generate a complete supplement document
   */
  async generateCompleteSupplementDocument(
    parentDocumentId: string,
    parentContent: string,
    organization: OrganizationContext
  ): Promise<{ title: string; content: string; sections: SupplementSuggestion[] }> {
    try {
      // First, analyze which sections need supplements
      const sectionsNeedingSupplements = await this.analyzeForSupplements(parentContent, organization);
      
      // Generate supplements for high-priority sections
      const supplements: SupplementSuggestion[] = [];
      
      for (const section of sectionsNeedingSupplements.filter(s => s.priority === 'HIGH')) {
        // Extract section content (simplified - in production, parse properly)
        const sectionRegex = new RegExp(`${section.sectionNumber}[\\s\\S]*?(?=\\d+\\.|$)`);
        const sectionMatch = parentContent.match(sectionRegex);
        
        if (sectionMatch) {
          const suggestions = await this.generateSupplementSuggestions(
            sectionMatch[0],
            'Parent Document',
            organization,
            section.sectionNumber
          );
          
          if (suggestions.length > 0) {
            supplements.push(suggestions[0]); // Take the best suggestion
          }
        }
      }

      // Generate document structure
      const title = `${organization.name} Supplement to Parent Document`;
      const content = this.formatSupplementDocument(supplements, organization);

      return { title, content, sections: supplements };
    } catch (error) {
      console.error('Error generating complete supplement document:', error);
      throw error;
    }
  }

  /**
   * Format supplements into a document
   */
  private formatSupplementDocument(supplements: SupplementSuggestion[], organization: OrganizationContext): string {
    let content = `<h1>${organization.name} Supplemental Guidance</h1>\n`;
    content += `<p><strong>Organization Type:</strong> ${organization.type}</p>\n`;
    content += `<p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>\n\n`;
    
    content += `<h2>Supplemental Sections</h2>\n`;
    
    for (const supplement of supplements) {
      const actionLabel = {
        ADD: 'Addition',
        MODIFY: 'Modification',
        REPLACE: 'Replacement',
        DELETE: 'Deletion'
      }[supplement.action];

      content += `<div class="supplement-section supplement-${supplement.action.toLowerCase()}">\n`;
      content += `<h3>Section ${supplement.sectionNumber} - ${actionLabel}</h3>\n`;
      content += `<div class="supplement-content">${supplement.content}</div>\n`;
      content += `<div class="supplement-rationale"><strong>Rationale:</strong> ${supplement.rationale}</div>\n`;
      content += `</div>\n\n`;
    }

    return content;
  }
}

export default AISupplementService;
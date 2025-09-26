import { FeedbackItem, DocumentStructureItem } from '../../types/ai-document';
import { extractParagraphsWithNumbers } from './content-parser';

/**
 * Generates OPR feedback with accurate text locations
 * @param content - The document content
 * @param feedbackCount - Number of feedback items to generate
 * @param pages - Number of pages for calculation
 * @returns Array of feedback items
 */
export function generateAIFeedback(content: string, feedbackCount: number = 10, pages: number = 5): FeedbackItem[] {
  const documentStructure = extractParagraphsWithNumbers(content, pages);

  // If we don't have enough content, return empty
  if (documentStructure.length === 0) {
    return [];
  }

  // Select random paragraphs for feedback, ensuring good distribution
  const selectedItems: DocumentStructureItem[] = [];
  const totalParagraphs = documentStructure.length;
  const step = Math.max(1, Math.floor(totalParagraphs / feedbackCount));

  for (let i = 0; i < Math.min(feedbackCount, totalParagraphs); i++) {
    const index = Math.min(i * step, totalParagraphs - 1);
    selectedItems.push(documentStructure[index]);
  }

  // Generate realistic feedback
  const feedbackTypes = ['A', 'S', 'C'];
  const components = ['Technical Review', 'Legal Review', 'Editorial Review', 'OPR Review', 'Safety Review'];
  const pocData = [
    { name: 'Col Anderson', phone: '555-0201', email: 'anderson.j@af.mil' },
    { name: 'Maj Williams', phone: '555-0202', email: 'williams.m@af.mil' },
    { name: 'Capt Davis', phone: '555-0203', email: 'davis.k@af.mil' },
    { name: 'Lt Johnson', phone: '555-0204', email: 'johnson.l@af.mil' },
    { name: 'MSgt Brown', phone: '555-0205', email: 'brown.r@af.mil' }
  ];

  const feedback = selectedItems.map((item, i) => {
    // Determine feedback type
    const rand = Math.random();
    const type = rand < 0.2 ? 'C' : rand < 0.6 ? 'S' : 'A';
    const poc = pocData[i % pocData.length];

    // Double-check: Skip if the text looks like a heading or is from excluded sections
    const excludedTerms = ['REFERENCES', 'GLOSSARY', 'ATTACHMENTS', 'DISTRIBUTION', 'ACRONYMS'];
    if (excludedTerms.some(term => item.text.toUpperCase().includes(term))) {
      return null; // Skip this item
    }

    // Skip if it's just a section heading
    if (/^\d+(\.\d+)*\s+[A-Z]/.test(item.text) && item.text.length < 100) {
      return null; // Skip this item
    }

    // Extract actual phrase from the selected paragraph
    const words = item.text.split(' ');
    const startWord = Math.floor(Math.random() * Math.max(1, words.length - 10));
    const originalPhrase = words.slice(startWord, startWord + 8).join(' ');

    // Calculate which line within the paragraph this phrase appears on
    // For Air Force documents, typical formatting is ~12-15 words per line
    const WORDS_PER_LINE = 12;
    const lineOffset = Math.floor(startWord / WORDS_PER_LINE);
    // The item.line is where the paragraph starts, add the offset for phrase position
    const actualLineNumber = item.line + lineOffset;

    // Generate improved version based on type
    let improvedPhrase = originalPhrase;
    let comment = 'Professional Air Force editorial improvement';
    let justification = '';

    if (type === 'A') {
      // Administrative - spelling, grammar, and terminology fixes
      const adminChanges = [
        { from: /personnel/g, to: 'members' },
        { from: /members/g, to: 'personnel' },
        { from: /will/g, to: 'shall' },
        { from: /should/g, to: 'must' },
        { from: /must/g, to: 'shall' },
        { from: /ensure/g, to: 'verify' },
        { from: /verify/g, to: 'ensure' },
        { from: /utilize/g, to: 'use' },
        { from: /implement/g, to: 'execute' },
        { from: /execute/g, to: 'implement' },
        { from: /provides/g, to: 'furnishes' },
        { from: /comprehensive/g, to: 'complete' },
        { from: /complete/g, to: 'comprehensive' },
        { from: /requirements/g, to: 'criteria' },
        { from: /criteria/g, to: 'requirements' }
      ];

      improvedPhrase = originalPhrase;
      // Apply 2-3 random changes to make it different
      const selectedChanges = adminChanges.sort(() => 0.5 - Math.random()).slice(0, 3);
      let changesMade = false;

      for (const change of selectedChanges) {
        if (originalPhrase.match(change.from)) {
          improvedPhrase = improvedPhrase.replace(change.from, change.to);
          changesMade = true;
        }
      }

      // If no changes were made, rephrase the entire thing
      if (!changesMade || improvedPhrase === originalPhrase) {
        const wordCount = originalPhrase.split(' ').length;
        if (wordCount > 5) {
          // Rephrase by rearranging or substituting
          improvedPhrase = originalPhrase
            .replace(/^The /, 'This ')
            .replace(/^This /, 'The ')
            .replace(/ is /g, ' remains ')
            .replace(/ are /g, ' remain ')
            .replace(/ has /g, ' maintains ')
            .replace(/ have /g, ' maintain ');

          // If still the same, add "shall" or "must" at the beginning
          if (improvedPhrase === originalPhrase) {
            improvedPhrase = 'Personnel shall ' + originalPhrase.charAt(0).toLowerCase() + originalPhrase.slice(1);
          }
        }
      }

      comment = 'Standardize terminology and correct administrative errors';
      justification = 'Administrative correction for consistency with AFI style guide';

    } else if (type === 'S') {
      // Substantive - significant rephrasing for clarity
      const words = originalPhrase.split(' ');

      if (words.length > 6) {
        // Rephrase longer sentences more substantially
        const rephrasings = [
          () => {
            // Active to passive voice or vice versa
            if (originalPhrase.includes(' provides ')) {
              improvedPhrase = originalPhrase.replace(/(\w+) provides/, 'provision is made by $1 for');
            } else if (originalPhrase.includes(' implements ')) {
              improvedPhrase = originalPhrase.replace(/(\w+) implements/, 'implementation is conducted by $1 for');
            } else if (originalPhrase.includes(' ensures ')) {
              improvedPhrase = originalPhrase.replace(/(\w+) ensures/, 'assurance is provided by $1 that');
            } else {
              // Generic rephrasing
              improvedPhrase = `To ${originalPhrase.toLowerCase().replace(/^the |^this |^a /, '')}`;
            }
          },
          () => {
            // Restructure sentence
            const midPoint = Math.floor(words.length / 2);
            const firstHalf = words.slice(0, midPoint).join(' ');
            const secondHalf = words.slice(midPoint).join(' ');
            improvedPhrase = `${secondHalf}, thereby ${firstHalf}`;
          },
          () => {
            // Add clarifying language
            improvedPhrase = `Specifically, ${originalPhrase.toLowerCase()}, which enhances operational effectiveness`;
          },
          () => {
            // Simplify complex phrases
            improvedPhrase = originalPhrase
              .replace(/in accordance with/g, 'per')
              .replace(/in order to/g, 'to')
              .replace(/at this time/g, 'now')
              .replace(/due to the fact that/g, 'because')
              .replace(/in the event that/g, 'if')
              .replace(/is able to/g, 'can')
              .replace(/is required to/g, 'must');
          }
        ];

        // Pick a random rephrasing strategy
        const strategy = rephrasings[Math.floor(Math.random() * rephrasings.length)];
        strategy();

        // Ensure we actually changed something
        if (improvedPhrase === originalPhrase) {
          improvedPhrase = `For clarity, ${originalPhrase.toLowerCase()}`;
        }
      } else {
        // For shorter phrases, make word substitutions
        improvedPhrase = originalPhrase
          .replace(/manages/g, 'oversees')
          .replace(/oversees/g, 'supervises')
          .replace(/provides/g, 'delivers')
          .replace(/ensures/g, 'guarantees')
          .replace(/system/g, 'framework')
          .replace(/framework/g, 'system');
      }

      comment = 'Improve clarity and directness of language';
      justification = 'Substantive improvement to enhance readability and comprehension';

    } else {
      // Critical - add missing required elements
      const criticalAdditions = [
        'in accordance with DoD Directive 5000.01',
        'per AFI 33-360 requirements',
        'as mandated by AFPD 10-6',
        'following NIST 800-53 controls',
        'compliant with FISMA standards'
      ];

      const addition = criticalAdditions[Math.floor(Math.random() * criticalAdditions.length)];
      improvedPhrase = `${originalPhrase} ${addition}`;
      comment = 'Add required compliance reference';
      justification = 'Critical: Missing mandatory regulatory citation required for publication';
    }

    return {
      id: `opr_${Date.now()}_${i}`,
      component: components[i % components.length],
      pocName: poc.name,
      pocPhone: poc.phone,
      pocEmail: poc.email,
      commentType: type as 'A' | 'S' | 'C',
      page: String(item.page),  // ACTUAL page where text appears
      paragraphNumber: item.paragraphNumber,  // ACTUAL paragraph number
      lineNumber: String(actualLineNumber),  // ACTUAL line number where the phrase appears
      coordinatorComment: comment,
      changeFrom: originalPhrase,
      changeTo: improvedPhrase,
      coordinatorJustification: justification,
      resolution: '',
      originatorJustification: '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }).filter(item => item !== null) as FeedbackItem[]; // Remove any null items that were skipped

  return feedback;
}
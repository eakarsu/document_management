import { NextRequest, NextResponse } from 'next/server';
import { authTokenService } from '../../../../lib/authTokenService';

// Function to add paragraph numbering to HTML content
function addParagraphNumbering(htmlContent: string) {
  const parser = require('node-html-parser');
  const root = parser.parse(htmlContent);
  
  let sectionCounter = 0;
  let subsectionCounter = 0;
  let currentSection = 0;
  let currentSubsection = 0;
  let paragraphCounter = 0;
  let currentLevel = 0;
  
  // Process headers to establish section structure
  const headers = root.querySelectorAll('h1, h2, h3, h4');
  headers.forEach((header: any) => {
    const level = parseInt(header.tagName.charAt(1));
    const existingNumber = header.textContent?.match(/^([\d]+\.[\d]+\.?[\d]*|[\d]+\.?)\s+/);
    
    if (level === 1 || level === 2) {
      if (existingNumber) {
        const parts = existingNumber[1].split('.');
        if (parts.length >= 2) {
          currentSection = parseInt(parts[0]) || currentSection;
          currentSubsection = parseInt(parts[1]) || 0;
          subsectionCounter = Math.max(subsectionCounter, currentSubsection);
        } else {
          currentSection = parseInt(parts[0]) || 1;
          currentSubsection = 0;
        }
      }
      paragraphCounter = 0;
      currentLevel = level;
    }
  });
  
  // Add paragraph numbers to all p elements
  const allElements = root.querySelectorAll('p, h1, h2, h3, h4');
  
  allElements.forEach((elem: any) => {
    if (elem.tagName.match(/^H[1-4]$/)) {
      const level = parseInt(elem.tagName.charAt(1));
      const existingNumber = elem.textContent?.match(/^([\d]+\.[\d]+\.?[\d]*|[\d]+\.?)\s+/);
      
      if (existingNumber) {
        const parts = existingNumber[1].split('.');
        if (level === 1) {
          currentSection = parseInt(parts[0]) || 1;
          currentSubsection = 0;
          currentLevel = 1;
        } else if (level === 2 && parts.length >= 2) {
          currentSection = parseInt(parts[0]) || currentSection;
          currentSubsection = parseInt(parts[1]) || 0;
          currentLevel = 2;
        }
        paragraphCounter = 0;
      }
    } else if (elem.tagName === 'P') {
      // Skip if already has numbering or is in special containers
      if (!elem.getAttribute('data-paragraph')) {
        paragraphCounter++;
        
        let paraNum = '';
        if (currentLevel === 2 && currentSubsection > 0) {
          paraNum = `${currentSection}.${currentSubsection}.${paragraphCounter}`;
        } else if (currentLevel === 1 && currentSection > 0) {
          paraNum = `${currentSection}.${paragraphCounter}`;
        } else {
          paraNum = `0.${paragraphCounter}`;
        }
        
        elem.setAttribute('data-paragraph', paraNum);
      }
    }
  });
  
  return root.toString();
}

// Function to extract text at specific paragraph/line location
function extractTextAtLocation(htmlContent: string, paragraphNum?: string, lineNum?: string) {
  // Create a temporary div to parse HTML
  if (typeof window === 'undefined') {
    // Server-side: use regex to extract
    const parser = require('node-html-parser');
    
    // First, add paragraph numbering if not already present
    const numberedHtml = addParagraphNumbering(htmlContent);
    const root = parser.parse(numberedHtml);
    
    // Find all paragraphs with data-paragraph attribute
    const paragraphs = root.querySelectorAll('[data-paragraph]');
    
    for (const para of paragraphs) {
      if (para.getAttribute('data-paragraph') === paragraphNum) {
        // Found the target paragraph
        const context = {
          targetText: para.innerText || para.textContent,
          paragraphHtml: para.outerHTML,
          beforeText: '',
          afterText: ''
        };
        
        // Get previous and next paragraphs for context
        const prev = para.previousElementSibling;
        const next = para.nextElementSibling;
        
        if (prev && prev.getAttribute('data-paragraph')) {
          context.beforeText = prev.innerText || prev.textContent;
        }
        if (next && next.getAttribute('data-paragraph')) {
          context.afterText = next.innerText || next.textContent;
        }
        
        return context;
      }
    }
    
    // If specific paragraph not found, try to extract by line number
    if (lineNum) {
      const lines = root.querySelectorAll('[data-line-start]');
      for (const line of lines) {
        const lineStart = parseInt(line.getAttribute('data-line-start') || '0');
        const lineEnd = parseInt(line.getAttribute('data-line-end') || '0');
        const targetLine = parseInt(lineNum.split('-')[0]); // Handle ranges like "45-47"
        
        if (targetLine >= lineStart && targetLine <= lineEnd) {
          return {
            targetText: line.innerText || line.textContent,
            paragraphHtml: line.outerHTML,
            beforeText: '',
            afterText: ''
          };
        }
      }
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { documentContent, feedback, mode } = await request.json();
    
    if (!documentContent || !feedback) {
      return NextResponse.json(
        { error: 'Document content and feedback are required' },
        { status: 400 }
      );
    }

    if (mode === 'ai' || mode === 'hybrid') {
      // Extract the relevant text based on paragraph/line numbers
      const locationContext = extractTextAtLocation(
        documentContent, 
        feedback.paragraphNumber,
        feedback.lineNumber
      );
      
      // Build a focused prompt with just the relevant text
      let textToSend = '';
      let contextInfo = '';
      
      if (locationContext) {
        textToSend = locationContext.targetText;
        contextInfo = `
          Text at Paragraph ${feedback.paragraphNumber || 'N/A'}, Line ${feedback.lineNumber || 'N/A'}:
          "${textToSend}"
          
          ${locationContext.beforeText ? `Previous context: "${locationContext.beforeText}"` : ''}
          ${locationContext.afterText ? `Following context: "${locationContext.afterText}"` : ''}
        `;
      } else {
        // Fallback: try to find the text using "changeFrom" if provided
        if (feedback.changeFrom) {
          const changeFromIndex = documentContent.indexOf(feedback.changeFrom);
          if (changeFromIndex !== -1) {
            // Extract context around the changeFrom text (300 chars before and after)
            const startIdx = Math.max(0, changeFromIndex - 300);
            const endIdx = Math.min(documentContent.length, changeFromIndex + feedback.changeFrom.length + 300);
            textToSend = documentContent.substring(startIdx, endIdx);
            contextInfo = `Text containing the change: "${textToSend}"`;
          }
        }
      }
      
      // If we still don't have text, use a reasonable excerpt
      if (!textToSend) {
        console.warn('Could not locate specific text, using excerpt');
        textToSend = documentContent.substring(0, 1000);
        contextInfo = 'Could not locate specific paragraph/line. Using document excerpt.';
      }
      
      // AI-assisted merge using OpenRouter
      const prompt = `
        You are helping merge feedback into a specific part of a document.
        
        ${contextInfo}
        
        Feedback to apply:
        - Type: ${feedback.commentType}
        - Comment: ${feedback.coordinatorComment}
        - Change From: ${feedback.changeFrom || 'N/A'}
        - Change To: ${feedback.changeTo || 'N/A'}
        - Justification: ${feedback.coordinatorJustification || 'N/A'}
        
        Instructions:
        1. Apply the feedback to modify the text
        2. If "Change From" and "Change To" are provided, replace the exact text
        3. Return ONLY the modified version of the text
        4. Preserve the original formatting and structure
        5. ${mode === 'hybrid' ? 'Mark changes with [CHANGED: old -> new]' : 'Apply changes directly without markers'}
        
        Return ONLY the modified text, nothing else.
      `;

      try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Document Management System'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              {
                role: 'system',
                content: 'You are an expert document editor helping to merge feedback into official documents.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 4000
          })
        });

        if (!openRouterResponse.ok) {
          throw new Error('Failed to get AI response');
        }

        const aiData = await openRouterResponse.json();
        const modifiedText = aiData.choices[0]?.message?.content || '';
        
        // Now replace the specific text in the document
        let mergedContent = documentContent;
        
        if (modifiedText && locationContext) {
          // Replace the specific paragraph in the document
          if (locationContext.paragraphHtml) {
            // Create modified paragraph with same attributes but new text
            const modifiedParagraph = locationContext.paragraphHtml.replace(
              locationContext.targetText,
              modifiedText
            );
            mergedContent = documentContent.replace(
              locationContext.paragraphHtml,
              modifiedParagraph
            );
          }
        } else if (modifiedText && feedback.changeFrom) {
          // Fallback: direct replacement
          mergedContent = documentContent.replace(feedback.changeFrom, modifiedText);
        } else {
          // Last resort: append the change as a comment
          mergedContent = documentContent + `\n<!-- Feedback applied: ${modifiedText} -->`;
        }

        return NextResponse.json({
          mergedContent: mode === 'ai' ? mergedContent : undefined,
          suggestedContent: mode === 'hybrid' ? mergedContent : undefined,
          appliedText: modifiedText,
          location: feedback.paragraphNumber || feedback.lineNumber,
          mode,
          success: true
        });

      } catch (aiError) {
        console.error('AI merge error:', aiError);
        // Fallback to manual merge
        return NextResponse.json({
          mergedContent: documentContent,
          error: 'AI merge failed, falling back to manual',
          mode: 'manual',
          success: false
        });
      }

    } else {
      // Manual merge
      let mergedContent = documentContent;
      
      if (feedback.changeFrom && feedback.changeTo) {
        // Simple text replacement
        mergedContent = documentContent.replace(feedback.changeFrom, feedback.changeTo);
      }
      
      return NextResponse.json({
        mergedContent,
        mode: 'manual',
        success: true
      });
    }

  } catch (error) {
    console.error('Merge API error:', error);
    return NextResponse.json(
      { error: 'Failed to process merge request' },
      { status: 500 }
    );
  }
}
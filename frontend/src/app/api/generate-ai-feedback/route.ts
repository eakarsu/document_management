import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, documentContent, documentType } = body;

    // If documentContent is not provided, fetch it from the document
    let content = documentContent;

    if (!content && documentId) {
      // Fetch document content from database
      const docResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documents/${documentId}`, {
        headers: request.headers
      });

      if (docResponse.ok) {
        const doc = await docResponse.json();
        content = doc.content || doc.customFields?.content || '';
      }
    }

    // Clean the HTML content to get plain text for analysis
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Generate AI feedback using OpenRouter
    const feedback = await generateAIFeedbackWithOpenRouter(textContent, documentType);

    return NextResponse.json({
      success: true,
      feedback,
      totalItems: feedback.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI feedback' },
      { status: 500 }
    );
  }
}

async function generateAIFeedbackWithOpenRouter(content: string, documentType: string): Promise<any[]> {
  const prompt = `You are an expert document reviewer analyzing an ${documentType || 'official'} document.

  Please analyze the following document content and provide detailed feedback in JSON format.

  Document Content:
  ${content.substring(0, 8000)} ${content.length > 8000 ? '... [truncated]' : ''}

  Provide feedback in the following categories:
  1. CRITICAL - Major issues that must be fixed (missing metrics, vague statements, critical errors)
  2. MAJOR - Important improvements needed (leadership examples, specific achievements)
  3. SUBSTANTIVE - Significant enhancements (better examples, more detail)
  4. ADMINISTRATIVE - Format and grammar issues

  For each feedback item, include:
  - comment: Clear description of the issue
  - severity: CRITICAL, MAJOR, SUBSTANTIVE, or ADMINISTRATIVE
  - category: Type of issue (Performance Metrics, Leadership, Communication, Format, etc.)
  - originalText: The problematic text from the document (max 100 chars)
  - suggestedText: Your suggested improvement
  - page: Estimated page number (1-5)
  - paragraph: The paragraph number in hierarchical format (e.g., "1.1", "1.2", "2.1", "2.3.1")
  - line: Estimated line number within the paragraph (1-20)

  Focus on:
  - Quantifiable metrics and achievements
  - Specific examples instead of vague statements
  - Leadership and team accomplishments
  - Professional development activities
  - Communication and presentation skills
  - Resource management
  - Innovation and improvements
  - Proper formatting and grammar

  Return ONLY a JSON array of feedback objects. No other text.`;

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
            content: 'You are an expert document reviewer specializing in military performance reports and official documents. Always return valid JSON arrays.'
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
      console.error('OpenRouter API error:', await openRouterResponse.text());
      throw new Error('Failed to get AI response');
    }

    const aiData = await openRouterResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content || '[]';

    // Parse the AI response - it should be a JSON array
    let feedback = [];
    try {
      // Extract JSON array from the response (in case AI adds extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        feedback = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to some default feedback
      feedback = generateFallbackFeedback(content);
    }

    // Ensure each feedback item has required fields
    feedback = feedback.map((item: any, index: number) => ({
      id: `ai_${Date.now()}_${index}`,
      comment: item.comment || 'Needs improvement',
      severity: item.severity || 'SUBSTANTIVE',
      category: item.category || 'General',
      originalText: item.originalText || '',
      suggestedText: item.suggestedText || '',
      page: item.page || 1,
      paragraph: item.paragraph || '1.1',  // Default to hierarchical format
      line: item.line || 1
    }));

    return feedback;

  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    // Return fallback feedback if AI fails
    return generateFallbackFeedback(content);
  }
}

function generateFallbackFeedback(content: string): any[] {
  const feedback = [];
  const textContent = content.substring(0, 1000);

  // Check for missing metrics
  if (!textContent.match(/\d+%/) && !textContent.match(/\$[\d,]+/)) {
    feedback.push({
      comment: "Document lacks quantifiable achievements. Include percentages, dollar amounts, time savings, or other metrics.",
      severity: 'CRITICAL',
      category: 'Performance Metrics',
      originalText: textContent.substring(0, 50),
      suggestedText: "Add specific metrics: improved by X%, saved $Y, reduced time by Z days",
      page: 1,
      paragraph: '1.1',
      line: 1
    });
  }

  // Check for vague terms
  const vagueTerms = ['good', 'excellent', 'effective', 'successful'];
  for (const term of vagueTerms) {
    if (textContent.toLowerCase().includes(term)) {
      feedback.push({
        comment: `Replace vague term "${term}" with specific achievements and metrics.`,
        severity: 'MAJOR',
        category: 'Clarity',
        originalText: term,
        suggestedText: `${term} [specify how/why with metrics]`,
        page: 1,
        paragraph: '1.2',
        line: 5
      });
      break;
    }
  }

  // Check for leadership examples
  if (!textContent.toLowerCase().includes('led') && !textContent.toLowerCase().includes('managed')) {
    feedback.push({
      comment: "Add specific leadership examples showing team management and mentoring.",
      severity: 'MAJOR',
      category: 'Leadership',
      originalText: '',
      suggestedText: "Led X-person team, Mentored Y subordinates, Managed Z operations",
      page: 1,
      paragraph: '2.1',
      line: 1
    });
  }

  return feedback;
}
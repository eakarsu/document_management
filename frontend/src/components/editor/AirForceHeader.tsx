import React from 'react';
import { Box, Paper } from '@mui/material';

interface AirForceHeaderProps {
  headerHtml?: string;
  documentStyles?: string;
  title?: string;
  organization?: string;
  classification?: string;
}

const AirForceHeader: React.FC<AirForceHeaderProps> = ({ headerHtml, documentStyles }) => {
  // Extract document information from the HTML if available
  const documentInfo = React.useMemo(() => {
    // Parse the HTML to extract actual values if available
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = headerHtml || '';
    const textContent = tempDiv.textContent || '';

    // Check for UNCLASSIFIED markers
    const hasUnclassified = textContent.includes('UNCLASSIFIED') || !headerHtml;

    if (!headerHtml || textContent.length < 50) {
      // Default values if no HTML provided or minimal content
      return {
        classification: 'UNCLASSIFIED',
        instruction: 'BY ORDER OF THE\nSECRETARY OF THE AIR FORCE',
        department: 'DEPARTMENT OF THE AIR FORCE\nAIR FORCE INSTRUCTION 36-2618',
        date: 'SEPTEMBER 15, 2025',
        title: 'The Enlisted Force Structure',
        subtitle: 'COMPLIANCE WITH THIS PUBLICATION IS MANDATORY',
        distribution: 'DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited',
        accessibility: 'Publications and forms are available on the e-Publishing website at\nhttps://www.e-publishing.af.mil',
        releasability: 'There are no releasability restrictions on this publication.',
        effectiveDate: 'SEPTEMBER 15, 2025',
        poc: 'Lt Col Smith, John A.\nDSN: 555-1234, Commercial: (703) 555-1234\nEmail: john.a.smith@us.af.mil',
        opr: 'SAF/IG',
        certifiedBy: 'AF/CV\n(General Larry O. Spencer)',
        pages: '5'
      };
    }

    // If we have content, extract patterns

    // Extract AFI number
    const afiMatch = textContent.match(/AIR FORCE INSTRUCTION\s+([\d-]+)/i);
    const instruction = afiMatch ? `AIR FORCE INSTRUCTION ${afiMatch[1]}` : 'AIR FORCE INSTRUCTION 36-2618';

    // Extract date
    const dateMatch = textContent.match(/(?:SEPTEMBER|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2},?\s+\d{4}/i);
    const date = dateMatch ? dateMatch[0] : 'SEPTEMBER 15, 2025';

    // Extract title - be more specific to avoid pulling in document content
    let title = 'The Enlisted Force Structure';
    let subtitle = 'AIRMAN AND FAMILY READINESS';

    // Look for title between date and COMPLIANCE, but limit to reasonable length
    const titleMatch = textContent.match(/\d{4}\s+([^]{0,200}?)(?:COMPLIANCE|DISTRIBUTION|ACCESSIBILITY)/);
    if (titleMatch) {
      const titleArea = titleMatch[1].trim();
      // Only use first 1-2 lines as title, not document content
      const lines = titleArea.split('\n').filter(l => l.trim() && l.length < 100);
      if (lines.length > 0 && !lines[0].includes('.01') && !lines[0].includes('DoD')) {
        title = lines[0].trim();
      }
      if (lines.length > 1 && !lines[1].includes('.01') && !lines[1].includes('DoD')) {
        subtitle = lines[1].trim();
      }
    }

    // Extract POC info
    const pocMatch = textContent.match(/POC:[\s]*([^\\n]+?)(?:DSN|$)/i);
    const dsnMatch = textContent.match(/DSN:\s*([\d-]+)/i);
    const commercialMatch = textContent.match(/Commercial:\s*\(([\d\s)-]+)\)/i);
    const emailMatch = textContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

    return {
      classification: 'UNCLASSIFIED',
      instruction: 'BY ORDER OF THE\nSECRETARY OF THE AIR FORCE',
      department: `DEPARTMENT OF THE AIR FORCE\n${instruction}`,
      date,
      title,
      subtitle,
      distribution: 'DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited',
      accessibility: 'Publications and forms are available on the e-Publishing website at\nhttps://www.e-publishing.af.mil',
      releasability: 'There are no releasability restrictions on this publication.',
      effectiveDate: date,
      poc: pocMatch ? `${pocMatch[1].trim()}\nDSN: ${dsnMatch ? dsnMatch[1] : '555-1234'}, Commercial: ${commercialMatch ? commercialMatch[1] : '(703) 555-1234'}\nEmail: ${emailMatch ? emailMatch[0] : 'john.a.smith@us.af.mil'}` : 'Lt Col Smith, John A.\nDSN: 555-1234, Commercial: (703) 555-1234\nEmail: john.a.smith@us.af.mil',
      opr: 'SAF/IG',
      certifiedBy: 'AF/CV\n(General Larry O. Spencer)',
      pages: textContent.match(/Pages:\s*(\d+)/) ? textContent.match(/Pages:\s*(\d+)/)[1] : '5'
    };
  }, [headerHtml]);

  // Process the HTML to ensure styles are applied
  const processedHtml = React.useMemo(() => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = headerHtml;

    // Process all div elements to ensure styles are applied
    const allDivs = tempDiv.querySelectorAll('div');
    allDivs.forEach(div => {
      const style = div.getAttribute('style');
      if (style) {
        // Parse and reapply styles more forcefully
        if (style.includes('text-align: center')) {
          div.style.textAlign = 'center';
        }
        if (style.includes('font-weight: bold')) {
          div.style.fontWeight = 'bold';
        }
        if (style.includes('text-decoration: underline')) {
          div.style.textDecoration = 'underline';
        }
        if (style.includes('font-size: 20px')) {
          div.style.fontSize = '20px';
        }
        if (style.includes('font-size: 18px')) {
          div.style.fontSize = '18px';
        }
        if (style.includes('font-size: 12px')) {
          div.style.fontSize = '12px';
        }
        if (style.includes('font-size: 11px')) {
          div.style.fontSize = '11px';
        }
        if (style.includes('border: 2px solid black')) {
          div.style.border = '2px solid black';
          div.style.padding = '10px';
          div.style.margin = '20px auto';
          div.style.width = '80%';
        }
        if (style.includes('border-bottom: 2px solid black')) {
          div.style.borderBottom = '2px solid black';
          div.style.width = '60%';
          div.style.margin = '20px auto';
        }
      }
    });

    return tempDiv.innerHTML;
  }, [headerHtml]);

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: 'white',
        marginBottom: 3,
        padding: 3,
        fontFamily: "'Times New Roman', serif",
        '& *': {
          fontFamily: "'Times New Roman', serif",
        }
      }}
    >
      {/* Global styles for this component */}
      <style jsx global>{`
        .af-header-wrapper {
          font-family: 'Times New Roman', serif;
        }

        .af-header-wrapper div[style*="text-align: center"] {
          text-align: center !important;
          width: 100%;
        }

        .af-header-wrapper div[style*="font-weight: bold"] {
          font-weight: bold !important;
        }

        .af-header-wrapper div[style*="text-decoration: underline"] {
          text-decoration: underline !important;
        }

        .af-header-wrapper div[style*="font-size: 20px"] {
          font-size: 20px !important;
          font-weight: bold !important;
        }

        .af-header-wrapper div[style*="font-size: 18px"] {
          font-size: 18px !important;
          font-weight: bold !important;
        }

        .af-header-wrapper div[style*="font-size: 12px"] {
          font-size: 12px !important;
        }

        .af-header-wrapper div[style*="font-size: 11px"] {
          font-size: 11px !important;
        }

        .af-header-wrapper div[style*="border: 2px solid black"] {
          border: 2px solid black !important;
          padding: 10px !important;
          margin: 20px auto !important;
          width: 80% !important;
          text-align: center !important;
          font-weight: bold !important;
        }

        .af-header-wrapper div[style*="border-bottom: 2px solid black"] {
          border-bottom: 2px solid black !important;
          width: 60% !important;
          margin: 20px auto !important;
        }

        .af-header-wrapper img {
          max-width: 150px !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }

        .af-header-wrapper strong {
          font-weight: bold !important;
        }

        /* TABLE OF CONTENTS STYLES */
        .af-header-wrapper h2:contains("TABLE OF CONTENTS"),
        .af-header-wrapper div:contains("TABLE OF CONTENTS") {
          text-align: center !important;
          font-weight: bold !important;
          font-size: 18px !important;
          margin: 20px 0 !important;
        }

        /* Style each TOC entry */
        .af-header-wrapper .toc-entry {
          display: flex !important;
          justify-content: space-between !important;
          align-items: baseline !important;
          margin: 8px 0 !important;
          font-family: 'Times New Roman', serif !important;
        }

        /* For entries that look like "1. Introduction to Air Force Technical Standards 1" */
        .af-header-wrapper p,
        .af-header-wrapper div {
          position: relative;
        }

        /* Apply to any line that starts with a number */
        .af-header-wrapper p:matches(^[0-9]),
        .af-header-wrapper div:matches(^[0-9]) {
          display: flex !important;
          justify-content: space-between !important;
        }
      `}</style>

      {/* Air Force Header - Proper Format */}
      <Box sx={{
        fontFamily: "'Times New Roman', serif",
        fontSize: '12pt',
        lineHeight: 1.5,
        padding: '0.5in'
      }}>
        {/* UNCLASSIFIED Header */}
        <Box sx={{
          border: '2px solid black',
          padding: '4px',
          textAlign: 'center',
          fontWeight: 'bold',
          mb: 4
        }}>
          UNCLASSIFIED
        </Box>

        {/* Three Column Layout */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          {/* Left Column */}
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Box sx={{ fontWeight: 'bold', mb: 1 }}>BY ORDER OF THE</Box>
            <Box sx={{ fontWeight: 'bold' }}>SECRETARY OF THE AIR FORCE</Box>
          </Box>

          {/* Center - Air Force Seal */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <img
              src="/images/air-force-seal.png"
              alt="Department of the Air Force Seal"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain'
              }}
            />
          </Box>

          {/* Right Column */}
          <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
            <Box sx={{ fontStyle: 'italic', fontWeight: 'bold', mb: 1 }}>DEPARTMENT OF THE AIR FORCE</Box>
            <Box sx={{ fontStyle: 'italic', mb: 2 }}>AIR FORCE INSTRUCTION 36-2618</Box>
            <Box sx={{ mt: 3, fontWeight: 'normal' }}>
              SEPTEMBER 15, 2025
            </Box>
            <Box sx={{ mt: 3, fontStyle: 'italic' }}>
              The Enlisted Force Structure
            </Box>
            <Box sx={{ mt: 1, fontStyle: 'italic' }}>
              AIRMAN AND FAMILY READINESS
            </Box>
            <Box sx={{ mt: 1, fontSize: '10pt' }}>
              Version 1.0
            </Box>
          </Box>
        </Box>

        {/* COMPLIANCE Box */}
        <Box sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          borderTop: '2px solid black',
          borderBottom: '2px solid black',
          py: 1,
          my: 3
        }}>
          COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
        </Box>

        {/* Metadata Table */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid black', pb: 1, mb: 1 }}>
            <Box sx={{ width: '150px', fontWeight: 'bold' }}>DISTRIBUTION:</Box>
            <Box sx={{ flex: 1 }}>{documentInfo.distribution}</Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid black', pb: 1, mb: 1 }}>
            <Box sx={{ width: '150px', fontWeight: 'bold' }}>ACCESSIBILITY:</Box>
            <Box sx={{ flex: 1 }}>{documentInfo.accessibility}</Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid black', pb: 1, mb: 1 }}>
            <Box sx={{ width: '150px', fontWeight: 'bold' }}>RELEASABILITY:</Box>
            <Box sx={{ flex: 1 }}>{documentInfo.releasability}</Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid black', pb: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', width: '50%' }}>
              <Box sx={{ width: '150px', fontWeight: 'bold' }}>EFFECTIVE DATE:</Box>
              <Box>{documentInfo.effectiveDate}</Box>
            </Box>
            <Box sx={{ display: 'flex', width: '50%' }}>
              <Box sx={{ width: '150px', fontWeight: 'bold' }}>REVIEW DATE:</Box>
              <Box>{documentInfo.effectiveDate?.replace('2025', '2026')}</Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid black', pb: 1, mb: 1 }}>
            <Box sx={{ width: '150px', fontWeight: 'bold' }}>POC:</Box>
            <Box sx={{ flex: 1 }}>
              {documentInfo.poc?.split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '2px solid black', pb: 1, mb: 2 }}>
            <Box sx={{ width: '150px', fontWeight: 'bold' }}>OPR:</Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Box>{documentInfo.opr}</Box>
              <Box sx={{ textAlign: 'right' }}>
                Certified by: {documentInfo.certifiedBy?.split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
                <br />
                Pages: {documentInfo.pages}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom UNCLASSIFIED */}
        <Box sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          mt: 4
        }}>
          UNCLASSIFIED
        </Box>
      </Box>

      {/* Original HTML content (hidden for now, can be toggled) */}
      <Box
        className="af-header-wrapper"
        sx={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {/* Table of Contents Section - Only if present in content */}
      {headerHtml && headerHtml.includes('TABLE OF CONTENTS') && (
        <Box sx={{ mt: 4, fontFamily: "'Times New Roman', serif" }}>
          <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', mb: 3 }}>
            TABLE OF CONTENTS
          </Box>

        {/* Sample TOC entries with proper formatting */}
        <Box sx={{ maxWidth: '600px', margin: '0 auto' }}>
          {[
            { number: '1.', title: 'Introduction to Air Force Technical Standards', page: '1' },
            { number: '1.1', title: 'Structure of Air Force Technical Manuals', page: '2' },
            { number: '1.1.1', title: 'Components of a Technical Manual', page: '2' },
            { number: '1.1.1.1', title: 'Procedural Sections', page: '2' },
            { number: '1.1.1.1.1', title: 'Compliance and Safety', page: '3' },
            { number: '1.2', title: 'Technical Specifications and Requirements', page: '3' },
            { number: '1.2.1', title: 'Equipment Testing and Validation', page: '4' },
            { number: '1.2.1.1', title: 'Performance Standards', page: '4' },
            { number: '1.2.1.1.1', title: 'Environmental Testing', page: '4' },
            { number: '1.3', title: 'Maintenance and Operational Procedures', page: '5' },
          ].map((entry, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                mb: 0.5,
                ml: entry.number.split('.').length > 2 ? `${(entry.number.split('.').length - 2) * 20}px` : 0
              }}
            >
              <Box sx={{ display: 'flex', flex: 1 }}>
                <Box sx={{ minWidth: '50px' }}>{entry.number}</Box>
                <Box sx={{ flex: 1, position: 'relative', mx: 1 }}>
                  <Box>{entry.title}</Box>
                  <Box sx={{
                    position: 'absolute',
                    bottom: '3px',
                    left: 0,
                    right: 0,
                    borderBottom: '1px dotted #333',
                    zIndex: 0
                  }} />
                </Box>
              </Box>
              <Box sx={{ minWidth: '30px', textAlign: 'right', backgroundColor: 'white', pl: 1, position: 'relative', zIndex: 1 }}>
                {entry.page}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      )}
    </Paper>
  );
};

export default AirForceHeader;
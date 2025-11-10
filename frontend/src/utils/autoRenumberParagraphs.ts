/**
 * Auto-renumber all paragraphs in HTML content
 * This function finds all paragraphs with numbering (e.g., 1.1.1, 1.1.2, etc.)
 * and renumbers them sequentially within their prefix groups
 */
export const autoRenumberParagraphs = (content: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  const allElements = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p'));

  interface ParagraphInfo {
    element: HTMLParagraphElement;
    position: number;
    prefix: string;
    oldNumber: string;
  }

  const paragraphGroups = new Map<string, ParagraphInfo[]>();

  allElements.forEach((elem, position) => {
    if (elem.tagName === 'P') {
      const p = elem as HTMLParagraphElement;
      let num = '';
      const pText = p.textContent || '';

      const strong = p.querySelector('strong');
      if (strong) {
        num = (strong.textContent || '').trim(); // Trim to remove trailing spaces
      } else {
        const textMatch = pText.match(/^(\d+(?:\.\d+){2,})\.?\s/);
        if (textMatch) {
          num = textMatch[1] + '.';
        }
      }

      if (num) {
        const match = num.match(/^(\d+(?:\.\d+)+)\.?$/);
        if (match) {
          const fullNumber = match[1];
          const parts = fullNumber.split('.');

          if (parts.length >= 3 && parts.every(part => /^\d+$/.test(part))) {
            const prefix = parts.slice(0, -1).join('.');

            if (!paragraphGroups.has(prefix)) {
              paragraphGroups.set(prefix, []);
            }

            paragraphGroups.get(prefix)!.push({
              element: p,
              position: position,
              prefix: prefix,
              oldNumber: num
            });
          }
        }
      }
    }
  });

  paragraphGroups.forEach((paragraphs, prefix) => {
    paragraphs.sort((a, b) => a.position - b.position);

    paragraphs.forEach((info, idx) => {
      const p = info.element;
      const newNum = `${prefix}.${idx + 1}`;
      const textWithoutNumber = p.textContent?.replace(/^[\d.]+\s*/, '').trim() || '';
      const existingStyle = p.getAttribute('style') || '';

      p.innerHTML = `<strong>${newNum}</strong> ${textWithoutNumber}`;

      if (existingStyle) {
        p.setAttribute('style', existingStyle);
      }
    });
  });

  return tempDiv.innerHTML;
};

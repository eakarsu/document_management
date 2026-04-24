import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  FormatListNumbered,
  FormatListBulleted,
  LooksOne,
  LooksTwo,
  Looks3,
  Looks4,
  Looks5,
  Looks6,
  Title,
  Subject,
  FormatIndentIncrease,
  FormatIndentDecrease,
  TableChart,
  AddBox,
  LibraryAdd
} from '@mui/icons-material';

interface DocumentStructureToolbarProps {
  editor: any; // TipTap editor instance
}

export const DocumentStructureToolbar: React.FC<DocumentStructureToolbarProps> = ({ editor }) => {
  const [sectionDialog, setSectionDialog] = useState(false);
  const [sectionLevel, setSectionLevel] = useState(1);
  const [sectionNumber, setSectionNumber] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [paragraphDialog, setParagraphDialog] = useState(false);
  const [paragraphNumber, setParagraphNumber] = useState('');
  const [paragraphText, setParagraphText] = useState('');
  const [subParagraphDialog, setSubParagraphDialog] = useState(false);
  const [subParagraphType, setSubParagraphType] = useState<'letter' | 'number' | 'roman'>('letter');
  const [subParagraphMarker, setSubParagraphMarker] = useState('');
  const [subParagraphText, setSubParagraphText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!editor) {
    return null;
  }

  // Insert numbered section
  const insertNumberedSection = (level: number) => {
    setSectionLevel(level);
    setSectionNumber('');
    setSectionTitle('');
    setSectionDialog(true);
  };

  // Insert numbered paragraph
  const insertNumberedParagraph = () => {
    setParagraphNumber('');
    setParagraphText('');
    setParagraphDialog(true);
  };

  // Insert sub-paragraph with letter
  const insertSubParagraph = (type: 'letter' | 'number' | 'roman') => {
    setSubParagraphType(type);
    setSubParagraphMarker('');
    setSubParagraphText('');
    setSubParagraphDialog(true);
  };

  // AUTO-NUMBER ALL PARAGRAPHS - Automatically renumber all paragraphs in document
  const autoNumberAllParagraphs = (showAlert = true) => {
    const content = editor.getHTML();

    let chapterNum = 0;
    let sectionNum = 0;
    let paraNum = 0;

    // Parse and renumber all elements
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Number chapters (h1)
    const h1Elements = tempDiv.querySelectorAll('h1');
    h1Elements.forEach((h1) => {
      chapterNum++;
      sectionNum = 0;
      const text = h1.textContent?.replace(/^CHAPTER\s+\d+\.?\s*/i, '').replace(/^:\s*/, '') || '';
      h1.textContent = `CHAPTER ${chapterNum}${text ? ': ' + text : ''}`;
    });

    // If no H1 found, check if there are H3s with chapter numbers already and extract the chapter
    if (chapterNum === 0) {
      const firstH3 = tempDiv.querySelector('h3');
      if (firstH3) {
        const match = firstH3.textContent?.match(/^(\d+)\.\d+\./);
        if (match) {
          chapterNum = parseInt(match[1]);
        } else {
          chapterNum = 1; // Default to chapter 1 if no H1 and can't extract
        }
      } else {
        chapterNum = 1; // Default to chapter 1
      }
    }

    // Number sections (h3)
    tempDiv.querySelectorAll('h3').forEach((h3) => {
      sectionNum++;
      // Remove any existing numbering (handles both "1.1." and "1.1 " formats)
      const text = h3.textContent?.replace(/^\d+\.\d+\.?\s*/, '').trim() || '';
      h3.textContent = `${chapterNum}.${sectionNum}. ${text}`;
    });

    // Number paragraphs with hierarchy support (1.1.1, 1.1.1.1, 1.1.1.1.1, etc.)
    // Process all elements in order to track section context for paragraphs
    let currentSection = sectionNum;
    paraNum = 0; // Reset paragraph counter
    let levelCounters: { [key: string]: number } = {};

    // Get all elements (H3 sections and P paragraphs) in document order
    const allElements = Array.from(tempDiv.querySelectorAll('h3, p'));

    allElements.forEach((element) => {
      if (element.tagName === 'H3') {
        // Update current section context when we encounter a new H3
        const match = element.textContent?.match(/^(\d+)\.(\d+)\./);
        if (match) {
          currentSection = parseInt(match[2]);
          paraNum = 0; // Reset paragraph counter for new section
          levelCounters = {}; // Reset sub-level counters
        }
      } else if (element.tagName === 'P') {
        const p = element as HTMLParagraphElement;
        const strong = p.querySelector('strong');
        if (strong && p.firstChild === strong) {
          // Determine indent level from margin-left style
          const marginLeft = p.style.marginLeft || '0px';
          const indentLevel = parseInt(marginLeft) / 40; // 0px=level0, 40px=level1, 80px=level2, etc.

          // Build the number based on hierarchy using currentSection
          let numberParts = [chapterNum, currentSection];

        if (indentLevel === 0) {
          // Top-level paragraph: 1.1.1, 1.1.2, etc.
          paraNum++;
          numberParts.push(paraNum);
          levelCounters = {}; // Reset sub-levels
        } else if (indentLevel === 1) {
          // Sub-paragraph: 1.1.1.1, 1.1.1.2, etc.
          levelCounters['1'] = (levelCounters['1'] || 0) + 1;
          numberParts.push(paraNum, levelCounters['1']);
          levelCounters['2'] = 0; // Reset deeper levels
          levelCounters['3'] = 0;
        } else if (indentLevel === 2) {
          // Sub-sub-paragraph: 1.1.1.1.1, etc.
          levelCounters['2'] = (levelCounters['2'] || 0) + 1;
          numberParts.push(paraNum, levelCounters['1'] || 1, levelCounters['2']);
          levelCounters['3'] = 0; // Reset deeper
        } else if (indentLevel === 3) {
          // Very deep: 1.1.1.1.1.1, etc.
          levelCounters['3'] = (levelCounters['3'] || 0) + 1;
          numberParts.push(paraNum, levelCounters['1'] || 1, levelCounters['2'] || 1, levelCounters['3']);
        }

        // Remove all existing numbers from text
        const text = p.textContent?.replace(/^[\d.]+\s*/, '').trim() || '';
        const newNumber = numberParts.join('.') + '.';
        strong.textContent = newNumber;

          // Rebuild paragraph preserving indentation
          const restText = Array.from(p.childNodes)
            .slice(1)
            .map(node => node.textContent)
            .join('');
          p.innerHTML = `<strong>${newNumber}</strong> ${restText}`;
        }
      }
    });

    editor.commands.setContent(tempDiv.innerHTML);
    if (showAlert) {
      alert('All paragraphs have been automatically numbered!');
    }
  };

  // SMART INSERT PARAGRAPH - Context-aware insert WITH auto-renumbering
  const insertSmartParagraph = () => {
    const content = editor.getHTML();
    const { from } = editor.state.selection;

    // Parse document structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const allElements = Array.from(tempDiv.querySelectorAll('h1, h3, p'));

    // Find what element comes IMMEDIATELY BEFORE the cursor position
    let beforeCursor = { chapter: 1, section: 0, paragraph: 0, type: 'none' };

    // Get the DOM position of cursor
    const cursorPos = editor.view.domAtPos(from);
    const cursorNode = cursorPos.node;

    // Walk backwards from cursor to find the nearest structural element
    let currentNode = cursorNode;
    let searchNode = currentNode.nodeType === 3 ? currentNode.parentElement : currentNode;

    // Traverse up and find previous sibling or parent's previous sibling
    while (searchNode) {
      // Check this element itself
      if (searchNode.tagName === 'H1') {
        const match = searchNode.textContent?.match(/CHAPTER\s+(\d+)/i);
        if (match) {
          beforeCursor = { chapter: parseInt(match[1]), section: 0, paragraph: 0, type: 'chapter' };
        }
        break;
      } else if (searchNode.tagName === 'H3') {
        const match = searchNode.textContent?.match(/^(\d+)\.(\d+)\.?\s/);
        if (match) {
          beforeCursor = {
            chapter: parseInt(match[1]),
            section: parseInt(match[2]),
            paragraph: 0,
            type: 'section'
          };
        }
        break;
      } else if (searchNode.tagName === 'P') {
        const strong = searchNode.querySelector('strong');
        if (strong) {
          const match = strong.textContent?.match(/^(\d+)\.(\d+)\.(\d+)\./);
          if (match) {
            beforeCursor = {
              chapter: parseInt(match[1]),
              section: parseInt(match[2]),
              paragraph: parseInt(match[3]),
              type: 'paragraph'
            };
            break;
          }
        }
      }

      // Try previous sibling
      if (searchNode.previousElementSibling) {
        searchNode = searchNode.previousElementSibling;
      } else {
        // Go up to parent
        searchNode = searchNode.parentElement;
      }
    }

    // Determine what to insert based on what came before (ALWAYS GO DEEPER)
    let newContent = '';

    if (beforeCursor.type === 'chapter') {
      // After chapter → insert section 1.1
      newContent = `<h3>${beforeCursor.chapter}.1. Type section title here</h3>`;
    } else if (beforeCursor.type === 'section') {
      // After section → insert paragraph 1.1.1
      newContent = `<p><strong>${beforeCursor.chapter}.${beforeCursor.section}.1.</strong> Type your content here</p>`;
    } else if (beforeCursor.type === 'paragraph') {
      // After paragraph → insert SUB-PARAGRAPH (go deeper)
      // Check how deep we already are by counting dots in the strong tag
      const strongEl = searchNode?.querySelector('strong');
      const existingNumber = strongEl?.textContent || '';
      const dotCount = (existingNumber.match(/\./g) || []).length;

      if (dotCount === 3) {
        // 1.1.1. → insert 1.1.1.1 (sub-paragraph, indent 40px)
        newContent = `<p style="margin-left: 40px;"><strong>${beforeCursor.chapter}.${beforeCursor.section}.${beforeCursor.paragraph}.1.</strong> Type your content here</p>`;
      } else if (dotCount === 4) {
        // 1.1.1.1. → insert 1.1.1.1.1 (sub-sub-paragraph, indent 80px)
        newContent = `<p style="margin-left: 80px;"><strong>${beforeCursor.chapter}.${beforeCursor.section}.${beforeCursor.paragraph}.1.1.</strong> Type your content here</p>`;
      } else if (dotCount === 5) {
        // 1.1.1.1.1. → insert 1.1.1.1.1.1 (very deep, indent 120px)
        newContent = `<p style="margin-left: 120px;"><strong>${beforeCursor.chapter}.${beforeCursor.section}.${beforeCursor.paragraph}.1.1.1.</strong> Type your content here</p>`;
      } else {
        // Fallback - insert next paragraph at same level
        newContent = `<p><strong>${beforeCursor.chapter}.${beforeCursor.section}.${beforeCursor.paragraph + 1}.</strong> Type your content here</p>`;
      }
    } else {
      // Default
      newContent = `<h3>1.1. Type section title here</h3>`;
    }

    // Insert at cursor position
    editor.commands.insertContent(newContent);

    // Auto-renumber everything after insertion to fix any conflicts (silent)
    setTimeout(() => {
      autoNumberAllParagraphs(false); // false = no alert popup
    }, 100);
  };

  // Quick insert templates
  const insertTemplate = (type: string) => {
    switch(type) {
      case 'chapter':
        editor
          .chain()
          .focus()
          .insertContent(`
            <h1>CHAPTER 1</h1>
            <h2 style="text-align: center;">CHAPTER TITLE</h2>
            <h3>1.1. Section Title</h3>
            <p>Section content...</p>
            <p><strong>1.1.1.</strong> Paragraph content...</p>
            <p style="margin-left: 40px;"><strong>1.1.1.1.</strong> Sub-paragraph content...</p>
            <p style="margin-left: 80px;"><strong>a.</strong> Item content...</p>
            <p style="margin-left: 120px;"><strong>(1)</strong> Sub-item content...</p>
          `)
          .run();
        break;
      
      case 'section':
        // Use the section dialog for template too
        setSectionLevel(2);
        setSectionNumber('1.1');
        setSectionTitle('Section Title');
        setSectionDialog(true);
        break;
      
      case 'list':
        editor
          .chain()
          .focus()
          .insertContent(`
            <p style="margin-left: 40px;"><strong>a.</strong> First item</p>
            <p style="margin-left: 40px;"><strong>b.</strong> Second item</p>
            <p style="margin-left: 40px;"><strong>c.</strong> Third item</p>
          `)
          .run();
        break;
      
      case 'table':
        editor
          .chain()
          .focus()
          .insertContent(`
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid black; padding: 8px;">Column 1</th>
                  <th style="border: 1px solid black; padding: 8px;">Column 2</th>
                  <th style="border: 1px solid black; padding: 8px;">Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid black; padding: 8px;">Data 1</td>
                  <td style="border: 1px solid black; padding: 8px;">Data 2</td>
                  <td style="border: 1px solid black; padding: 8px;">Data 3</td>
                </tr>
              </tbody>
            </table>
          `)
          .run();
        break;
    }
  };

  const handleTemplateMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1, 
      flexWrap: 'wrap', 
      p: 1, 
      backgroundColor: 'grey.100',
      borderRadius: 1,
      mb: 2
    }}>
      {/* Heading Levels */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Chapter (H1)">
          <Button onClick={() => insertNumberedSection(1)}>
            <LooksOne />
          </Button>
        </Tooltip>
        <Tooltip title="Section (H2)">
          <Button onClick={() => insertNumberedSection(2)}>
            <LooksTwo />
          </Button>
        </Tooltip>
        <Tooltip title="Subsection (H3)">
          <Button onClick={() => insertNumberedSection(3)}>
            <Looks3 />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Paragraph Numbering */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Insert Numbered Paragraph (1.1.1)">
          <Button onClick={insertNumberedParagraph}>
            ¶1.1
          </Button>
        </Tooltip>
        <Tooltip title="Insert Lettered Sub-paragraph (a.)">
          <Button onClick={() => insertSubParagraph('letter')}>
            a.
          </Button>
        </Tooltip>
        <Tooltip title="Insert Numbered Sub-item ((1))">
          <Button onClick={() => insertSubParagraph('number')}>
            (1)
          </Button>
        </Tooltip>
        <Tooltip title="Insert Roman Numeral (i.)">
          <Button onClick={() => insertSubParagraph('roman')}>
            i.
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Auto-Numbering Tools */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Smart Insert - Goes one level deeper (1.1→1.1.1→1.1.1.1)">
          <Button
            onClick={insertSmartParagraph}
            sx={{
              bgcolor: 'success.light',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'success.main' }
            }}
          >
            + Para
          </Button>
        </Tooltip>
        <Tooltip title="Auto-Number All Paragraphs - Renumber entire document">
          <Button
            onClick={() => autoNumberAllParagraphs()}
            sx={{
              bgcolor: 'primary.light',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'primary.main' }
            }}
          >
            🔢 Auto
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* List Options */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Bullet List">
          <Button 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'inherit'}
          >
            <FormatListBulleted />
          </Button>
        </Tooltip>
        <Tooltip title="Numbered List">
          <Button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'inherit'}
          >
            <FormatListNumbered />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Indentation */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Increase Indent">
          <Button onClick={() => {
            const selection = editor.view.state.selection;
            editor.chain().focus().insertContent('<p style="margin-left: 40px;">').run();
          }}>
            <FormatIndentIncrease />
          </Button>
        </Tooltip>
        <Tooltip title="Decrease Indent">
          <Button onClick={() => {
            // This would need more complex logic to reduce indent
            editor.chain().focus().liftListItem('listItem').run();
          }}>
            <FormatIndentDecrease />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Page Break */}
      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          editor?.chain().focus().setHardBreak().run();
          editor?.chain().focus().insertContent('<div style="page-break-after: always; margin: 20px 0; border-top: 2px dashed #ccc; text-align: center; color: #999;">--- Page Break ---</div>').run();
        }}
        title="Insert Page Break"
      >
        Page Break
      </Button>

      <Divider orientation="vertical" flexItem />

      {/* Quick Templates */}
      <Button
        variant="contained"
        size="small"
        startIcon={<LibraryAdd />}
        onClick={handleTemplateMenu}
      >
        Templates
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => { insertTemplate('chapter'); handleCloseMenu(); }}>
          <AddBox sx={{ mr: 1 }} /> Insert Chapter Template
        </MenuItem>
        <MenuItem onClick={() => { insertTemplate('section'); handleCloseMenu(); }}>
          <Subject sx={{ mr: 1 }} /> Insert Section Template
        </MenuItem>
        <MenuItem onClick={() => { insertTemplate('list'); handleCloseMenu(); }}>
          <FormatListBulleted sx={{ mr: 1 }} /> Insert List Template
        </MenuItem>
        <MenuItem onClick={() => { insertTemplate('table'); handleCloseMenu(); }}>
          <TableChart sx={{ mr: 1 }} /> Insert Table Template
        </MenuItem>
      </Menu>

      {/* Custom Section Dialog */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)}>
        <DialogTitle>Insert Section</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Section Number"
            placeholder={sectionLevel === 1 ? "e.g., 1, 2, 3" : sectionLevel === 2 ? "e.g., 1.1, 2.3" : "e.g., 1.2.3"}
            value={sectionNumber}
            onChange={(e) => setSectionNumber(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Section Title"
            placeholder="e.g., Administrative Requirements"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (sectionNumber && sectionTitle) {
                const headingTag = `h${Math.min(sectionLevel + 1, 6)}`;
                editor
                  .chain()
                  .focus()
                  .insertContent(`<${headingTag}><strong>${sectionNumber}</strong> ${sectionTitle}</${headingTag}>\n<p></p>`)
                  .run();
                setSectionDialog(false);
                setSectionNumber('');
                setSectionTitle('');
              }
            }}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Paragraph Dialog */}
      <Dialog open={paragraphDialog} onClose={() => setParagraphDialog(false)}>
        <DialogTitle>Insert Numbered Paragraph</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Paragraph Number"
            placeholder="e.g., 1.1.1.1, 2.3.1"
            value={paragraphNumber}
            onChange={(e) => setParagraphNumber(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Paragraph Text (Optional)"
            placeholder="Enter the paragraph content"
            value={paragraphText}
            onChange={(e) => setParagraphText(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParagraphDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (paragraphNumber) {
                editor
                  .chain()
                  .focus()
                  .insertContent(`<p><strong>${paragraphNumber}</strong> ${paragraphText}</p>`)
                  .run();
                setParagraphDialog(false);
                setParagraphNumber('');
                setParagraphText('');
              }
            }}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-Paragraph Dialog */}
      <Dialog open={subParagraphDialog} onClose={() => setSubParagraphDialog(false)}>
        <DialogTitle>Insert Sub-Paragraph</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={subParagraphType === 'letter' ? "Letter" : subParagraphType === 'number' ? "Number" : "Roman Numeral"}
            placeholder={subParagraphType === 'letter' ? "e.g., a., b., c." : subParagraphType === 'number' ? "e.g., (1), (2), (3)" : "e.g., i., ii., iii."}
            value={subParagraphMarker}
            onChange={(e) => setSubParagraphMarker(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Sub-Paragraph Text (Optional)"
            placeholder="Enter the sub-paragraph content"
            value={subParagraphText}
            onChange={(e) => setSubParagraphText(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubParagraphDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (subParagraphMarker) {
                editor
                  .chain()
                  .focus()
                  .insertContent(`<p style="margin-left: 40px;"><strong>${subParagraphMarker}</strong> ${subParagraphText}</p>`)
                  .run();
                setSubParagraphDialog(false);
                setSubParagraphMarker('');
                setSubParagraphText('');
              }
            }}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentStructureToolbar;
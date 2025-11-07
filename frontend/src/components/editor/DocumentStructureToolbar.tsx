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
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  FormatListNumbered,
  FormatListBulleted,
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
  const [sectionMode, setSectionMode] = useState<'child' | 'sibling' | 'parent'>('child'); // child = go deeper, sibling = same level, parent = parent level
  const [siblingNumber, setSiblingNumber] = useState(''); // Store the sibling alternative
  const [parentNumber, setParentNumber] = useState(''); // Store the parent level number
  const [chapterDialog, setChapterDialog] = useState(false);
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
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

  // Add Chapter - detects next chapter number and opens dialog
  const addChapter = () => {
    const content = editor.getHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Find all existing chapters (H1 tags with "CHAPTER X" format)
    const chapters = Array.from(tempDiv.querySelectorAll('h1'));
    let highestChapter = 0;

    chapters.forEach(h1 => {
      const match = h1.textContent?.match(/CHAPTER\s+(\d+)/i);
      if (match) {
        const chapterNum = parseInt(match[1]);
        if (chapterNum > highestChapter) {
          highestChapter = chapterNum;
        }
      }
    });

    // Next chapter number
    const nextChapter = highestChapter + 1;

    // Open dialog with pre-populated chapter number
    setChapterNumber(nextChapter.toString());
    setChapterTitle('');
    setChapterDialog(true);
  };

  // Add Section - detects context and goes one level deeper
  const addSection = () => {
    const content = editor.getHTML();
    const { from } = editor.state.selection;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Find the element immediately before cursor (can be H3, P with number, etc.)
    const cursorPos = editor.view.domAtPos(from);
    let currentNode = cursorPos.node;
    let searchNode = currentNode.nodeType === 3 ? currentNode.parentElement : currentNode;

    let sectionNumber = '1.1';
    let referenceSectionStyle = '';
    let iterationCount = 0;

    // Walk backwards from cursor to find the most recent numbered element
    while (searchNode && iterationCount < 20) {
      iterationCount++;
      // Check for any heading (H3, H4, H5, H6) with section numbers
      if (['H3', 'H4', 'H5', 'H6'].includes(searchNode.tagName)) {
        const match = searchNode.textContent?.match(/^(\d+(?:\.\d+)*)\.?\s/);
        if (match) {
          const baseNumber = match[1];
          // Go one level deeper: "1.2" -> "1.2.1", "1.1.1.1" -> "1.1.1.1.1"
          sectionNumber = `${baseNumber}.1`;
          referenceSectionStyle = (searchNode as HTMLElement).getAttribute('style') || '';
          break;
        }
      }
      // Check for H1 chapter
      else if (searchNode.tagName === 'H1') {
        const match = searchNode.textContent?.match(/CHAPTER\s+(\d+)/i);
        if (match) {
          const chapterNum = match[1];
          sectionNumber = `${chapterNum}.1`;
          break;
        }
      }

      // Move to previous element
      if (searchNode.previousElementSibling) {
        searchNode = searchNode.previousElementSibling;
      } else {
        searchNode = searchNode.parentElement;
      }
    }

    // Calculate sibling number (increment last part instead of adding .1)
    let calculatedSiblingNumber = '1.2';

    // Walk backwards again to find what to increment for sibling
    let searchNode2 = currentNode.nodeType === 3 ? currentNode.parentElement : currentNode;
    while (searchNode2) {
      if (['H3', 'H4', 'H5', 'H6'].includes(searchNode2.tagName)) {
        const match = searchNode2.textContent?.match(/^(\d+(?:\.\d+)*)\.?\s/);
        if (match) {
          const baseNumber = match[1];
          const parts = baseNumber.split('.');
          // Increment the last part
          const lastNum = parseInt(parts[parts.length - 1]);
          parts[parts.length - 1] = (lastNum + 1).toString();
          calculatedSiblingNumber = parts.join('.');
          break;
        }
      }
      if (searchNode2.previousElementSibling) {
        searchNode2 = searchNode2.previousElementSibling;
      } else {
        searchNode2 = searchNode2.parentElement;
      }
    }

    // Calculate parent number (remove last segment and increment second-to-last)
    let calculatedParentNumber = '1.2';
    let searchNode3 = currentNode.nodeType === 3 ? currentNode.parentElement : currentNode;
    while (searchNode3) {
      if (['H3', 'H4', 'H5', 'H6'].includes(searchNode3.tagName)) {
        const match = searchNode3.textContent?.match(/^(\d+(?:\.\d+)*)\.?\s/);
        if (match) {
          const baseNumber = match[1];
          const parts = baseNumber.split('.');
          // Need at least 2 levels to go to parent (e.g., 1.1.2.1 has parent 1.1.3)
          if (parts.length >= 2) {
            // Remove last segment and increment second-to-last
            // e.g., 1.1.2.1 → [1, 1, 2, 1] → [1, 1, 2] → [1, 1, 3]
            const parentParts = parts.slice(0, -1);
            const parentLastNum = parseInt(parentParts[parentParts.length - 1]);
            parentParts[parentParts.length - 1] = (parentLastNum + 1).toString();
            calculatedParentNumber = parentParts.join('.');
          }
          break;
        }
      }
      if (searchNode3.previousElementSibling) {
        searchNode3 = searchNode3.previousElementSibling;
      } else {
        searchNode3 = searchNode3.parentElement;
      }
    }

    // Store reference style for later use when inserting
    (window as any).__sectionReferenceStyle = referenceSectionStyle;

    // Open dialog with pre-populated section number (default to child)
    setSectionNumber(sectionNumber); // Child number
    setSiblingNumber(calculatedSiblingNumber); // Sibling number
    setParentNumber(calculatedParentNumber); // Parent number
    setSectionMode('child'); // Default to child mode
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

  // AUTO-NUMBER ALL PARAGRAPHS - Fix duplicates and renumber sequentially
  const autoNumberAllParagraphs = (showAlert = true) => {
    const content = editor.getHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Get all elements (headings and paragraphs) to understand structure
    const allElements = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p'));

    // Track all paragraphs with their positions in document
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

        // Try to find number in multiple ways:
        // 1. Inside a <strong> tag
        // 2. At the start of paragraph text (plain text)
        let num = '';
        const pText = p.textContent || '';

        // First, try to find <strong> tag
        const strong = p.querySelector('strong');
        if (strong) {
          num = strong.textContent || '';
        } else {
          // No strong tag, check if paragraph starts with a number pattern
          // Match patterns like "1.1.1.1.1.1." or "1.1.1.1.1.1 " (with dot or space after)
          const textMatch = pText.match(/^(\d+(?:\.\d+){2,})\.?\s/);
          if (textMatch) {
            num = textMatch[1] + '.';
          }
        }

        if (num) {
          // Match any valid number pattern (1.1.1, 1.1.1.1, 1.1.1.1.1, etc.)
          const match = num.match(/^(\d+(?:\.\d+)+)\.?$/);
          if (match) {
            const fullNumber = match[1];
            const parts = fullNumber.split('.');

            // Must have at least 3 levels (e.g., 1.1.1)
            if (parts.length >= 3 && parts.every(part => /^\d+$/.test(part))) {
              // Prefix is everything except the last number
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

    // Renumber each group sequentially, ensuring document order
    paragraphGroups.forEach((paragraphs, prefix) => {
      // Sort by position to ensure document order
      paragraphs.sort((a, b) => a.position - b.position);

      paragraphs.forEach((info, idx) => {
        const p = info.element;
        const newNum = `${prefix}.${idx + 1}.`;

        // Get text content without the number
        const textWithoutNumber = p.textContent?.replace(/^[\d.]+\s*/, '').trim() || '';

        // Preserve existing style attributes
        const existingStyle = p.getAttribute('style') || '';

        // Update paragraph with new number
        p.innerHTML = `<strong>${newNum}</strong> ${textWithoutNumber}`;

        // Restore style if it existed
        if (existingStyle) {
          p.setAttribute('style', existingStyle);
        }
      });
    });

    editor.commands.setContent(tempDiv.innerHTML);
    if (showAlert) {
      alert('All paragraph numbers have been renumbered!');
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
    let beforeCursor: any = { chapter: 1, section: 0, paragraph: 0, type: 'none', fullNumber: '' };

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
      } else if (['H3', 'H4', 'H5', 'H6'].includes(searchNode.tagName)) {
        // Check for any heading (H3, H4, H5, H6) with section numbers
        const match = searchNode.textContent?.match(/^(\d+(?:\.\d+)*)\.?\s/);
        if (match) {
          const fullNumber = match[1];
          beforeCursor = {
            chapter: 0,
            section: 0,
            paragraph: 0,
            type: 'section',
            fullNumber: fullNumber  // Store the full number for later use
          };
          break;
        }
      } else if (searchNode.tagName === 'P') {
        const strong = searchNode.querySelector('strong');
        if (strong) {
          const fullNumber = strong.textContent || '';
          // Match ANY number of levels (1.2.3 or 1.2.3.4.5.6, etc.)
          const match = fullNumber.match(/^(\d+)\.(\d+)\.(\d+)/);
          if (match) {
            beforeCursor = {
              chapter: parseInt(match[1]),
              section: parseInt(match[2]),
              paragraph: parseInt(match[3]),
              type: 'paragraph',
              fullNumber: fullNumber  // Store the full number for later use
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
      // After section/heading → go one level deeper (1.1 → 1.1.1, 1.1.1.1 → 1.1.1.1.1)
      const fullNumber = (beforeCursor.fullNumber || '').replace(/\.+$/, ''); // Remove ALL trailing dots
      const newNumber = `${fullNumber}.1.`;

      // Calculate indent based on depth - same formula as sections
      const parts = newNumber.replace(/\.$/, '').split('.').filter(p => p); // Filter out empty strings
      const marginLeft = (parts.length - 1) * 20; // level 1=0px, level 2=20px, level 3=40px, etc.
      const styleAttr = marginLeft > 0 ? ` style="margin-left: ${marginLeft}px;"` : '';

      newContent = `<p${styleAttr}><strong>${newNumber}</strong> Type your content here</p>`;
    } else if (beforeCursor.type === 'paragraph') {
      // After paragraph → increment the LAST number (same level sibling)
      const fullNumber = (beforeCursor.fullNumber || '').replace(/\.+$/, ''); // Remove ALL trailing dots
      const parts = fullNumber.split('.').filter(p => p); // Filter out empty strings

      if (parts.length > 0) {
        // Increment the last part
        parts[parts.length - 1] = (parseInt(parts[parts.length - 1]) + 1).toString();
        const newNumber = parts.join('.') + '.';

        // Calculate indent based on depth - same formula as sections
        const marginLeft = (parts.length - 1) * 20; // level 1=0px, level 2=20px, level 3=40px, etc.
        const styleAttr = marginLeft > 0 ? ` style="margin-left: ${marginLeft}px;"` : '';

        newContent = `<p${styleAttr}><strong>${newNumber}</strong> Type your content here</p>`;
      } else {
        // Fallback
        newContent = `<p><strong>${beforeCursor.chapter}.${beforeCursor.section}.${beforeCursor.paragraph + 1}.</strong> Type your content here</p>`;
      }
    } else {
      // Default
      newContent = `<h3>1.1. Type section title here</h3>`;
    }

    // Insert at cursor position
    editor.commands.insertContent(newContent);

    // Do NOT auto-renumber - let user manually click Auto button
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
      {/* Add Chapter and Add Section Buttons */}
      <ButtonGroup variant="contained" size="small">
        <Tooltip title="Add Chapter - Auto-detects next chapter number">
          <Button
            onClick={addChapter}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            + Add Chapter
          </Button>
        </Tooltip>
        <Tooltip title="Add Section - Auto-detects next section number based on cursor position">
          <Button
            onClick={addSection}
            sx={{
              bgcolor: 'secondary.main',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'secondary.dark' }
            }}
          >
            + Add Section
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

      {/* Add Chapter Dialog */}
      <Dialog open={chapterDialog} onClose={() => setChapterDialog(false)}>
        <DialogTitle>Add Chapter</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Chapter Number"
            placeholder="e.g., 1, 2, 3"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Chapter Title"
            placeholder="e.g., General Information"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChapterDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (chapterNumber && chapterTitle) {
                editor
                  .chain()
                  .focus()
                  .insertContent(`<h1>CHAPTER ${chapterNumber}</h1>\n<h2 style="text-align: center;">${chapterTitle}</h2>\n<p></p>`)
                  .run();
                setChapterDialog(false);
                setChapterNumber('');
                setChapterTitle('');
              }
            }}
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Section</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mb: 2, mt: 1 }}>
            <FormLabel component="legend">Section Type</FormLabel>
            <RadioGroup
              value={sectionMode}
              onChange={(e) => {
                const mode = e.target.value as 'child' | 'sibling' | 'parent';
                setSectionMode(mode);
              }}
            >
              <FormControlLabel
                value="child"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      <strong>Add child section (go deeper)</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creates: {sectionNumber} (indented under current section)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="sibling"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      <strong>Add sibling section (same level)</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creates: {siblingNumber} (same indent as current section)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="parent"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      <strong>Add to parent level (go up one level)</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creates: {parentNumber} (one level up from current section)
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Section Number"
            placeholder="e.g., 1.1, 2.3"
            value={sectionMode === 'child' ? sectionNumber : sectionMode === 'sibling' ? siblingNumber : parentNumber}
            disabled
            sx={{ mb: 2, bgcolor: 'grey.50' }}
            helperText="Auto-generated based on your selection above"
          />
          <TextField
            fullWidth
            label="Section Title"
            placeholder="e.g., Administrative Requirements"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const finalNumber = sectionMode === 'child' ? sectionNumber : sectionMode === 'sibling' ? siblingNumber : parentNumber;

              if (finalNumber && sectionTitle) {
                // Get the reference style from the previous section
                const refStyle = (window as any).__sectionReferenceStyle || '';

                // Determine heading level and margin based on depth (number of dots)
                const levels = finalNumber.split('.').filter(n => n).length;
                let headingTag = 'h3'; // Default for sections like 1.1, 1.2

                // Calculate margin: each level adds 20px (level 1=0px, level 2=20px, level 3=40px, etc.)
                let marginLeft = (levels - 1) * 20;

                // IMPORTANT: For sibling sections, use the SAME margin as the reference section
                if (sectionMode === 'sibling' && refStyle) {
                  const marginMatch = refStyle.match(/margin-left:\s*(\d+)px/);
                  if (marginMatch) {
                    marginLeft = parseInt(marginMatch[1]);
                  }
                }

                // IMPORTANT: For parent sections, reduce margin by one level (go up)
                if (sectionMode === 'parent' && refStyle) {
                  const marginMatch = refStyle.match(/margin-left:\s*(\d+)px/);
                  if (marginMatch) {
                    // Parent is one level up, so subtract 20px from reference margin
                    marginLeft = Math.max(0, parseInt(marginMatch[1]) - 20);
                  }
                }

                if (levels === 2) {
                  headingTag = 'h3'; // 1.1, 1.2 (section level)
                } else if (levels === 3) {
                  headingTag = 'h4'; // 1.1.1, 1.2.3 (subsection level)
                } else if (levels === 4) {
                  headingTag = 'h5'; // 1.1.1.1 (sub-subsection level)
                } else if (levels >= 5) {
                  headingTag = 'h6'; // 1.1.1.1.1+ (5th+ level)
                }

                // Use margin-left for indentation (matching template sections)
                const finalStyle = `margin-left: ${marginLeft}px;`;

                const styleAttr = ` style="${finalStyle}"`;

                // Extract margin for the paragraph placeholder
                const paragraphStyle = ` style="margin-left: ${marginLeft}px;"`;

                // Move cursor to end of document or after current block to avoid nesting
                const { $to } = editor.state.selection;
                const endPos = $to.after();

                editor
                  .chain()
                  .focus()
                  .insertContentAt(endPos, `<${headingTag}${styleAttr}>${finalNumber} ${sectionTitle}</${headingTag}>\n<p${paragraphStyle}></p>`)
                  .run();
                setSectionDialog(false);
                setSectionNumber('');
                setSiblingNumber('');
                setParentNumber('');
                setSectionTitle('');
                setSectionMode('child');

                // Clear the reference style
                (window as any).__sectionReferenceStyle = '';
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
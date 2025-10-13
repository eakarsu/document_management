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
  const autoNumberAllParagraphs = () => {
    const content = editor.getHTML();

    let chapterNum = 0;
    let sectionNum = 0;
    let paraNum = 0;

    // Parse and renumber all elements
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Number chapters (h1)
    tempDiv.querySelectorAll('h1').forEach((h1) => {
      chapterNum++;
      sectionNum = 0;
      const text = h1.textContent?.replace(/^CHAPTER\s+\d+\.?\s*/i, '') || '';
      h1.textContent = `CHAPTER ${chapterNum}. ${text}`;
    });

    // Number sections (h3)
    tempDiv.querySelectorAll('h3').forEach((h3) => {
      sectionNum++;
      paraNum = 0;
      const text = h3.textContent?.replace(/^\d+\.\d+\.?\s*/, '') || '';
      h3.textContent = `${chapterNum}.${sectionNum}. ${text}`;
    });

    // Number paragraphs (p with strong at start)
    tempDiv.querySelectorAll('p').forEach((p) => {
      const strong = p.querySelector('strong');
      if (strong && p.firstChild === strong) {
        paraNum++;
        const text = p.textContent?.replace(/^\d+\.\d+\.\d+\.?\s*/, '') || '';
        strong.textContent = `${chapterNum}.${sectionNum}.${paraNum}.`;
        // Keep the rest of the text
        const restText = Array.from(p.childNodes)
          .slice(1)
          .map(node => node.textContent)
          .join('');
        p.innerHTML = `<strong>${chapterNum}.${sectionNum}.${paraNum}.</strong> ${restText}`;
      }
    });

    editor.commands.setContent(tempDiv.innerHTML);
    alert('All paragraphs have been automatically numbered!');
  };

  // SMART INSERT PARAGRAPH - Insert paragraph with auto-calculated next number
  const insertSmartParagraph = () => {
    const content = editor.getHTML();

    // Find all existing paragraph numbers
    const paraMatches = content.match(/\d+\.\d+\.\d+\./g) || [];

    if (paraMatches.length === 0) {
      // No paragraphs yet, start with 1.1.1
      editor.commands.insertContent('<p><strong>1.1.1.</strong> Type your content here</p>');
    } else {
      // Get the last paragraph number
      const lastPara = paraMatches[paraMatches.length - 1];
      const parts = lastPara.replace('.', '').split('.');
      const ch = parseInt(parts[0]) || 1;
      const sec = parseInt(parts[1]) || 1;
      const para = parseInt(parts[2]) || 0;

      // Increment paragraph number
      const nextNum = `${ch}.${sec}.${para + 1}`;

      editor.commands.insertContent(`<p><strong>${nextNum}.</strong> Type your content here</p>`);
    }
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
        <Tooltip title="Smart Insert Paragraph - Auto-calculates next number">
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
            onClick={autoNumberAllParagraphs}
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
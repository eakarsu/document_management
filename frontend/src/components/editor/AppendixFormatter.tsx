import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Typography,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  PostAdd,
  LibraryBooks,
  FormatListBulleted,
  Description,
  Link,
  Book,
  Delete,
  Add,
  Edit
} from '@mui/icons-material';

interface AppendixFormatterProps {
  editor: any; // TipTap editor instance
  isOpen: boolean;
  onClose: () => void;
}

interface ReferenceItem {
  type: 'law' | 'policy' | 'directive' | 'instruction' | 'memo' | 'publication' | 'form';
  citation: string;
  title: string;
  date?: string;
}

interface AbbreviationItem {
  abbreviation: string;
  definition: string;
}

interface TermItem {
  term: string;
  definition: string;
}

export const AppendixFormatter: React.FC<AppendixFormatterProps> = ({ editor, isOpen, onClose }) => {
  const [appendixDialog, setAppendixDialog] = useState(false);
  const [appendixType, setAppendixType] = useState<'attachment' | 'appendix'>('attachment');
  const [appendixNumber, setAppendixNumber] = useState('1');
  const [appendixTitle, setAppendixTitle] = useState('');
  
  // References Dialog
  const [referencesDialog, setReferencesDialog] = useState(false);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [newReference, setNewReference] = useState<ReferenceItem>({
    type: 'law',
    citation: '',
    title: ''
  });
  
  // Abbreviations Dialog
  const [abbreviationsDialog, setAbbreviationsDialog] = useState(false);
  const [abbreviations, setAbbreviations] = useState<AbbreviationItem[]>([]);
  const [newAbbreviation, setNewAbbreviation] = useState<AbbreviationItem>({
    abbreviation: '',
    definition: ''
  });
  
  // Terms Dialog
  const [termsDialog, setTermsDialog] = useState(false);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [newTerm, setNewTerm] = useState<TermItem>({
    term: '',
    definition: ''
  });

  if (!editor) {
    return null;
  }

  // Insert full appendix/attachment
  const insertAppendix = () => {
    const header = appendixType === 'attachment' 
      ? `Attachment ${appendixNumber}`
      : `Appendix ${appendixNumber}`;
    
    const content = `
      <div style="page-break-before: always;">
        <h1 style="text-align: center;">${header}</h1>
        <h2 style="text-align: center;">${appendixTitle}</h2>
        
        <h3>References</h3>
        <p>[Add references here]</p>
        
        <h3>Prescribed Forms</h3>
        <p>N/A</p>
        
        <h3>Adopted Forms</h3>
        <p>N/A</p>
        
        <h3>Abbreviations and Acronyms</h3>
        <p>[Add abbreviations here]</p>
        
        <h3>Office Symbols</h3>
        <p>[Add office symbols here]</p>
        
        <h3>Terms</h3>
        <p>[Add terms and definitions here]</p>
      </div>
    `;
    
    editor.chain().focus().insertContent(content).run();
    setAppendixDialog(false);
    setAppendixNumber('1');
    setAppendixTitle('');
  };

  // Insert references section
  const insertReferences = () => {
    let content = '<h3>References</h3>\n';
    
    // Group references by type
    const groupedRefs: { [key: string]: ReferenceItem[] } = {};
    references.forEach(ref => {
      if (!groupedRefs[ref.type]) {
        groupedRefs[ref.type] = [];
      }
      groupedRefs[ref.type].push(ref);
    });
    
    // Format each reference
    Object.keys(groupedRefs).forEach(type => {
      groupedRefs[type].forEach(ref => {
        content += `<p>${ref.citation}${ref.title ? `, <em>${ref.title}</em>` : ''}${ref.date ? `, ${ref.date}` : ''}</p>\n`;
      });
    });
    
    editor.chain().focus().insertContent(content).run();
    setReferencesDialog(false);
    setReferences([]);
  };

  // Insert abbreviations section
  const insertAbbreviations = () => {
    let content = '<h3>Abbreviations and Acronyms</h3>\n';
    
    // Sort abbreviations alphabetically
    const sortedAbbr = [...abbreviations].sort((a, b) => 
      a.abbreviation.localeCompare(b.abbreviation)
    );
    
    sortedAbbr.forEach(abbr => {
      content += `<p><strong>${abbr.abbreviation}</strong>—${abbr.definition}</p>\n`;
    });
    
    editor.chain().focus().insertContent(content).run();
    setAbbreviationsDialog(false);
    setAbbreviations([]);
  };

  // Insert terms section
  const insertTerms = () => {
    let content = '<h3>Terms</h3>\n';
    
    // Sort terms alphabetically
    const sortedTerms = [...terms].sort((a, b) => 
      a.term.localeCompare(b.term)
    );
    
    sortedTerms.forEach(term => {
      content += `<p><strong>${term.term}</strong>—${term.definition}</p>\n`;
    });
    
    editor.chain().focus().insertContent(content).run();
    setTermsDialog(false);
    setTerms([]);
  };

  // Quick insert templates
  const insertTemplate = (type: string) => {
    switch(type) {
      case 'glossary':
        editor.chain().focus().insertContent(`
          <h1 style="text-align: center;">GLOSSARY OF REFERENCES AND SUPPORTING INFORMATION</h1>
          <h3>References</h3>
          <p>[Insert references here]</p>
          <h3>Prescribed Forms</h3>
          <p>N/A</p>
          <h3>Adopted Forms</h3>
          <p>N/A</p>
          <h3>Abbreviations and Acronyms</h3>
          <p>[Insert abbreviations here]</p>
          <h3>Terms</h3>
          <p>[Insert terms here]</p>
        `).run();
        break;
        
      case 'usc-reference':
        editor.chain().focus().insertContent(
          '<p>10 USC § [Number], [Title]</p>'
        ).run();
        break;
        
      case 'policy-reference':
        editor.chain().focus().insertContent(
          '<p>[Policy Type] [Number], <em>[Title]</em>, [Date]</p>'
        ).run();
        break;
        
      case 'abbreviation-list':
        editor.chain().focus().insertContent(`
          <p><strong>DAF</strong>—Department of the Air Force</p>
          <p><strong>DoD</strong>—Department of Defense</p>
          <p><strong>USC</strong>—United States Code</p>
        `).run();
        break;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1, 
      flexWrap: 'wrap', 
      p: 1, 
      backgroundColor: 'grey.50',
      borderRadius: 1,
      mb: 2
    }}>
      {/* Main Appendix Tools */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Insert Attachment/Appendix">
          <Button 
            onClick={() => setAppendixDialog(true)}
            startIcon={<PostAdd />}
          >
            Attachment
          </Button>
        </Tooltip>
        <Tooltip title="Insert Glossary Template">
          <Button 
            onClick={() => insertTemplate('glossary')}
            startIcon={<LibraryBooks />}
          >
            Glossary
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Reference Tools */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Add References Section">
          <Button 
            onClick={() => setReferencesDialog(true)}
            startIcon={<Link />}
          >
            References
          </Button>
        </Tooltip>
        <Tooltip title="Insert USC Reference">
          <Button onClick={() => insertTemplate('usc-reference')}>
            USC §
          </Button>
        </Tooltip>
        <Tooltip title="Insert Policy Reference">
          <Button onClick={() => insertTemplate('policy-reference')}>
            Policy
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Abbreviation & Terms Tools */}
      <ButtonGroup variant="outlined" size="small">
        <Tooltip title="Add Abbreviations Section">
          <Button 
            onClick={() => setAbbreviationsDialog(true)}
            startIcon={<FormatListBulleted />}
          >
            Abbreviations
          </Button>
        </Tooltip>
        <Tooltip title="Add Terms Section">
          <Button 
            onClick={() => setTermsDialog(true)}
            startIcon={<Book />}
          >
            Terms
          </Button>
        </Tooltip>
      </ButtonGroup>

      {/* Appendix/Attachment Dialog */}
      <Dialog 
        open={appendixDialog} 
        onClose={() => setAppendixDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Insert Appendix or Attachment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={appendixType}
              onChange={(e) => setAppendixType(e.target.value as 'attachment' | 'appendix')}
              label="Type"
            >
              <MenuItem value="attachment">Attachment</MenuItem>
              <MenuItem value="appendix">Appendix</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Number"
            placeholder="1, 2, A, B, etc."
            value={appendixNumber}
            onChange={(e) => setAppendixNumber(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Title"
            placeholder="e.g., GLOSSARY OF REFERENCES AND SUPPORTING INFORMATION"
            value={appendixTitle}
            onChange={(e) => setAppendixTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppendixDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={insertAppendix}>Insert</Button>
        </DialogActions>
      </Dialog>

      {/* References Dialog */}
      <Dialog 
        open={referencesDialog} 
        onClose={() => setReferencesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add References</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newReference.type}
                onChange={(e) => setNewReference({...newReference, type: e.target.value as any})}
                label="Type"
              >
                <MenuItem value="law">USC Law</MenuItem>
                <MenuItem value="policy">Policy</MenuItem>
                <MenuItem value="directive">Directive</MenuItem>
                <MenuItem value="instruction">Instruction</MenuItem>
                <MenuItem value="memo">Memorandum</MenuItem>
                <MenuItem value="publication">Publication</MenuItem>
                <MenuItem value="form">Form</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Citation"
              placeholder="e.g., 10 USC § 9013"
              value={newReference.citation}
              onChange={(e) => setNewReference({...newReference, citation: e.target.value})}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Title"
              placeholder="e.g., Secretary of the Air Force"
              value={newReference.title}
              onChange={(e) => setNewReference({...newReference, title: e.target.value})}
              sx={{ flex: 2 }}
            />
            <TextField
              size="small"
              label="Date"
              placeholder="Optional"
              value={newReference.date || ''}
              onChange={(e) => setNewReference({...newReference, date: e.target.value})}
            />
            <IconButton 
              color="primary"
              onClick={() => {
                if (newReference.citation) {
                  setReferences([...references, newReference]);
                  setNewReference({ type: 'law', citation: '', title: '' });
                }
              }}
            >
              <Add />
            </IconButton>
          </Box>
          
          <List>
            {references.map((ref, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={`${ref.citation}${ref.title ? `, ${ref.title}` : ''}`}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip size="small" label={ref.type} />
                      {ref.date && <Chip size="small" label={ref.date} variant="outlined" />}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => {
                      setReferences(references.filter((_, i) => i !== index));
                    }}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReferencesDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={insertReferences}
            disabled={references.length === 0}
          >
            Insert References
          </Button>
        </DialogActions>
      </Dialog>

      {/* Abbreviations Dialog */}
      <Dialog 
        open={abbreviationsDialog} 
        onClose={() => setAbbreviationsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Abbreviations and Acronyms</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            <TextField
              size="small"
              label="Abbreviation"
              placeholder="e.g., DAF"
              value={newAbbreviation.abbreviation}
              onChange={(e) => setNewAbbreviation({...newAbbreviation, abbreviation: e.target.value})}
            />
            <TextField
              size="small"
              label="Definition"
              placeholder="e.g., Department of the Air Force"
              value={newAbbreviation.definition}
              onChange={(e) => setNewAbbreviation({...newAbbreviation, definition: e.target.value})}
              sx={{ flex: 1 }}
            />
            <IconButton 
              color="primary"
              onClick={() => {
                if (newAbbreviation.abbreviation && newAbbreviation.definition) {
                  setAbbreviations([...abbreviations, newAbbreviation]);
                  setNewAbbreviation({ abbreviation: '', definition: '' });
                }
              }}
            >
              <Add />
            </IconButton>
          </Box>
          
          <List>
            {abbreviations.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)).map((abbr, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={<><strong>{abbr.abbreviation}</strong>—{abbr.definition}</>}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => {
                      setAbbreviations(abbreviations.filter((_, i) => i !== index));
                    }}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbbreviationsDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={insertAbbreviations}
            disabled={abbreviations.length === 0}
          >
            Insert Abbreviations
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog 
        open={termsDialog} 
        onClose={() => setTermsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Terms and Definitions</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            <TextField
              size="small"
              label="Term"
              placeholder="e.g., Resilience"
              value={newTerm.term}
              onChange={(e) => setNewTerm({...newTerm, term: e.target.value})}
            />
            <TextField
              size="small"
              label="Definition"
              placeholder="Enter the definition..."
              value={newTerm.definition}
              onChange={(e) => setNewTerm({...newTerm, definition: e.target.value})}
              sx={{ flex: 1 }}
              multiline
            />
            <IconButton 
              color="primary"
              onClick={() => {
                if (newTerm.term && newTerm.definition) {
                  setTerms([...terms, newTerm]);
                  setNewTerm({ term: '', definition: '' });
                }
              }}
            >
              <Add />
            </IconButton>
          </Box>
          
          <List>
            {terms.sort((a, b) => a.term.localeCompare(b.term)).map((term, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={<strong>{term.term}</strong>}
                  secondary={term.definition}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => {
                      setTerms(terms.filter((_, i) => i !== index));
                    }}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermsDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={insertTerms}
            disabled={terms.length === 0}
          >
            Insert Terms
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppendixFormatter;
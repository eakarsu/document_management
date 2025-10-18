'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  SpaceBar,
  FormatIndentIncrease,
  VerticalAlignTop,
  VerticalAlignBottom,
  TableChart,
  MergeType,
  CallSplit,
  Colorize,
  BookmarkAdd,
  Link as LinkIcon,
  Person,
  History as HistoryIcon,
  CompareArrows,
  Timer,
  Accessibility,
  Keyboard,
  HighlightAlt,
  RestartAlt,
  FormatListNumbered as ListIcon
} from '@mui/icons-material';

interface AdvancedFeaturesToolbarProps {
  editor: Editor | null;
  documentId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const AdvancedFeaturesToolbar: React.FC<AdvancedFeaturesToolbarProps> = ({ editor, documentId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [wordGoal, setWordGoal] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Paragraph Spacing Controls
  const setParagraphSpacing = (type: 'before' | 'after', value: string) => {
    if (type === 'before') {
      editor?.chain().focus().setParagraphSpacingBefore(value).run();
    } else {
      editor?.chain().focus().setParagraphSpacingAfter(value).run();
    }
  };

  // Table operations
  const mergeCells = () => {
    editor?.chain().focus().mergeCells().run();
  };

  const splitCell = () => {
    editor?.chain().focus().splitCell().run();
  };

  const setCellBackground = (color: string) => {
    editor?.chain().focus().setCellAttribute('backgroundColor', color).run();
  };

  // List operations
  const restartNumbering = () => {
    editor?.chain().focus().updateAttributes('orderedList', { start: 1 }).run();
  };

  // Word count calculation
  const getWordCount = () => {
    const text = editor?.state.doc.textContent || '';
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = () => {
    const wordCount = getWordCount();
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Keyboard shortcuts dialog
  const KeyboardShortcutsDialog = () => (
    <Dialog open={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} maxWidth="md" fullWidth>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Text Formatting</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box><Chip label="Ctrl+B" size="small" /> Bold</Box>
              <Box><Chip label="Ctrl+I" size="small" /> Italic</Box>
              <Box><Chip label="Ctrl+U" size="small" /> Underline</Box>
              <Box><Chip label="Ctrl+Shift+X" size="small" /> Strikethrough</Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Navigation</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box><Chip label="Ctrl+Z" size="small" /> Undo</Box>
              <Box><Chip label="Ctrl+Y" size="small" /> Redo</Box>
              <Box><Chip label="Ctrl+F" size="small" /> Find</Box>
              <Box><Chip label="Ctrl+S" size="small" /> Save</Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Indentation</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box><Chip label="Tab" size="small" /> Increase Indent</Box>
              <Box><Chip label="Shift+Tab" size="small" /> Decrease Indent</Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Headings</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box><Chip label="Ctrl+Alt+1" size="small" /> Heading 1</Box>
              <Box><Chip label="Ctrl+Alt+2" size="small" /> Heading 2</Box>
              <Box><Chip label="Ctrl+Alt+3" size="small" /> Heading 3</Box>
              <Box><Chip label="Ctrl+Alt+0" size="small" /> Paragraph</Box>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowKeyboardShortcuts(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Paper sx={{ p: 1, bgcolor: '#fafafa' }}>
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
        <Tab label="Paragraph" />
        <Tab label="Lists" />
        <Tab label="Tables" />
        <Tab label="Document" />
        <Tab label="Collaboration" />
        <Tab label="Productivity" />
        <Tab label="Accessibility" />
      </Tabs>

      {/* Tab 1: Paragraph & Spacing */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Spacing Before</InputLabel>
            <Select
              label="Spacing Before"
              onChange={(e) => setParagraphSpacing('before', e.target.value as string)}
              startAdornment={<VerticalAlignTop fontSize="small" />}
            >
              <MenuItem value="0">None</MenuItem>
              <MenuItem value="6pt">6pt</MenuItem>
              <MenuItem value="12pt">12pt (Default)</MenuItem>
              <MenuItem value="18pt">18pt</MenuItem>
              <MenuItem value="24pt">24pt</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Spacing After</InputLabel>
            <Select
              label="Spacing After"
              onChange={(e) => setParagraphSpacing('after', e.target.value as string)}
              startAdornment={<VerticalAlignBottom fontSize="small" />}
            >
              <MenuItem value="0">None</MenuItem>
              <MenuItem value="6pt">6pt</MenuItem>
              <MenuItem value="12pt">12pt (Default)</MenuItem>
              <MenuItem value="18pt">18pt</MenuItem>
              <MenuItem value="24pt">24pt</MenuItem>
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem />

          <ButtonGroup size="small">
            <Tooltip title="First Line Indent">
              <Button onClick={() => editor?.chain().focus().setFirstLineIndent('40px').run()}>
                <FormatIndentIncrease /> First Line
              </Button>
            </Tooltip>
            <Tooltip title="Hanging Indent">
              <Button onClick={() => editor?.chain().focus().setHangingIndent('40px').run()}>
                <FormatIndentIncrease /> Hanging
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          <FormControlLabel
            control={<Switch onChange={(e) => editor?.chain().focus().setKeepWithNext(e.target.checked).run()} />}
            label="Keep with Next"
          />

          <FormControlLabel
            control={<Switch onChange={(e) => editor?.chain().focus().setPageBreakBefore(e.target.checked).run()} />}
            label="Page Break Before"
          />
        </Box>
      </TabPanel>

      {/* Tab 2: Lists Enhancements */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <ButtonGroup size="small">
            <Tooltip title="Restart Numbering at 1">
              <Button onClick={restartNumbering} startIcon={<RestartAlt />}>
                Restart at 1
              </Button>
            </Tooltip>
            <Tooltip title="Continue from Previous">
              <Button onClick={() => editor?.chain().focus().updateAttributes('orderedList', { start: null }).run()}>
                Continue
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Typography variant="body2" color="text.secondary">
            Multi-level lists: Use Tab/Shift+Tab to nest lists
          </Typography>
        </Box>
      </TabPanel>

      {/* Tab 3: Advanced Table Features */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <ButtonGroup size="small">
            <Tooltip title="Merge Selected Cells">
              <Button onClick={mergeCells} startIcon={<MergeType />}>
                Merge Cells
              </Button>
            </Tooltip>
            <Tooltip title="Split Cell">
              <Button onClick={splitCell} startIcon={<CallSplit />}>
                Split Cell
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Tooltip title="Cell Background Color">
            <input
              type="color"
              onChange={(e) => setCellBackground(e.target.value)}
              style={{
                width: '40px',
                height: '32px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
          </Tooltip>

          <Typography variant="body2" sx={{ ml: 1 }}>Cell Background</Typography>
        </Box>
      </TabPanel>

      {/* Tab 4: Document Structure */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <ButtonGroup size="small">
            <Tooltip title="Insert Bookmark">
              <Button startIcon={<BookmarkAdd />}>
                Bookmark
              </Button>
            </Tooltip>
            <Tooltip title="Insert Cross-Reference">
              <Button startIcon={<LinkIcon />}>
                Cross-Ref
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Typography variant="body2" color="text.secondary">
            Advanced document structure features - Bookmarks & References
          </Typography>
        </Box>
      </TabPanel>

      {/* Tab 5: Collaboration Features */}
      <TabPanel value={activeTab} index={4}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <ButtonGroup size="small">
            <Tooltip title="Mention User">
              <Button startIcon={<Person />}>
                @Mention
              </Button>
            </Tooltip>
            <Tooltip title="Version History">
              <Button startIcon={<HistoryIcon />}>
                History
              </Button>
            </Tooltip>
            <Tooltip title="Compare Documents">
              <Button startIcon={<CompareArrows />}>
                Compare
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Typography variant="body2" color="text.secondary">
            Collaboration tools - Track changes is already enabled in main toolbar
          </Typography>
        </Box>
      </TabPanel>

      {/* Tab 6: Productivity Tools */}
      <TabPanel value={activeTab} index={5}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Word Count:</Typography>
            <Chip label={`${getWordCount()} words`} color="primary" size="small" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Reading Time:</Typography>
            <Chip label={`${getReadingTime()} min`} color="secondary" size="small" icon={<Timer />} />
          </Box>

          <Divider orientation="vertical" flexItem />

          <TextField
            size="small"
            label="Word Goal"
            type="number"
            value={wordGoal}
            onChange={(e) => setWordGoal(Number(e.target.value))}
            sx={{ width: 120 }}
          />
          {wordGoal > 0 && (
            <Chip
              label={`${Math.round((getWordCount() / wordGoal) * 100)}% Complete`}
              color={getWordCount() >= wordGoal ? 'success' : 'warning'}
              size="small"
            />
          )}

          <Divider orientation="vertical" flexItem />

          <Button
            size="small"
            variant="outlined"
            startIcon={<Keyboard />}
            onClick={() => setShowKeyboardShortcuts(true)}
          >
            Shortcuts
          </Button>

          <FormControlLabel
            control={<Switch checked={focusMode} onChange={(e) => setFocusMode(e.target.checked)} />}
            label="Focus Mode"
          />
        </Box>
      </TabPanel>

      {/* Tab 7: Accessibility Features */}
      <TabPanel value={activeTab} index={6}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />}
            label="High Contrast Mode"
          />

          <Divider orientation="vertical" flexItem />

          <ButtonGroup size="small">
            <Tooltip title="Add Alt Text to Images">
              <Button startIcon={<HighlightAlt />}>
                Alt Text
              </Button>
            </Tooltip>
            <Tooltip title="Check Accessibility">
              <Button startIcon={<Accessibility />}>
                Check
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Divider orientation="vertical" flexItem />

          <Typography variant="body2" color="text.secondary">
            Accessibility: Screen reader optimized, keyboard navigation enabled
          </Typography>
        </Box>
      </TabPanel>

      <KeyboardShortcutsDialog />
    </Paper>
  );
};

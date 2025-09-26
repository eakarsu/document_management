import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Divider,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  Search,
  FindReplace,
  ArrowUpward,
  ArrowDownward,
  Close,
  SwapVert,
  CheckCircle,
  Cancel,
  Code
} from '@mui/icons-material';

interface AdvancedSearchReplaceProps {
  editor: any;
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

interface SearchMatch {
  from: number;
  to: number;
  text: string;
}

export const AdvancedSearchReplace: React.FC<AdvancedSearchReplaceProps> = ({
  editor,
  open,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchInSelection, setSearchInSelection] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchStats, setSearchStats] = useState({ replaced: 0, total: 0 });
  const [searchMode, setSearchMode] = useState<'find' | 'replace'>('find');

  // Perform search
  const performSearch = () => {
    if (!editor || !searchTerm) {
      setMatches([]);
      return;
    }

    const doc = editor.state.doc;
    const selection = editor.state.selection;
    const searchMatches: SearchMatch[] = [];
    
    let searchPattern: RegExp;
    
    try {
      if (useRegex) {
        searchPattern = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
      } else {
        let pattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars
        if (wholeWord) {
          pattern = `\\b${pattern}\\b`;
        }
        searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      }
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return;
    }

    const searchStart = searchInSelection ? selection.from : 0;
    const searchEnd = searchInSelection ? selection.to : doc.content.size;
    
    // Get text content
    const text = doc.textBetween(searchStart, searchEnd, '\n');
    
    // Find all matches
    let match;
    while ((match = searchPattern.exec(text)) !== null) {
      searchMatches.push({
        from: searchStart + match.index,
        to: searchStart + match.index + match[0].length,
        text: match[0]
      });
    }
    
    setMatches(searchMatches);
    setSearchStats({ ...searchStats, total: searchMatches.length });
    
    // Highlight first match
    if (searchMatches.length > 0) {
      highlightMatch(0);
    }
  };

  // Highlight specific match
  const highlightMatch = (index: number) => {
    if (matches.length === 0) return;
    
    const match = matches[index];
    editor.chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .run();
    
    // Scroll to match
    const coords = editor.view.coordsAtPos(match.from);
    window.scrollTo({
      top: coords.top - 200,
      behavior: 'smooth'
    });
    
    setCurrentMatchIndex(index);
  };

  // Navigate to next match
  const nextMatch = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    highlightMatch(nextIndex);
  };

  // Navigate to previous match
  const previousMatch = () => {
    if (matches.length === 0) return;
    const prevIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    highlightMatch(prevIndex);
  };

  // Replace current match
  const replaceCurrent = () => {
    if (matches.length === 0 || !replaceTerm) return;
    
    const match = matches[currentMatchIndex];
    
    editor.chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .deleteSelection()
      .insertContent(replaceTerm)
      .run();
    
    // Remove current match and update stats
    const newMatches = [...matches];
    newMatches.splice(currentMatchIndex, 1);
    setMatches(newMatches);
    setSearchStats({
      replaced: searchStats.replaced + 1,
      total: newMatches.length
    });
    
    // Highlight next match
    if (newMatches.length > 0) {
      const nextIndex = currentMatchIndex >= newMatches.length ? 0 : currentMatchIndex;
      highlightMatch(nextIndex);
    }
  };

  // Replace all matches
  const replaceAll = () => {
    if (matches.length === 0 || !replaceTerm) return;
    
    // Sort matches in reverse order to maintain positions
    const sortedMatches = [...matches].sort((a, b) => b.from - a.from);
    
    editor.chain().focus().command(({ tr }) => {
      sortedMatches.forEach(match => {
        tr.delete(match.from, match.to);
        tr.insertText(replaceTerm, match.from);
      });
      return true;
    }).run();
    
    setSearchStats({
      replaced: searchStats.replaced + matches.length,
      total: 0
    });
    setMatches([]);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setReplaceTerm('');
    setMatches([]);
    setCurrentMatchIndex(0);
    setSearchStats({ replaced: 0, total: 0 });
    
    // Clear selection
    editor?.chain().focus().setTextSelection(editor.state.selection.from).run();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          previousMatch();
        } else {
          nextMatch();
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentMatchIndex, matches]);

  // Auto-search on term change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        performSearch();
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, caseSensitive, wholeWord, useRegex, searchInSelection]);

  return (
    <Dialog 
      open={open || isOpen} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FindReplace />
            <Typography variant="h6">Advanced Search & Replace</Typography>
            <ToggleButtonGroup
              value={searchMode}
              exclusive
              onChange={(e, newMode) => newMode && setSearchMode(newMode)}
              size="small"
            >
              <ToggleButton value="find">
                <Search /> Find
              </ToggleButton>
              <ToggleButton value="replace">
                <SwapVert /> Replace
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search input */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Find"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Previous match (Shift+Enter)">
                <IconButton 
                  onClick={previousMatch}
                  disabled={matches.length === 0}
                >
                  <ArrowUpward />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next match (Enter)">
                <IconButton 
                  onClick={nextMatch}
                  disabled={matches.length === 0}
                >
                  <ArrowDownward />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Replace input (conditional) */}
          {searchMode === 'replace' && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Replace with"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SwapVert sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              <Button
                variant="outlined"
                onClick={replaceCurrent}
                disabled={matches.length === 0}
              >
                Replace
              </Button>
              <Button
                variant="contained"
                onClick={replaceAll}
                disabled={matches.length === 0}
              >
                Replace All
              </Button>
            </Box>
          )}

          {/* Search options */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Search Options
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    size="small"
                  />
                }
                label="Case sensitive"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={wholeWord}
                    onChange={(e) => setWholeWord(e.target.checked)}
                    size="small"
                    disabled={useRegex}
                  />
                }
                label="Whole word"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Code fontSize="small" />
                    Regular expression
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={searchInSelection}
                    onChange={(e) => setSearchInSelection(e.target.checked)}
                    size="small"
                  />
                }
                label="Search in selection"
              />
            </Box>
          </Paper>

          {/* Search statistics */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {matches.length > 0 ? (
              <>
                <Chip
                  label={`Match ${currentMatchIndex + 1} of ${matches.length}`}
                  color="primary"
                  variant="outlined"
                />
                {searchStats.replaced > 0 && (
                  <Chip
                    label={`${searchStats.replaced} replaced`}
                    color="success"
                    icon={<CheckCircle />}
                  />
                )}
              </>
            ) : searchTerm ? (
              <Chip
                label="No matches found"
                color="error"
                variant="outlined"
                icon={<Cancel />}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Enter search term to begin
              </Typography>
            )}
          </Box>

          {/* Match preview */}
          {matches.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Match Preview
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                {matches.slice(0, 10).map((match, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 0.5,
                      backgroundColor: index === currentMatchIndex ? 'action.selected' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => highlightMatch(index)}
                  >
                    <Typography variant="body2" component="span">
                      ...{editor.state.doc.textBetween(
                        Math.max(0, match.from - 20),
                        match.from
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ backgroundColor: 'warning.light', fontWeight: 'bold' }}
                    >
                      {match.text}
                    </Typography>
                    <Typography variant="body2" component="span">
                      {editor.state.doc.textBetween(
                        match.to,
                        Math.min(editor.state.doc.content.size, match.to + 20)
                      )}...
                    </Typography>
                  </Box>
                ))}
                {matches.length > 10 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    ... and {matches.length - 10} more matches
                  </Typography>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={clearSearch}>Clear</Button>
        <Button onClick={onClose} variant="contained">Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedSearchReplace;
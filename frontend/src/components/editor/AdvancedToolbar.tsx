'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Typography
} from '@mui/material';
import {
  Upload,
  EmojiEmotions,
  Functions,
  FormatListNumbered,
  PostAdd
} from '@mui/icons-material';

interface AdvancedToolbarProps {
  editor: Editor | null;
  onHasUnsavedChanges: () => void;
  removeAllColors: (htmlContent: string) => string;
}

export const AdvancedToolbar: React.FC<AdvancedToolbarProps> = ({
  editor,
  onHasUnsavedChanges,
  removeAllColors
}) => {
  const clearAllColors = () => {
    if (!editor) return;

    setTimeout(() => {
      const htmlBefore = editor.getHTML();

      editor.chain().focus().selectAll().unsetColor().run();

      setTimeout(() => {
        const { tr } = editor.state;
        const { doc } = editor.state;

        doc.descendants((node, pos) => {
          if (node.type.name === 'text' && node.marks) {
            node.marks.forEach((mark) => {
              if (mark.type.name === 'textStyle' && mark.attrs.color) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
              }
            });
          }
        });

        if (tr.steps.length > 0) {
          editor.view.dispatch(tr);
        }

        setTimeout(() => {
          const html = editor.getHTML();
          const cleanedHtml = removeAllColors(html);

          if (html !== cleanedHtml) {
            editor.commands.setContent(cleanedHtml);
          }
        }, 50);
      }, 50);

      onHasUnsavedChanges();
    });
  };

  const generateTableOfContents = () => {
    const html = editor?.getHTML();
    if (!html) return;

    // Enhanced TOC detection - check for existing TOC more thoroughly
    const tocPatterns = [
      /table\s+of\s+contents/i,
      /contents\s*$/i,
      /toc\b/i,
      /outline/i
    ];

    const hasExistingToc = tocPatterns.some(pattern => pattern.test(html)) ||
                          html.includes('table-of-contents') ||
                          html.includes('toc-') ||
                          /<h[1-6][^>]*>\s*(table\s+of\s+contents|contents|toc)\s*<\/h[1-6]>/i.test(html);

    if (hasExistingToc) {
      alert('This document already contains a Table of Contents. The existing TOC from the database will be preserved.');
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const headers = tempDiv.querySelectorAll('h1, h2, h3, h4');

    if (headers.length === 0) {
      alert('No headings found to create a table of contents.');
      return;
    }

    let toc = '<div class="table-of-contents" style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; background: #f9f9f9;"><h2>Table of Contents</h2><ul style="list-style: none; padding-left: 0;">';

    headers.forEach((header, index) => {
      const level = parseInt(header.tagName.charAt(1));
      const text = header.textContent || '';
      const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat((level - 1));
      toc += `<li style="margin: 5px 0;">${indent}<a href="#heading-${index}" style="text-decoration: none; color: #1976d2;">${text}</a></li>`;
    });

    toc += '</ul></div>';

    editor?.commands.focus('start');
    editor?.chain().insertContent(toc).run();
    onHasUnsavedChanges();
  };

  const insertDocumentTemplate = () => {
    const template = `<h1>Executive Summary</h1>
<p>Provide a brief overview of the document's purpose and key points.</p>

<h1>1. Introduction</h1>
<p>Background and context for this document.</p>

<h2>1.1 Purpose</h2>
<p>Explain the specific purpose and objectives.</p>

<h2>1.2 Scope</h2>
<p>Define what is and isn't covered in this document.</p>

<h1>2. Body Content</h1>
<p>Main content goes here.</p>

<h2>2.1 Key Points</h2>
<ul>
<li>First key point</li>
<li>Second key point</li>
<li>Third key point</li>
</ul>

<h2>2.2 Details</h2>
<p>Additional details and explanations.</p>

<h1>3. Conclusion</h1>
<p>Summary and final thoughts.</p>

<h1>4. References</h1>
<p>List any references or citations.</p>`;

    editor?.commands.setContent(template);
    onHasUnsavedChanges();
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      {/* Headings */}
      <ButtonGroup size="small">
        <Button
          variant={editor?.isActive('heading', { level: 1 }) ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          variant={editor?.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          variant={editor?.isActive('heading', { level: 3 }) ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          variant={editor?.isActive('heading', { level: 4 }) ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          H4
        </Button>
        <Button
          variant={editor?.isActive('paragraph') ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          P
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Lists */}
      <ButtonGroup size="small">
        <Button
          variant={editor?.isActive('bulletList') ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          • List
        </Button>
        <Button
          variant={editor?.isActive('orderedList') ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1. List
        </Button>
        <Button
          variant={editor?.isActive('taskList') ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          title="Task List"
        >
          ☐ Tasks
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Special Elements */}
      <ButtonGroup size="small">
        <Button
          variant={editor?.isActive('blockquote') ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Block Quote"
        >
          " Quote
        </Button>
        <Button
          variant={editor?.isActive('codeBlock') ? 'contained' : 'outlined'}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          {'</>'}
        </Button>
        <Button
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          ―
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Table Operations */}
      <ButtonGroup size="small">
        <Button
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            }
          }}
          title="Insert Table (3x3)"
        >
          📊 Table
        </Button>
        <Button
          onClick={() => {
            if (editor && editor.can().addColumnAfter()) {
              editor.chain().focus().addColumnAfter().run();
            }
          }}
          disabled={!editor || !editor.can().addColumnAfter()}
          title="Add Column After"
        >
          +Col
        </Button>
        <Button
          onClick={() => {
            if (editor && editor.can().addRowAfter()) {
              editor.chain().focus().addRowAfter().run();
            }
          }}
          disabled={!editor || !editor.can().addRowAfter()}
          title="Add Row After"
        >
          +Row
        </Button>
        <Button
          onClick={() => {
            if (editor && editor.can().deleteTable()) {
              editor.chain().focus().deleteTable().run();
            }
          }}
          disabled={!editor || !editor.can().deleteTable()}
          title="Delete Table"
        >
          ×Table
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Media & Links */}
      <ButtonGroup size="small">
        <Button
          component="label"
          title="Upload Image"
          startIcon={<Upload />}
        >
          Image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const src = event.target?.result as string;
                  editor?.chain().focus().setImage({ src }).run();
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </Button>
        <Button
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor?.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="Insert Image from URL"
        >
          🖼️ URL
        </Button>
        <Button
          variant={editor?.isActive('link') ? 'contained' : 'outlined'}
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor?.chain().focus().setLink({ href: url }).run();
            }
          }}
          title="Insert Link"
        >
          🔗 Link
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Special Characters & Emoji */}
      <ButtonGroup size="small">
        <Button
          onClick={() => {
            const emojis = ['😀', '😎', '👍', '❤️', '✅', '⭐', '🔥', '💡', '📌', '⚠️', '❌', '➡️'];
            const selected = window.prompt(`Enter emoji or select: ${emojis.join(' ')}`);
            if (selected) {
              editor?.chain().focus().insertContent(selected).run();
            }
          }}
          title="Insert Emoji"
          startIcon={<EmojiEmotions />}
        >
          Emoji
        </Button>
        <Button
          onClick={() => {
            const symbols = ['©', '®', '™', '°', '±', '×', '÷', '≠', '≤', '≥', '∞', '√', 'π', 'α', 'β', 'Δ', 'Σ', '§', '¶', '†', '‡', '•', '…', '€', '£', '¥', '¢'];
            const selected = window.prompt(`Enter symbol or copy: ${symbols.join(' ')}`);
            if (selected) {
              editor?.chain().focus().insertContent(selected).run();
            }
          }}
          title="Insert Special Character"
          startIcon={<Functions />}
        >
          Symbol
        </Button>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Document Formatting Tools */}
      <ButtonGroup size="small">
        <Button
          onClick={generateTableOfContents}
          title="Generate Table of Contents"
          startIcon={<FormatListNumbered />}
        >
          TOC
        </Button>
        <Button
          onClick={insertDocumentTemplate}
          title="Insert Document Template"
          startIcon={<PostAdd />}
        >
          Template
        </Button>
        <Button
          onClick={clearAllColors}
          title="Remove All Text Colors"
          sx={{ backgroundColor: '#ffebee' }}
        >
          Clear Colors
        </Button>
      </ButtonGroup>
    </Box>
  );
};
import { Extension } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import TypographyExtension from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { ChangeTracking } from '@/lib/tiptap-change-tracking';
import { SupplementMark } from '@/lib/tiptap-supplement-mark';
import { CommentMark } from '@/lib/tiptap-comments';
import { FootnoteReference, FootnoteContent, Footnotes } from '@/lib/tiptap-footnotes';
import { CrossReferences } from '@/lib/tiptap-cross-references';
import { LineHeight } from '@/lib/tiptap-line-height';
import { Indent } from '@/lib/tiptap-indent';
import { ParagraphSpacing } from '@/lib/tiptap-paragraph-spacing';

const lowlight = createLowlight(common);

// Custom extension to preserve inline styles
const PreserveStyles = Extension.create({
  name: 'preserveStyles',

  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph', 'listItem', 'blockquote'],
        attributes: {
          style: {
            default: null,
            parseHTML: element => {
              const style = element.getAttribute('style');
              return style || null;
            },
            renderHTML: attributes => {
              if (!attributes.style) {
                return {};
              }
              return {
                style: String(attributes.style),
              };
            },
          },
        },
      },
    ];
  },
});

// Auto-numbering extension - automatically insert numbered paragraphs on Enter
const AutoNumbering = Extension.create({
  name: 'autoNumbering',

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        console.log('🔍 🔍 🔍 AutoNumbering: Enter key pressed - EXTENSION IS ACTIVE');

        const { state } = editor;
        const { $from } = state.selection;

        console.log('Full state:', state);
        console.log('Selection:', state.selection);

        // Get the parent paragraph node
        let currentNode = $from.parent;
        console.log('🔍 Current node type:', currentNode.type.name);

        // Only process if we're in a paragraph
        if (currentNode.type.name !== 'paragraph') {
          console.log('❌ Not in a paragraph, skipping');
          return false;
        }

        // Get the full text content of the paragraph
        const paraText = currentNode.textContent;
        console.log('🔍 Paragraph text:', JSON.stringify(paraText));
        console.log('🔍 Paragraph text length:', paraText.length);
        console.log('🔍 First 50 chars:', JSON.stringify(paraText.substring(0, 50)));

        // Check if paragraph has a strong mark (bold) at the beginning with numbers
        const firstChild = currentNode.firstChild;
        console.log('🔍 First child:', firstChild);
        console.log('🔍 First child type:', firstChild?.type.name);

        // Check if first child has strong mark
        let hasStrongMark = false;
        if (firstChild && firstChild.marks) {
          hasStrongMark = firstChild.marks.some((mark: any) => mark.type.name === 'strong');
          console.log('🔍 Has strong mark:', hasStrongMark);
        }

        // Try to extract number from the text (works with or without strong tag)
        let numberMatch = paraText.match(/^(\d+(?:\.\d+)+)\.\s/);
        console.log('🔍 Number match (with space):', numberMatch);

        if (!numberMatch) {
          // Try without requiring space after period
          numberMatch = paraText.match(/^(\d+(?:\.\d+)+)\./);
          console.log('🔍 Number match (no space required):', numberMatch);
        }

        if (!numberMatch) {
          console.log('❌ No number pattern found, skipping');
          return false; // Not a numbered paragraph
        }

        // If we found a match but there's no strong mark, user typed it manually
        // We should still process it
        console.log('✅ Found numbered paragraph (has strong mark:', hasStrongMark, ')');

        const currentNumber = numberMatch[1];
        const parts = currentNumber.split('.').map(Number);
        console.log('✅ Found numbered paragraph:', currentNumber, 'Parts:', parts);

        // Check if we're at the end of an empty numbered paragraph (just the number)
        if (paraText.trim() === `${currentNumber}.`) {
          console.log('🚪 Exit numbering mode - empty paragraph');
          // Exit numbering mode - user pressed Enter on empty numbered line
          return editor.commands.clearNodes();
        }

        // Determine current indent level from style
        const styleAttr = currentNode.attrs.style || '';
        const marginMatch = styleAttr.match(/margin-left:\s*(\d+)px/);
        const currentIndent = marginMatch ? parseInt(marginMatch[1]) : 0;
        console.log('🔍 Current indent:', currentIndent);

        // Calculate next number (SAME LEVEL, INCREMENT - like Word/Google Docs)
        let nextNumber: string;
        let nextIndent: number;

        // Increment the last number part and keep same indent level
        parts[parts.length - 1]++;
        nextNumber = parts.join('.');
        nextIndent = currentIndent;

        console.log('🔍 Same level increment - parts:', parts);

        console.log('➡️ Next number:', nextNumber, 'Next indent:', nextIndent);

        // Use TipTap's insertContent with HTML
        editor.commands.splitBlock();

        // Insert the numbered paragraph content
        const htmlContent = `<strong>${nextNumber}.</strong> `;

        console.log('📝 Inserting HTML content:', htmlContent);

        editor.commands.insertContent(htmlContent);

        // Apply indentation if needed
        if (nextIndent > 0) {
          editor.commands.updateAttributes('paragraph', {
            style: `margin-left: ${nextIndent}px`
          });
          console.log('📝 Applied indentation:', nextIndent);
        }

        console.log('✅ Numbered paragraph inserted');
        return true;
      },
    };
  },
});

export const createEditorConfig = (options: {
  content?: string;
  trackChanges?: boolean;
  userId?: string;
  userName?: string;
  onUpdate?: (content: string) => void;
  onSelectionUpdate?: () => void;
  onTransaction?: () => void;
}) => {
  const {
    content = '',
    trackChanges = true,
    userId = 'anonymous',
    userName = 'Anonymous User',
    onUpdate,
    onSelectionUpdate,
    onTransaction,
  } = options;

  return {
    immediatelyRender: false,
    editable: true,  // Explicitly set editor as editable
    content,
    parseOptions: {
      preserveWhitespace: 'full' as 'full',
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
        contenteditable: 'true',  // Ensure contenteditable attribute is set
      },
      transformPastedHTML(html) {
        return html;
      },
    },
    extensions: [
      PreserveStyles,
      AutoNumbering,
      StarterKit.configure({
        codeBlock: false,
        link: false, // Disable link from StarterKit to avoid duplicates
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        validate: href => /^(https?:\/\/|#)/.test(href),
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-fixed',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      Color,
      TextStyle,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily,
      TypographyExtension,
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      ChangeTracking.configure({
        trackChanges: trackChanges,
        showChanges: true,
        changes: [],
        userId,
        userName,
      }),
      SupplementMark.configure({
        HTMLAttributes: {
          class: 'supplement-mark',
        },
      }),
      CommentMark.configure({
        HTMLAttributes: {
          class: 'comment-mark',
        },
      }),
      FootnoteReference,
      FootnoteContent,
      Footnotes,
      CrossReferences,
      LineHeight.configure({
        types: ['paragraph', 'heading'],
        heights: ['1', '1.15', '1.5', '2', '2.5', '3'],
        defaultHeight: '1.5',
      }),
      Indent.configure({
        types: ['paragraph', 'heading', 'listItem'],
        minIndent: 0,
        maxIndent: 400,
        defaultIndent: 40,
      }),
      ParagraphSpacing.configure({
        types: ['paragraph', 'heading'],
      }),
    ],
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    onSelectionUpdate: onSelectionUpdate,
    onTransaction: onTransaction,
  };
};

export const useDocumentEditor = (options: Parameters<typeof createEditorConfig>[0]) => {
  // Don't include options.content in dependencies to prevent editor recreation
  // Content should be set via setContent command, not by recreating the editor
  return useEditor(createEditorConfig(options));
};
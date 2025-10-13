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
        console.log('🔍 AutoNumbering: Enter key pressed');

        const { state } = editor;
        const { $from } = state.selection;

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
        console.log('🔍 Paragraph text:', paraText);

        // Check if paragraph starts with a number pattern like "1.1.1. "
        const numberMatch = paraText.match(/^(\d+(?:\.\d+)+)\.\s/);
        console.log('🔍 Number match:', numberMatch);

        if (!numberMatch) {
          console.log('❌ No number pattern found, skipping');
          return false; // Not a numbered paragraph
        }

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

        // Calculate next number (one level deeper)
        let nextNumber: string;
        let nextIndent: number;

        if (parts.length === 3) {
          // 1.1.1 → 1.1.1.1 (go deeper)
          nextNumber = `${currentNumber}.1`;
          nextIndent = 40;
        } else if (parts.length === 4) {
          // 1.1.1.1 → 1.1.1.1.1 (go deeper)
          nextNumber = `${currentNumber}.1`;
          nextIndent = 80;
        } else if (parts.length === 5) {
          // 1.1.1.1.1 → 1.1.1.1.1.1 (go deeper)
          nextNumber = `${currentNumber}.1`;
          nextIndent = 120;
        } else if (parts.length === 6) {
          // Very deep - increment at same level
          parts[parts.length - 1]++;
          nextNumber = parts.join('.');
          nextIndent = currentIndent;
        } else {
          // Default
          nextNumber = `${currentNumber}.1`;
          nextIndent = currentIndent + 40;
        }

        console.log('➡️ Next number:', nextNumber, 'Next indent:', nextIndent);

        // Split the current paragraph first (standard Enter behavior)
        editor.commands.splitBlock();

        // After a short delay, replace the empty paragraph with our numbered one
        setTimeout(() => {
          const currentHTML = editor.getHTML();
          console.log('📝 Current HTML before replacement:', currentHTML.substring(currentHTML.length - 200));

          // Create the new numbered paragraph content
          const newContent = nextIndent > 0
            ? `<p style="margin-left: ${nextIndent}px;"><strong>${nextNumber}.</strong> </p>`
            : `<p><strong>${nextNumber}.</strong> </p>`;

          // Replace the last empty paragraph with our numbered content
          const updatedHTML = currentHTML.replace(
            /<p([^>]*)>\s*<\/p>\s*$/,
            newContent
          );

          console.log('📝 Updated HTML after replacement:', updatedHTML.substring(updatedHTML.length - 200));

          // Set the updated content
          editor.commands.setContent(updatedHTML, false);

          // Focus the editor at the end
          editor.commands.focus('end');

          console.log('✅ Numbered paragraph inserted');
        }, 10);

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
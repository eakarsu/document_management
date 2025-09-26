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
    content,
    parseOptions: {
      preserveWhitespace: 'full' as 'full',
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
      transformPastedHTML(html) {
        return html;
      },
    },
    extensions: [
      PreserveStyles,
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
  return useEditor(createEditorConfig(options), [options.content]);
};
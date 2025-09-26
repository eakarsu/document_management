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
import { Extension } from '@tiptap/core';
import { ChangeTracking, type Change } from '@/lib/tiptap-change-tracking';
import { SupplementMark } from '@/lib/tiptap-supplement-mark';

interface UseEditorConfigProps {
  user: any;
  trackChanges: boolean;
  showChanges: boolean;
  changes: Change[];
  onChangeAdded: (change: Change) => void;
  onUpdate: (props: { editor: any }) => void;
}

export const useEditorConfig = ({
  user,
  trackChanges,
  showChanges,
  changes,
  onChangeAdded,
  onUpdate
}: UseEditorConfigProps) => {
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

  const editor = useEditor({
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
      transformPastedHTML(html) {
        // Preserve the HTML as-is without stripping styles
        return html;
      },
    },
    extensions: [
      PreserveStyles, // Add custom extension to preserve inline styles
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
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
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'relative',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Color,
      TextStyle.configure({
        HTMLAttributes: {
          // Preserve inline styles
          style: true,
        },
      }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TypographyExtension,
      CharacterCount.configure({
        limit: null,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-md p-4 my-2 overflow-x-auto',
        },
      }),
      ChangeTracking.configure({
        userId: user?.id || 'unknown',
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        trackChanges: trackChanges,
        showChanges: showChanges,
        changes: changes,
        onChangeAdded: onChangeAdded,
      }),
      SupplementMark,
    ],
    content: '', // Start with empty content, will be loaded via useEffect
    onUpdate,
  });

  return editor;
};
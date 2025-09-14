import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface Footnote {
  id: string;
  number: number;
  content: string;
  type: 'footnote' | 'endnote';
}

export interface FootnotesOptions {
  HTMLAttributes: Record<string, any>;
  footnotes: Footnote[];
  onFootnoteAdd?: (footnote: Footnote) => void;
  onFootnoteUpdate?: (footnote: Footnote) => void;
  onFootnoteDelete?: (footnoteId: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnotes: {
      insertFootnote: (content: string, type?: 'footnote' | 'endnote') => ReturnType;
      updateFootnote: (id: string, content: string) => ReturnType;
      deleteFootnote: (id: string) => ReturnType;
      insertFootnoteReference: (footnoteId: string) => ReturnType;
    };
  }
}

const footnotesPluginKey = new PluginKey('footnotes');

// Footnote Reference Node (the superscript number in the text)
export const FootnoteReference = Node.create({
  name: 'footnoteReference',
  
  group: 'inline',
  inline: true,
  atom: true,
  
  addAttributes() {
    return {
      footnoteId: {
        default: null,
        parseHTML: element => element.getAttribute('data-footnote-id'),
        renderHTML: attributes => {
          if (!attributes.footnoteId) {
            return {};
          }
          return {
            'data-footnote-id': attributes.footnoteId,
          };
        },
      },
      footnoteNumber: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-footnote-number') || '1'),
        renderHTML: attributes => ({
          'data-footnote-number': attributes.footnoteNumber,
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote-id]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const number = HTMLAttributes['data-footnote-number'] || '1';
    return ['sup', mergeAttributes(HTMLAttributes, {
      class: 'footnote-reference',
      style: 'color: #0066cc; cursor: pointer; font-weight: bold;',
      title: 'Click to view footnote'
    }), `[${number}]`];
  },
  
  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement('sup');
      dom.className = 'footnote-reference';
      dom.style.color = '#0066cc';
      dom.style.cursor = 'pointer';
      dom.style.fontWeight = 'bold';
      dom.setAttribute('data-footnote-id', node.attrs.footnoteId);
      dom.setAttribute('data-footnote-number', node.attrs.footnoteNumber);
      dom.textContent = `[${node.attrs.footnoteNumber}]`;
      
      // Add click handler to jump to footnote
      dom.addEventListener('click', () => {
        const footnoteEl = document.getElementById(`footnote-${node.attrs.footnoteId}`);
        if (footnoteEl) {
          footnoteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          footnoteEl.style.backgroundColor = '#ffffcc';
          setTimeout(() => {
            footnoteEl.style.backgroundColor = '';
          }, 2000);
        }
      });
      
      return {
        dom,
      };
    };
  },
});

// Footnote Content Node (the actual footnote text at the bottom)
export const FootnoteContent = Node.create({
  name: 'footnoteContent',
  
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      footnoteId: {
        default: null,
        parseHTML: element => element.getAttribute('data-footnote-id'),
        renderHTML: attributes => {
          if (!attributes.footnoteId) {
            return {};
          }
          return {
            'data-footnote-id': attributes.footnoteId,
            'id': `footnote-${attributes.footnoteId}`,
          };
        },
      },
      footnoteNumber: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-footnote-number') || '1'),
        renderHTML: attributes => ({
          'data-footnote-number': attributes.footnoteNumber,
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div.footnote-content',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const number = HTMLAttributes['data-footnote-number'] || '1';
    return ['div', mergeAttributes(HTMLAttributes, {
      class: 'footnote-content',
      style: 'margin: 10px 0; padding: 5px; border-left: 3px solid #ccc; font-size: 0.9em;'
    }), 
      ['span', { style: 'font-weight: bold; margin-right: 8px;' }, `${number}.`],
      ['span', 0]
    ];
  },
});

// Main Footnotes Extension
export const Footnotes = Node.create<FootnotesOptions>({
  name: 'footnotes',
  
  addOptions() {
    return {
      HTMLAttributes: {},
      footnotes: [],
    };
  },
  
  addCommands() {
    return {
      insertFootnote: (content: string, type: 'footnote' | 'endnote' = 'footnote') => ({ commands, editor, tr }) => {
        const footnoteId = `fn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const footnoteNumber = this.options.footnotes.length + 1;
        
        const footnote: Footnote = {
          id: footnoteId,
          number: footnoteNumber,
          content,
          type,
        };
        
        // Add footnote to options
        if (this.options.onFootnoteAdd) {
          this.options.onFootnoteAdd(footnote);
        }
        
        // Insert reference at current position
        const { from } = editor.state.selection;
        const referenceNode = editor.schema.nodes.footnoteReference.create({
          footnoteId,
          footnoteNumber,
        });
        
        tr.insert(from, referenceNode);
        
        // If it's a footnote (not endnote), add content at the end of current page
        // For endnotes, they would be added at the end of the document
        if (type === 'footnote') {
          // Find the next page break or end of document
          const doc = editor.state.doc;
          let insertPos = doc.content.size;
          
          // Insert horizontal rule if not already present
          const hrNode = editor.schema.nodes.horizontalRule?.create();
          if (hrNode) {
            tr.insert(insertPos, hrNode);
            insertPos += 1;
          }
          
          // Insert footnote content
          const footnoteContentNode = editor.schema.nodes.footnoteContent.create(
            { footnoteId, footnoteNumber },
            editor.schema.text(content)
          );
          tr.insert(insertPos, footnoteContentNode);
        }
        
        return true;
      },
      
      updateFootnote: (id: string, content: string) => ({ editor }) => {
        const footnote = this.options.footnotes.find(f => f.id === id);
        if (footnote && this.options.onFootnoteUpdate) {
          this.options.onFootnoteUpdate({
            ...footnote,
            content,
          });
        }
        
        // Update the footnote content in the document
        const { doc } = editor.state;
        let found = false;
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'footnoteContent' && node.attrs.footnoteId === id) {
            editor.chain()
              .focus()
              .setTextSelection(pos + 1)
              .deleteRange({ from: pos + 1, to: pos + node.nodeSize - 1 })
              .insertContent(content)
              .run();
            found = true;
            return false;
          }
        });
        
        return found;
      },
      
      deleteFootnote: (id: string) => ({ editor, tr }) => {
        if (this.options.onFootnoteDelete) {
          this.options.onFootnoteDelete(id);
        }
        
        const { doc } = editor.state;
        const positions: { from: number; to: number }[] = [];
        
        // Find all references and content for this footnote
        doc.descendants((node, pos) => {
          if ((node.type.name === 'footnoteReference' || node.type.name === 'footnoteContent') 
              && node.attrs.footnoteId === id) {
            positions.push({ from: pos, to: pos + node.nodeSize });
          }
        });
        
        // Delete in reverse order to maintain positions
        positions.sort((a, b) => b.from - a.from);
        positions.forEach(({ from, to }) => {
          tr.delete(from, to);
        });
        
        // Renumber remaining footnotes
        this.renumberFootnotes(editor);
        
        return true;
      },
      
      insertFootnoteReference: (footnoteId: string) => ({ commands, editor }) => {
        const footnote = this.options.footnotes.find(f => f.id === footnoteId);
        if (!footnote) return false;
        
        return commands.insertContent({
          type: 'footnoteReference',
          attrs: {
            footnoteId,
            footnoteNumber: footnote.number,
          },
        });
      },
    };
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: footnotesPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, old) => {
            // Update decorations if needed
            return old.map(tr.mapping, tr.doc);
          },
        },
      }),
    ];
  },
  
  // Helper method to renumber footnotes after deletion
  renumberFootnotes(editor: any) {
    const { doc } = editor.state;
    const footnoteRefs: { id: string; pos: number }[] = [];
    const footnoteContents: { id: string; pos: number }[] = [];
    
    // Collect all footnote references and contents
    doc.descendants((node, pos) => {
      if (node.type.name === 'footnoteReference') {
        footnoteRefs.push({ id: node.attrs.footnoteId, pos });
      } else if (node.type.name === 'footnoteContent') {
        footnoteContents.push({ id: node.attrs.footnoteId, pos });
      }
    });
    
    // Sort by position
    footnoteRefs.sort((a, b) => a.pos - b.pos);
    
    // Renumber
    footnoteRefs.forEach((ref, index) => {
      const newNumber = index + 1;
      const content = footnoteContents.find(c => c.id === ref.id);
      
      // Update reference number
      editor.chain()
        .focus()
        .setTextSelection(ref.pos)
        .updateAttributes('footnoteReference', { footnoteNumber: newNumber })
        .run();
      
      // Update content number
      if (content) {
        editor.chain()
          .focus()
          .setTextSelection(content.pos)
          .updateAttributes('footnoteContent', { footnoteNumber: newNumber })
          .run();
      }
    });
  },
});

export default Footnotes;
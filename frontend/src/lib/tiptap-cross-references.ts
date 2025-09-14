import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export interface CrossReference {
  id: string;
  targetId: string;
  targetType: 'heading' | 'figure' | 'table' | 'section' | 'footnote' | 'page';
  targetText: string;
  displayText?: string;
}

export interface CrossReferencesOptions {
  HTMLAttributes: Record<string, any>;
  onReferenceClick?: (reference: CrossReference) => void;
  autoUpdate?: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    crossReferences: {
      insertCrossReference: (reference: Omit<CrossReference, 'id'>) => ReturnType;
      updateCrossReferences: () => ReturnType;
      goToReference: (targetId: string) => ReturnType;
    };
  }
}

const crossReferencesPluginKey = new PluginKey('crossReferences');

export const CrossReferences = Node.create<CrossReferencesOptions>({
  name: 'crossReference',
  
  group: 'inline',
  inline: true,
  atom: true,
  
  addOptions() {
    return {
      HTMLAttributes: {},
      autoUpdate: true,
    };
  },
  
  addAttributes() {
    return {
      referenceId: {
        default: null,
        parseHTML: element => element.getAttribute('data-reference-id'),
        renderHTML: attributes => {
          if (!attributes.referenceId) {
            return {};
          }
          return {
            'data-reference-id': attributes.referenceId,
          };
        },
      },
      targetId: {
        default: null,
        parseHTML: element => element.getAttribute('data-target-id'),
        renderHTML: attributes => ({
          'data-target-id': attributes.targetId,
        }),
      },
      targetType: {
        default: 'section',
        parseHTML: element => element.getAttribute('data-target-type'),
        renderHTML: attributes => ({
          'data-target-type': attributes.targetType,
        }),
      },
      displayText: {
        default: '',
        parseHTML: element => element.getAttribute('data-display-text') || element.textContent,
        renderHTML: attributes => ({
          'data-display-text': attributes.displayText,
        }),
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'a[data-reference-id]',
      },
      {
        tag: 'span[data-reference-id]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const displayText = HTMLAttributes['data-display-text'] || 'Reference';
    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      href: `#${HTMLAttributes['data-target-id']}`,
      class: 'cross-reference',
      style: 'color: #0066cc; text-decoration: underline; cursor: pointer;',
      title: `Go to ${HTMLAttributes['data-target-type']}`
    }), displayText];
  },
  
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('a');
      dom.className = 'cross-reference';
      dom.style.color = '#0066cc';
      dom.style.textDecoration = 'underline';
      dom.style.cursor = 'pointer';
      dom.setAttribute('data-reference-id', node.attrs.referenceId);
      dom.setAttribute('data-target-id', node.attrs.targetId);
      dom.setAttribute('data-target-type', node.attrs.targetType);
      dom.href = `#${node.attrs.targetId}`;
      
      // Update display text based on target
      const updateDisplayText = () => {
        const targetId = node.attrs.targetId;
        const { doc } = editor.state;
        let targetText = node.attrs.displayText;
        
        // Find the target element in the document
        doc.descendants((node, pos) => {
          // Check headings
          if (node.type.name.includes('heading')) {
            const id = node.attrs.id || `heading-${pos}`;
            if (id === targetId) {
              const headingNumber = this.extractHeadingNumber(node.textContent);
              targetText = headingNumber ? `Section ${headingNumber}` : node.textContent;
              return false;
            }
          }
          
          // Check for other elements with IDs
          if (node.attrs && node.attrs.id === targetId) {
            targetText = this.formatReferenceText(node.attrs.targetType, node.textContent);
            return false;
          }
        });
        
        dom.textContent = targetText || 'Reference';
      };
      
      updateDisplayText();
      
      // Handle click
      dom.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = node.attrs.targetId;
        
        // Find and scroll to target
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Highlight target temporarily
          targetElement.style.backgroundColor = '#ffffcc';
          setTimeout(() => {
            targetElement.style.backgroundColor = '';
          }, 2000);
        } else {
          // Search in the editor content
          const { doc } = editor.state;
          let targetPos: number | null = null;
          
          doc.descendants((node, pos) => {
            if (node.attrs && (node.attrs.id === targetId || 
                (node.type.name.includes('heading') && `heading-${pos}` === targetId))) {
              targetPos = pos;
              return false;
            }
          });
          
          if (targetPos !== null) {
            editor.chain().focus().setTextSelection(targetPos).run();
          }
        }
        
        if (this.options.onReferenceClick) {
          this.options.onReferenceClick({
            id: node.attrs.referenceId,
            targetId: node.attrs.targetId,
            targetType: node.attrs.targetType,
            targetText: dom.textContent || '',
          });
        }
      });
      
      // Auto-update references if enabled
      if (this.options.autoUpdate) {
        const updateInterval = setInterval(updateDisplayText, 1000);
        
        return {
          dom,
          destroy() {
            clearInterval(updateInterval);
          },
        };
      }
      
      return {
        dom,
      };
    };
  },
  
  addCommands() {
    return {
      insertCrossReference: (reference: Omit<CrossReference, 'id'>) => ({ commands, editor }) => {
        const referenceId = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Find the target and get its text
        const { doc } = editor.state;
        let targetText = reference.displayText || '';
        
        if (!targetText) {
          doc.descendants((node, pos) => {
            if (node.attrs && node.attrs.id === reference.targetId) {
              targetText = this.formatReferenceText(reference.targetType, node.textContent);
              return false;
            }
            // Check headings without explicit IDs
            if (node.type.name.includes('heading')) {
              const id = node.attrs.id || `heading-${pos}`;
              if (id === reference.targetId) {
                const headingNumber = this.extractHeadingNumber(node.textContent);
                targetText = headingNumber ? `Section ${headingNumber}` : node.textContent;
                return false;
              }
            }
          });
        }
        
        return commands.insertContent({
          type: this.name,
          attrs: {
            referenceId,
            targetId: reference.targetId,
            targetType: reference.targetType,
            displayText: targetText || reference.targetText,
          },
        });
      },
      
      updateCrossReferences: () => ({ editor }) => {
        const { doc, tr } = editor.state;
        
        // Find all cross references and update their display text
        doc.descendants((node, pos) => {
          if (node.type.name === this.name) {
            const targetId = node.attrs.targetId;
            let newDisplayText = node.attrs.displayText;
            
            // Find the current text of the target
            doc.descendants((targetNode, targetPos) => {
              if (targetNode.attrs && targetNode.attrs.id === targetId) {
                newDisplayText = this.formatReferenceText(node.attrs.targetType, targetNode.textContent);
                return false;
              }
              // Check headings
              if (targetNode.type.name.includes('heading')) {
                const id = targetNode.attrs.id || `heading-${targetPos}`;
                if (id === targetId) {
                  const headingNumber = this.extractHeadingNumber(targetNode.textContent);
                  newDisplayText = headingNumber ? `Section ${headingNumber}` : targetNode.textContent;
                  return false;
                }
              }
            });
            
            // Update the attribute if changed
            if (newDisplayText !== node.attrs.displayText) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                displayText: newDisplayText,
              });
            }
          }
        });
        
        editor.view.dispatch(tr);
        return true;
      },
      
      goToReference: (targetId: string) => ({ editor }) => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Highlight target
          targetElement.style.backgroundColor = '#ffffcc';
          setTimeout(() => {
            targetElement.style.backgroundColor = '';
          }, 2000);
        } else {
          // Search in editor
          const { doc } = editor.state;
          let targetPos: number | null = null;
          
          doc.descendants((node, pos) => {
            if (node.attrs && node.attrs.id === targetId) {
              targetPos = pos;
              return false;
            }
          });
          
          if (targetPos !== null) {
            editor.chain().focus().setTextSelection(targetPos).run();
          }
        }
        
        return true;
      },
    };
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: crossReferencesPluginKey,
        props: {
          handleDOMEvents: {
            // Update references when document changes
            input: (view) => {
              if (this.options.autoUpdate) {
                setTimeout(() => {
                  view.dispatch(view.state.tr);
                }, 100);
              }
              return false;
            },
          },
        },
      }),
    ];
  },
  
  // Helper methods
  extractHeadingNumber(text: string): string | null {
    const match = text.match(/^(\d+(?:\.\d+)*)/);
    return match ? match[1] : null;
  },
  
  formatReferenceText(type: string, text: string): string {
    const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    
    switch (type) {
      case 'heading':
      case 'section':
        const number = this.extractHeadingNumber(text);
        return number ? `Section ${number}` : truncatedText;
      case 'figure':
        return `Figure ${truncatedText}`;
      case 'table':
        return `Table ${truncatedText}`;
      case 'footnote':
        return `Footnote ${truncatedText}`;
      case 'page':
        return `Page ${truncatedText}`;
      default:
        return truncatedText;
    }
  },
});

export default CrossReferences;
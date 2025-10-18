import { Extension } from '@tiptap/core';

export interface IndentOptions {
  types: string[];
  minIndent: number;
  maxIndent: number;
  defaultIndent: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
      setIndent: (indent: number) => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      minIndent: 0,
      maxIndent: 400,
      defaultIndent: 40,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const marginLeft = element.style.marginLeft;
              return marginLeft ? parseInt(marginLeft) : 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { $from, $to } = selection;

        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            const newIndent = Math.min(
              currentIndent + this.options.defaultIndent,
              this.options.maxIndent
            );

            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: newIndent,
              });
            }
          }
        });

        return true;
      },

      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { $from, $to } = selection;

        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            const newIndent = Math.max(
              currentIndent - this.options.defaultIndent,
              this.options.minIndent
            );

            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: newIndent,
              });
            }
          }
        });

        return true;
      },

      setIndent: (indent: number) => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { $from, $to } = selection;

        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: Math.max(
                  this.options.minIndent,
                  Math.min(indent, this.options.maxIndent)
                ),
              });
            }
          }
        });

        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});

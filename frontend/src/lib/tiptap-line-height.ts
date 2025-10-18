import { Extension } from '@tiptap/core';

export interface LineHeightOptions {
  types: string[];
  heights: string[];
  defaultHeight: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (height: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      heights: ['1', '1.15', '1.5', '2', '2.5', '3'],
      defaultHeight: '1.5',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (height: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { lineHeight: height })
        );
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every(type =>
          commands.resetAttributes(type, 'lineHeight')
        );
      },
    };
  },
});

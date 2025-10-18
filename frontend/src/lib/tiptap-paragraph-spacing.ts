import { Extension } from '@tiptap/core';

export interface ParagraphSpacingOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setParagraphSpacingBefore: (spacing: string) => ReturnType;
      setParagraphSpacingAfter: (spacing: string) => ReturnType;
      setFirstLineIndent: (indent: string) => ReturnType;
      setHangingIndent: (indent: string) => ReturnType;
      setKeepWithNext: (keep: boolean) => ReturnType;
      setPageBreakBefore: (pageBreak: boolean) => ReturnType;
    };
  }
}

export const ParagraphSpacing = Extension.create<ParagraphSpacingOptions>({
  name: 'paragraphSpacing',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          spacingBefore: {
            default: null,
            parseHTML: element => element.style.marginTop || null,
            renderHTML: attributes => {
              if (!attributes.spacingBefore) return {};
              return { style: `margin-top: ${attributes.spacingBefore}` };
            },
          },
          spacingAfter: {
            default: null,
            parseHTML: element => element.style.marginBottom || null,
            renderHTML: attributes => {
              if (!attributes.spacingAfter) return {};
              return { style: `margin-bottom: ${attributes.spacingAfter}` };
            },
          },
          firstLineIndent: {
            default: null,
            parseHTML: element => element.style.textIndent || null,
            renderHTML: attributes => {
              if (!attributes.firstLineIndent) return {};
              return { style: `text-indent: ${attributes.firstLineIndent}` };
            },
          },
          hangingIndent: {
            default: null,
            parseHTML: element => {
              const paddingLeft = element.style.paddingLeft;
              const textIndent = element.style.textIndent;
              if (paddingLeft && textIndent && textIndent.startsWith('-')) {
                return paddingLeft;
              }
              return null;
            },
            renderHTML: attributes => {
              if (!attributes.hangingIndent) return {};
              return {
                style: `padding-left: ${attributes.hangingIndent}; text-indent: -${attributes.hangingIndent}`
              };
            },
          },
          keepWithNext: {
            default: false,
            parseHTML: element => element.style.pageBreakAfter === 'avoid',
            renderHTML: attributes => {
              if (!attributes.keepWithNext) return {};
              return { style: 'page-break-after: avoid' };
            },
          },
          pageBreakBefore: {
            default: false,
            parseHTML: element => element.style.pageBreakBefore === 'always',
            renderHTML: attributes => {
              if (!attributes.pageBreakBefore) return {};
              return { style: 'page-break-before: always' };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacingBefore: (spacing: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { spacingBefore: spacing })
        );
      },
      setParagraphSpacingAfter: (spacing: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { spacingAfter: spacing })
        );
      },
      setFirstLineIndent: (indent: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { firstLineIndent: indent })
        );
      },
      setHangingIndent: (indent: string) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { hangingIndent: indent })
        );
      },
      setKeepWithNext: (keep: boolean) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { keepWithNext: keep })
        );
      },
      setPageBreakBefore: (pageBreak: boolean) => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { pageBreakBefore: pageBreak })
        );
      },
    };
  },
});

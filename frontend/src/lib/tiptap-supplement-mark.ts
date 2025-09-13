import { Mark, mergeAttributes } from '@tiptap/core';

export interface SupplementMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    supplementMark: {
      setSupplementMark: (attributes?: {
        class?: string;
        'data-supplement'?: string;
        'data-section'?: string;
        'data-action'?: string;
        'data-rationale'?: string;
      }) => ReturnType;
      toggleSupplementMark: (attributes?: {
        class?: string;
        'data-supplement'?: string;
        'data-section'?: string;
        'data-action'?: string;
        'data-rationale'?: string;
      }) => ReturnType;
      unsetSupplementMark: () => ReturnType;
    };
  }
}

export const SupplementMark = Mark.create<SupplementMarkOptions>({
  name: 'supplementMark',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return {};
          }
          return { class: attributes.class };
        },
      },
      'data-supplement': {
        default: null,
        parseHTML: element => element.getAttribute('data-supplement'),
        renderHTML: attributes => {
          if (!attributes['data-supplement']) {
            return {};
          }
          return { 'data-supplement': attributes['data-supplement'] };
        },
      },
      'data-section': {
        default: null,
        parseHTML: element => element.getAttribute('data-section'),
        renderHTML: attributes => {
          if (!attributes['data-section']) {
            return {};
          }
          return { 'data-section': attributes['data-section'] };
        },
      },
      'data-action': {
        default: null,
        parseHTML: element => element.getAttribute('data-action'),
        renderHTML: attributes => {
          if (!attributes['data-action']) {
            return {};
          }
          return { 'data-action': attributes['data-action'] };
        },
      },
      'data-rationale': {
        default: null,
        parseHTML: element => element.getAttribute('data-rationale'),
        renderHTML: attributes => {
          if (!attributes['data-rationale']) {
            return {};
          }
          return { 'data-rationale': attributes['data-rationale'] };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          // Use rationale as title for hover tooltip
          if (attributes['data-rationale']) {
            return { title: `Rationale: ${attributes['data-rationale']}` };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-supplement]',
      },
      {
        tag: 'span.supplement-add',
      },
      {
        tag: 'span.supplement-modify',
      },
      {
        tag: 'span.supplement-replace',
      },
      {
        tag: 'span.supplement-delete',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setSupplementMark:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleSupplementMark:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetSupplementMark:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default SupplementMark;
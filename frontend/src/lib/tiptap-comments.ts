import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: Date;
  resolved: boolean;
  replies?: Comment[];
  selection?: {
    from: number;
    to: number;
  };
}

export interface CommentsOptions {
  HTMLAttributes: Record<string, any>;
  onCommentAdd?: (comment: Comment) => void;
  onCommentUpdate?: (comment: Comment) => void;
  onCommentDelete?: (commentId: string) => void;
  comments: Comment[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comments: {
      setComment: (commentId: string) => ReturnType;
      addComment: (comment: Omit<Comment, 'id'>) => ReturnType;
      removeComment: (commentId: string) => ReturnType;
      toggleComment: () => ReturnType;
      resolveComment: (commentId: string) => ReturnType;
    };
  }
}

const commentsPluginKey = new PluginKey('comments');

export const CommentMark = Mark.create<CommentsOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
      comments: [],
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
      class: {
        default: 'comment-highlight',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'comment-highlight',
      style: 'background-color: #fff3cd; border-bottom: 2px solid #ffc107; cursor: pointer;'
    }), 0];
  },

  addCommands() {
    return {
      setComment: (commentId: string) => ({ commands }) => {
        return commands.setMark(this.name, { commentId });
      },
      
      addComment: (comment: Omit<Comment, 'id'>) => ({ commands, editor }) => {
        const { from, to } = editor.state.selection;
        const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newComment: Comment = {
          ...comment,
          id: commentId,
          selection: { from, to },
        };
        
        if (this.options.onCommentAdd) {
          this.options.onCommentAdd(newComment);
        }
        
        return commands.setMark(this.name, { commentId });
      },
      
      removeComment: (commentId: string) => ({ commands, editor }) => {
        if (this.options.onCommentDelete) {
          this.options.onCommentDelete(commentId);
        }
        
        // Remove the mark from the document
        const { doc } = editor.state;
        const decorations: any[] = [];
        
        doc.descendants((node, pos) => {
          if (node.marks.find(mark => mark.type.name === this.name && mark.attrs.commentId === commentId)) {
            decorations.push({
              from: pos,
              to: pos + node.nodeSize,
            });
          }
        });
        
        // Unmark all positions with this comment
        decorations.forEach(({ from, to }) => {
          editor.chain().focus().setTextSelection({ from, to }).unsetMark(this.name).run();
        });
        
        return true;
      },
      
      toggleComment: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
      
      resolveComment: (commentId: string) => ({ editor }) => {
        const comment = this.options.comments.find(c => c.id === commentId);
        if (comment && this.options.onCommentUpdate) {
          this.options.onCommentUpdate({
            ...comment,
            resolved: true,
          });
        }
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: commentsPluginKey,
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc } = state;
            
            // Add decorations for comments
            doc.descendants((node, pos) => {
              node.marks.forEach(mark => {
                if (mark.type.name === this.name) {
                  const comment = this.options.comments.find(c => c.id === mark.attrs.commentId);
                  if (comment) {
                    decorations.push(
                      Decoration.inline(pos, pos + node.nodeSize, {
                        class: comment.resolved ? 'comment-resolved' : 'comment-active',
                        nodeName: 'span',
                      })
                    );
                  }
                }
              });
            });
            
            return DecorationSet.create(doc, decorations);
          },
          
          handleClick: (view, pos, event) => {
            const { state } = view;
            const node = state.doc.nodeAt(pos);
            
            if (node) {
              const commentMark = node.marks.find(mark => mark.type.name === this.name);
              if (commentMark) {
                // Trigger comment display
                const comment = this.options.comments.find(c => c.id === commentMark.attrs.commentId);
                if (comment) {
                  // Dispatch custom event for comment click
                  const customEvent = new CustomEvent('comment-clicked', {
                    detail: { comment, position: { x: event.clientX, y: event.clientY } }
                  });
                  document.dispatchEvent(customEvent);
                }
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default CommentMark;
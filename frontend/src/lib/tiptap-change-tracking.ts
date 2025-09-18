import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface Change {
  id: string;
  type: 'insertion' | 'deletion' | 'format';
  content: string;
  author: string;
  authorId: string;
  timestamp: Date;
  from: number;
  to: number;
  accepted?: boolean;
  rejected?: boolean;
}

export interface ChangeTrackingOptions {
  userId: string;
  userName: string;
  trackChanges: boolean;
  showChanges: boolean;
  changes: Change[];
  onChangeAdded?: (change: Change) => void;
}

const changeTrackingKey = new PluginKey('changeTracking');

export const ChangeTracking = Extension.create<ChangeTrackingOptions>({
  name: 'changeTracking',

  addOptions() {
    return {
      userId: '',
      userName: '',
      trackChanges: true,
      showChanges: true,
      changes: [],
    };
  },

  addStorage() {
    return {
      changes: [] as Change[],
    };
  },

  addCommands() {
    return {
      toggleChangeTracking: () => ({ editor }) => {
        const { trackChanges } = editor.extensionManager.extensions
          .find(ext => ext.name === 'changeTracking')?.options || {};
        
        editor.extensionManager.extensions
          .find(ext => ext.name === 'changeTracking')!.options.trackChanges = !trackChanges;
        
        return true;
      },

      acceptChange: (changeId: string) => ({ editor, state, dispatch }) => {
        const changes = this.storage.changes.filter((c: Change) => c.id !== changeId);
        this.storage.changes = changes;
        
        // Force re-render
        if (dispatch) {
          dispatch(state.tr);
        }
        
        return true;
      },

      rejectChange: (changeId: string) => ({ editor, state, dispatch }) => {
        const change = this.storage.changes.find((c: Change) => c.id === changeId);
        if (change && change.type === 'insertion') {
          // Remove the inserted text
          editor.commands.deleteRange({ from: change.from, to: change.to });
        } else if (change && change.type === 'deletion') {
          // Restore the deleted text
          editor.commands.insertContentAt(change.from, change.content);
        }
        
        // Remove the change from storage
        const changes = this.storage.changes.filter((c: Change) => c.id !== changeId);
        this.storage.changes = changes;
        
        return true;
      },

      acceptAllChanges: () => ({ editor }) => {
        this.storage.changes = [];
        editor.view.updateState(editor.state);
        return true;
      },

      rejectAllChanges: () => ({ editor }) => {
        // Process changes in reverse order to maintain positions
        const changes = [...this.storage.changes].reverse();
        
        changes.forEach((change: Change) => {
          if (change.type === 'insertion') {
            editor.commands.deleteRange({ from: change.from, to: change.to });
          } else if (change.type === 'deletion') {
            editor.commands.insertContentAt(change.from, change.content);
          }
        });
        
        this.storage.changes = [];
        return true;
      },
    } as any;
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: changeTrackingKey,
        
        state: {
          init() {
            return DecorationSet.empty;
          },
          
          apply(tr, oldState, _, newState) {
            if (!extension.options.showChanges) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            
            // Add decorations for each tracked change
            extension.storage.changes.forEach((change: Change) => {
              if (change.type === 'insertion') {
                decorations.push(
                  Decoration.inline(change.from, change.to, {
                    class: 'change-insertion',
                    style: 'background-color: #c8f7c5; border-bottom: 2px solid #27ae60;',
                    title: `Added by ${change.author} at ${new Date(change.timestamp).toLocaleString()}`,
                  })
                );
              } else if (change.type === 'deletion') {
                decorations.push(
                  Decoration.inline(change.from, change.from + 1, {
                    class: 'change-deletion',
                    style: 'background-color: #ffcdd2; text-decoration: line-through; border-bottom: 2px solid #e74c3c;',
                    title: `Deleted by ${change.author} at ${new Date(change.timestamp).toLocaleString()}`,
                  })
                );
              }
            });
            
            return DecorationSet.create(newState.doc, decorations);
          },
        },
        
        appendTransaction(transactions, oldState, newState) {
          if (!extension.options.trackChanges) {
            return null;
          }

          const transaction = transactions[0];
          if (!transaction || !transaction.docChanged) {
            return null;
          }

          // Track insertions and deletions
          transaction.steps.forEach((step: any) => {
            if (step.constructor.name === 'ReplaceStep') {
              const from = step.from;
              const to = step.to;
              const oldContent = oldState.doc.textBetween(
                Math.max(0, from),
                Math.min(oldState.doc.content.size, to),
                ' '
              );
              const newContent = newState.doc.textBetween(
                Math.max(0, from),
                Math.min(newState.doc.content.size, from + step.slice.size),
                ' '
              );

              if (oldContent && !newContent) {
                // Deletion
                const change: Change = {
                  id: `change-${Date.now()}-${Math.random()}`,
                  type: 'deletion',
                  content: oldContent,
                  author: extension.options.userName,
                  authorId: extension.options.userId,
                  timestamp: new Date(),
                  from,
                  to,
                };
                extension.storage.changes.push(change);
                extension.options.onChangeAdded?.(change);
              } else if (!oldContent && newContent) {
                // Insertion
                const change: Change = {
                  id: `change-${Date.now()}-${Math.random()}`,
                  type: 'insertion',
                  content: newContent,
                  author: extension.options.userName,
                  authorId: extension.options.userId,
                  timestamp: new Date(),
                  from,
                  to: from + step.slice.size,
                };
                extension.storage.changes.push(change);
                extension.options.onChangeAdded?.(change);
              } else if (oldContent && newContent && oldContent !== newContent) {
                // Replacement (treated as deletion + insertion)
                const deletionChange: Change = {
                  id: `change-${Date.now()}-del-${Math.random()}`,
                  type: 'deletion',
                  content: oldContent,
                  author: extension.options.userName,
                  authorId: extension.options.userId,
                  timestamp: new Date(),
                  from,
                  to,
                };
                extension.storage.changes.push(deletionChange);
                extension.options.onChangeAdded?.(deletionChange);

                const insertionChange: Change = {
                  id: `change-${Date.now()}-ins-${Math.random()}`,
                  type: 'insertion',
                  content: newContent,
                  author: extension.options.userName,
                  authorId: extension.options.userId,
                  timestamp: new Date(),
                  from,
                  to: from + step.slice.size,
                };
                extension.storage.changes.push(insertionChange);
                extension.options.onChangeAdded?.(insertionChange);
              }
            }
          });

          return null;
        },
        
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
import BulletList from '@tiptap/extension-bullet-list'

/** Preserves recap list class through TipTap round-trips. */
export const RecapBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: el => el.getAttribute('class'),
        renderHTML: attrs => (attrs.class ? { class: attrs.class } : {}),
      },
    }
  },
})

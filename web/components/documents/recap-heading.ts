import Heading from '@tiptap/extension-heading'

/** Preserves recap section / entry header classes and timestamps through TipTap round-trips. */
export const RecapHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: el => el.getAttribute('class'),
        renderHTML: attrs => (attrs.class ? { class: attrs.class } : {}),
      },
      dataRecapTime: {
        default: null,
        parseHTML: el => el.getAttribute('data-recap-time'),
        renderHTML: attrs =>
          attrs.dataRecapTime ? { 'data-recap-time': attrs.dataRecapTime } : {},
      },
    }
  },
})

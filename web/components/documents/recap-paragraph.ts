import Paragraph from '@tiptap/extension-paragraph'

/** Preserves recap entry anchor ids and data attrs through TipTap round-trips. */
export const RecapParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: el => el.getAttribute('id'),
        renderHTML: attrs => (attrs.id ? { id: attrs.id } : {}),
      },
      dataRecapEntry: {
        default: null,
        parseHTML: el => (el.hasAttribute('data-recap-entry') ? '' : null),
        renderHTML: attrs => (attrs.dataRecapEntry != null ? { 'data-recap-entry': '' } : {}),
      },
      dataNoteId: {
        default: null,
        parseHTML: el => el.getAttribute('data-note-id'),
        renderHTML: attrs => (attrs.dataNoteId ? { 'data-note-id': attrs.dataNoteId } : {}),
      },
      dataCaptureType: {
        default: null,
        parseHTML: el => el.getAttribute('data-capture-type'),
        renderHTML: attrs => (attrs.dataCaptureType ? { 'data-capture-type': attrs.dataCaptureType } : {}),
      },
      class: {
        default: null,
        parseHTML: el => el.getAttribute('class'),
        renderHTML: attrs => (attrs.class ? { class: attrs.class } : {}),
      },
    }
  },
})

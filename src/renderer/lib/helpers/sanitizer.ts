import sanitizeHtml from 'sanitize-html'

export function sanitize (data: string) {
  return sanitizeHtml(data, {
    allowedTags: [
      'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
    ],
    allowedAttributes: {
      a: [ 'href', 'name', 'target' ],
      img: [ 'src', 'width', 'height', 'style' ]
    }
  })
}

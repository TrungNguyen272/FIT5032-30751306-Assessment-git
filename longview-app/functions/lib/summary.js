import PDFDocument from 'pdfkit'

/**
 * (BR D.2 / E.1).
 */

const MAX_ITEMS = 25
const MAX_TITLE = 120
const MAX_SUBJECT = 100
const MAX_NOTE = 300
export const DEFAULT_SUBJECT = 'Your Longview learning summary'

/** control characters and cap length. */
export function cleanText(value, maxLength = MAX_TITLE) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/**
 * Validate what the browser sent. Returns
 * { bookmarked, rated, subject, note } or throws an Error with a user-safe
 * message.
 */
export function sanitiseSummaryRequest(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('No course data supplied.')
  }

  const bookmarked = (Array.isArray(input.bookmarked) ? input.bookmarked : [])
    .slice(0, MAX_ITEMS)
    .map((title) => cleanText(title))
    .filter(Boolean)

  const rated = (Array.isArray(input.rated) ? input.rated : [])
    .slice(0, MAX_ITEMS)
    .map((entry) => ({
      title: cleanText(entry?.title),
      stars: Number(entry?.stars),
    }))
    .filter((e) => e.title && Number.isInteger(e.stars) && e.stars >= 1 && e.stars <= 5)

  if (bookmarked.length === 0 && rated.length === 0) {
    throw new Error('Choose at least one bookmarked or rated course to include.')
  }

  const subject = cleanText(input.subject, MAX_SUBJECT) || DEFAULT_SUBJECT
  if (subject.length < 3) throw new Error('The subject needs at least 3 characters.')

  const note = cleanText(input.note, MAX_NOTE)

  return { bookmarked, rated, subject, note }
}

/** Render the PDF to a Buffer */
export function buildSummaryPdf({ name, bookmarked, rated, note = '', generatedOn = new Date() }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 56,
      info: { Title: 'Longview learning summary' },
    })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const green = '#2f6f4e'

    doc.rect(0, 0, doc.page.width, 90).fill(green)
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('LONGVIEW', 56, 32)
    doc.fontSize(11).font('Helvetica').text('Your learning summary', 56, 62)

    doc
      .fillColor('#222222')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`Hi ${cleanText(name, 60)},`, 56, 120)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Generated ${generatedOn.toLocaleDateString('en-AU', { dateStyle: 'long', timeZone: 'Australia/Melbourne' })}`,
      )
    doc.moveDown(1.2)

    if (note) {
      doc.fillColor(green).fontSize(13).font('Helvetica-Bold').text('Your note')
      doc.moveDown(0.3)
      doc.fillColor('#222222').fontSize(11).font('Helvetica-Oblique').text(note, { lineGap: 2 })
      doc.moveDown(1)
    }

    const section = (heading, lines) => {
      doc.fillColor(green).fontSize(13).font('Helvetica-Bold').text(heading)
      doc.moveDown(0.3)
      doc.fillColor('#222222').fontSize(11).font('Helvetica')
      if (lines.length === 0) {
        doc.fillColor('#888888').text('Nothing here yet.')
      } else {
        lines.forEach((line) => doc.text(`•  ${line}`, { indent: 6, lineGap: 2 }))
      }
      doc.moveDown(1)
    }

    section('Bookmarked courses', bookmarked)
    section(
      'Your ratings',
      rated.map((r) => `${r.title}  -  ${r.stars} / 5`),
    )

    doc
      .fillColor('#888888')
      .fontSize(9)
      .text(
        'Sent by Longview. You received this because you asked for it from your dashboard.',
        56,
        doc.page.height - 80,
      )

    doc.end()
  })
}

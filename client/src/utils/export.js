/**
 * 导出工具：PDF / Word
 */
import html2pdf from 'html2pdf.js'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

/**
 * 导出为PDF
 */
export function exportToPDF(htmlContent, filename) {
  const container = document.createElement('div')
  container.innerHTML = htmlContent
  container.style.padding = '20px'
  container.style.fontFamily = 'sans-serif'
  container.style.maxWidth = '800px'
  document.body.appendChild(container)

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename || '周报.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  return html2pdf().set(opt).from(container).save().finally(() => {
    document.body.removeChild(container)
  })
}

/**
 * 导出为Word (docx)
 */
export async function exportToWord(htmlContent, filename) {
  // 解析HTML内容为结构化数据
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html')
  const children = doc.body.firstChild.children

  const paragraphs = []

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return new TextRun({ text: node.textContent || '' })
    }

    const tag = node.tagName?.toLowerCase()
    const text = node.textContent || ''

    if (tag === 'h1') {
      return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 36, font: 'Microsoft YaHei' })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    }
    if (tag === 'h2') {
      return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 28, font: 'Microsoft YaHei' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    }
    if (tag === 'p') {
      const runs = []
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          runs.push(new TextRun({ text: child.textContent, size: 22, font: 'Microsoft YaHei' }))
        } else if (child.tagName?.toLowerCase() === 'strong') {
          runs.push(new TextRun({ text: child.textContent, bold: true, size: 22, font: 'Microsoft YaHei' }))
        }
      })
      if (runs.length === 0) runs.push(new TextRun({ text, size: 22, font: 'Microsoft YaHei' }))
      return new Paragraph({ children: runs, spacing: { after: 100 } })
    }
    if (tag === 'ul' || tag === 'ol') {
      const items = []
      node.querySelectorAll(':scope > li').forEach(li => {
        items.push(new Paragraph({
          children: [new TextRun({ text: `  • ${li.textContent}`, size: 22, font: 'Microsoft YaHei' })],
          spacing: { after: 60 },
          indent: { left: 400 }
        }))
      })
      return items
    }

    return new Paragraph({
      children: [new TextRun({ text, size: 22, font: 'Microsoft YaHei' })],
      spacing: { after: 100 }
    })
  }

  function flatten(result) {
    if (Array.isArray(result)) return result.flat(1)
    return result ? [result] : []
  }

  if (children) {
    Array.from(children).forEach(node => {
      const processed = processNode(node)
      paragraphs.push(...flatten(processed))
    })
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: '无内容', size: 22 })] }))
  }

  const wordDoc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: paragraphs
    }]
  })

  const blob = await Packer.toBlob(wordDoc)
  saveAs(blob, filename || '周报.docx')
}

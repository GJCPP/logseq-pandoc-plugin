import {
  convertToDocx,
  convertToHtml,
  convertToLatex,
  convertToPptx,
} from './pandoc-services'

interface MenuItem {
  label: string
  format: string
  action: (pandoc: any, content: string, filename: string) => Promise<void>
}

export const menuItems: MenuItem[] = [
  {
    label: 'Pandoc: Convert to docx',
    format: 'docx',
    action: convertToDocx,
  },
  {
    label: 'Pandoc: Convert to pptx',
    format: 'pptx',
    action: convertToPptx,
  },
  {
    label: 'Pandoc: Convert to HTML',
    format: 'html',
    action: convertToHtml,
  },
  {
    label: 'Pandoc: Convert to Latex',
    format: 'latex',
    action: convertToLatex,
  },
]

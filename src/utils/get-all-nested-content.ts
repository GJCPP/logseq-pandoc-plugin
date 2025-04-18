import { BlockEntity } from '@logseq/libs/dist/LSPlugin'

import { applyContentRule, applyEnvironmentRule, ContentRule, RuleSet, wrapLatex } from './load-rules'



const applyContentRules = (text: string, rules: ContentRule[]): string => {
  let linefront = ''
  let lineback = ''

  for (const rule of rules) {
    const res = applyContentRule(rule, text)
    linefront = res.front + linefront
    text = res.middle
    lineback = lineback + res.back
  }

  return linefront + text + lineback
}


const cleanOrderListType = (blocks: BlockEntity[]): boolean => {
  let replaced = false

  for (const block of blocks) {
    if (block.content) {
      const trimedContent = block.content.trim()
      const cleaned = trimedContent.replace("logseq.order-list-type:: number", '').trim()
      if (cleaned !== trimedContent) {
        block.content = cleaned
        replaced = true
      }
    }
  }

  return replaced
}

const replaceImage = (text: string, listOfAssets: any): string => {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g // Try match markdown images and replace with counter + format
  const content = text.replace(imageRegex, (match, alt, url) => {
    // In Logseq, the URL of an image is the relative path, e.g. "../assets/image1.png".
    // However, the LaTeX figure environment requires the full path, e.g. "/Users/username/Documents/logseq/assets/image1.png".

    // Truncate URL to the last slash to obtain the filename.
    // For example, "../assets/2021-01-01.png" would be truncated to "2021-01-01.png"
    const truncatedUrl = url.substring(url.lastIndexOf('/') + 1);

    const matchingAsset = listOfAssets.find((asset: { path: string }) => asset.path.endsWith(truncatedUrl)); // Find the asset with the matching path.

    if (matchingAsset) {
      url = matchingAsset.path; // Use the full matching asset path
    }
    url = url.replace(/\\/g, "/");
    return `![${alt}](${url})`;
  });
  return content
}

export const getAllNestedContent = async (
  blocks: BlockEntity[],
  rules: RuleSet,
  format: string // To which format are we translating
): Promise<string> => {
  let str = ''
  const beginEnumerate = wrapLatex("\\begin{enumerate}")
  const itemEnumerate = wrapLatex("\\item ")
  const endEnumerate = wrapLatex("\\end{enumerate}")
  const listOfAssets = await logseq.Assets.listFilesOfCurrentGraph()

  const activeEnvRules = rules.Environment.filter(r =>
    !r.formats?.length || r.formats.includes(format)
  )
  const activeContentRules = rules.Content.filter(r =>
    !r.formats?.length || r.formats.includes(format)
  )

  const getNestedContent = async (blocks: BlockEntity[]) => {
    // Check for logseq.order-list-type:: number
    const inList = cleanOrderListType(blocks)

    if (inList) {
      str += beginEnumerate // Add \begin{enumerate}
    }

    for (const block of blocks) {
      if (block.content === undefined || block.content.length === 0) continue

      // Start handling brackets, block references, etc.
      let content = block.content.trim().replace('[[', '').replace(']]', '')
      const uuidRe =
        /\(\(\s*([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\s*\)\)/
      const matchBlock = uuidRe.exec(content)
      if (matchBlock && matchBlock[0] && matchBlock[1]) {
        const blkContent = (await logseq.Editor.getBlock(matchBlock[1]))
          ?.content
        if (!blkContent) continue
        content = content.replace(matchBlock[0], blkContent)
        content = content.substring(0, content.indexOf('id:: '))
      }

      content = replaceImage(content, listOfAssets)
      content = applyContentRules(content, activeContentRules)

      const envRule = activeEnvRules.find(r => {
        if (r.matchType === 'regex' && r.compiledRegex) {
          const match = r.compiledRegex.exec(content)
          return match?.[0] === content
        } else {
          return r.match === content
        }
      })
      
      if (envRule) {
        const { begin, end } = applyEnvironmentRule(envRule, content)
      
        str += begin + '\n'
        if (block.children) await getNestedContent(block.children as BlockEntity[])
        str += end + '\n\n'
      } else {
        if (inList) {
          str += itemEnumerate
        }
        str += content.trim() + '\n\n'
        if (block.children) await getNestedContent(block.children as BlockEntity[])
      }
    }

    if (inList) {
      str += endEnumerate // Add \end{enumerate}
    }
  }
  await getNestedContent(blocks)

  // console.log(str)

  return str
}

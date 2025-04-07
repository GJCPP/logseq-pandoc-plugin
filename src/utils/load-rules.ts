export type MatchType = 'exact' | 'regex'

export interface EnvironmentRule {
	type: 'environment'
	name: string
	match: string
	begin: string
	end: string
	matchType?: MatchType
	compiledRegex?: RegExp
	islatex: boolean,
	formats?: string[]
}

export interface ContentRule {
	type: 'content'
	name: string
	trigger: string
	replacement?: string
	matchType?: MatchType
	front?: string
	back?: string
	compiledRegex?: RegExp
	islatex: boolean,
	formats?: string[]
}

export interface RuleSet {
	Environment: EnvironmentRule[]
	Content: ContentRule[]
}

// Wrap latex command with fence
export function wrapLatex(value: string | undefined): string {
	if (!value) return ''
	return "\n```{=latex}\n" + value + "\n```\n"
}

export async function loadRulesFromFile(filepath: string): Promise<RuleSet> {
	const Environment: EnvironmentRule[] = []
	const Content: ContentRule[] = []

	try {
		const content = await fetch(filepath)
		const ruleSet = await content.json()

		// Load Environment rules
		for (const name in ruleSet.Environment) {
			const raw = ruleSet.Environment[name]
			const rule: EnvironmentRule = {
				type: 'environment',
				name,
				match: raw.match,
				begin: raw.begin,
				end: raw.end,
				matchType: raw.matchType || 'exact',
				compiledRegex: raw.matchType === 'regex' ? new RegExp(raw.match) : undefined,
				islatex: !!raw.islatex,
				formats: raw.formats ?? []
			}
			if (rule.islatex) {
				rule.begin = wrapLatex(rule.begin)
				rule.end = wrapLatex(rule.end)
			}
			Environment.push(rule)
		}

		// Load Content rules
		for (const name in ruleSet.Content) {
			const raw = ruleSet.Content[name]
			const rule: ContentRule = {
				type: 'content',
				name,
				trigger: raw.trigger,
				replacement: raw.replacement ?? '',
				matchType: raw.matchType || 'exact',
				front: raw.front,
				back: raw.back,
				compiledRegex: raw.matchType === 'regex' ? new RegExp(raw.trigger) : undefined,
				islatex: !!raw.islatex,
				formats: raw.formats ?? []
			}
			if (rule.islatex) {
				rule.front = wrapLatex(rule.front)
				rule.back = wrapLatex(rule.back)
			}
			Content.push(rule)
		}
	} catch (error) {
		console.error('Failed to load rules:', error)
	}
	return { Environment, Content }
}

export function applyContentRule(
	rule: ContentRule,
	text: string
): { front: string; middle: string; back: string } {
	let linefront = ""
	let lineback = ""
	if (rule.matchType === 'regex' && rule.compiledRegex) {
		text = text.replace(rule.compiledRegex, (...args) => {
			const groups = args.slice(1, -2) // capture groups
			const replaceRefs = (template: string | undefined) =>
				template?.replace(/\$(\d+)/g, (_, i) => groups[+i - 1] ?? '') ?? ''

			const replacement = replaceRefs(rule.replacement)
			const front = replaceRefs(rule.front)
			const back = replaceRefs(rule.back)

			linefront = front + linefront
			lineback = lineback + back

			return replacement
		})
	} else {
		if (text.includes(rule.trigger)) {
			text = text.replace(rule.trigger, rule.replacement ?? '')
			linefront = (rule.front ?? '') + linefront
			lineback = lineback + (rule.back ?? '')
		}
	}
	return {
		front: linefront,
		middle: text,
		back: lineback
	}
}

export function applyEnvironmentRule(
	rule: EnvironmentRule,
	content: string
): { begin: string; end: string } {
	if (rule.matchType === 'regex' && rule.compiledRegex) {
		const match = rule.compiledRegex.exec(content)
		if (!match) return { begin: rule.begin, end: rule.end }
		const groups = match.slice(1) // skip full match
		const replaceRefs = (template: string | undefined) =>
			template?.replace(/\$(\d+)/g, (_, i) => groups[+i - 1] ?? '') ?? ''

		const begin = replaceRefs(rule.begin)
		const end = replaceRefs(rule.end)

		return { begin: begin, end: end }
	}

	// Exact match
	return {
		begin: rule.begin,
		end: rule.end
	}
}

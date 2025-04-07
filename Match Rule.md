# Explanation for match_rule.json

### Environment Rule

Environment rules are aimed for translating customized keywords into certain latex environment.

An environment rule consists of the following fields:

 - `match`: can be exact/regex, which specifies the keyword to be replaced.

 - `begin`/`end`: the content inserted to the begin/end of sub-blocks. Set to empty string by defualt.
 
 - `matchType`: taken value from "exact" and "regex". The match is exact by default.

 - `islatex`: a boolean indicates whether the begin/end contains latex command. Set to `false` by defualt.

 - `formats`: chosen from {"latex", "html", "docx", "pptx"}. By defualt, the rule applies to all formats.

For example, the following rule replaces all level-3 heading by begin/end environment in latex:

```
"level-3 heading" : {
  "match": "^### (.+)",
  "begin": "\\begin{$1}",
  "end": "\\end{$1}",
  "matchType": "regex",
  "islatex": true,
  "formats": ["latex"]
}
```

> :warning: The environment rule is applied only upon matching the entire unit block. Upon match, exact or regex, all content in the block is removed.
> Also, only the first match is applied.

### Content Rule

Content rules are designed for better formatting the text. Notably, it is frequently used to remove Logseq keywords. The content rules are applied for all matches and applied in turn.

A content rule consists of the following fields:

  - `trigger`: which is used to match the content that requires replacement.
  - `replacement`: which replaces the matched content.
  - `front`: which is pushed to the front of current block.
  - `back`: which is appended to the back of current block.
  - `islatex`: same as environment rule.
  - `matchType`: same as environment rule.
  - `formats`: same as environment rule.

As an example, the following content rule replaces the Logseq background color by Latex textcolor command, wrapping in all content of the unit block.

```
"background-color" : {
  "trigger": "background-color:: (.+)",
  "matchType": "regex",
  "front": "\\textcolor{$1}{",
  "replacement": "",
  "back": "}",
  "islatex": true,
  "formats": ["latex"]
}
```

> :warning: Different from environment rule, one content rule can be applied to multiple matches in the block. Also, the rules are applied in the same order as they are listed in `match_rule.json`.
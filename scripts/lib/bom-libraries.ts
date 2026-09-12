/**
 * Parser for the `library(...)` DSL in Spring Boot's dependency BOM build script.
 *
 * Pure functions over the script's text. No I/O, no Groovy evaluation: the DSL
 * subset the BOM actually uses is small and regular, and evaluating the script
 * would mean running Gradle — the very thing ADR-0004 exists to avoid.
 *
 * The shapes handled here are the ones `BomExtension.LinksHandler` declares:
 *
 * ```groovy
 * library("Spring Framework", "${springFrameworkVersion}") {
 *   links {
 *     site("https://spring.io/projects/spring-framework")
 *     javadoc(version -> "https://.../%s/javadoc-api"
 *       .formatted(version.forMajorMinorGeneration()), "org.springframework.[aop|web]")
 *     releaseNotes("https://.../tag/v{version}")
 *   }
 * }
 * ```
 *
 * A rootName override exists only on `javadoc(String, Function, String...)`, so
 * a leading string literal renames the attribute only when the next argument is
 * a lambda; otherwise it is the link template itself and the rest are packages.
 */

/** A `LibraryVersion` accessor a link lambda can call. */
export type VersionAccessor
  = | 'toString'
    | 'forAntora'
    | 'forMajorMinorGeneration'
    | 'major'
    | 'minor'
    | 'patch'
  /** Numeric components, which fill one format specifier each. */
    | 'componentInts'

/** One `version…` expression from a link lambda's `.formatted(…)` arguments. */
export interface VersionExpression {
  readonly accessor: VersionAccessor
  /** Separator of `toString(separator)`, replacing the `.` between components. */
  readonly separator: string | undefined
  /** `.replace(search, replacement)` calls, applied in declaration order. */
  readonly replacements: readonly { readonly search: string, readonly replacement: string }[]
}

/** A link URL, still awaiting the library's version. */
export type LinkTemplate
  /** A plain template; `{version}` is the only placeholder `asFactory` resolves. */
  = | { readonly kind: 'placeholder', readonly text: string }
  /** A `"…%s…".formatted(version.x(), …)` lambda body. */
    | { readonly kind: 'formatted', readonly text: string, readonly args: readonly VersionExpression[] }

/** One entry of a library's `links` block. */
export interface LibraryLink {
  /** Link kind: `site`, `github`, `docs`, `javadoc`, `releaseNotes`, or a custom name. */
  readonly name: string
  /** Overrides the library's link root name, when the DSL supplied one. */
  readonly rootName: string | undefined
  readonly template: LinkTemplate
  /** Java packages this link is the javadoc for, already bracket-expanded. */
  readonly packages: readonly string[]
}

/** A Maven coordinate a library declares, without its version. */
export interface ModuleCoordinates {
  readonly groupId: string
  readonly artifactId: string
}

/** A Maven BOM one library imports to manage its modules. */
export type ImportedBom = ModuleCoordinates

/** One `library(...)` declaration. */
export interface BomLibrary {
  /** Display name as declared, e.g. `Spring Framework`. */
  readonly name: string
  /** Attribute root derived from the name, e.g. `spring-framework`. */
  readonly linkRootName: string
  /** Version as declared; a `${…}` Groovy reference when the script interpolates. */
  readonly declaredVersion: string
  /**
   * BOMs the library imports instead of naming each module's version.
   *
   * A module managed this way has no version in the build script at all, so a
   * caller that needs one has to resolve it from the imported BOM.
   */
  readonly importedBoms: readonly ImportedBom[]
  /**
   * Modules the library manages directly, which therefore carry its own version.
   *
   * The two are alternatives: a library either lists its modules or imports a
   * BOM that does, and which one it uses has changed across the supported range.
   */
  readonly managedModules: readonly ModuleCoordinates[]
  readonly links: readonly LibraryLink[]
}

/** A bracketed package suffix list, as `Link.expandPackage` matches it. */
const PACKAGE_EXPAND = /^([^[]*)\[([^\]]*)\]$/
/** Version component separators: `1.2.3-RC1` splits on both. */
const VERSION_SEPARATOR = /[.-]/
/** A run of digits, i.e. one numeric version component. */
const NUMERIC_COMPONENT = /^\d+$/
/** Any non-whitespace character. */
const NON_WHITESPACE = /\S/

/** Matches `Library.generateLinkRootName`. */
export function linkRootNameFor(name: string): string {
  return name.replaceAll('-', '').replaceAll(' ', '-').toLowerCase()
}

/** Matches `Link.expandPackage`: `a.[b|c]` becomes `a.b`, `a.c`. */
export function expandPackages(packages: readonly string[]): readonly string[] {
  return packages.flatMap((packageName) => {
    const match = PACKAGE_EXPAND.exec(packageName)
    if (!match)
      return [packageName]
    const [, root = '', suffixes = ''] = match
    return suffixes.split('|').map(suffix => root + suffix)
  })
}

/**
 * Format specifiers Java's `String.formatted` uses in these templates.
 *
 * Only `%s` and zero-padded `%d` appear across the BOM; anything else would be a
 * new shape and is left untouched rather than silently mis-rendered.
 */
const FORMAT_SPECIFIER = /%(0(\d+))?([sd])/g

/** Render one link template for a concrete version. */
export function renderLink(template: LinkTemplate, version: string): string {
  if (template.kind === 'placeholder')
    return template.text.replaceAll('{version}', version)

  const values = template.args.flatMap(expression => evaluate(version, expression))
  let index = 0
  return template.text.replace(FORMAT_SPECIFIER, (whole, _padded, width: string | undefined) => {
    const value = values[index++]
    if (value === undefined)
      return whole
    return width === undefined ? value : value.padStart(Number(width), '0')
  })
}

/** Evaluate one `version…` expression; `componentInts()` yields several values. */
function evaluate(version: string, expression: VersionExpression): readonly string[] {
  const values = baseValues(version, expression)
  return values.map(value =>
    expression.replacements.reduce(
      (text, { search, replacement }) => text.replaceAll(search, replacement),
      value,
    ),
  )
}

/** The `LibraryVersion` accessors the BOM's link lambdas call. */
function baseValues(version: string, expression: VersionExpression): readonly string[] {
  const parts = version.split(VERSION_SEPARATOR)
  const snapshot = version.endsWith('SNAPSHOT') ? '-SNAPSHOT' : ''

  switch (expression.accessor) {
    case 'toString':
      return [expression.separator === undefined
        ? version
        : version.replaceAll('.', expression.separator)]
    case 'forAntora':
      return [`${parts[0]}.${parts[1]}${snapshot}`]
    case 'forMajorMinorGeneration':
      return [`${parts[0]}.${parts[1]}.x${snapshot}`]
    case 'major':
      return [parts[0] ?? '']
    case 'minor':
      return [parts[1] ?? '']
    case 'patch':
      return [parts[2] ?? '']
    case 'componentInts':
      // `DependencyVersion.componentInts` reports the numeric components only,
      // so a qualifier such as `.Final` contributes nothing.
      return parts.filter(part => NUMERIC_COMPONENT.test(part))
  }
}

/** One `name(...)` or `name { … }` call found at the start of a line. */
interface StatementCall {
  readonly name: string
  /** Index just after the opening delimiter. */
  readonly argsStart: number
  /** Index of the matching closing delimiter. */
  readonly argsEnd: number
  /**
   * True when the call was written with a closure instead of an argument list.
   *
   * The 3.3 line writes link factories as Groovy closures — `docs { version ->
   * … }` — where later releases use a Java lambda in parentheses. The closure
   * body is then the call's single argument.
   */
  readonly closure: boolean
}

/** Header of a `links { … }` or `links("root") { … }` closure. */
const LINKS_HEADER = /(?:^|\n)[ \t]*links[ \t]*(?:\(\s*"((?:[^"\\]|\\.)*)"\s*\)[ \t]*)?\{/
/** One double-quoted Groovy/Java string literal. */
const STRING_LITERAL = /"((?:[^"\\]|\\.)*)"/g
/** A `.formatted(…)` suffix closing a lambda body. */
const FORMATTED_SUFFIX = /\.formatted\(([\s\S]*)\)\s*$/
/** A `.replace("a", "b")` call chained onto a version expression. */
const REPLACE_CALL = /\.replace\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g
/** A no-argument or single-literal-argument accessor call. */
const ACCESSOR_CALL = /\.[ \t]*([a-z]+)[ \t]*\(\s*(?:"((?:[^"\\]|\\.)*)"\s*)?\)/i
/** A Groovy identifier. */
const IDENTIFIER_CHAR = /[\w$]/

/**
 * Every `library(...)` declaration in the script, with its links.
 *
 * Declarations without a `links` block are still reported: the caller needs the
 * full set to know which library names it has seen.
 */
export function parseBomLibraries(buildScript: string): readonly BomLibrary[] {
  const libraries: BomLibrary[] = []
  let cursor = 0

  while (cursor < buildScript.length) {
    const call = nextStatementCall(buildScript, cursor)
    if (!call)
      break
    if (call.name !== 'library') {
      // Step just inside the call rather than past it: the declarations live
      // inside the top-level `bom { … }` closure, and skipping its body would
      // skip every library with it.
      cursor = call.argsStart
      continue
    }

    const args = splitArguments(buildScript.slice(call.argsStart, call.argsEnd))
    const name = stringLiteralOf(args[0])
    const body = closureAfter(buildScript, call.argsEnd)
    cursor = body.end

    if (name === undefined)
      continue
    const block = parseLinksBlock(body.text)
    libraries.push({
      name,
      // `links("spring-data") { … }` renames the library outright, not just its
      // links: `AntoraAsciidocAttributes` reads the same root for `version-*`.
      linkRootName: block.rootName ?? linkRootNameFor(name),
      declaredVersion: stringLiteralOf(args[1]) ?? '',
      ...parseGroups(body.text),
      links: block.links,
    })
  }

  return libraries
}

/**
 * The next call written at the start of a line at or after `from`.
 *
 * The BOM's DSL is one statement per line, so anchoring on line starts keeps a
 * call inside a string or a nested expression from being read as a declaration.
 */
function nextStatementCall(source: string, from: number): StatementCall | undefined {
  let lineStart = from

  while (lineStart < source.length) {
    let index = lineStart
    while (index < source.length && (source[index] === ' ' || source[index] === '\t'))
      index++

    const nameStart = index
    while (index < source.length && IDENTIFIER_CHAR.test(source[index] ?? ''))
      index++

    if (index > nameStart) {
      const name = source.slice(nameStart, index)
      // A closure may be written after a space: `docs { version -> … }`.
      let delimiter = index
      while (delimiter < source.length && source[delimiter] === ' ')
        delimiter++

      if (source[index] === '(') {
        const argsEnd = matchingDelimiter(source, index, '(', ')')
        if (argsEnd !== -1)
          return { name, argsStart: index + 1, argsEnd, closure: false }
      }
      else if (source[delimiter] === '{') {
        const argsEnd = matchingDelimiter(source, delimiter, '{', '}')
        if (argsEnd !== -1)
          return { name, argsStart: delimiter + 1, argsEnd, closure: true }
      }
    }

    const newline = source.indexOf('\n', lineStart)
    if (newline === -1)
      return undefined
    lineStart = newline + 1
  }

  return undefined
}

/** A closure body, plus where scanning should resume after it. */
interface Closure {
  readonly text: string
  readonly end: number
}

/** The brace-balanced closure following a call, or an empty one when absent. */
function closureAfter(source: string, callEnd: number): Closure {
  const braceStart = source.indexOf('{', callEnd)
  // A `library(...)` with no closure is followed by the next declaration, so a
  // brace far ahead must not be mistaken for this library's body.
  if (braceStart === -1 || NON_WHITESPACE.test(source.slice(callEnd + 1, braceStart)))
    return { text: '', end: callEnd + 1 }

  const braceEnd = matchingDelimiter(source, braceStart, '{', '}')
  return braceEnd === -1
    ? { text: '', end: callEnd + 1 }
    : { text: source.slice(braceStart + 1, braceEnd), end: braceEnd + 1 }
}

/** An `imports = [ "a", "b" ]` assignment, as the 3.3-3.4 BOM writes it. */
const IMPORTS_ASSIGNMENT = /\bimports[ \t]*=[ \t]*\[([\s\S]*?)\]/g
/** A `modules = [ "a", "b" ]` assignment. */
const MODULES_ASSIGNMENT = /\bmodules[ \t]*=[ \t]*\[([\s\S]*?)\]/g

/**
 * The BOMs every `group(...)` closure in a library body imports.
 *
 * Two spellings are in use across the supported range:
 *
 * ```groovy
 * group("com.fasterxml.jackson") {   // 3.5 and later
 *   bom("jackson-bom")
 * }
 * group("org.springframework.data") { // 3.3-3.4
 *   imports = ["spring-data-bom"]
 * }
 * ```
 */
function parseGroups(libraryBody: string): {
  importedBoms: readonly ImportedBom[]
  managedModules: readonly ModuleCoordinates[]
} {
  const boms: ImportedBom[] = []
  const modules: ModuleCoordinates[] = []
  let cursor = 0

  while (cursor < libraryBody.length) {
    const call = nextStatementCall(libraryBody, cursor)
    if (!call)
      break
    cursor = call.argsEnd + 1
    if (call.name !== 'group')
      continue

    const groupId = stringLiteralOf(libraryBody.slice(call.argsStart, call.argsEnd))
    const group = closureAfter(libraryBody, call.argsEnd)
    cursor = group.end
    if (groupId === undefined)
      continue

    let inner = 0
    while (inner < group.text.length) {
      const bom = nextStatementCall(group.text, inner)
      if (!bom)
        break
      inner = bom.argsEnd + 1
      if (bom.name !== 'bom')
        continue
      const artifactId = stringLiteralOf(group.text.slice(bom.argsStart, bom.argsEnd))
      if (artifactId !== undefined)
        boms.push({ groupId, artifactId })
    }

    for (const assignment of group.text.matchAll(IMPORTS_ASSIGNMENT)) {
      for (const literal of (assignment[1] ?? '').matchAll(STRING_LITERAL))
        boms.push({ groupId, artifactId: literal[1] ?? '' })
    }

    for (const assignment of group.text.matchAll(MODULES_ASSIGNMENT)) {
      for (const literal of (assignment[1] ?? '').matchAll(STRING_LITERAL))
        modules.push({ groupId, artifactId: literal[1] ?? '' })
    }
  }

  return { importedBoms: boms, managedModules: modules }
}

/** A library's `links` closure: its entries, plus any root-name override. */
interface LinksBlock {
  readonly rootName: string | undefined
  readonly links: readonly LibraryLink[]
}

/** Parse the `links { … }` or `links("root") { … }` closure out of a library body. */
function parseLinksBlock(libraryBody: string): LinksBlock {
  const header = LINKS_HEADER.exec(libraryBody)
  if (!header)
    return { rootName: undefined, links: [] }

  const rootName = header[1]
  const braceStart = header.index + header[0].length - 1
  const braceEnd = matchingDelimiter(libraryBody, braceStart, '{', '}')
  if (braceEnd === -1)
    return { rootName, links: [] }

  const links: LibraryLink[] = []
  const body = libraryBody.slice(braceStart + 1, braceEnd)
  let cursor = 0

  while (cursor < body.length) {
    const call = nextStatementCall(body, cursor)
    if (!call)
      break
    const source = body.slice(call.argsStart, call.argsEnd)
    // A closure body is one argument, not an argument list: splitting it on
    // commas would tear a `.formatted(a, b)` call in half.
    const args: string[] = call.closure ? [source] : [...splitArguments(source)]
    cursor = call.argsEnd + 1

    // Groovy's trailing-closure form — `add("userguide") { version -> … }` —
    // puts the factory after the argument list rather than inside it.
    if (!call.closure) {
      const trailing = closureAfter(body, call.argsEnd)
      if (trailing.text !== '') {
        args.push(trailing.text)
        cursor = trailing.end
      }
    }

    const link = parseLinkCall(call.name, args)
    if (link)
      links.push(link)
  }

  return { rootName, links }
}

/** Turn one `site(...)` / `javadoc(...)` / `add(...)` call into a link. */
function parseLinkCall(call: string, args: readonly string[]): LibraryLink | undefined {
  // `add(name, …)` names the link in its first argument; every other call is
  // named after itself.
  const named = call === 'add'
  const name = named ? stringLiteralOf(args[0]) : call
  if (name === undefined)
    return undefined
  const rest = named ? args.slice(1) : args

  // Only `javadoc(String rootName, Function, String...)` renames the attribute,
  // so a leading literal is a rootName exactly when a lambda follows it.
  const renames = call === 'javadoc' && rest.length > 1 && isLambda(rest[1]) && !isLambda(rest[0])
  const rootName = renames ? stringLiteralOf(rest[0]) : undefined
  const remaining = renames ? rest.slice(1) : rest

  const template = parseTemplate(remaining[0])
  if (!template)
    return undefined

  const packages = remaining
    .slice(1)
    .map(argument => stringLiteralOf(argument))
    .filter((value): value is string => value !== undefined)

  return { name, rootName, template, packages: expandPackages(packages) }
}

/** Read a link template from either a string literal or a lambda body. */
function parseTemplate(argument: string | undefined): LinkTemplate | undefined {
  if (argument === undefined)
    return undefined

  if (!isLambda(argument)) {
    const text = stringLiteralOf(argument)
    return text === undefined ? undefined : { kind: 'placeholder', text }
  }

  const body = argument.slice(argument.indexOf('->') + 2)
  const formatted = FORMATTED_SUFFIX.exec(body)

  // The template is only the literals *before* `.formatted(`: a separator
  // argument such as `version.toString("_")` is a literal too, and folding it
  // into the template appends a stray separator to every rendered URL.
  const text = stringLiteralOf(formatted ? body.slice(0, formatted.index) : body)
  if (text === undefined)
    return undefined
  if (!formatted)
    return { kind: 'placeholder', text }

  return {
    kind: 'formatted',
    text,
    args: splitArguments(formatted[1] ?? '').map(expressionOf),
  }
}

/** Read one `version…` expression's accessor, separator and replacements. */
function expressionOf(source: string): VersionExpression {
  const replacements = Array.from(source.matchAll(REPLACE_CALL), match => ({
    search: match[1] ?? '',
    replacement: match[2] ?? '',
  }))

  const call = ACCESSOR_CALL.exec(source)
  const method = call?.[1]
  const separator = call?.[2]

  switch (method) {
    case 'forAntora':
    case 'forMajorMinorGeneration':
    case 'major':
    case 'minor':
    case 'patch':
    case 'componentInts':
      return { accessor: method, separator: undefined, replacements }
    default:
      return { accessor: 'toString', separator, replacements }
  }
}

function isLambda(argument: string | undefined): boolean {
  return argument !== undefined && argument.includes('->')
}

/**
 * Concatenate every double-quoted literal in an expression.
 *
 * The BOM splits long package lists across lines with `+`, so taking every
 * literal in order reconstructs the text.
 */
function stringLiteralOf(expression: string | undefined): string | undefined {
  if (expression === undefined)
    return undefined

  const parts = Array.from(expression.matchAll(STRING_LITERAL), match =>
    (match[1] ?? '').replaceAll('\\"', '"').replaceAll('\\\\', '\\'))
  return parts.length === 0 ? undefined : parts.join('')
}

/**
 * Split an argument list on top-level commas.
 *
 * Commas inside nested calls, closures and string literals belong to the
 * argument that contains them, so depth and quoting are both tracked.
 */
function splitArguments(source: string): readonly string[] {
  const args: string[] = []
  let depth = 0
  let start = 0
  let quoted = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '\\')
        i++
      else if (char === '"')
        quoted = false
      continue
    }
    if (char === '"') {
      quoted = true
    }
    else if (char === '(' || char === '{' || char === '[') {
      depth++
    }
    else if (char === ')' || char === '}' || char === ']') {
      depth--
    }
    else if (char === ',' && depth === 0) {
      args.push(source.slice(start, i).trim())
      start = i + 1
    }
  }

  const last = source.slice(start).trim()
  if (last !== '' || args.length > 0)
    args.push(last)
  return args
}

/**
 * Index of the delimiter closing the one at `openIndex`, or `-1`.
 *
 * String literals are skipped so a brace or paren inside a URL never shifts the
 * nesting depth.
 */
function matchingDelimiter(source: string, openIndex: number, open: string, close: string): number {
  let depth = 0
  let quoted = false

  for (let i = openIndex; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '\\')
        i++
      else if (char === '"')
        quoted = false
      continue
    }
    if (char === '"') {
      quoted = true
    }
    else if (char === open) {
      depth++
    }
    else if (char === close) {
      depth--
      if (depth === 0)
        return i
    }
  }

  return -1
}

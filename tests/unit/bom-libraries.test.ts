import { describe, expect, test } from 'bun:test'
import {
  expandPackages,
  hasUnconsumedSpecifier,
  linkRootNameFor,
  parseBomLibraries,
  renderLink,
} from '../../scripts/lib/bom-libraries.ts'

describe('linkRootNameFor', () => {
  test('drops hyphens, then turns spaces into hyphens', () => {
    expect(linkRootNameFor('Spring Framework')).toBe('spring-framework')
    // The order matters: hyphens go first, so a hyphenated name collapses.
    expect(linkRootNameFor('JSON-SMART')).toBe('jsonsmart')
    expect(linkRootNameFor('Native Build Tools Plugin')).toBe('native-build-tools-plugin')
  })
})

describe('expandPackages', () => {
  test('expands a bracketed suffix list into one package each', () => {
    expect(expandPackages(['org.example.[aop|web]'])).toEqual([
      'org.example.aop',
      'org.example.web',
    ])
  })

  test('leaves an unbracketed package alone', () => {
    expect(expandPackages(['org.example.core'])).toEqual(['org.example.core'])
  })
})

describe('renderLink', () => {
  test('substitutes the {version} placeholder of a plain template', () => {
    expect(renderLink({ kind: 'placeholder', text: 'https://x/tag/v{version}' }, '6.2.19'))
      .toBe('https://x/tag/v6.2.19')
  })

  test('applies forAntora and forMajorMinorGeneration', () => {
    const antora = { accessor: 'forAntora', separator: undefined, replacements: [] } as const
    const generation = {
      accessor: 'forMajorMinorGeneration',
      separator: undefined,
      replacements: [],
    } as const

    expect(renderLink({ kind: 'formatted', text: 'r/%s', args: [antora] }, '6.2.19')).toBe('r/6.2')
    expect(renderLink({ kind: 'formatted', text: 'd/%s', args: [generation] }, '6.2.19'))
      .toBe('d/6.2.x')
  })

  test('replaces the component separator for toString(separator)', () => {
    const separated = { accessor: 'toString', separator: '_', replacements: [] } as const
    expect(renderLink({ kind: 'formatted', text: 'v_%s.html', args: [separated] }, '2.3.34'))
      .toBe('v_2_3_34.html')
  })

  test('applies replace() calls chained onto toString()', () => {
    const stripped = {
      accessor: 'toString',
      separator: undefined,
      replacements: [{ search: '.Final', replacement: '' }],
    } as const
    expect(renderLink({ kind: 'formatted', text: 'tag/%s', args: [stripped] }, '7.4.5.Final'))
      .toBe('tag/7.4.5')
  })

  test('spreads componentInts across zero-padded specifiers', () => {
    const components = { accessor: 'componentInts', separator: undefined, replacements: [] } as const
    expect(renderLink({ kind: 'formatted', text: 'c-%02d-%02d-%02d', args: [components] }, '6.2.9'))
      .toBe('c-06-02-09')
  })

  test('leaves a specifier alone when no argument supplies it', () => {
    expect(renderLink({ kind: 'formatted', text: 'a/%s/%s', args: [] }, '1.0.0')).toBe('a/%s/%s')
  })
})

describe('hasUnconsumedSpecifier', () => {
  test('reports a link the renderer could not fill', () => {
    expect(hasUnconsumedSpecifier(renderLink(
      { kind: 'formatted', text: 'a/%s/%s', args: [] },
      '1.0.0',
    ))).toBe(true)
  })

  test('reports a padded specifier too', () => {
    expect(hasUnconsumedSpecifier('c-06-02-%02d')).toBe(true)
  })

  test('accepts a fully rendered link', () => {
    expect(hasUnconsumedSpecifier('https://example.com/1.0.0/api')).toBe(false)
  })

  test('does not mistake percent-encoding for a specifier', () => {
    // `%2F` and friends are ordinary URL escapes; only `%s`/`%0Nd` are templates.
    expect(hasUnconsumedSpecifier('https://example.com/a%2Fb?q=100%25')).toBe(false)
  })
})

/** One BOM excerpt covering every DSL shape the parser has to handle. */
const BOM = `
dependencies {
}

bom {
  library("Example Lib", "1.2.3") {
    group("com.example") {
      modules = ["example-core"]
    }
    links {
      site("https://example.com")
      docs(version -> "https://example.com/reference/%s".formatted(version.forAntora()))
      javadoc(version -> "https://example.com/docs/%s/api"
        .formatted(version.forMajorMinorGeneration()), "com.example.[core|web]")
      releaseNotes("https://example.com/releases/{version}")
    }
  }
  library("Interpolated", "\${interpolatedVersion}") {
    links {
      site("https://interpolated.example")
    }
  }
  library("Renamed Bom", "2025.1.0") {
    links("renamed") {
      site("https://renamed.example")
    }
  }
  library("Rooted Javadoc", "4.0.0") {
    links {
      javadoc("other-artifact", version -> "https://cdn.example/%s/index.html".formatted(version), "com.other")
    }
  }
  library("No Links", "9.9.9") {
    group("com.example") {
      modules = ["nothing"]
    }
  }
}
`

describe('parseBomLibraries', () => {
  const libraries = parseBomLibraries(BOM)
  const byName = new Map(libraries.map(library => [library.name, library]))

  test('finds every library declaration, including one without links', () => {
    expect(libraries.map(library => library.name)).toEqual([
      'Example Lib',
      'Interpolated',
      'Renamed Bom',
      'Rooted Javadoc',
      'No Links',
    ])
    expect(byName.get('No Links')?.links).toEqual([])
  })

  test('keeps a Groovy interpolation as declared, for the caller to resolve', () => {
    expect(byName.get('Interpolated')?.declaredVersion).toBe(`\${interpolatedVersion}`)
  })

  test('renders each link kind of a library', () => {
    const library = byName.get('Example Lib')
    const rendered = Object.fromEntries(
      (library?.links ?? []).map(link => [link.name, renderLink(link.template, '1.2.3')]),
    )

    expect(rendered).toEqual({
      site: 'https://example.com',
      docs: 'https://example.com/reference/1.2',
      javadoc: 'https://example.com/docs/1.2.x/api',
      releaseNotes: 'https://example.com/releases/1.2.3',
    })
  })

  test('expands the packages a javadoc link covers', () => {
    const javadoc = byName.get('Example Lib')?.links.find(link => link.name === 'javadoc')
    expect(javadoc?.packages).toEqual(['com.example.core', 'com.example.web'])
  })

  test('links("root") renames the library, not just its links', () => {
    expect(byName.get('Renamed Bom')?.linkRootName).toBe('renamed')
  })

  test('a leading literal is a rootName only when a lambda follows it', () => {
    const javadoc = byName.get('Rooted Javadoc')?.links[0]

    expect(javadoc?.rootName).toBe('other-artifact')
    expect(javadoc?.packages).toEqual(['com.other'])
    expect(renderLink(javadoc!.template, '4.0.0')).toBe('https://cdn.example/4.0.0/index.html')
  })

  test('reads a Groovy closure factory, as the 3.3 line writes it', () => {
    const bom = `
bom {
  library("Closure", "1.3.0") {
    links {
      docs { version -> "https://example.com/reference/%s".formatted(version.forAntora()) }
    }
  }
}
`
    const link = parseBomLibraries(bom)[0]?.links[0]

    expect(link?.name).toBe('docs')
    expect(renderLink(link!.template, '1.3.0')).toBe('https://example.com/reference/1.3')
  })

  test('reads a trailing closure written after the argument list', () => {
    const bom = `
bom {
  library("Trailing", "6.5.2.Final") {
    links {
      add("userguide") { version -> "https://example.com/%s.%s/guide.html"
        .formatted(version.major(), version.minor()) }
    }
  }
}
`
    const link = parseBomLibraries(bom)[0]?.links[0]

    expect(link?.name).toBe('userguide')
    expect(renderLink(link!.template, '6.5.2.Final')).toBe('https://example.com/6.5/guide.html')
  })

  test('reads both spellings of an imported bom', () => {
    const bom = `
bom {
  library("Newer", "1.0.0") {
    group("com.example.new") {
      bom("new-bom")
    }
  }
  library("Older", "2.0.0") {
    group("com.example.old") {
      imports = [
        "old-bom"
      ]
    }
  }
}
`
    const libraries = parseBomLibraries(bom)

    expect(libraries[0]?.importedBoms).toEqual([{ groupId: 'com.example.new', artifactId: 'new-bom' }])
    expect(libraries[1]?.importedBoms).toEqual([{ groupId: 'com.example.old', artifactId: 'old-bom' }])
  })

  test('reads the modules a library manages directly', () => {
    expect(byName.get('Example Lib')?.managedModules)
      .toEqual([{ groupId: 'com.example', artifactId: 'example-core' }])
  })

  test('a separator argument does not leak into the template', () => {
    const bom = `
bom {
  library("Sep", "2.3.34") {
    links {
      releaseNotes(version -> "https://example.com/v_%s.html".formatted(version.toString("_")))
    }
  }
}
`
    const link = parseBomLibraries(bom)[0]?.links[0]
    expect(renderLink(link!.template, '2.3.34')).toBe('https://example.com/v_2_3_34.html')
  })
})

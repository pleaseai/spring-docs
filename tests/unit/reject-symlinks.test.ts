import { describe, expect, test } from 'bun:test'
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import {
  assertDeclaredSymlink,
  assertNoSymlinks,
  materializeDeclaredSymlinks,
} from '../../scripts/lib/reject-symlinks.ts'

describe('assertNoSymlinks', () => {
  test('accepts a clean tree of regular files and directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-clean-'))
    try {
      await mkdir(join(root, 'modules', 'pages'), { recursive: true })
      await writeFile(join(root, 'modules', 'pages', 'index.adoc'), 'content')

      await expect(assertNoSymlinks(root)).resolves.toBeUndefined()
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a symlinked root rather than walking the link target', async () => {
    // `readdir` follows a symlinked directory, so a root that is itself a link
    // would be reported clean on the strength of a tree it does not name. A
    // sparse checkout materializes a mode 120000 blob as a real symlink, so an
    // upstream tag storing the component root as a link reaches this case.
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-root-'))
    try {
      const real = join(root, 'real')
      await mkdir(real)
      await writeFile(join(real, 'index.adoc'), 'content')
      const link = join(root, 'link')
      await symlink(real, link)

      await expect(assertNoSymlinks(link)).rejects.toThrow(link)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a root that is not a directory at all', async () => {
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-file-'))
    try {
      const file = join(root, 'antora.yml')
      await writeFile(file, 'name: boot\n')

      await expect(assertNoSymlinks(file)).rejects.toThrow(/non-directory/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('rejects a symlink anywhere in the tree, naming its path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'reject-symlinks-dirty-'))
    try {
      await mkdir(join(root, 'modules', 'pages'), { recursive: true })
      const target = join(root, 'outside.txt')
      await writeFile(target, 'content')
      const link = join(root, 'modules', 'pages', 'escape.adoc')
      await symlink(target, link)

      await expect(assertNoSymlinks(root)).rejects.toThrow(link)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('materializeDeclaredSymlinks', () => {
  /** A component whose examples are reached through a relative symlink, as Spring Framework's are. */
  async function componentWithExamplesLink(): Promise<string> {
    const root = await mkdtemp(join(tmpdir(), 'materialize-'))
    const component = join(root, 'framework-docs')
    await mkdir(join(component, 'src', 'main'), { recursive: true })
    await writeFile(join(component, 'src', 'main', 'Sample.java'), 'class Sample {}')
    await mkdir(join(component, 'modules', 'ROOT', 'examples'), { recursive: true })
    await symlink('../../../src', join(component, 'modules', 'ROOT', 'examples', 'docs-src'))
    return component
  }

  test('replaces the link with a real copy, leaving the tree copyable', async () => {
    const component = await componentWithExamplesLink()
    try {
      await materializeDeclaredSymlinks(
        dirname(component),
        'framework-docs',
        [{ path: 'modules/ROOT/examples/docs-src', target: 'framework-docs/src' }],
      )

      // The whole point: what was a link is now a directory, so the strict copy
      // guard passes over the component without being relaxed.
      const link = join(component, 'modules', 'ROOT', 'examples', 'docs-src')
      expect((await lstat(link)).isSymbolicLink()).toBe(false)
      expect((await lstat(link)).isDirectory()).toBe(true)
      expect(await readFile(join(link, 'main', 'Sample.java'), 'utf8')).toBe('class Sample {}')
      await expect(assertNoSymlinks(component)).resolves.toBeUndefined()
    }
    finally {
      await rm(join(component, '..'), { recursive: true, force: true })
    }
  })

  test('leaves an undeclared symlink to fail the copy guard', async () => {
    const component = await componentWithExamplesLink()
    try {
      await materializeDeclaredSymlinks(dirname(component), 'framework-docs', [])

      // Nothing declared, nothing materialized — the guard still refuses it.
      await expect(assertNoSymlinks(component)).rejects.toThrow(/docs-src/)
    }
    finally {
      await rm(join(component, '..'), { recursive: true, force: true })
    }
  })

  test('refuses a link pointing out of the checkout', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-escape-'))
    try {
      const outside = join(root, 'outside')
      await mkdir(outside, { recursive: true })
      await writeFile(join(outside, 'secret.txt'), 'not ours')
      const checkout = join(root, 'checkout')
      const component = join(checkout, 'component')
      await mkdir(component, { recursive: true })
      await symlink(outside, join(component, 'escape'))

      await expect(materializeDeclaredSymlinks(checkout, 'component', [{ path: 'escape', target: 'component/escape' }]))
        .rejects
        .toThrow(/out of the checkout/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a link that contains itself, which would copy forever', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-cycle-'))
    try {
      const component = join(root, 'component')
      await mkdir(join(component, 'nested'), { recursive: true })
      // `nested/self` -> the component root, which `nested` sits inside.
      await symlink('..', join(component, 'nested', 'self'))

      await expect(materializeDeclaredSymlinks(root, 'component', [{ path: 'nested/self', target: 'component' }]))
        .rejects
        .toThrow(/contains itself/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a declaration upstream no longer honours', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-stale-'))
    try {
      const component = join(root, 'component')
      await mkdir(component, { recursive: true })
      await writeFile(join(component, 'docs-src'), 'a real file now')

      // Upstream turning the link into a regular file is a layout change a
      // person should see, not one to absorb silently.
      await expect(materializeDeclaredSymlinks(root, 'component', [{ path: 'docs-src', target: 'component/docs-src' }]))
        .rejects
        .toThrow(/not a symlink/)
      await expect(materializeDeclaredSymlinks(root, 'component', [{ path: 'gone', target: 'component/gone' }]))
        .rejects
        .toThrow(/absent/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a link whose target tree carries a symlink of its own', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-nested-'))
    try {
      const outside = join(root, 'outside')
      await mkdir(outside, { recursive: true })
      await writeFile(join(outside, 'secret.txt'), 'not ours')

      const component = join(root, 'component')
      await mkdir(join(component, 'src', 'main'), { recursive: true })
      // The declared link resolves inside the component, but the tree it names
      // hides one pointing out of it. The copy dereferences, so without a check
      // on the source the escape would land as ordinary file content and the
      // check on the copy would find nothing left to refuse.
      await symlink(outside, join(component, 'src', 'main', 'escape'))
      await mkdir(join(component, 'modules', 'ROOT', 'examples'), { recursive: true })
      const link = join(component, 'modules', 'ROOT', 'examples', 'docs-src')
      await symlink('../../../src', link)

      await expect(
        materializeDeclaredSymlinks(
          root,
          'component',
          [{ path: 'modules/ROOT/examples/docs-src', target: 'component/src' }],
        ),
      )
        .rejects
        .toThrow(/escape/)
      expect((await lstat(link)).isSymbolicLink()).toBe(true)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a broken link rather than copying nothing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'materialize-broken-'))
    try {
      const component = join(root, 'component')
      await mkdir(component, { recursive: true })
      await symlink('./nowhere', join(component, 'dangling'))

      await expect(materializeDeclaredSymlinks(root, 'component', [{ path: 'dangling', target: 'component/dangling' }]))
        .rejects
        .toThrow(/broken/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('refuses a link upstream retargeted at a different in-checkout tree', async () => {
    // Upstream repointing the link without moving or removing it — adding and
    // moving are already covered above — must surface too, or the build would
    // silently absorb whatever the link now happens to point at.
    const root = await mkdtemp(join(tmpdir(), 'materialize-retarget-'))
    try {
      const component = join(root, 'component')
      await mkdir(join(component, 'src'), { recursive: true })
      await mkdir(join(component, 'other'), { recursive: true })
      await symlink('other', join(component, 'docs-src'))

      await expect(
        materializeDeclaredSymlinks(root, 'component', [{ path: 'docs-src', target: 'component/src' }]),
      )
        .rejects
        .toThrow(/retargeted/)
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('materializes only the declared link, leaving an undeclared one to fail the guard', async () => {
    // The production shape for framework-docs: one declared link, and every
    // other symlink must still fail. A regression where materialize scanned
    // and auto-copied every symlink instead of only the declared paths would
    // pass a suite that never exercised both together.
    const component = await componentWithExamplesLink()
    try {
      // Outside the declared link's target tree (`src`), so materializing
      // `docs-src` does not walk over this one and throw for the wrong reason.
      await mkdir(join(component, 'modules', 'ROOT', 'pages'), { recursive: true })
      const outside = join(component, '..', 'outside.adoc')
      await writeFile(outside, 'not ours')
      await symlink(outside, join(component, 'modules', 'ROOT', 'pages', 'undeclared.adoc'))

      await materializeDeclaredSymlinks(
        dirname(component),
        'framework-docs',
        [{ path: 'modules/ROOT/examples/docs-src', target: 'framework-docs/src' }],
      )

      const link = join(component, 'modules', 'ROOT', 'examples', 'docs-src')
      expect((await lstat(link)).isSymbolicLink()).toBe(false)
      await expect(assertNoSymlinks(component)).rejects.toThrow(/undeclared\.adoc/)
    }
    finally {
      await rm(join(component, '..'), { recursive: true, force: true })
    }
  })

  test('materializes a link resolving outside the component but inside the checkout', async () => {
    // The Spring Data shape (ADR-0008): the component is `src/main/antora`, and
    // its examples link reaches the store's test sources beside it.
    const checkout = await mkdtemp(join(tmpdir(), 'materialize-store-'))
    try {
      const sources = join(checkout, 'src', 'test', 'java', 'example')
      await mkdir(sources, { recursive: true })
      await writeFile(join(sources, 'Example.java'), 'class Example {}')
      const examples = join(checkout, 'src', 'main', 'antora', 'modules', 'ROOT', 'examples')
      await mkdir(examples, { recursive: true })
      const link = join(examples, 'example')
      await symlink(relative(examples, sources), link)

      await materializeDeclaredSymlinks(
        checkout,
        'src/main/antora',
        [{ path: 'modules/ROOT/examples/example', target: 'src/test/java/example' }],
      )

      expect((await lstat(link)).isDirectory()).toBe(true)
      expect(await readFile(join(link, 'Example.java'), 'utf8')).toBe('class Example {}')
      await expect(assertNoSymlinks(join(checkout, 'src', 'main', 'antora'))).resolves.toBeUndefined()
    }
    finally {
      await rm(checkout, { recursive: true, force: true })
    }
  })

  test('refuses a link that reaches the pipeline\'s own checkout state through a directory link', async () => {
    // The declared target passes as text, but a directory on the way to it is
    // itself a link into `.git`, so what the copy would read is git metadata.
    const checkout = await mkdtemp(join(tmpdir(), 'materialize-reserved-'))
    try {
      await mkdir(join(checkout, '.git', 'objects'), { recursive: true })
      await symlink('.git', join(checkout, 'meta'))
      const component = join(checkout, 'component')
      await mkdir(component, { recursive: true })
      await symlink('../.git/objects', join(component, 'examples'))

      await expect(
        materializeDeclaredSymlinks(checkout, 'component', [{ path: 'examples', target: 'meta/objects' }]),
      )
        .rejects
        .toThrow(/pipeline's own checkout state/)
    }
    finally {
      await rm(checkout, { recursive: true, force: true })
    }
  })
})

describe('assertDeclaredSymlink', () => {
  test('accepts a plain relative path and target', () => {
    expect(() => assertDeclaredSymlink({
      path: 'modules/ROOT/examples/r2dbc',
      target: 'spring-data-r2dbc/src/test/java/org/springframework/data/r2dbc/documentation',
    })).not.toThrow()
  })

  test.each([
    ['a target under .git', { path: 'examples/x', target: '.git/objects' }, /\.git\//],
    ['a target in the parent checkout', { path: 'examples/x', target: '.spring-docs-parent/parent' }, /\.spring-docs-parent\//],
    ['a target in the companion checkout', { path: 'examples/x', target: '.spring-docs-companion/src' }, /\.spring-docs-companion\//],
    ['a target climbing with ..', { path: 'examples/x', target: 'src/../../outside' }, /not normalized/],
    ['a path climbing with ..', { path: '../x', target: 'src' }, /not normalized/],
    ['an absolute target', { path: 'examples/x', target: '/etc' }, /not relative/],
    ['an empty target', { path: 'examples/x', target: '' }, /not relative/],
    ['the checkout root itself', { path: 'examples/x', target: '.' }, /not normalized/],
    ['a trailing slash', { path: 'examples/x', target: 'src/' }, /not normalized/],
  ] as const)('refuses %s', (_label, declared, message) => {
    expect(() => assertDeclaredSymlink(declared)).toThrow(message)
  })

  test('is enforced by materializeDeclaredSymlinks before the checkout is read', async () => {
    // A path that does not exist: the declaration is refused on its spelling,
    // not reported as an absent link.
    await expect(
      materializeDeclaredSymlinks('/nonexistent-checkout', 'component', [{ path: 'x', target: '.git/config' }]),
    )
      .rejects
      .toThrow(/\.git\//)
  })
})

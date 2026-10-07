// The report's possible links, its sections and the pull request's text; and how the next
// episode is chosen.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { setGloss } from '../../toolkit/src/edit/names.js'
import { data as makeData, entry, mention, small } from '../../toolkit/test/fixtures/data.js'
import { PER_ENTRY, possibleLinks, pullRequest, report } from '../5-report/report.js'
import { nextEpisode } from '../lib/next-episode.js'
import { EPISODE, ID } from './project.js'

/** `before` and `after` adding the episode with a new entry, London. */
function change(beforeEntries) {
  const before = makeData(beforeEntries)
  const after = structuredClone(before)
  after.episodes.unshift({ ...EPISODE })
  after.entries.push(entry('London', { language: null, category: 'name' }, mention(ID, 60, 'A city.')))
  after.entries.push(entry('Paris', { language: null, category: 'name' }, mention(ID, 120, 'Another city, unlike [[see:London]].')))
  return { before, after }
}

const of = (links, slug) => links.find((x) => x.entry.slug === slug)

describe('possibleLinks', () => {
  test('finds links that led nowhere and now lead to a new entry, in other episodes only', () => {
    const { before, after } = change([
      entry('Thames', { category: 'name' }, mention('ep-a', 10, 'The river of [[see:London]].')),
      entry('Seine', { category: 'name' }, mention('ep-b', 10, 'The river of [[see:Paris]], not of London.')),
    ])
    const london = of(possibleLinks(before, after, ID), 'london')
    assert.deepEqual(london.captured.map((x) => x.entry.slug), ['thames'])
    assert.deepEqual(london.plain.map((x) => x.entry.slug), ['seine'])
    const paris = of(possibleLinks(before, after, ID), 'paris')
    assert.deepEqual(paris.captured.map((x) => x.entry.slug), ['seine'])
    assert.equal(paris.plainTotal, 0)
  })

  test('lists no plain-text mentions of a language name', () => {
    const { before, after } = change([entry('Glasgow', { category: 'name' }, mention('ep-a', 10, 'From Scottish Gaelic Glaschu.')), entry('glas', { language: 'Scottish Gaelic' }, mention('ep-a', 20, 'Green.'))])
    after.entries.push(entry('Scottish Gaelic', { category: 'about-language' }, mention(ID, 180, 'The Celtic language of Scotland.')))
    assert.equal(of(possibleLinks(before, after, ID), 'scottish-gaelic').plainTotal, 0)
  })

  test('caps each list, with the totals', () => {
    const entries = Array.from({ length: PER_ENTRY + 3 }, (_, i) => entry(`river ${i}`, {}, mention('ep-a', i, `It flows through London, stop ${i}.`)))
    const { before, after } = change(entries)
    const london = of(possibleLinks(before, after, ID), 'london')
    assert.equal(london.plain.length, PER_ENTRY)
    assert.equal(london.plainTotal, PER_ENTRY + 3)
  })

  test('follows links of entries renamed by a gloss', () => {
    const { before, after: added } = change([entry('Thames', { category: 'name' }, mention('ep-a', 10, 'The river of [[see:London]].'))])
    const after = setGloss(added, 'thames', 'river')
    const london = of(possibleLinks(before, after, ID, [{ from: 'thames', to: 'thames-river' }]), 'london')
    assert.deepEqual(london.captured.map((x) => x.entry.slug), ['thames-river'])
  })
})

describe('report and pull request', () => {
  const record = {
    episode: EPISODE,
    model: 'claude-opus-5-5',
    result: { turns: 40, duration_ms: 600_000, cost_usd: 3.5 },
    warnings: [{ code: 'note-context', message: 'paris in newEpisode1: the note starts with "Another".', slugs: ['paris'] }],
    complaints: [{ slug: 'inch', name: 'inch', text: 'Language should be English.' }],
    glosses: [],
    retro: 'The roles of cities were hard to call.',
  }

  test('has every section', () => {
    const { before, after } = change(small().entries)
    const text = report({ record, before, after, verify: 'Passed: 2 mentions.\nmore' })
    for (const heading of ['# Words for towns', '## Summary', '## Warnings (1)', '## Complaints (1)', '## Retrospective', '## Possible links to the new entries']) {
      assert.ok(text.includes(`\n${heading}\n`) || text.startsWith(`${heading}\n`), heading)
    }
    assert.match(text, /2 mentions \(2 subject, 0 aside, 0 mention\), 0 low-confidence; 2 new entries\./)
    assert.match(text, /- `note-context` paris in newEpisode1/)
    assert.match(text, /- \*\*inch\*\* \(`inch`\): Language should be English\./)
    assert.match(text, /The roles of cities were hard to call\./)
    assert.match(text, /Extracted by claude-opus-5-5, 40 turns, 10 min, \$3\.50\./)
    assert.match(text, /## Possible links to the new entries\n\n.*\n\nNone found\.\n/)
  })

  test('lists the possible links of each new entry', () => {
    const { before, after } = change([...small().entries, entry('Thames', { category: 'name' }, mention('ep-a', 10, 'The river of [[see:London]].'))])
    const text = report({ record, before, after, verify: 'Passed.' })
    assert.match(text, /### London \(`london`\)\n\nLinks that now lead here \(1\):\n\n- \*\*Thames\*\* in \*Episode A\* \(00:00:10\): The river of \[\[see:London\]\]\.\n/)
  })

  test('the pull request is short', () => {
    const { after } = change(small().entries)
    assert.equal(
      pullRequest({ record: { ...record, glosses: [{ from: 'a', to: 'a-b' }] }, after }),
      `Episode: Words for towns\n\nAdds "Words for towns" (2026-04-01): 2 mentions, 2 new entries, 1 gloss added; 1 warning, 1 complaint.\n\nReport: ingest/runs/${ID}/5-report.md`,
    )
  })
})

describe('nextEpisode', () => {
  const videos = [
    { id: 'newest00000', duration: 3000 },
    { id: 'trailer0000', duration: 60 },
    { id: 'newer000000', duration: 3000 },
    { id: 'known000000', duration: 3000 },
    { id: 'older000000', duration: 3000 },
  ]
  test('takes the oldest video newer than every known episode', () => {
    assert.equal(nextEpisode(videos, new Set(['known000000']), new Set()), 'newer000000')
  })
  test('skips episodes with a branch, and short videos', () => {
    assert.equal(nextEpisode(videos, new Set(['known000000']), new Set(['newer000000'])), 'newest00000')
    assert.equal(nextEpisode(videos, new Set(['known000000']), new Set(['newer000000', 'newest00000'])), null)
  })
  test('finds nothing when the newest video is known', () => {
    assert.equal(nextEpisode(videos, new Set(['newest00000']), new Set()), null)
  })
})

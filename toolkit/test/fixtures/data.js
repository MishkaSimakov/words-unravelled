// A small, error-free dataset for tests, and builders for more. Every call returns fresh objects.

import { ENTRY_KEYS, ordered } from '../../src/model/schema.js'
import { entrySlug } from '../../src/model/slugs.js'

export const EPISODES = () => [
  { id: 'ep-c', title: 'Episode C', date: '2026-03-01', duration: 3000 },
  { id: 'ep-b', title: 'Episode B', date: '2026-02-01', duration: 3000 },
  { id: 'ep-a', title: 'Episode A', date: '2026-01-01', duration: 3000 },
]

/** A mention. */
export const mention = (episode_id, t, note, role = 'subject', confidence = 'high') => ({ episode_id, t, role, note, confidence })

/** An entry with its slug derived from term and gloss; English words unless `fields` say otherwise. */
export const entry = (term, fields = {}, ...mentions) =>
  ordered(ENTRY_KEYS, { slug: entrySlug(term, fields.gloss), term, language: 'English', category: 'word', ...fields, mentions })

/** Data from entries, sorted by slug as the data files are. */
export const data = (entries, episodes = EPISODES()) => ({
  entries: entries.sort((a, b) => (a.slug < b.slug ? -1 : 1)),
  episodes,
})

/**
 * Glossed homographs (meal), an unglossed word with a glossed sibling (gift, Gift (German)), a
 * link resolved by original form (uncia -> ounce), links of every type, an uncertain link, a
 * trail, an entry in two episodes and a mention-only entry.
 */
export const small = () =>
  data([
    entry('acrobat', {}, mention('ep-c', 500, 'Literally a walker on tiptoe.')),
    entry('bat', {}, mention('ep-c', 400, 'Pointed back to the episode on animal names.', 'mention')),
    entry('bath', {}, mention('ep-c', 410, 'Pointed back to the episode on houses.', 'mention')),
    entry('batter', {}, mention('ep-c', 420, 'A mixture of flour and eggs, beaten.')),
    entry('break a leg', { category: 'expression' },
      mention('ep-c', 300, 'Good luck, said to actors; the German [[equivalent:Hals- und Beinbruch]] says the same.')),
    entry('cartouche', {},
      mention('ep-a', 100, 'A doublet of [[same-root:cartridge]]; both from Italian [[from:cartuccia]].'),
      mention('ep-c', 50, 'The loop around royal names in hieroglyphs.', 'aside')),
    entry('cartridge', {}, mention('ep-a', 120, 'From [[from:cartuccia]], via French.')),
    entry('cartuccia', { language: 'Italian' },
      mention('ep-a', 110, 'Italian, which [[gave:cartridge]] and [[gave?:cartouche]].', 'aside', 'low')),
    entry('gift', {}, mention('ep-b', 10, 'A present; [[unrelated:Gift (German)]] means poison.')),
    entry('Gift', { gloss: 'German', original: 'Gift', translation: 'poison', language: 'German' },
      mention('ep-b', 20, 'Poison, from the same root as English [[same-root:gift]].')),
    entry('inch', {}, mention('ep-b', 30, 'From Latin [[from:uncia]], a twelfth, like [[see:ounce]]s.')),
    entry('meal', { gloss: 'flour' }, mention('ep-a', 200, 'Ground grain, as in [[see:oatmeal]].')),
    entry('meal', { gloss: 'repast' }, mention('ep-a', 210, 'A repast, unrelated to [[unrelated:meal (flour)]].')),
    entry('oatmeal', {}, mention('ep-a', 220, 'Porridge of [[see:meal (flour)]].', 'aside')),
    entry('ounce', { original: 'uncia', translation: 'a twelfth', language: 'Latin' },
      mention('ep-b', 40, 'A twelfth of a pound.')),
  ])

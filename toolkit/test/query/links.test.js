import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linkIndex, resolveLink } from '../../src/query/links.js'

const entry = (slug, original = null) => ({ slug, original })

const index = linkIndex([
  entry('cartouche'),
  entry('meal-flour'),
  entry('meal-repast'),
  entry('gift-german', 'Gift'),
  entry('horse', 'hors'),
  entry('chauve-souris', 'chauve-souris'),
  entry('pain-french', 'pain'),
  entry('bread', 'pain'),
])

test('a target resolves by its slug', () => {
  assert.equal(resolveLink(index, 'Cartouche', 'bat'), 'cartouche')
})

test('a target with a gloss resolves to that homograph', () => {
  assert.equal(resolveLink(index, 'meal (flour)', 'bat'), 'meal-flour')
  assert.equal(resolveLink(index, 'meal (repast)', 'bat'), 'meal-repast')
})

test('a target resolves by original form when no entry has its slug', () => {
  assert.equal(resolveLink(index, 'hors', 'bat'), 'horse')
  assert.equal(resolveLink(index, 'Gift', 'bat'), 'gift-german')
})

test('a target without a gloss does not reach a glossed homograph by its term', () => {
  assert.equal(resolveLink(index, 'meal', 'bat'), null)
})

test('a link never resolves to its own entry', () => {
  assert.equal(resolveLink(index, 'cartouche', 'cartouche'), null)
  assert.equal(resolveLink(index, 'hors', 'horse'), null)
})

test('a slug match comes before an original form', () => {
  assert.equal(resolveLink(index, 'chauve-souris', 'bat'), 'chauve-souris')
})

test('a target several original forms match resolves to nothing', () => {
  assert.equal(resolveLink(index, 'pain', 'bat'), null)
  assert.equal(resolveLink(index, 'pain', 'bread'), 'pain-french')
})

test('a target that names nothing resolves to nothing', () => {
  assert.equal(resolveLink(index, 'unicorn', 'bat'), null)
})

test('linkIndex groups entries by the slug of their term, glossed or not, and by original form', () => {
  const terms = linkIndex([
    { slug: 'meal-flour', term: 'Meal', gloss: 'flour', original: null },
    { slug: 'meal-repast', term: 'meal', gloss: 'repast', original: null },
    { slug: 'gift-german', term: 'Gift', gloss: 'German', original: 'Gift' },
  ])
  assert.deepEqual(terms.byTerm.get('meal').map((e) => e.slug), ['meal-flour', 'meal-repast'])
  assert.deepEqual(terms.byOriginal.get('gift').map((e) => e.slug), ['gift-german'])
  assert.equal(terms.byOriginal.size, 1)
})

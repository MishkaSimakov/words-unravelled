import { test } from 'node:test'
import assert from 'node:assert/strict'
import { entrySlug, fileAs, fileLetter, fold, slugify, slugText } from '../../src/model/slugs.js'

test('slugify lowercases and turns spaces and punctuation into single hyphens', () => {
  assert.equal(slugify('Break a Leg!'), 'break-a-leg')
  assert.equal(slugify('  -able '), 'able')
  assert.equal(slugify('4-4-0'), '4-4-0')
  assert.equal(slugify('snake_case'), 'snake-case')
})

test('slugify folds diacritics and spells out letters that do not fold', () => {
  assert.equal(slugify('Björk'), 'bjork')
  assert.equal(slugify('hōra'), 'hora')
  assert.equal(slugify('Straße'), 'strasse')
  assert.equal(slugify('Ælfric'), 'aelfric')
  assert.equal(slugify('þorn'), 'thorn')
  assert.equal(slugify('Łódź'), 'lodz')
})

test('slugify drops apostrophes and invisible characters, and spells out &', () => {
  assert.equal(slugify("don't"), 'dont')
  assert.equal(slugify('Sod’s law'), 'sods-law')
  assert.equal(slugify('soft­ware​'), 'software')
  assert.equal(slugify('M&S'), 'm-and-s')
})

test('slugify keeps letters of other scripts', () => {
  assert.equal(slugify('Ελλάδα'), 'ελλαδα')
  assert.equal(slugify('кот'), 'кот')
})

test('slugify of nothing is "entry"', () => {
  assert.equal(slugify(''), 'entry')
  assert.equal(slugify('…'), 'entry')
  assert.equal(slugify(null), 'entry')
})

test('slugText is slugify without the fallback', () => {
  assert.equal(slugText('Break a Leg!'), 'break-a-leg')
  assert.equal(slugText('…'), '')
  assert.equal(slugText(null), '')
})

test('entrySlug adds the gloss when there is one', () => {
  assert.equal(entrySlug('meal', 'flour'), 'meal-flour')
  assert.equal(entrySlug('Gift', 'German'), 'gift-german')
  assert.equal(entrySlug('meal'), 'meal')
  assert.equal(entrySlug('meal', null), 'meal')
})

test('fold keeps one character per character', () => {
  assert.equal(fold('Café'), 'cafe')
  assert.equal(fold('Ælf').length, 3)
  // An emoji is two code units, and stays two.
  assert.equal(fold('A😀İb'), 'a😀ib')
})

test('fileAs files under the first letter, with unfoldable letters spelt out', () => {
  assert.equal(fileAs('-able'), 'able')
  assert.equal(fileAs('ælf'), 'aelf')
  assert.equal(fileAs('Éclair'), 'eclair')
  assert.equal(fileLetter(fileAs('Éclair')), 'E')
  assert.equal(fileLetter(fileAs('10-1')), '#')
  assert.equal(fileLetter(fileAs('кот')), '#')
})

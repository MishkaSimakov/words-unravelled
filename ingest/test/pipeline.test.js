// The pipeline's scripts on a temporary copy of the project, with a mock claude: a whole run of
// new-episode.sh, the sandbox flags, every way step 3 can fail (each must leave the working tree
// as it was), the verifier rejecting a change, and the leftovers of earlier runs.

import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { after, describe, test } from 'node:test'
import { ALLOWED_TOOLS } from '../3-extract/run.js'
import { ID, item, makeProject, submitAndFinish } from './project.js'

const projects = []
const project = (options) => {
  const p = makeProject(options)
  projects.push(p)
  return p
}
after(() => projects.forEach((p) => p.remove()))

const LONDON = item({ term: 'London', language: null, category: 'name' }, '00:01:00', 'Named after [[from:Londinium]].')
const OUNCE = item('ounce', '00:02:00', 'A weight, as in an ounce of prevention.', 'aside')
const GOOD = submitAndFinish([LONDON, OUNCE])
const RUN = `ingest/runs/${ID}`

/** Asserts the run failed and left nothing behind: data as at HEAD, the run moved to failed/. */
function assertUndone(p, r, pattern) {
  assert.equal(r.status, 1, r.out)
  assert.match(r.out, pattern)
  assert.match(r.out, /data\/ is back as it is at HEAD/)
  assert.deepEqual(p.status(), [])
  assert.equal(existsSync(p.at(RUN)), false)
  const failed = readdirSync(p.at('ingest/failed'))
  assert.equal(failed.length, 1)
  assert.ok(failed[0].startsWith(`${ID}-`))
  return p.at('ingest/failed', failed[0])
}

describe('new-episode.sh', () => {
  test('runs steps 2 to 5 and commits the episode on its own branch', () => {
    const p = project({ transcript: false })
    const r = p.run('ingest/new-episode.sh', [ID, '--model', 'claude-test'], { script: GOOD })
    assert.equal(r.status, 0, r.out)
    for (const step of ['Step 1: download', 'Step 2: transcript', 'Step 3: extract', 'Step 4: verify', 'Step 5: report']) assert.match(r.out, new RegExp(step))
    assert.equal(p.git('branch', '--show-current').trim(), `episode/${ID}`)
    assert.deepEqual(p.status(), [])
    const files = p.git('show', '--name-only', '--format=%s', 'HEAD').trim().split('\n')
    assert.equal(files[0], `Add episode "Words for towns" (${ID})`)
    assert.deepEqual(files.slice(2).sort(), ['data/entries.json', 'data/episodes.json', ...['3-agent-log.md', '3-record.json', '4-verify.txt', '5-report.md'].map((f) => `${RUN}/${f}`)])
    // The pull request's title and body come last.
    assert.match(r.stdout, /Episode: Words for towns\n\nAdds "Words for towns" \(2026-04-01\): 2 mentions, 1 new entry; 0 warnings, 0 complaints\.\n\nReport: ingest\/runs\/newEpisode1\/5-report\.md\n$/)
    assert.equal(p.json(`${RUN}/3-record.json`).model, 'claude-test')
  })

  test('passes --cookies to yt-dlp, for listing the channel and downloading', () => {
    const p = project({ captions: false, transcript: false })
    // A path relative to where the script is run from, outside the repository.
    const cookies = join(p.root, '..', `${basename(p.root)}-cookies.txt`)
    writeFileSync(cookies, '# Netscape HTTP Cookie File\n')
    projects.push({ remove: () => rmSync(cookies, { force: true }) })
    const script = submitAndFinish([item({ term: 'London', language: null, category: 'name' }, '00:01:00', 'A city.')])
    const r = p.run('ingest/new-episode.sh', ['--cookies', `../${basename(cookies)}`], { script, env: { MOCK_YTDLP_VIDEOS: `${ID} 3000,ep-c 3000` } })
    assert.equal(r.status, 0, r.out)
    assert.match(r.out, /Next episode: newEpisode1/)
    assert.equal(r.log.ytdlp.length, 2, 'the listing and the download')
    for (const args of r.log.ytdlp) assert.deepEqual(args.slice(0, 2), ['--cookies', cookies])
  })

  test('downloads without cookies when none are given', () => {
    const p = project({ captions: false, transcript: false })
    const r = p.run('ingest/new-episode.sh', [ID], { script: GOOD })
    assert.equal(r.status, 0, r.out)
    assert.equal(r.log.ytdlp.length, 1)
    assert.ok(!r.log.ytdlp[0].includes('--cookies'))
  })

  test('refuses a cookies file that does not exist', () => {
    const p = project()
    const r = p.run('ingest/new-episode.sh', [ID, '--cookies', 'nowhere.txt'], { script: GOOD })
    assert.equal(r.status, 2)
    assert.match(r.out, /No cookies file nowhere\.txt/)
    assert.equal(r.log, null, 'nothing was run')
  })

  test('refuses a dirty working tree before doing anything', () => {
    const p = project()
    p.write('notes.txt', 'mine')
    const r = p.run('ingest/new-episode.sh', [ID], { script: GOOD })
    assert.equal(r.status, 1)
    assert.match(r.out, /working tree has changes/)
    assert.equal(r.log, null, 'claude was not run')
  })

  test('refuses an episode whose branch exists', () => {
    const p = project()
    p.git('branch', `episode/${ID}`)
    const r = p.run('ingest/new-episode.sh', [ID], { script: GOOD })
    assert.equal(r.status, 1)
    assert.match(r.out, /Branch episode\/newEpisode1 exists/)
  })

  test('stops at the first failing step and leaves the tree as it was', () => {
    const p = project()
    const r = p.run('ingest/new-episode.sh', [ID], { script: { ...GOOD, result: { is_error: true, result: 'Claude AI usage limit reached' }, exit: 1 } })
    assertUndone(p, r, /usage limit reached/)
    assert.doesNotMatch(r.out, /Step 4/)
    assert.equal(p.git('branch', '--show-current').trim(), 'main')
  })
})

describe('step 3: extract', () => {
  test('runs claude in the sandbox', () => {
    const p = project()
    const r = p.run('ingest/3-extract/run.js', [ID], { script: GOOD })
    assert.equal(r.status, 0, r.out)
    const args = r.log.args
    const flag = (name) => args[args.indexOf(name) + 1]
    assert.equal(flag('--tools'), '')
    assert.equal(flag('--setting-sources'), '')
    assert.equal(flag('--permission-mode'), 'dontAsk')
    assert.equal(flag('--allowedTools'), ALLOWED_TOOLS.join(','))
    assert.equal(flag('--model'), 'claude-opus-5-5')
    for (const name of ['-p', '--strict-mcp-config', '--disable-slash-commands', '--no-session-persistence']) assert.ok(args.includes(name), name)
    assert.match(flag('--system-prompt'), /^You add one new episode/)
    assert.match(r.log.stdin, /<transcript>\n# video_id: newEpisode1[\s\S]*\[00:01:00\] London was Londinium\.[\s\S]*<\/transcript>/)
    // The agent's log has its calls, and no transcript.
    const log = p.read(`${RUN}/3-agent-log.md`)
    assert.match(log, /\*\*→ submit\*\*/)
    assert.match(log, /\*\*← finish\*\*/)
    assert.doesNotMatch(log, /London was Londinium/)
    const record = p.json(`${RUN}/3-record.json`)
    assert.equal(record.finished, true)
    assert.equal(record.result.cost_usd, 0.25)
  })

  const failures = {
    'a usage limit': [{ ...GOOD, result: { is_error: true, result: 'Claude AI usage limit reached|1760000000' }, exit: 1 }, /usage limit reached/],
    'an API error': [{ calls: GOOD.calls.slice(0, 1), result: { subtype: 'error_during_execution', is_error: true, result: '' } }, /error_during_execution/],
    'a crash': [{ ...GOOD, exit: 3, stderr: 'Segmentation fault' }, /code 3.*Segmentation fault/],
    'no finish': [{ calls: GOOD.calls.slice(0, 1) }, /stopped without calling finish/],
    'tools outside the sandbox': [{ ...GOOD, tools: ['Bash'] }, /outside the sandbox: Bash/],
    'a timeout': [{ calls: GOOD.calls.slice(0, 1), hang: true }, /longer than 0\.02 minutes/],
  }
  for (const [name, [script, pattern]] of Object.entries(failures)) {
    test(`undoes everything after ${name}`, () => {
      const p = project()
      const r = p.run('ingest/3-extract/run.js', [ID, '--timeout', '0.02'], { script })
      const failed = assertUndone(p, r, pattern)
      assert.ok(existsSync(`${failed}/3-agent-log.md`), 'the log is kept for a look')
    })
  }

  test('says so when claude is not installed', () => {
    const p = project()
    const r = p.run('ingest/3-extract/run.js', [ID], { env: { CLAUDE_BIN: p.at('no-such-claude') } })
    assertUndone(p, r, /could not be started/)
  })

  const refusals = {
    'a dirty working tree': [(p) => p.write('data/silenced.json', '[ ]\n'), /working tree has changes/],
    'an earlier run': [(p) => mkdirSync(p.at(RUN), { recursive: true }), /runs\/newEpisode1\/ exists/],
    'no transcript': [() => {}, /No transcript/, { transcript: false }],
    'no metadata': [() => {}, /No metadata/, { captions: false }],
    'an episode already in data': [
      (p) => {
        p.write('data/episodes.json', p.read('data/episodes.json').replace('[\n', `[\n {"id": "${ID}", "title": "x", "date": "2026-04-01", "duration": 10},\n`))
        p.git('commit', '-qam', 'Add it')
      },
      /already in data\/episodes.json/,
    ],
    'a bad video ID': [() => {}, /not a YouTube video ID/, {}, '../../etc'],
  }
  for (const [name, [prepare, pattern, options, id]] of Object.entries(refusals)) {
    test(`refuses ${name} and changes nothing`, () => {
      const p = project(options)
      prepare(p)
      const before = p.status()
      const r = p.run('ingest/3-extract/run.js', [id ?? ID], { script: GOOD })
      assert.equal(r.status, 1, r.out)
      assert.match(r.out, pattern)
      assert.equal(r.log, null, 'claude was not run')
      assert.deepEqual(p.status(), before)
      assert.equal(existsSync(p.at('ingest/failed')), false)
    })
  }
})

describe('step 4: verify', () => {
  test('passes the change step 3 made', () => {
    const p = project()
    p.run('ingest/3-extract/run.js', [ID], { script: GOOD })
    const r = p.run('ingest/4-verify/verify.js', [ID])
    assert.equal(r.status, 0, r.out)
    assert.match(p.read(`${RUN}/4-verify.txt`), /^Passed: 2 mentions of newEpisode1, 1 new entry\./)
  })

  test('rejects a change beyond the episode, discards it and keeps the diff', () => {
    const p = project()
    p.run('ingest/3-extract/run.js', [ID], { script: GOOD })
    p.write('data/entries.json', p.read('data/entries.json').replace('A twelfth of a pound.', 'A twelfth of a pound, more or less.'))
    const r = p.run('ingest/4-verify/verify.js', [ID])
    const failed = assertUndone(p, r, /\[other-mentions\] ounce in ep-b/)
    assert.match(p.read(`${failed.slice(p.root.length + 1)}/4-verify.diff`), /more or less/)
    assert.match(p.read(`${failed.slice(p.root.length + 1)}/4-verify.txt`), /^Rejected:/)
  })

  test('rejects another file changed', () => {
    const p = project()
    p.run('ingest/3-extract/run.js', [ID], { script: GOOD })
    p.write('data/silenced.json', '[ ]\n')
    assertUndone(p, p.run('ingest/4-verify/verify.js', [ID]), /\[files\].*data\/silenced\.json/)
  })

  test('refuses to run without a finished step 3, or twice', () => {
    const p = project()
    let r = p.run('ingest/4-verify/verify.js', [ID])
    assert.equal(r.status, 1)
    assert.match(r.out, /No finished extraction/)
    p.run('ingest/3-extract/run.js', [ID], { script: GOOD })
    p.run('ingest/4-verify/verify.js', [ID])
    r = p.run('ingest/4-verify/verify.js', [ID])
    assert.equal(r.status, 1)
    assert.match(r.out, /verified already/)
    assert.ok(existsSync(p.at(RUN)), 'a refusal undoes nothing')
  })
})

describe('step 5: report', () => {
  test('refuses to run before step 4, or twice', () => {
    const p = project()
    p.run('ingest/3-extract/run.js', [ID], { script: GOOD })
    let r = p.run('ingest/5-report/report.js', [ID])
    assert.equal(r.status, 1)
    assert.match(r.out, /4-verify\.txt\. Run steps 3 and 4 first/)
    p.run('ingest/4-verify/verify.js', [ID])
    assert.equal(p.run('ingest/5-report/report.js', [ID]).status, 0)
    r = p.run('ingest/5-report/report.js', [ID])
    assert.equal(r.status, 1)
    assert.match(r.out, /written already/)
  })
})

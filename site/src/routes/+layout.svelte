<script>
  import '@fontsource-variable/fraunces/opsz.css'
  import '@fontsource-variable/fraunces/opsz-italic.css'
  import '@fontsource-variable/source-serif-4/opsz.css'
  import '@fontsource-variable/source-serif-4/opsz-italic.css'
  import '../app.css'
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/state'
  import { load } from '#lib/db.js'
  import { href } from '#lib/paths.js'

  let { children } = $props()

  let main
  const route = $derived(page.route.id)
  const data = load()

  // Like a page load, a followed link starts reading at the content.
  afterNavigate(({ type }) => {
    if (type === 'link') main?.focus({ preventScroll: true })
  })

  async function onkeydown(ev) {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)
    if (ev.key === '/' && !typing) {
      ev.preventDefault()
      if (!document.getElementById('q')) {
        await goto(href())
        main?.focus({ preventScroll: true })
      }
      document.getElementById('q')?.focus()
    }
  }
</script>

<svelte:window {onkeydown} />

<a class="skip" href="#main">Skip to content</a>
<header class="site-header" class:home={route === '/'}>
  <div class="wrap">
    <a class="brand" href={href()}>
      <span class="brand-mark" aria-hidden="true">æ</span>
      <span class="brand-name">Wordhoard</span>
    </a>
    <span class="brand-tag">unofficial index to <em>Words Unravelled</em></span>
    <nav class="site-nav" aria-label="Main">
      <a href={href('episodes')} aria-current={route === '/episodes' || route === '/episode/[id]' ? 'page' : undefined}
        >Episodes</a
      >
      <a href={href('about')} aria-current={route === '/about' ? 'page' : undefined}>About</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap" tabindex="-1" bind:this={main}>
  {#await data}
    <p class="loading">Opening the hoard…</p>
  {:then}
    <!-- Every navigation renders the page afresh, also between two entries. -->
    {#key page.url.pathname}{@render children()}{/key}
  {:catch err}
    <article class="prose">
      <h1 class="page-title">The hoard is locked</h1>
      <p>The index data could not be loaded ({err.message}). Try reloading the page.</p>
    </article>
  {/await}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>
      <strong>Wordhoard</strong> is an unofficial fan project, not affiliated with RobWords or
      Words Unravelled. Entries are extracted automatically from YouTube captions and may
      contain mistakes. <a href={href('about')}>About this site</a>.
    </p>
  </div>
</footer>

<style>
  main {
    flex: 1;
    padding-bottom: 64px;
    outline: none;
  }

  .skip {
    position: absolute;
    left: -999px;
    top: 8px;
    background: var(--ink);
    color: var(--paper);
    padding: 8px 12px;
    z-index: 10;
  }
  .skip:focus {
    left: 8px;
  }

  .loading {
    color: var(--muted);
    font-style: italic;
    padding: 48px 0;
  }

  .site-header {
    border-bottom: 1px solid var(--rule);
    background: var(--paper);
  }
  .site-header .wrap {
    display: flex;
    align-items: center;
    gap: 12px 18px;
    min-height: 60px;
    flex-wrap: wrap;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .brand:hover {
    color: inherit;
  }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--rubric);
    color: var(--paper);
    font-family: var(--serif-display);
    font-style: italic;
    font-size: 1.35rem;
    line-height: 1;
    padding-bottom: 3px;
  }
  .brand-name {
    font-family: var(--serif-display);
    font-weight: 650;
    font-size: 1.3rem;
    letter-spacing: -0.01em;
  }
  .brand-tag {
    color: var(--muted);
    font-size: 0.9rem;
    font-style: italic;
  }
  .home .brand-tag {
    display: none;
  }
  .brand-tag em {
    font-style: normal;
  }
  .site-nav {
    margin-left: auto;
    display: flex;
    gap: 18px;
  }
  .site-nav a {
    text-decoration: none;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.06em;
    font-size: 1.1rem;
    color: var(--ink-soft);
  }
  .site-nav a[aria-current] {
    color: var(--rubric);
    text-decoration: underline;
  }

  .site-footer {
    border-top: 1px solid var(--rule);
    background: var(--paper-deep);
    color: var(--muted);
    font-size: 0.9rem;
  }
  .site-footer p {
    margin: 20px 0;
    max-width: 70ch;
  }

  @media (max-width: 700px) {
    .brand-tag {
      display: none;
    }
  }
</style>

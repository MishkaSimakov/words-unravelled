<script>
  import '@fontsource-variable/fraunces/opsz.css'
  import '@fontsource-variable/fraunces/opsz-italic.css'
  import '@fontsource-variable/source-serif-4/opsz.css'
  import '@fontsource-variable/source-serif-4/opsz-italic.css'
  import '../app.css'
  import { afterNavigate, goto } from '$app/navigation'
  import { page } from '$app/state'
  import { load } from '#lib/db.js'
  import { debug, setDebug } from '#lib/debug.svelte.js'
  import { href } from '#lib/paths.js'

  let { children } = $props()

  let main
  let navBox
  let menuOpen = $state(false)
  const route = $derived(page.route.id)
  const data = load()
  // The edit tools (npm run dev only; see lib/edit).
  const edit = import.meta.env.DEV ? import('#lib/edit/index.js') : null

  // Like a page load, a followed link starts reading at the content.
  afterNavigate(({ type }) => {
    menuOpen = false
    if (type === 'link') main?.focus({ preventScroll: true })
  })

  // On a phone the nav is a menu behind one button; a click outside it closes it.
  function onclick(ev) {
    if (menuOpen && !navBox.contains(ev.target)) menuOpen = false
  }

  async function onkeydown(ev) {
    if (ev.key === 'Escape' && menuOpen) {
      menuOpen = false
      navBox.querySelector('.menu-button').focus()
      return
    }
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

<svelte:window {onkeydown} {onclick} />

<a class="skip" href="#main">Skip to content</a>
<header class="site-header" class:home={route === '/'}>
  <div class="wrap">
    <a class="brand" href={href()}>
      <span class="brand-mark" aria-hidden="true">æ</span>
      <span class="brand-name">Wordhoard</span>
    </a>
    <span class="brand-tag">unofficial index to <em>Words Unravelled</em></span>
    <div class="nav-box" class:open={menuOpen} bind:this={navBox}>
      <button
        class="menu-button"
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onclick={() => (menuOpen = !menuOpen)}>Menu</button
      >
      <nav class="site-nav" id="site-nav" aria-label="Main">
        <a href={href('episodes')} aria-current={route === '/episodes' || route === '/episode/[id]' ? 'page' : undefined}
          >Episodes</a
        >
        <a href={href('graph')} aria-current={route === '/graph' ? 'page' : undefined}>Graph</a>
        <a href={href('about')} aria-current={route === '/about' ? 'page' : undefined}>About</a>
        {#if edit}
          {#if debug.on}<a href={href('review')} aria-current={route === '/review' ? 'page' : undefined}>Review</a>{/if}
          <label class="debug" title="Show the edit tools and the roles of mentions">
            <input type="checkbox" checked={debug.on} onchange={(ev) => setDebug(ev.currentTarget.checked)} /> Debug
          </label>
        {/if}
      </nav>
    </div>
  </div>
</header>
<main id="main" class="wrap" tabindex="-1" bind:this={main}>
  {#await data}
    <p class="loading">Opening the hoard…</p>
  {:then}
    <!-- Every navigation renders the page afresh, also between two entries. -->
    {#key page.url.pathname}{@render children()}{/key}
    {#if edit}{#await edit then tools}<tools.EditHost />{/await}{/if}
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
  .nav-box {
    margin-left: auto;
    position: relative;
  }
  .site-nav {
    display: flex;
    gap: 18px;
  }
  .site-nav a,
  .menu-button {
    text-decoration: none;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.06em;
    font-size: 1.1rem;
    color: var(--ink-soft);
  }
  .menu-button {
    display: none;
    padding: 0 12px 2px;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    cursor: pointer;
  }
  .menu-button:hover,
  .open .menu-button {
    color: var(--rubric);
  }
  .debug {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.06em;
    font-size: 1.1rem;
    color: var(--muted);
    cursor: pointer;
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

  /* A phone has no room for the nav next to the brand: it opens from the Menu button. */
  @media (max-width: 560px) {
    .menu-button {
      display: block;
    }
    .site-nav {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      z-index: 20;
      flex-direction: column;
      gap: 0;
      min-width: 10rem;
      padding: 6px 0;
      background: var(--card);
      border: 1px solid var(--rule);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .open .site-nav {
      display: flex;
    }
    .site-nav a,
    .debug {
      padding: 4px 16px;
    }
  }
</style>

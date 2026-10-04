<script>
  // Debug only (npm run dev): a mention's role.
  import { dev } from '$app/env'

  let { role, text = role } = $props()
</script>

{#if dev}<span class="role-badge" data-role={role}>{text}</span>{/if}

<style>
  /* Solid, dashed and dotted, from subject to mention. */
  .role-badge {
    display: inline-block;
    margin-left: 6px;
    padding: 0 7px;
    border: 1px solid var(--muted);
    border-radius: 3px;
    font-family: var(--mono);
    font-size: 0.72rem;
    font-variant-caps: normal;
    letter-spacing: 0;
    line-height: 1.5;
    color: var(--muted);
    vertical-align: 1px;
  }
  .role-badge[data-role='subject'] {
    border-color: var(--rubric);
    color: var(--rubric);
  }
  .role-badge[data-role='aside'] {
    border-style: dashed;
  }
  .role-badge[data-role='mention'] {
    border-style: dotted;
  }
</style>

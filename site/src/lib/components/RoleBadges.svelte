<script>
  // Debug only: the roles of all an entry's mentions ("subject · aside ×2").
  import { dev } from '$app/env'
  import { roleRank } from '../entries.js'
  import RoleBadge from './RoleBadge.svelte'

  let { entry } = $props()

  const counts = $derived.by(() => {
    const counts = new Map()
    for (const m of [...entry.mentions].sort((a, b) => roleRank(a) - roleRank(b))) {
      counts.set(m.role, (counts.get(m.role) ?? 0) + 1)
    }
    return [...counts]
  })
</script>

{#if dev}{#each counts as [role, n] (role)}<RoleBadge {role} text="{role}{n > 1 ? ` ×${n}` : ''}" />{/each}{/if}

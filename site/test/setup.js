// Resolves #toolkit/* for node --test as Vite does for the site: Node refuses package imports
// that point outside the package.
import { registerHooks } from 'node:module'

const toolkit = new URL('../../toolkit/src/', import.meta.url)

registerHooks({
  resolve: (specifier, context, next) =>
    next(specifier.startsWith('#toolkit/') ? new URL(specifier.slice('#toolkit/'.length), toolkit).href : specifier, context),
})

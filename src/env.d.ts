/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// vite-plugin-yaml lets us `import data from '*.yml'` — returns parsed JS object
declare module '*.yml' {
  const content: Record<string, unknown>;
  export default content;
}
declare module '*.yaml' {
  const content: Record<string, unknown>;
  export default content;
}

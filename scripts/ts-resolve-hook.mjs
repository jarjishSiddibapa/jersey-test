// ESM resolve hook used only by `npm test`. The app's source imports are
// extensionless (`from "./pricing"`), which Vite resolves fine but plain
// Node ESM won't guess ".ts" for - this hook is the ~10-line fix instead
// of rewriting every import in the app to satisfy a test runner. Node
// itself already runs .ts natively (type-stripping) as of this project's
// Node version; this only teaches module RESOLUTION about the missing
// extension, nothing about TypeScript syntax.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // not a .ts file (e.g. a real extensionless directory import) - fall through
    }
  }
  return nextResolve(specifier, context);
}

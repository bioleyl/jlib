type Registrable = { register(): void };

/**
 * Defines components for use as HTML tags: `define(JlButton, JlDialog)`. A component also defines itself when its
 * class is used; naming it here is what keeps it in the bundle when the page only writes its tag.
 */
export function define(...components: Registrable[]): void {
  for (const component of components) {
    component.register();
  }
}

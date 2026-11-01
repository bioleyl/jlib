import design from './design.css?inline';
import examples from './examples.css?inline';
import prose from './prose.css?inline';

/** The reading style shared by the site's pages, after the library's base styles. */
export const PROSE_STYLES = prose;

/**
 * The layout helpers of the examples (`row`, `stack`…). Examples render in the light DOM of site-example, which
 * sits in the page's shadow root: the page's styles must hold these rules.
 */
export const EXAMPLE_STYLES = examples;

/** The specimens, swatches and guidelines of the design system pages. */
export const DESIGN_STYLES = design;

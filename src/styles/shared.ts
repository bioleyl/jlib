import base from './base.css?raw';
import control from './control.css?raw';
import floating from './floating.css?raw';
import tokens from './tokens.css?raw';

/** First in every shadow root. */
export const BASE_STYLES = base;

/** For the components that hold a text field, a select or a text area: the `.control` frame. */
export const CONTROL_STYLES = control;

/** For the components that open something over the page: `.floating` (the top-layer box) and `.panel`. */
export const FLOATING_STYLES = floating;

/** The design tokens, adopted by the document when the first component registers. */
export const TOKEN_STYLES = tokens;

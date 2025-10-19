import { createStyle } from './utils/dom';

export const defaultStyle = createStyle(`$css
  .mk-component {
    box-sizing: border-box;
  }

  input.mk-component, select.mk-component {
    margin: 0 !important;
  }
`);

import { MK_HIDDEN_SCROLL_CLASS } from './constants';
import { createStyle } from './utils/dom';

export const defaultStyle = createStyle(`$css
  .mk-component {
    box-sizing: border-box;
  }

  input.mk-component, select.mk-component {
    margin: 0 !important;
  }

  [class*=${MK_HIDDEN_SCROLL_CLASS}-], .${MK_HIDDEN_SCROLL_CLASS} {
    overflow: hidden;
    visibility: visible;
    padding-right: 14px;
  }
`);

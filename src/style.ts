import { MK_CUSTOM_COMPONENT, MK_HIDDEN_SCROLL_CLASS } from './constants';
import { createStyle } from './utils/dom';

export const defaultStyle = createStyle(`$css
  .${MK_CUSTOM_COMPONENT} {
    box-sizing: border-box;
  }

  input.${MK_CUSTOM_COMPONENT}, select.${MK_CUSTOM_COMPONENT} {
    margin: 0 !important;
  }

  [class*=${MK_HIDDEN_SCROLL_CLASS}-], .${MK_HIDDEN_SCROLL_CLASS} {
    overflow: hidden;
    visibility: visible;
    padding-right: 14px;
  }
`);

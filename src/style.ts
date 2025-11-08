import { MK_CUSTOM_COMPONENT, MK_HIDDEN_SCROLL_CLASS } from './constants';
import { createStyle } from './utils/dom';

export const defaultStyle = createStyle(`$css
  .${MK_CUSTOM_COMPONENT} {
    box-sizing: border-box;
  }

  p.${MK_CUSTOM_COMPONENT},
  h1.${MK_CUSTOM_COMPONENT},
  h2.${MK_CUSTOM_COMPONENT},
  h3.${MK_CUSTOM_COMPONENT},
  h4.${MK_CUSTOM_COMPONENT},
  h5.${MK_CUSTOM_COMPONENT},
  h6.${MK_CUSTOM_COMPONENT},
  input.${MK_CUSTOM_COMPONENT},
  select.${MK_CUSTOM_COMPONENT} {
    margin: 0 !important;
    color: inherit !important;
    font-family: inherit !important;
  }

  h1.${MK_CUSTOM_COMPONENT} {
    font-size: 2em;
  }

  h2.${MK_CUSTOM_COMPONENT} {
    font-size: 1.5em;
  }

  h3.${MK_CUSTOM_COMPONENT} {
    font-size: 1.17em;
  }

  h4.${MK_CUSTOM_COMPONENT} {
    font-size: 1em;
  }

  h5.${MK_CUSTOM_COMPONENT} {
    font-size: 0.83em;
  }

  h6.${MK_CUSTOM_COMPONENT} {
    font-size: 0.67em;
  }

  h1.${MK_CUSTOM_COMPONENT},
  h2.${MK_CUSTOM_COMPONENT},
  h3.${MK_CUSTOM_COMPONENT},
  h4.${MK_CUSTOM_COMPONENT},
  h5.${MK_CUSTOM_COMPONENT},
  h6.${MK_CUSTOM_COMPONENT} {
    font-weight: bold;
  }

  .${MK_HIDDEN_SCROLL_CLASS},
  [class*='${MK_HIDDEN_SCROLL_CLASS}-'] {
    overflow: hidden;
    visibility: visible;
    padding-right: 14px;
  }

  .mk-hide {
    display: none !important;
  }
`);

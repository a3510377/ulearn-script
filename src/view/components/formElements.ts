import { createElement } from '#/dom';

export const buildRow = (opts: {
  label: string;
  desc?: string;
  field: () => HTMLElement;
  kv?: () => string;
}) => {
  const row = createElement('div', 'mk-settings-row');
  const left = createElement('div');
  const right = createElement('div', 'mk-settings-field');

  const label = createElement('div', 'mk-settings-label');
  label.textContent = opts.label;
  left.appendChild(label);

  if (opts.desc) {
    const desc = createElement('div', 'mk-settings-desc');
    desc.textContent = opts.desc;
    left.appendChild(desc);
  }

  const fieldEl = opts.field();
  right.appendChild(fieldEl);

  if (opts.kv) {
    const kv = createElement('div', 'mk-kv');
    const update = () => (kv.textContent = opts.kv!());

    update();
    fieldEl.addEventListener('input', update);
    fieldEl.addEventListener('change', update);
    right.appendChild(kv);
  }

  // Special case for range inputs
  if (fieldEl.querySelector('input[type=range]')) {
    row.classList.add('mk-field-split');
  }

  row.append(left, right);
  return row;
};

export const buildToggle = <T extends Record<string, any>>(
  key: keyof T,
  store: {
    get: (k: keyof T) => any;
    set: (k: keyof T, v: any) => void;
    subscribe: (k: keyof T, fn: any, initial?: boolean) => void;
  }
) => {
  const input = createElement('input', 'mk-checkbox');

  input.type = 'checkbox';
  input.checked = store.get(key) as boolean;
  input.addEventListener('change', () => store.set(key, input.checked));

  store.subscribe(
    key,
    ({ value }: { value: boolean }) => {
      input.checked = value;
    },
    false
  );

  return input;
};

export const makeRange = (
  initial: number,
  min: number,
  max: number,
  step: number,
  onChange: (v: number) => void
) => {
  const wrap = createElement('div', 'mk-settings-field');
  const input = createElement('input', 'mk-input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(initial);

  const num = createElement('input', 'mk-input');
  num.type = 'number';
  num.min = String(min);
  num.max = String(max);
  num.step = String(step);
  num.value = String(initial);
  num.style.width = '64px';

  const sync = (v: number) => {
    const clamped = Math.max(min, Math.min(max, v));

    if (parseFloat(input.value) !== clamped) input.value = String(clamped);
    if (parseFloat(num.value) !== clamped) num.value = String(clamped);
  };

  input.addEventListener('input', () => {
    const v = parseFloat(input.value);

    sync(v);
    onChange(v);
  });

  num.addEventListener('change', () => {
    const v = parseFloat(num.value);

    sync(v);
    onChange(v);
  });

  wrap.append(input, num);
  return wrap;
};

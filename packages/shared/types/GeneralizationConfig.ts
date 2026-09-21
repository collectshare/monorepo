export type GeneralizationConfig =
  | { type: 'date_truncate'; precision: 'year' | 'month' }
  | { type: 'numeric_range'; step: number }
  | { type: 'text_prefix'; chars: number }
  | { type: 'cep_region'; precision: 'state' | 'ddd' };

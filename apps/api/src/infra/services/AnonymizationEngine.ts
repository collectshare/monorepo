import { createHmac } from 'node:crypto';
import { Question } from '@monorepo/shared/entities/Question';
import { GeneralizationConfig } from '@monorepo/shared/types/GeneralizationConfig';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

const STATE_BY_CEP_PREFIX: Record<string, string> = {
  '01': 'SP', '02': 'SP', '03': 'SP', '04': 'SP', '05': 'SP', '06': 'SP', '07': 'SP',
  '08': 'SP', '09': 'SP', '10': 'SP', '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP',
  '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
  '20': 'RJ', '21': 'RJ', '22': 'RJ', '23': 'RJ', '24': 'RJ', '25': 'RJ', '26': 'RJ',
  '27': 'RJ', '28': 'RJ',
  '29': 'ES',
  '30': 'MG', '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '36': 'MG',
  '37': 'MG', '38': 'MG', '39': 'MG',
  '40': 'BA', '41': 'BA', '42': 'BA', '43': 'BA', '44': 'BA', '45': 'BA', '46': 'BA',
  '47': 'BA', '48': 'BA',
  '49': 'SE',
  '50': 'PE', '51': 'PE', '52': 'PE', '53': 'PE', '54': 'PE', '55': 'PE', '56': 'PE',
  '57': 'AL', '58': 'PB', '59': 'RN',
  '60': 'CE', '61': 'CE', '62': 'CE', '63': 'CE',
  '64': 'PI',
  '65': 'MA', '66': 'MA',
  '67': 'PA', '68': 'PA',
  '69': 'AM',
  '70': 'DF', '71': 'DF', '72': 'GO', '73': 'GO', '74': 'GO', '75': 'GO', '76': 'GO',
  '77': 'TO', '78': 'MT', '79': 'MS',
  '80': 'PR', '81': 'PR', '82': 'PR', '83': 'PR', '84': 'PR', '85': 'PR', '86': 'PR',
  '87': 'PR',
  '88': 'SC', '89': 'SC',
  '90': 'RS', '91': 'RS', '92': 'RS', '93': 'RS', '94': 'RS', '95': 'RS', '96': 'RS',
  '97': 'RS', '98': 'RS', '99': 'RS',
};

@Injectable()
export class AnonymizationEngine {
  constructor(private readonly appConfig: AppConfig) { }

  hash(value: string, formId: string): string {
    const formKey = createHmac('sha256', this.appConfig.secrets.exportSecret).update(formId).digest();
    return createHmac('sha256', formKey).update(value).digest('hex');
  }

  generalize(value: string, config: GeneralizationConfig): string {
    switch (config.type) {
      case 'date_truncate': {
        const parts = value.split(/[-/]/);
        if (parts.length < 1) { return value; }
        if (config.precision === 'year') { return parts[0]; }
        if (config.precision === 'month') { return `${parts[0]}-${parts[1] ?? ''}`; }
        return value;
      }
      case 'numeric_range': {
        const num = parseFloat(value);
        if (isNaN(num)) { return value; }
        const lower = Math.floor(num / config.step) * config.step;
        const upper = lower + config.step - 1;
        return `${lower}-${upper}`;
      }
      case 'text_prefix': {
        return value.slice(0, config.chars);
      }
      case 'cep_region': {
        const digits = value.replace(/\D/g, '');
        if (config.precision === 'state') {
          const prefix = digits.slice(0, 2);
          return STATE_BY_CEP_PREFIX[prefix] ?? prefix;
        }
        return digits.slice(0, 3);
      }
    }
  }

  private applyToValue(
    value: string | string[] | null,
    piiStrategy: 'pseudonymize' | 'generalize' | 'suppress',
    generalizationConfig: GeneralizationConfig | undefined,
    formId: string,
  ): string | string[] | null {
    if (piiStrategy === 'suppress') { return null; }

    if (piiStrategy === 'generalize' && generalizationConfig) {
      if (Array.isArray(value)) { return value.map((v) => this.generalize(v, generalizationConfig)); }
      if (value === null) { return null; }
      return this.generalize(value, generalizationConfig);
    }

    // 'pseudonymize', or 'generalize' with no usable config (fail-safe fallback — never pass PII through raw)
    if (Array.isArray(value)) { return value.map((v) => this.hash(v, formId)); }
    if (value === null) { return null; }
    return this.hash(value, formId);
  }

  resolve(question: Question, value: string | string[] | null): string | string[] | null {
    if (question.piiStrategy) {
      return this.applyToValue(value, question.piiStrategy, question.generalizationConfig, question.formId);
    }

    if (question.anonymizationSuggestion?.needsAnonymization) {
      return this.applyToValue(value, 'pseudonymize', undefined, question.formId);
    }

    return value;
  }
}

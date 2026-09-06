export type AnonymizationSuggestion = {
  needsAnonymization: boolean;
  confidence: number;
  reason: string;
  classifiedAt: string;
};

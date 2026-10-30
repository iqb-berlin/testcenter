const calculatorModels = ['CALCULATOR', 'CALC'] as const;

// Order also defines workspace-resource preference when both calculator names exist.
export function widgetModelCandidates(model: string): readonly string[] {
  return calculatorModels.some(candidate => candidate === model) ? calculatorModels : [model];
}

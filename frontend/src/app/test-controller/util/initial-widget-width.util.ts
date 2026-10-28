import { widgetModelCandidates } from './widget-model.util';

// Temporary preferred widths until widgets report their own dimensions.
// Keep model-specific sizing out of the dialog and protocol implementation.
const widths: Readonly<Record<string, number>> = {
  CALCULATOR: 400,
  PERIODIC_TABLE: 1100,
  MOLECULE_EDITOR: 1100
};

export function initialWidgetWidth(model: string): number | undefined {
  return widths[widgetModelCandidates(model)[0]];
}

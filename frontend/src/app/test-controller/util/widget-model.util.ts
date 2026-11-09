import { CustomtextService, customTextDefaults } from '@shared/shared.module';

interface WidgetModel {
  // custom text for the title, as the widgets' labels aren't meant for test takers
  titleKey: string;
  // icon of the toolbar button
  icon?: string;
  // for widgets that don't fit the default window (the widgets fill the space they get)
  windowSize?: { width: string; height: string };
}

// The widget models the Testcenter knows. Any other model gets the defaults.
const widgetModels: Readonly<Record<string, WidgetModel>> = {
  CALCULATOR: {
    titleKey: 'booklet_widgetTitleCalculator',
    icon: 'calculate',
    windowSize: { width: '400px', height: '600px' }
  },
  PERIODIC_TABLE: {
    titleKey: 'booklet_widgetTitlePeriodicTable',
    windowSize: { width: '1130px', height: '690px' }
  },
  MOLECULE_EDITOR: { titleKey: 'booklet_widgetTitleMoleculeEditor' }
};

function findWidgetModel(model: string): WidgetModel | undefined {
  // the model comes from a player or a booklet
  return Object.hasOwn(widgetModels, model) ? widgetModels[model] : undefined;
}

// The window title and button text for a widget: a custom text for the models we know, otherwise the widget's label.
export function getWidgetTitle(model: string, label: string | undefined, cts: CustomtextService): string {
  const titleKey = findWidgetModel(model)?.titleKey;
  if (titleKey === undefined) return label || 'Widget';
  return cts.getCustomText(titleKey) || customTextDefaults[titleKey].defaultvalue;
}

export function getWidgetIcon(model: string): string {
  return findWidgetModel(model)?.icon ?? 'widgets';
}

export function getWidgetWindowSize(model: string): { width: string; height: string } | undefined {
  return findWidgetModel(model)?.windowSize;
}

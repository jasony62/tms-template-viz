export enum TEMPLATE_DATA_TYPE {
  Text = 'text',
  JsonArray = 'json:array',
}

export enum TEMPLATE_SNIPPET_MODE {
  Text = 'text',
  Text2 = 'text2',
  List1 = 'list1',
  List2 = 'list2',
}

export type TemplateVarExample = {
  title?: string
  data: any
}

export type TemplateVar = {
  name: string
  title: string
  examples?: TemplateVarExample[]
}

export type WizardCreateOption = {
  varsRootName?: string
  vars?: TemplateVar[]
}

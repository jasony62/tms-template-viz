export enum TEMPLATE_DATA_TYPE {
  Text = 'text',
  Json = 'json',
}

export type TemplateVarExample = {
  title?: string
  data: any
}

export type TemplateVar = {
  name: string
  title: string
  type: string
  examples?: TemplateVarExample[]
}

export type WizardCreateOption = {
  varsRootName?: string
  vars?: TemplateVar[]
}

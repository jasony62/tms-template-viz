import Debug from 'debug'
import * as Handlebars from 'handlebars'
import _set from 'lodash.set'
import _get from 'lodash.get'

const log = Debug('ttv:wizard')

export enum TEMPLATE_DATA_TYPE {
  Text = 'text',
  JsonArray = 'json:array',
}

export enum TEMPLATE_SNIPPET_MODE {
  Text = 'text',
  List1 = 'list1',
  List2 = 'list2',
}

export type TemplateVar = {
  name: string
  title: string
  example?: any
}

export type WizardCreateOption = {
  varsRootName?: string
  vars?: TemplateVar[]
}

export class Wizard {
  private _template: any
  private _templateDataType: TEMPLATE_DATA_TYPE
  private _sample: any
  private _varsRootName: string
  private _templateVars

  constructor(target?: any, sample?: any) {
    this._template = target
    this._sample = sample
    this._templateDataType = TEMPLATE_DATA_TYPE.Text
  }
  get template() {
    return this._template
  }
  set template(val) {
    this._template = val
  }
  get templateDataType() {
    return this._templateDataType
  }
  set templateDataType(val) {
    this._templateDataType = val
  }
  get sample() {
    return this._sample
  }
  set sample(val: any) {
    this._sample = val
  }
  get varsRootName() {
    return this._varsRootName
  }
  set varsRootName(val: string) {
    this._varsRootName = val
  }
  get templateVars() {
    return this._templateVars
  }
  set templateVars(val) {
    this._templateVars = val
  }
  /**
   * 根据模板和输入的数据，返回输出的数据
   * @param input 指定用于填充模板的数据，如果不指定用对象的inutSample
   * @returns
   */
  outputResult(input?: any): any {
    // 解决运行时，根据执行位置再生成模板的情况
    let latest = this._template
    latest = latest.replaceAll('[*]', '[0]')
    let hb = Handlebars.compile(latest)
    let result = hb(input ?? this.sample)

    if (this._templateDataType === TEMPLATE_DATA_TYPE.Text) return result

    try {
      let json = JSON.parse(result)
      return json
    } catch (e) {
      return result
    }
  }
  /**
   * 创建模板片段
   * @param varname
   * @param subTemplate
   * @param mode
   * @returns
   */
  createSnippet(
    varname: string,
    subTemplate: string,
    mode?: TEMPLATE_SNIPPET_MODE
  ) {
    let snippet = ''
    switch (mode) {
      case TEMPLATE_SNIPPET_MODE.List1:
        snippet = `{{#each ${varname}}}{{#unless @first}},{{/unless}}{{this}}{{/each}}`
        if (this.templateDataType === 'json:array') snippet = `[${snippet}]`
        break
      case TEMPLATE_SNIPPET_MODE.List2:
        snippet = `{{#each ${varname}}}{{#unless @first}},{{/unless}}${
          subTemplate ?? '替换这里的内容'
        }{{/each}}`
        if (this.templateDataType === 'json:array') snippet = `[${snippet}]`
        break
      default:
        snippet = `{{{${varname}}}}`
    }

    return snippet
  }

  createSampleMold(tpl?: string) {
    let mold = { [this.varsRootName]: {} }
    if (tpl) {
      let re = new RegExp(
        `(?<=\\{{2,3})${this.varsRootName}\\.\\w+(?=\\}{2,3})`,
        'g'
      )
      Array.from(tpl.matchAll(re), (m) => {
        let varpath = m[0]
        let varobj = this.templateVars.get(varpath)
        _set(mold, varpath, varobj?.example ?? '')
      })
      let re2 = new RegExp(
        `(?<=\{{2}#each )${this.varsRootName}\\.\\w+(?=\\}{2,3})`,
        'g'
      )
      Array.from(tpl.matchAll(re2), (m) => {
        let varpath = m[0]
        let varobj = this.templateVars.get(varpath)
        _set(mold, varpath, varobj?.example ?? '')
      })
    }

    return mold
  }
  /**
   * 创建实例
   * @param options
   * @returns
   */
  static Create(options?: WizardCreateOption) {
    options ??= {}
    const { varsRootName, vars } = options

    const mapOfVars = new Map()
    if (Array.isArray(vars) && vars.length)
      vars?.forEach((v) => mapOfVars.set(v.name, v))

    const wizard = new Wizard()
    wizard.varsRootName = varsRootName ?? ''
    wizard.templateVars = mapOfVars

    return wizard
  }
}

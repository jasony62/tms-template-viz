import Debug from 'debug'
import * as Handlebars from 'handlebars'
import _set from 'lodash.set'
import _get from 'lodash.get'
import {
  TEMPLATE_DATA_TYPE,
  TEMPLATE_SNIPPET_MODE,
  WizardCreateOption,
} from './common'

const log = Debug('ttv:wizard')

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
   * @param sample
   * @returns
   */
  createSnippet(
    varname: string,
    subTemplate: string,
    mode?: TEMPLATE_SNIPPET_MODE,
    sample?: any
  ) {
    let snippet = ''
    switch (mode) {
      case TEMPLATE_SNIPPET_MODE.List1:
        snippet = `{{#each ${varname}}}{{#unless @first}},{{/unless}}`
        if (
          Array.isArray(sample) &&
          sample.length &&
          typeof sample[0] === 'string'
        )
          snippet += `"{{this}}"`
        else snippet += `{{this}}`
        snippet += `{{/each}}`
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
  /**
   * 创建样例数据
   * @param tpl
   * @returns
   */
  createSampleMold(tpl?: string) {
    let mold = { [this.varsRootName]: {} }
    if (!tpl) return

    const res = [
      `(?<=\\{{2,3})${this.varsRootName}\\.\\w+(?=\\}{2,3})`,
      `(?<=\{{2}#each )${this.varsRootName}\\.\\w+(?=\\}{2,3})`,
    ]
    res.forEach((re) => {
      Array.from(tpl.matchAll(new RegExp(re, 'g')), (m) => {
        let varpath = m[0]
        let varobj = this.templateVars.get(varpath)
        if (!varobj || typeof varobj !== 'object') return
        let { examples } = varobj
        let varval =
          Array.isArray(examples) && examples.length ? examples[0].data : ''
        _set(mold, varpath, varval)
      })
    })

    return mold
  }
  /**
   * 深度便利对象，返回所有key的数据
   * @param example
   * @returns
   */
  flattenExampleKeys(example: any) {
    function walk(o: any, parentPath: string, result: string[]) {
      for (let k in o) {
        let v = o[k]
        if (Array.isArray(v)) walk(v, parentPath + `[${k}]`, result)
        else if (v && typeof v === 'object')
          walk(v, parentPath + '.' + k, result)
        else result.push(parentPath ? `.${k}` : k)
      }
    }

    const result: string[] = []

    walk(Array.isArray(example) ? example[0] : example, '', result)

    return result
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

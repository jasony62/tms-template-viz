import Debug from 'debug'
import * as Handlebars from 'handlebars'
import _set from 'lodash.set'
import _get from 'lodash.get'
import { TemplateVar, TEMPLATE_DATA_TYPE, WizardCreateOption } from './common'

const log = Debug('ttv:wizard')

export class Wizard {
  private _template: any
  private _templateDataType: TEMPLATE_DATA_TYPE
  private _sample: any
  private _varsRootName: string
  private _templateVars: Map<string, TemplateVar>

  constructor(target?: any) {
    this._template = target
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
   * @param input 指定用于填充模板的数据
   * @returns
   */
  outputResult(input: any): any {
    // 解决运行时，根据执行位置再生成模板的情况
    let latest = this._template
    latest = latest.replaceAll('[*]', '[0]')
    let hb = Handlebars.compile(latest)
    let result = hb(input)

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
   * @param vartype
   * @param useAsteriskAsArrayIndex
   * @returns
   */
  createSnippet(
    varname: string,
    vartype?: string,
    useAsteriskAsArrayIndex = false
  ) {
    let snippet = ''
    switch (vartype) {
      case 'array':
        snippet = `{{#each ${varname}}}{{#unless @first}},{{/unless}}`
        snippet += `{{this}}`
        snippet += `{{/each}}`
        if (this.templateDataType === TEMPLATE_DATA_TYPE.Json) {
          snippet = `[${snippet}]`
        }
        break
      case 'object':
        snippet = `{{#with ${varname}}}`
        snippet += `{{this}}`
        snippet += `{{/with}}`
        break
      case 'string':
        snippet = `{{{${varname}}}}`
        if (this.templateDataType === TEMPLATE_DATA_TYPE.Json) {
          snippet = `"${snippet}"`
        }
        break
      default:
        snippet = `{{{${varname}}}}`
    }
    if (useAsteriskAsArrayIndex === true)
      snippet = snippet.replaceAll(/\[\d+\]/g, '[*]')

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
      `(?<=\\{{2,3})${this.varsRootName}\\.[\\w|\\.]+(?=\\}{2,3})`,
      `(?<=\{{2}#each )${this.varsRootName}\\.[\\w|\\.]+(?=\\}{2,3})`,
      `(?<=\{{2}#with )${this.varsRootName}\\.[\\w|\\.]+(?=\\}{2,3})`,
    ]
    res.forEach((re) => {
      Array.from(tpl.matchAll(new RegExp(re, 'g')), (m) => {
        let varpath = m[0]
        for (let k of this.templateVars.keys()) {
          if (varpath.indexOf(k) === 0) {
            let varobj = this.templateVars.get(k)
            if (!varobj || typeof varobj !== 'object') return
            let { examples } = varobj
            let varval =
              Array.isArray(examples) && examples.length ? examples[0].data : ''
            _set(mold, k, varval)
            break
          }
        }
      })
    })

    return mold
  }
  /**
   * 深度便利对象，返回所有key的数据
   * @param example 样例数据
   * @returns
   */
  flattenExampleKeys(example: any): TemplateVar[] {
    function walk(o: any, path: string, result: TemplateVar[]) {
      const inArray = Array.isArray(o)
      for (let k in o) {
        /**
         * 包含完整路径的变量名
         */
        let key = inArray ? `[${k}]` : k
        let fullname = path ? `${path}.${key}` : key
        result.push({
          name: fullname,
          title: '',
          type: Array.isArray(o[k]) ? 'array' : typeof o[k],
        })
        /**
         * 值是对象或数组类型，继续遍历
         */
        let v = o[k]
        if (v && typeof v === 'object') {
          walk(v, fullname, result)
        }
      }
    }

    const result: TemplateVar[] = []

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

    const mapOfVars = new Map<string, TemplateVar>()
    if (Array.isArray(vars) && vars.length)
      vars?.forEach((v) => mapOfVars.set(v.name, v))

    const wizard = new Wizard()
    wizard.varsRootName = varsRootName ?? ''
    wizard.templateVars = mapOfVars

    return wizard
  }
}

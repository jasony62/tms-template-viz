import Debug from 'debug'
import * as Handlebars from 'handlebars'
import _has from 'lodash.has'

const log = Debug('tms-template-viz:wizard')

function convert(target: any, InputSample?: any): any {
  if (Array.isArray(target)) {
    return target.map((item) => {
      return convert(item, InputSample)
    })
  } else if (target && typeof target === 'object') {
    return Object.keys(target).reduce((tplObj, key) => {
      tplObj[key] = convert(target[key], InputSample)
      return tplObj
    }, {})
  } else {
    if (InputSample) {
      return _has(InputSample, target) ? `{{{${target}}}}` : target
    } else {
      return `{{{${target}}}}`
    }
  }
}

export enum CONVERT_MODE {
  Text = 'text_fill',
  Fill = 'fill',
  List = 'list',
}

class BuilderImpl {
  mode: CONVERT_MODE
  target
  inputSample

  constructor(target?: any) {
    this.target = target
  }
  /**
   * 通过模板提取target和mode
   * @param template
   */
  setTemplate(template: string) {
    let t
    /**检查是否为列表转换*/
    let found = template.match(
      /\[\{\{#each\s(.+)\}\}\{\{#unless @first\}\},\{\{\/unless\}\}"\{{2,3}(.+?)\}{2,3}"\{\{\/each\}\}\]/
    )
    if (found) {
      this.mode = CONVERT_MODE.List
      let [, arrayName, itemName] = found
      t = `["${arrayName}[*].${itemName}"]`
    } else {
      found = template.match(/^[.*]$|^\{.*\}$/)
      if (found) {
        this.mode = CONVERT_MODE.Fill
        t = template.replaceAll(/\{{2,3}(.+?)\}{2,3}/g, '$1')
      } else {
        this.mode = CONVERT_MODE.Text
        t = template
      }
    }

    if (this.mode === CONVERT_MODE.Text) {
      this.target = t
    } else {
      try {
        this.target = JSON.parse(t)
      } catch (e) {
        // throw e
      }
    }

    return this
  }
  setMode(val: CONVERT_MODE) {
    this.mode = val
    return this
  }
  setInputSample(val: any) {
    this.inputSample = val
    return this
  }
  build() {
    const wizard = new Wizard(this.target, this.inputSample, this.mode)
    return wizard
  }
}

export class Wizard {
  private _mode: CONVERT_MODE
  private _target: any
  private inputSample: any
  private latestGenerated: string

  constructor(target: any, inputSample?: any, mode = CONVERT_MODE.Fill) {
    this._target = target
    this.inputSample = inputSample
    if (typeof target === 'string') {
      this._mode = CONVERT_MODE.Text
    } else {
      this._mode = mode
    }
  }

  private fill(): string {
    let mappings = convert(this._target, this.inputSample)
    let template = JSON.stringify(mappings)
    return template
  }

  private list(): string {
    let item = this._target[0]
    let [arrayName, itemName] = item.split('[*].')
    let template = `[{{#each ${arrayName}}}{{#unless @first}},{{/unless}}"{{{${itemName}}}}"{{/each}}]`
    return template
  }

  private text(): string {
    let template = this._target
    return template
  }

  get target() {
    return this._target
  }
  get mode() {
    return this._mode
  }
  /**
   * 生成并返回模板
   * @returns
   */
  template(): string {
    let tpl
    switch (this._mode) {
      case CONVERT_MODE.Fill:
        tpl = this.fill()
        break
      case CONVERT_MODE.List:
        tpl = this.list()
        break
      default:
        tpl = this.text()
    }

    this.latestGenerated = tpl

    return tpl
  }
  /**
   * 根据模板和输入的数据，返回输出的数据
   * @param input 指定用于填充模板的数据，如果不指定用对象的inutSample
   * @returns
   */
  outputResult(input?: any): any {
    if (!this.latestGenerated) {
      this.template()
    }
    // 解决运行时，根据执行位置再生成模板的情况
    let latest = this.latestGenerated
    latest = latest.replaceAll('[*]', '[0]')
    let template = Handlebars.compile(latest)
    let result = template(input ?? this.inputSample)
    if (this.mode === CONVERT_MODE.Text) {
      return result
    }
    let json = JSON.parse(result)
    return json
  }

  static Builder(target?: any) {
    return new BuilderImpl(target)
  }
}

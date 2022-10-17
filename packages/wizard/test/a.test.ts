import { HandlebarsWizard } from '../src'

let { Wizard, CONVERT_MODE } = HandlebarsWizard

describe('测试生成模板', () => {
  test('指定映射关系生成模板（文本）', () => {
    let target = '{{{vars.username}}}，你好，请处理单据【{{{vars.billid}}}】'
    let wizard = Wizard.Builder(target).build()
    expect(wizard.mode).toBe(CONVERT_MODE.Text)
    expect(wizard.template()).toBe(target)
    let input = { vars: { username: 'alice', billid: '123abc' } }
    let output = wizard.outputResult(input)
    expect(output).toBe('alice，你好，请处理单据【123abc】')
  })
  test('指定映射关系生成模板（对象到对象）', () => {
    // {"a":"x","b":"y","c":{"d":"z.u","e":"z.v"}}
    let target = { a: 'x', b: 'y', c: { d: 'z.u', e: 'z.v' } }
    let wizard = Wizard.Builder(target).build()
    let tpl = wizard.template()
    expect(tpl).toBe(
      '{"a":"{{{x}}}","b":"{{{y}}}","c":{"d":"{{{z.u}}}","e":"{{{z.v}}}"}}'
    )
    // {"x":"abc","y":11,"z":{"u":"def","v":99}}
    let input = { x: 'abc', y: 11, z: { u: 'def', v: 99 } }
    let outputResult = wizard.outputResult(input)
    expect(outputResult).toMatchObject({
      a: 'abc',
      b: '11',
      c: { d: 'def', e: '99' },
    })
  })
  test('指定映射关系+样本数据生成模板（对象到对象）', () => {
    // { "x": "abc", "z": { "u": "def" } }
    let inputSample = { x: 'abc', z: { u: 'def' } }
    // { "a": "x", "b": 11, "c": { "d": "z.u", "e": 99 } }
    let target = { a: 'x', b: 11, c: { d: 'z.u', e: 99 } }
    let wizard = Wizard.Builder(target).setInputSample(inputSample).build()
    let tpl = wizard.template()
    expect(tpl).toBe('{"a":"{{{x}}}","b":11,"c":{"d":"{{{z.u}}}","e":99}}')

    let outputResult = wizard.outputResult()
    expect(outputResult).toMatchObject({
      a: 'abc',
      b: 11,
      c: { d: 'def', e: 99 },
    })
  })
  test('固定数组，从输入中取值1', () => {
    let target = ['input.[0]', 'input.[1]', 'input.[2]']
    let wizard = Wizard.Builder(target).build()
    let tpl = wizard.template()
    expect(tpl).toBe('["{{{input.[0]}}}","{{{input.[1]}}}","{{{input.[2]}}}"]')

    let input = { input: ['x', 'y', 'z'] }
    let outputResult = wizard.outputResult(input)
    expect(outputResult).toEqual(['x', 'y', 'z'])
  })
  test('固定数组，从输入中取值2', () => {
    let target = ['input.a', 'input.b', 'input.c']
    let wizard = Wizard.Builder(target).build()
    let tpl = wizard.template()
    expect(tpl).toBe('["{{{input.a}}}","{{{input.b}}}","{{{input.c}}}"]')

    let input = { input: { a: 'x', b: 'y', c: 'z' } }
    let outputResult = wizard.outputResult(input)
    expect(outputResult).toEqual(['x', 'y', 'z'])
  })
  test('输入数组转换为目标数组（数组到数组），项目是简单类型', () => {
    let arrayName = 'input'
    let itemName = 'name'
    // ["input[*].name"]
    let target = [`${arrayName}[*].${itemName}`]
    let wizard = Wizard.Builder(target).setMode(CONVERT_MODE.List).build()
    let tpl = wizard.template()
    expect(tpl).toBe(
      `[{{#each ${arrayName}}}{{#unless @first}},{{/unless}}"{{{${itemName}}}}"{{/each}}]`
    )

    // {"input":[{"name":"aaa"},{"name":"bbb"},{"name":"ccc"}]}
    let input = {
      input: [{ name: 'aaa' }, { name: 'bbb' }, { name: 'ccc' }],
    }
    let outputResult = wizard.outputResult(input)
    expect(outputResult).toHaveLength(input.input.length)
    expect(outputResult).toEqual(['aaa', 'bbb', 'ccc'])
  })
})

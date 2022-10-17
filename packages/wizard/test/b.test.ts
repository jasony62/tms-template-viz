import { HandlebarsWizard } from '../src'

let { Wizard, CONVERT_MODE } = HandlebarsWizard

describe('测试通过模板生成工具对象', () => {
  test('指定映射关系生成模板（对象到对象）', () => {
    let tpl =
      '{"a":"{{{x}}}","b":"{{{y}}}","c":{"d":"{{{z.u}}}","e":"{{{z.v}}}"}}'
    let wizard = Wizard.Builder().setTemplate(tpl).build()
    expect(wizard.target).toMatchObject({
      a: 'x',
      b: 'y',
      c: { d: 'z.u', e: 'z.v' },
    })
    expect(wizard.mode).toBe(CONVERT_MODE.Fill)
  })
  test('输入数组转换为目标数组（数组到数组），项目是简单类型', () => {
    let arrayName = 'input'
    let itemName = 'name'
    let tpl = `[{{#each ${arrayName}}}{{#unless @first}},{{/unless}}"{{{${itemName}}}}"{{/each}}]`
    let wizard = Wizard.Builder().setTemplate(tpl).build()
    expect(wizard.target).toMatchObject([`${arrayName}[*].${itemName}`])
    expect(wizard.mode).toBe(CONVERT_MODE.List)
  })
  test('管理文本模板', () => {
    let tpl =
      '【{{vars.notices.result.docs.[*].username}}】您好，有单据【{{vars.notices.result.docs.[*].reimbursementNo}}】需要处理。'
    let wizard = Wizard.Builder().setTemplate(tpl).build()
    expect(wizard.mode).toBe(CONVERT_MODE.Text)
    expect(wizard.template()).toBe(tpl)
    let input = {
      vars: {
        notices: {
          result: {
            docs: [{ username: 'tester', reimbursementNo: 'abc123' }],
          },
        },
      },
    }
    let output = wizard.outputResult(input)
    expect(output).toBe('【tester】您好，有单据【abc123】需要处理。')
  })
})

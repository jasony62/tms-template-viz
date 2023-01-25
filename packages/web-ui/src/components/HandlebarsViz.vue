<template>
  <div class="ttv-wizard">
    <div class="ttv-wizard-divider">模板变量</div>
    <div class="ttv-wizard__get-var-mode" v-if="canGetVarMode">
      <label> 选择变量
        <input type="radio" value="select" name="inputVarMode" v-model="getVarMode" />
      </label>
      <label> 输入变量
        <input type="radio" value="custom" name="inputVarMode" v-model="getVarMode" />
      </label>
    </div>
    <div class="ttv-wizard__vars-select" v-if="rootVars?.length && getVarMode === 'select'">
      <select v-model="rootVar" @change="onChangeVar">
        <option :value="null">选择变量</option>
        <option v-for="v in rootVars" :value="v">{{ v.title }} - {{ v.name }}</option>
      </select>
      <div v-if="rootVar?.examples?.length">
        <div>样例数据</div>
        <textarea v-model="example"></textarea>
      </div>
      <div v-if="subVars.length">
        <select v-model="subVar">
          <option :value="null">选择变量</option>
          <option v-for="tv in subVars" :value="tv">{{ tv.name }}</option>
        </select>
      </div>
    </div>
    <div class="ttv-wizard__vars-custom" v-if="getVarMode === 'custom'">
      <div>
        <input type="text" v-model="customVarName" placeholder="输入模板变量名称" />
      </div>
      <div>
        <select v-model="customVarType">
          <option value="">选择变量类型</option>
          <option value="array">数组</option>
          <option value="object">对象</option>
          <option value="string">字符串</option>
          <option value="number">数字</option>
          <option value="boolean">布尔</option>
        </select>
      </div>
    </div>
    <div class="ttv-wizard-divider">模板内容</div>
    <div class="ttv-wizard__template">
      <div>
        <select v-model="templateDataType">
          <option value="text">模板是文本</option>
          <option value="json">模板是JSON</option>
        </select>
      </div>
      <div>
        <label>用*代替数组索引
          <input type="checkbox" v-model="useAsteriskAsArrayIndex" />
        </label>
      </div>
      <div class="ttv-wizard__actions">
        <button @click="addSnippet" class="tvu-button">插入模板片段</button>
        <button @click="replaceTemplate" class="tvu-button">替换整个模板</button>
      </div>
      <div ref="elTemplate" class="ttv-wizard__editor" contenteditable="true"></div>
    </div>
    <div class="ttv-wizard-divider">模板验证</div>
    <div class="ttv-wizard__sample">
      <div class="ttv-wizard__actions">
        <button @click="createSampleMold" class="tvu-button">生成验证数据框架</button>
      </div>
      <div class="sample">
        <textarea v-model="sample"></textarea>
      </div>
    </div>
    <div class="ttv-wizard__output">
      <div class="ttv-wizard__actions">
        <button @click="test" class="tvu-button">生成验证结果</button>
      </div>
      <div class="ttv-wizard__output__wrap">
        <pre>{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Wizard, TEMPLATE_DATA_TYPE } from 'tms-template-wizard'
import type { TemplateVar, WizardCreateOption } from 'tms-template-wizard'
import './HandlebarsViz.scss'
import _get from 'lodash.get'

const canGetVarMode = ref<Boolean>(false)
const getVarMode = ref<String>('custom')
const rootVar = ref<TemplateVar | null>(null)
const rootVars = ref<TemplateVar[]>([])
const customVarName = ref<string>()
const customVarType = ref<string>('')
const templateDataType = ref(TEMPLATE_DATA_TYPE.Text)
const useAsteriskAsArrayIndex = ref(false)
const subVar = ref<TemplateVar | null>(null) // 模板变量
const example = ref('')
const sample = ref('')
const output = ref('')
/**
 * 生成的模板
 */
const elTemplate = ref<HTMLDivElement | null>(null)

let wizard: InstanceType<typeof Wizard>

const props = defineProps({
  varsRootName: { type: String, required: true },
  templateText: { type: String },
  vars: { type: Array<TemplateVar> },
})
/**
 * 添加根变量的类型信息
 */
if (Array.isArray(props.vars) && props.vars.length) {
  props.vars.forEach(({ name, title, examples }) => {
    let example = (Array.isArray(examples) && examples.length) ? examples[0] : null
    let exampleData = example?.data
    let type = Array.isArray(exampleData) ? 'array' : exampleData ? typeof exampleData : 'string'
    rootVars.value.push({ name, title, type, examples })
  })
  getVarMode.value = 'select'
  canGetVarMode.value = true
}

onMounted(() => {
  if (elTemplate.value) {
    if (props.templateText) elTemplate.value.innerText = props.templateText
    const { varsRootName } = props
    wizard = Wizard.Create({ varsRootName, vars: rootVars.value } as WizardCreateOption)
  }
})

watch(templateDataType, (nv) => {
  if (wizard)
    wizard.templateDataType = nv
}, { immediate: true })
/**
 * 选择的根变量下的子变量
 */
const subVars = computed<TemplateVar[]>(() => {
  const examples = rootVar.value?.examples
  if (!Array.isArray(examples) || examples.length === 0) return []

  let exampleData = examples[0].data
  if (Array.isArray(exampleData)) {
    if (exampleData.length === 0) return []
  } else if (typeof exampleData === 'object') {
    if (Object.keys(exampleData).length === 0) return []
  } else return []

  const result = wizard.flattenExampleKeys(exampleData)

  return result
})
/**
 * 选择可用变量
 * @param tplVar 
 */
const onChangeVar = () => {
  example.value = ''
  if (rootVar.value) {
    if (Array.isArray(rootVar.value.examples) && rootVar.value.examples.length) {
      example.value = JSON.stringify(rootVar.value.examples[0].data, null, 2)
    }
  }
}
/**
 * 创建模板片段
 */
const createSnippet = () => {
  let snippet = ''

  if (rootVars.value?.length) {
    if (!rootVar.value) return snippet

    const { name } = rootVar.value
    const subName = subVar.value?.name
    let varName = subName ? `${name}.${subName}` : name
    /**
     * 变量的名称改为上下文中的名称
     */
    let tplText = elTemplate.value?.innerText
    if (tplText) {
      let selObj = window.getSelection()
      if (selObj && selObj.anchorOffset) {
        let beforeTplStr = tplText.substring(0, selObj.anchorOffset)
        let matched = beforeTplStr.matchAll(/(?<=\{{2}#each )[\w|\.]+(?=\}{2,3})/g)
        Array.from(matched).forEach(m => varName = varName.replace(`${m[0]}.[0].`, ''))
      }
    }

    let varType = subVar.value?.type || rootVar.value.type
    snippet = wizard.createSnippet(varName, varType, useAsteriskAsArrayIndex.value)
  } else if (customVarName.value && customVarType.value) {
    let name = customVarName.value
    let type = customVarType.value
    // 如果需要，添加变量根名称
    // if (!new RegExp(`^${props.varsRootName}\\.`).test(name)) name = props.varsRootName + '.' + name
    snippet = wizard.createSnippet(name, type, useAsteriskAsArrayIndex.value)
  }

  return snippet
}
/**
 * 在模板中插入片段
 */
const addSnippet = () => {
  let insertContent = createSnippet()
  let selObj = window.getSelection()
  /**
   * 模板编辑框是否有选中的区域
   */
  let isVarsTplEditor = false
  let pe = selObj?.anchorNode?.parentElement
  while (pe) {
    if (pe.classList.contains('ttv-wizard__template')) {
      isVarsTplEditor = true
      break
    }
    pe = pe.parentElement
  }
  if (isVarsTplEditor) {
    /**
     * 在模板中执行插入操作
     */
    let selRange = selObj?.getRangeAt(0)
    if (selRange) {
      selRange.deleteContents()
      selRange.insertNode(document.createTextNode(insertContent))
    }
  } else {
    if (elTemplate.value) {
      let range = document.createRange()
      range.setStart(elTemplate.value, 0)
      range.insertNode(document.createTextNode(insertContent))
    }
  }
}
/**
 * 
 */
const replaceTemplate = () => {
  if (elTemplate.value) {
    let insertContent = createSnippet()
    elTemplate.value.innerText = insertContent
  }
}
/**
 * 创建测试数据模板
 */
const createSampleMold = () => {
  let mold = wizard.createSampleMold(elTemplate.value?.innerText ?? '')
  sample.value = JSON.stringify(mold)
}

const test = () => {
  if (!elTemplate.value || !sample.value) return
  wizard.template = elTemplate.value.innerText
  try {
    let sampleJson = JSON.parse(sample.value)
    let outputResult = wizard.outputResult(sampleJson)
    output.value =
      wizard.templateDataType === 'text'
        ? outputResult
        : JSON.stringify(outputResult)
  } catch (e: any) {
    alert(e.message)
  }
}
/**
 * 返回当前编辑的模板
 */
const editing = () => {
  return elTemplate.value?.innerText
}
/**
 * 允许外部使用
 */
defineExpose({
  editing
})
</script>

<template>
  <div class="ttv-wizard">
    <div class="ttv-wizard__mode">
      <select v-model="mode">
        <option value="text">插入单个变量</option>
        <option value="list1">插入循环结构</option>
        <option value="list2">插入循环结构（子模板）</option>
      </select>
    </div>
    <div>
      <select v-model="templateDataType">
        <option value="text">文本</option>
        <option value="json:array">JSON数组</option>
      </select>
    </div>
    <div class="ttv-wizard__vars" v-if="vars?.length">
      <select v-model="selectedVar">
        <option :value="null">选择变量</option>
        <option v-for="v in vars" :value="v">{{ v.title }}</option>
      </select>
    </div>
    <div class="ttv-wizard__vars-custom" v-if="!vars?.length">
      <input v-model="customVarName" placeholder="输入变量名称" />
    </div>
    <div class="ttv-wizard__sub-template" v-if="requireSubTemplate">
      <div>子模板</div>
      <div v-if="subVars.length">
        <select v-model="selectedSubVar">
          <option value="">选择变量</option>
          <option v-for="v in subVars" :value="v">{{ v }}</option>
        </select>
      </div>
      <div class="ttv-wizard__actions" v-if="subVars.length">
        <button @click="addSubSnippet" class="tvu-button">插入变量</button>
      </div>
      <div ref="elSubTemplate" class="ttv-wizard__editor" contenteditable="true"></div>
    </div>
    <div class="ttv-wizard__template">
      <div>模板</div>
      <div class="ttv-wizard__actions">
        <button @click="addSnippet" class="tvu-button">插入模板片段</button>
        <button @click="replaceTemplate" class="tvu-button">替换模板</button>
      </div>
      <div ref="elTemplate" class="ttv-wizard__editor" contenteditable="true"></div>
    </div>
    <div class="ttv-wizard__sample">
      <div>模板变量数据样例</div>
      <div class="ttv-wizard__actions">
        <button @click="createSampleMold" class="tvu-button">生成测试数据框架</button>
      </div>
      <div class="sample">
        <textarea v-model="sample"></textarea>
      </div>
    </div>
    <div class="ttv-wizard__output">
      <div>测试结果</div>
      <div class="ttv-wizard__actions">
        <button @click="test" class="tvu-button">测试</button>
      </div>
      <div class="ttv-wizard__output__wrap">
        <pre>{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Wizard, TEMPLATE_SNIPPET_MODE, TEMPLATE_DATA_TYPE } from 'tms-template-wizard'
import type { TemplateVar, WizardCreateOption } from 'tms-template-wizard'
import './HandlebarsViz.scss'
import _get from 'lodash.get'

const props = defineProps({
  varsRootName: { type: String, required: true },
  templateText: { type: String },
  vars: { type: Array<TemplateVar> },
})

const selectedVar = ref<any>(null)
const customVarName = ref<any>(null)
const templateDataType = ref(TEMPLATE_DATA_TYPE.Text)
const selectedSubVar = ref<string>('')
const mode = ref(TEMPLATE_SNIPPET_MODE.Text)
const sample = ref('')
const output = ref('')

const elTemplate = ref<HTMLDivElement | null>(null)
const elSubTemplate = ref<HTMLDivElement | null>(null)

let wizard: InstanceType<typeof Wizard>

onMounted(() => {
  if (elTemplate.value) {
    if (props.templateText) elTemplate.value.innerText = props.templateText
    const { varsRootName, vars } = props
    wizard = Wizard.Create({ varsRootName, vars } as WizardCreateOption)
  }
})

watch(templateDataType, (nv) => {
  if (wizard)
    wizard.templateDataType = nv
}, { immediate: true })

const requireSubTemplate = computed(() => {
  if (mode.value !== TEMPLATE_SNIPPET_MODE.List2) return false
  return true
})
/**
 * 子模板可用属性
 */
const subVars = computed(() => {
  const examples = selectedVar.value?.examples
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
 * 创建模板片段
 */
const createSnippet = () => {
  if (props.vars?.length) {
    if (!selectedVar.value) return ''

    const { name, examples } = selectedVar.value
    let exampleData = (Array.isArray(examples) && examples.length) ? examples[0].data : undefined
    let subTpl = elSubTemplate.value?.innerText ?? '替换这里的内容'
    let snippet = wizard.createSnippet(name, subTpl, mode.value, exampleData)

    return snippet
  } else if (customVarName.value) {
    let name = customVarName.value
    // 如果需要，添加变量根名称
    if (!new RegExp(`^${props.varsRootName}\\.`).test(name)) name = props.varsRootName + '.' + name
    let subTpl = elSubTemplate.value?.innerText ?? '替换这里的内容'
    let snippet = wizard.createSnippet(name, subTpl, mode.value)

    return snippet
  }

  return ''
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
    // 插入到指定位置
    let selRange = selObj?.getRangeAt(0)
    selRange?.insertNode(document.createTextNode(insertContent))
  } else {
    if (elTemplate.value) {
      let range = document.createRange()
      range.setStart(elTemplate.value, 0)
      range.insertNode(document.createTextNode(insertContent))
    }
  }
}
/**
 * 在子模板中插入片段
 */
const addSubSnippet = () => {
  if (!selectedSubVar.value) return
  let key = selectedSubVar.value
  let insertContent = `{{{${key}}}}`
  if (templateDataType.value === 'json:array') {
    if (selectedVar.value?.examples) {
      let { examples } = selectedVar.value
      if (Array.isArray(examples) && examples.length) {
        let exampleData = examples[0].data
        let varval
        if (Array.isArray(exampleData) && exampleData.length) {
          varval = _get(exampleData[0], key)
        } else if (typeof exampleData === 'object') {
          varval = _get(exampleData, key)
        }
        if (varval && typeof varval === 'string') {
          insertContent = `"${insertContent}"`
        }
      }
    }
  }

  let selObj = window.getSelection()
  /**
   * 模板编辑框是否有选中的区域
   */
  let isVarsTplEditor = false
  let pe = selObj?.anchorNode?.parentElement
  while (pe) {
    if (pe.classList.contains('ttv-wizard__sub-template')) {
      isVarsTplEditor = true
      break
    }
    pe = pe.parentElement
  }
  if (isVarsTplEditor) {
    // 插入到指定位置
    let selRange = selObj?.getRangeAt(0)
    selRange?.insertNode(document.createTextNode(insertContent))
  } else {
    if (elSubTemplate.value) {
      let range = document.createRange()
      range.setStart(elSubTemplate.value, 0)
      range.insertNode(document.createTextNode(insertContent))
    }
  }
}

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
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { HandlebarsWizard } from 'tms-template-wizard'
import './HandlebarsViz.scss'

const { Wizard, CONVERT_MODE } = HandlebarsWizard
const props = defineProps({
  templateText: { type: String }
})

const mode = ref('')
const target = ref('')
const sample = ref('')
const template = ref('')
const output = ref('')

let wizard: Wizard

if (props.templateText) {
  wizard = Wizard.Builder().setTemplate(props.templateText).build()
  target.value = typeof wizard.target !== 'string' ? JSON.stringify(wizard.target, null, 2) : wizard.target
  mode.value = wizard.mode
  template.value = props.templateText
}

const generate = () => {
  let targetJson = mode.value === CONVERT_MODE.Text ? target.value : JSON.parse(target.value)
  let builder = Wizard.Builder(targetJson)
  let sampleJson
  if (sample.value) {
    sampleJson = JSON.parse(sample.value)
    builder.setInputSample(sampleJson)
  }
  switch (mode.value) {
    case 'fill':
      builder.setMode(CONVERT_MODE.Fill)
      break
    case 'list':
      builder.setMode(CONVERT_MODE.List)
      break
  }
  wizard = builder.build()
  template.value = wizard.template()
}

const test = (event: MouseEvent) => {
  if (!wizard) generate()

  if (sample.value) {
    let sampleJson = JSON.parse(sample.value)
    let outputResult = wizard.outputResult(sampleJson)
    output.value = wizard.mode === CONVERT_MODE.Text ? outputResult : JSON.stringify(outputResult)
  }
}

</script>

<template>
  <div class="ttv-handlebars">
    <div class="ttv-handlebars__mode">
      <select v-model="mode">
        <option value=""></option>
        <option value="text_fill">字符串填充</option>
        <option value="fill">对象或数组填充</option>
        <option value="list">转换列表</option>
      </select>
    </div>
    <div class="ttv-handlebars__target">
      <div>目标数据结构</div>
      <div class="target">
        <textarea v-model="target"></textarea>
      </div>
    </div>
    <div class="ttv-handlebars__sample">
      <div>输入数据样例</div>
      <div class="sample">
        <textarea v-model="sample"></textarea>
      </div>
    </div>
    <div class="ttv-handlebars--actions">
      <button @click="generate" class="tvu-button">生成模板</button>
    </div>
    <div class="ttv-handlebars__template">
      <div>handlebars模板</div>
      <div class="resul">
        <textarea v-model="template"></textarea>
      </div>
    </div>
    <div class="ttv-handlebars__actions">
      <button @click="test" class="tvu-button">测试</button>
    </div>
    <div class="ttv-handlebars__data">
      <div>测试结果</div>
      <div>
        <pre>{{output}}</pre>
      </div>
    </div>
  </div>
</template>
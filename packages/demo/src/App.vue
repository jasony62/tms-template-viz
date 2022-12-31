<template>
  <div style="width:300px;">
    <handlebars-viz :vars-root-name="varsRootName" :template-text="templateText" :vars="vars" />
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { HandlebarsViz } from 'tms-template-viz'

const varsRootName = 'vars'

const templateText = '{{{vars.var1}}}，你好！'

// const vars: any[] = []
const vars = [
  { name: 'vars.var1', title: '变量1', examples: [{ data: 'abc' }] },
  { name: 'vars.var2', title: '变量2', examples: [{ data: 'xyz' }] },
  { name: 'vars.var3', title: '变量3', examples: [{ data: 123 }] },
  { name: 'vars.arr4', title: '数组4（简单类型）', examples: [{ data: ['a', 'b', 'c'] }] },
  { name: 'vars.arr5', title: '数组5（对象类型）', examples: [{ data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }] }
]
</script>

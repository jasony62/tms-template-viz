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

const vars = [
  { name: 'vars.var1', title: '变量1', example: 'abc' },
  { name: 'vars.var2', title: '变量2', example: 'xyz' },
  { name: 'vars.var3', title: '变量3', example: 123 },
  { name: 'vars.arr4', title: '数组4（简单类型）', example: ['a', 'b', 'c'] },
  { name: 'vars.arr5', title: '数组5（对象类型）', example: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }
]
</script>

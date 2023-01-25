<template>
  <div>
    <button @click="getResult">获得模板</button>
  </div>
  <div style="width:300px;">
    <handlebars-viz ref="$ttv" :vars-root-name="varsRootName" :template-text="templateText" :vars="vars" />
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { HandlebarsViz } from 'tms-template-viz'
import { ref } from 'vue';

const $ttv = ref<{ editing: () => string } | null>(null)

const varsRootName = 'vars'

const templateText = '{{{vars.var1}}}，你好！'

const vars: any[] = []
// const vars = [
//   { name: 'vars.var1', title: '变量1（字符串）', examples: [{ data: 'abc' }] },
//   { name: 'vars.var2', title: '变量2（字符串）', examples: [{ data: 'xyz' }] },
//   { name: 'vars.var3', title: '变量3（数字）', examples: [{ data: 123 }] },
//   { name: 'vars.var4', title: '变量4（对象）', examples: [{ data: { name: 'tester', value: 'abc' } }] },
//   { name: 'vars.arr5', title: '数组5（简单类型）', examples: [{ data: ['a', 'b', 'c'] }] },
//   { name: 'vars.arr6', title: '数组6（对象类型）', examples: [{ data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }] },
//   { name: 'vars.var7', title: '变量7' },
//   {
//     name: 'vars.userlist02', title: '测试数据02', "examples": [
//       {
//         "data": {
//           "code": 0,
//           "data": [
//             {
//               "_id": "63c7aba3818b1f15b73b2eac",
//               "extra": {
//                 "billno": "abc123"
//               },
//               "username": "yangyue",
//               "mobile": 13370166318,
//               "qywx": "YG000887",
//               "TMW_CREATE_TIME": "2023-01-18 16:19:47"
//             }
//           ]
//         }
//       }
//     ]
//   },
// ]

const getResult = () => {
  let result = $ttv.value?.editing()
  alert('结果：' + result)
}
</script>

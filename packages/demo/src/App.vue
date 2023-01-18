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

// const vars: any[] = []
const vars = [
  { name: 'vars.var1', title: '变量1', examples: [{ data: 'abc' }] },
  { name: 'vars.var2', title: '变量2', examples: [{ data: 'xyz' }] },
  { name: 'vars.var3', title: '变量3', examples: [{ data: 123 }] },
  { name: 'vars.arr4', title: '数组4（简单类型）', examples: [{ data: ['a', 'b', 'c'] }] },
  { name: 'vars.arr5', title: '数组5（对象类型）', examples: [{ data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }] },
  { name: 'vars.var6', title: '变量6' },
  {
    name: 'vars.userlist02', title: '测试数据02', "examples": [
      {
        "data": {
          "code": 0,
          "data": [
            {
              "_id": "63c7aba3818b1f15b73b2eac",
              "extra": {
                "billno": "abc123"
              },
              "username": "yangyue",
              "mobile": 13370166318,
              "qywx": "YG000887",
              "TMW_CREATE_TIME": "2023-01-18 16:19:47"
            }
          ]
        }
      }
    ]
  },
]

const getResult = () => {
  let result = $ttv.value?.editing()
  alert('结果：' + result)
}
</script>

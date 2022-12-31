模板生成辅助工具。

基于`Handlebars`模板引擎

# 支持的模式

## 包含变量的文本

> {{{vars.nickname}}}，你好！

```
alice，你好
```

## 包含变量的 JSON

> {"nickname":"{{{vars.nickname}}}", "age":{{{vars.age}}}}

```json
{ "nickname": "alice", "age": 18 }
```

## 不定长数组生成文本

> {{#each vars.users}}{{#unless @first}},{{/unless}}{{{mobile}}}{{/each}}

```
18900001111,18900002222
```

## 不定长数组生成 JSON

> [{{#each vars.users}}{{#unless @first}},{{/unless}}"{{{mobile}}}"{{/each}}]

```json
["18900001111", "18900002222"]
```

# 实现思路

结构固定的模板，用变量插入或替换。

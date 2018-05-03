# knockout.treetable.js
公司做SaaS系统后台需要一个快速表格控件，所以利用Knockout做了一个将就用。<br>
Description：基于Knockout的TreeTable,如同名字,可单一显示表格/表格树以及左树右表格,带搜索参数(调用方式详见下列demo)
## 调用方式
>>依赖：underscore ext js库,ext是扩展的相关插件
```
文本框={ type: "text",displayName:"", key: "r", placeholder: "文本框", value: ko.observable() }
下拉框={ type: "select",displayName:"", key: "r", placeholder: "--下拉框--", value: ko.observable(), url: [] }
时间框={ type: "time",displayName:"", key: "r", placeholder: "时间框", value: ko.observable() }
时间范围选择框={ type: "timerange", displayName: "", key: [{ name: "br",placeholder:"", value: ko.observable() }, { name: "er",placeholder:"", value: ko.observable() }] }
树形下拉框{ type: "tree", displayName: "", key: "r", value: ko.observable(), data: { data: { url: [] } } }
级联下拉框{ type: "cascade", displayName: "", key: "r", value: ko.observable(), url: [] }
```


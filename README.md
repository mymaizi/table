# ElTable.vue
扩展element UI的表格,自我感觉很好用，毕竟做后台表格太繁琐了。
用法大致同以下表格描述
# knockout.treetable.js
Description：基于Knockout的TreeTable,如同名字,可单一显示表格/表格树以及左树右表格,带搜索参数(调用方式详见下列demo)
>依赖：underscore ext js库,ext是扩展的相关插件,underscore可用lodash代替
## 关于ext
>这个扩展文件也可以单独在表单中使用，具体使用方式可在文件内部找到。

## HTML Demo
>前提是你已经熟悉Kncokout
基于knockout.treetable.js 调用
* 文本框={ type: "text",displayName:"", key: "r", placeholder: "文本框", value: ko.observable() }
* 下拉框={ type: "select",displayName:"", key: "r", placeholder: "--下拉框--", value: ko.observable(), url: [] }
* 时间框={ type: "time",displayName:"", key: "r", placeholder: "时间框", value: ko.observable() }
* 时间范围选择框={ type: "timerange", displayName: "", key: [{ name: "br",placeholder:"", value: ko.observable() }, { name: "er",placeholder:"", value: ko.observable() }] }
* 树形下拉框{ type: "tree", displayName: "", key: "r", value: ko.observable(), data: { data: { url: [] } } }
* 级联下拉框{ type: "cascade", displayName: "", key: "r", value: ko.observable(), url: [] }
```
<script>
        var vm = new ko.treeTable.viewModel({
            url: [],
            columns: [
                { headerText: "用户姓名", rowText: "" },
                { headerText: "手机号码", rowText: "" },
                { headerText: "区域", rowText: "" },
                { headerText: "用户状态", rowText: "" },
                { headerText: "企业用户", rowText: "" },
                { headerText: "注册时间", rowText: "" },
                { headerText: "最近登录", rowText: "" },
                { headerText: "当前版本", rowText: "" },
                { headerText: "操作", rowText: function (item) { return '<button type="button" class="btn btn-block btn-info btn-xs">查看</button><button type="button" class="btn btn-block btn-danger btn-xs">冻结</button>' } },
            ],
            searchRules: [
                { type: "text", key: "r", placeholder:"用户姓名", value: ko.observable() },
                { type: "text", key: "r", placeholder: "手机号码", value: ko.observable() },
                { type: "select", key: "r", placeholder: "--用户状态--", value: ko.observable(), url: [] },
                {
                    type: "select", key: "r", placeholder: "--区域--", value: ko.observable(), optionsText: "name", optionsValue: "code", url: "youpostorgeturl", response: function (items) {
                        return _.where(items.datas, { parentCode: "0" });
                    }
                },
                { type: "time", key: "r", placeholder: "从注册时间", value: ko.observable() },
                { type: "time", key: "r", placeholder: "到注册时间", value: ko.observable() }
            ]
        });
        ko.applyBindings(vm, document.getElementById("myTable"));
    </script>
```

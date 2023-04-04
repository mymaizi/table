<template>
  <el-table v-loading="table.loading" :element-loading-text="loadingText" :element-loading-spinner="loadingSpinner"
    :data="table.items" :row-class-name="tableRowClassName" :header-cell-style="headCellStyle" :cell-style="cellStyle"
    :row-style="rowStyle" :highlight-current-row="!allowMultiple" :empty-text="emptyText" :select-on-indeterminate="true"
    :border="border" :size="tableSize" :height="table.height" :max-height="table.maxHeight" :row-key="rowKey"
    :tree-props="treeProps" @selection-change="handleSelectionChange" @row-click="handleRowClick"
    @sort-change="handleSortChange" @expand-change="handleExpandChange">
    <template v-if="allowMultiple">
      <el-table-column type="selection" />
    </template>
    <slot name="first" />
    <template v-for="(item, i) in table.columns_">
      <slot :name="item.rowText">
        <el-table-column :label="item.headerText" :key="i" :sortable="item.sortable" :prop="item.rowText"
          :width="item.width" :show-overflow-tooltip="item.showTooltip" />
      </slot>
    </template>
    <slot name="last" />
  </el-table>
  <el-pagination background @current-change="handleCurrentChange" :page-size="size" :hide-on-single-page="hidePage"
    layout="total, prev, pager, next, jumper" :total="table.totalCount" :small="paginationSmall" />
</template>

<script setup>
//通用表格组件
const emits = defineEmits(["expandChange", "httpResult", "update:modelValue"]);
const props = defineProps({
  //请求地址，如果请求返回数据中包括columns字段则可忽略prop属性columns,反之则需要外部传入
  http: {
    type: [Object, Function, String],
  },
  //请求参数
  params: {
    type: Object,
    default: {}
  },
  //数据绑定列===>[{ headerText: "", rowText: "",sortable:"",width:"",showTooltip:"",disabled:"" }]
  columns: {
    type: Array,
  },
  //分页大小
  size: {
    type: Number,
    default: 20,
  },
  //允许多选
  allowMultiple: {
    type: Boolean,
    default: false,
  },
  //v-model
  modelValue: {
    type: Array,
  },
  //允许加载请求数据
  allowInitRequest: {
    type: Boolean,
    default: true,
  },
  //加载显示文字
  loadingText: {
    type: String,
  },
  //加载显示图标
  loadingSpinner: {
    type: String,
  },
  //空数据提示
  emptyText: {
    type: String,
    default: "暂无数据"
  },
  //分页变量,详情参见defaultPageInfoName
  pageInfoName: {
    type: Object,
  },
  //border
  border: {
    type: Boolean,
    default: false,
  },
  // 表格高
  height: {
    type: [Function, Number],
  },
  // 表格高
  maxHeight: {
    type: [Function, Number],
  },
  // 表格大小
  tableSize: {
    type: String,
    default: "mini",
  },
  // 行背景色
  tableRowClassName: {
    type: Function,
    default: null,
  },
  // 分页控件样式是否为small
  paginationSmall: {
    type: Boolean,
    default: false,
  },
  // 分页 未满一页时是否显示
  hidePage: {
    type: Boolean,
    default: true,
  },
  // 行样式
  rowStyle: {
    type: Object,
  },
  // 单元格样式
  cellStyle: {
    type: Object
  },
  //头部单元格样式
  headCellStyle: {
    typeof: Object
  },
  // 返回数据别名
  dataAlias: {
    type: String,
    default: "rows",
  },
  // 返回数据别名
  totalAlias: {
    type: String,
    default: "total",
  },
  rowKey: {
    type: [Function, String],
    default: "",
  },
  treeProps: {
    type: Object,
    default: () => { },
  },
});
const defaultPageInfoName = {
  pageName: "pageNum",
  skipName: "skipCount",
  sizeName: "pageSize",
};
const table = reactive({
  loading: false,
  items: [], //数据项
  totalCount: 0, //总数
  page: 1,
  columns_: props.columns.filter(a => !a.disabled), //用于控制显示列
  params_: null,
  height: null,
  maxHeight: null
});
onMounted(() => {
  if (props.allowInitRequest) {
    load();
  }
  nextTick(() => {
    if (typeof props.height == "function") {
      table.height = props.height();
    } else {
      table.height = props.height;
    }
    if (typeof props.maxHeight == "function") {
      table.maxHeight = props.maxHeight();
    } else {
      table.maxHeight = props.maxHeight;
    }
  });
});

/**
 * params Object 传入除首次调用时的参数
 */
function load(params) {
  if (params) {
    table.params_ = params;
  }
  table.loading = true;
  let _params = {};
  let pageInfoName = Object.assign(defaultPageInfoName, props.pageInfoName);
  _params[pageInfoName.pageName] = table.page;
  _params[pageInfoName.skipName] = (table.page - 1) * props.size;
  _params[pageInfoName.sizeName] = props.size;
  let p = Object.assign(_params, table.params_);
  if (props.params) {
    p = Object.assign(p, props.params);
  }
  if (!props.http) {
    table.loading = false;
    return;
  }
  props
    .http(p)
    .then((response) => {
      table.loading = false;
      table.items = response[props.dataAlias];
      table.totalCount = response[props.totalAlias];
      emits("httpResult", response);
    })
    .catch(() => {
      table.loading = false;
    });
}
function handleCurrentChange(page = 1) {
  table.page = page;
  load();
}
function handleSelectionChange(val) {
  emits("update:modelValue", val);
}
function handleRowClick(val) {
  emits("update:modelValue", [val]);
}
function handleExpandChange(row, type) {
  emits("expandChange", row, type);
}
function handleSortChange(val) {
  if (val.order != null) {
    props.params["sorting"] = `${val.prop} ${val.order.replace("ending", "")}`;
  } else {
    delete props.params.sorting;
  }
  load();
}
defineExpose({
  //以下操作用于静态数据处理
  add(data) {
    table.items = table.items.concat(data);
  },
  remove(index) {
    table.items.splice(index, 1)
  },
  clear() {
    table.items = [];
  },
  list() {
    return JSON.parse(JSON.stringify(table.items));
  },
  search(params) {
    table.items = [];
    table.page = 1;
    load(params);
  },
})
</script>

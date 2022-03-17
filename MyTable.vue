<template>
  <el-table
    ref="refTable"
    v-loading="table.loading"
    :element-loading-text="loadingText"
    :element-loading-spinner="loadingSpinner"
    :data="table.items"
    :row-class-name="tableRowClassName"
    :header-cell-style="headCellStyle"
    :cell-style="cellStyle"
    :row-style="rowStyle"
    :highlight-current-row="!allowMultiple"
    :empty-text="emptyText"
    :select-on-indeterminate="true"
    :border="border"
    :size="tableSize"
    :height="table.height"
    @selection-change="handleSelectionChange"
    @row-click="handleRowClick"
    @sort-change="handleSortChange"
    @expand-change="handleExpandChange"
  >
    <template v-if="allowMultiple">
      <el-table-column type="selection" />
    </template>
    <slot name="first" />
    <template v-for="(item, i) in table.columns_">
      <slot :name="item.rowText">
        <el-table-column
          :label="item.headerText"
          :key="i"
          :sortable="item.sortable"
          :prop="item.rowText"
          :width="item.width"
          :show-overflow-tooltip="showTooltip"
        />
      </slot>
    </template>
    <slot name="last" />
  </el-table>
  <el-pagination
    background
    @current-change="handleCurrentChange"
    :page-size="size"
    :hide-on-single-page="hidePage"
    layout="total, prev, pager, next, jumper"
    :total="table.totalCount"
    :small="paginationSmall"
  />
</template>
<script>
import { onMounted, reactive,nextTick } from "vue";
//通用表格组件
export default {
  name: "MyTable",
  emits: ["expandChange","httpResult"],
  props: {
    //请求地址，如果请求返回数据中包括columns字段则可忽略prop属性columns,反之则需要外部传入
    http: {
      type: [Object, Function,String],
    },
    //请求参数
    params: {
      type: Object,
      default:{}
    },
    //数据绑定列===>[{ headerText: "you header text", rowText: "you data field",sortable:"you field sortable to true or false",width:"you field column width" }]
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
      default:"暂无数据"
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
      type: [Function,Number],
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
    // 溢出是否显示tooltip
    showTooltip: {
      type: Boolean,
      default: false,
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
    cellStyle:{
      type:Object
    },
    //头部单元格样式
    headCellStyle:{
      typeof:Object
    },
    // 返回数据别名
    dataAlias: {
      type: String,
      default: "list",
    },
    // 返回数据别名
    totalAlias: {
      type: String,
      default: "total",
    },
  },
  setup(props, context) {
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
      columns_: props.columns, //用于控制显示列是通过table属性传入还是通过后端请求获取
      params_: null,
      height:null
    });
    onMounted(() => {
      if (props.allowInitRequest) {
        search();
      }
      nextTick(()=>{
        if(typeof props.height=="function"){
          table.height=props.height();
        }else{
          table.height=props.height;
        }
      });
    });

    const handleCurrentChange = (page = 1) => {
      table.page = page;
      search();
    };
    /**
     * params Object 传入除首次调用时的参数
     */
    const search = (params) => {
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
      if (table.page > 1) {
        p[pageInfoName.pageName] = table.page;
      }
      if (!props.http) {
        table.loading = false;
        return;
      }
      props
        .http(p)
        .then((response) => {
          table.loading = false;
          let result = response.data;
          if (result.columns != undefined && self.columns == undefined) {
            table.columns_ = result.columns;
          } else if (table.columns_ == undefined) {
            console.log(
              "初始化表格失败，请检查是否设置columns参数或者保证columns从后端返回！"
            );
          }
          table.items = result[props.dataAlias];
          table.totalCount = result[props.totalAlias];
          context.emit("httpResult", result);
        })
        .catch(() => {
          table.loading = false;
        });
    };
    const handleSelectionChange = (val) => {
      context.emit("update:modelValue", val);
    };
    const handleRowClick = (val) => {
      context.emit("update:modelValue", [val]);
    };
    const handleExpandChange = (row, type) => {
      context.emit("expandChange", row, type);
    };
    const handleSortChange = (val) => {
      if (val.order != null) {
        props.params["sorting"] = `${val.prop} ${val.order.replace("ending","")}`;
      } else {
        delete props.params.sorting;
      }
      search();
    };
    //以下操作用于静态数据处理
    const add = (data) => {
      table.items = _.concat(table.items, data);
    };
    const remove = (key) => {
      _.remove(table.items, (item) => {
        return item.id == key;
      });
    };
    const clear = () => {
      table.items = [];
    };

    //返回当前组件对象
    return {
      table,
      search,
      add,
      remove,
      clear,
      handleCurrentChange,
      handleSelectionChange,
      handleRowClick,
      handleSortChange,
      handleExpandChange
    };
  },
};
</script>

<style>
.el-pagination {
  margin-top: 14px;
  text-align: center;
}
.el-table .warning-row {
  background: oldlace;
}
.el-table .success-row {
  background: #f0f9eb;
}
.el-table .cell {
  overflow: hidden;
  white-space: nowrap !important;
  text-overflow: ellipsis;
}
.theme-black .el-table,
.theme-black .el-table thead {
  color: #909399;
}
</style>

/*
* Author：Maizi
* Time：2017-8-25 14:44
* Description：基于Knockout的TreeTable,如同名字,可单一显示表格/表格树以及左树右表格,带搜索参数(调用方式详见下列demo)
* 文本框={ type: "text",displayName:"", key: "r", placeholder: "文本框", value: ko.observable() }
* 下拉框={ type: "select",displayName:"", key: "r", placeholder: "--下拉框--", value: ko.observable(), url: [] }
* 时间框={ type: "time",displayName:"", key: "r", placeholder: "时间框", value: ko.observable() }
* 时间范围选择框={ type: "timerange", displayName: "", key: [{ name: "br",placeholder:"", value: ko.observable() }, { name: "er",placeholder:"", value: ko.observable() }] }
* 树形下拉框{ type: "tree", displayName: "", key: "r", value: ko.observable(), data: { data: { url: [] } } }
* 级联下拉框{ type: "cascade", displayName: "", key: "r", value: ko.observable(), url: [] }
* 依赖：underscore ext js库,ext是扩展的相关插件
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "knockout", "underscore"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"), require("knockout"), require("underscore"));
    } else {
        factory(jQuery, ko, _);
    }
}(function ($, ko, _) {
    ko.treeTable = {
        viewModel: function (tableOptions, treeOptions) {
            var treeOpts = $.extend({}, { treeUrl: "", treeTitle: "默认标题", treeAdd: null, treeEdit: null, treeRemove: null, random: Math.round(Math.random() * 100), ready: null }, treeOptions || {});
            var tabelOpts = $.extend({}, { url: "", tableTitle: "查询条件", columns: [], searchRules: [], clickToSelect: null, isSerialNumber: false, SerialNumberText: "序号", ready: null, isTreeTable: false, pageClick: null, buttonExtTarget: null,type:"GET" }, tableOptions || {});
            var self = this;
            self.tabelOpts = tabelOpts;
            self.treeOpts = treeOpts;
            self.isTree = !treeOptions;
            self.pageCount = ko.observable(0);
            self.currentPage = ko.observable(1);
            self.columns = ko.observableArray(tabelOpts.columns);
            self.items = ko.observableArray();
            self.checkAll = ko.observable(false);
            self.searchRules = ko.observableArray(tabelOpts.searchRules);
            self.goTo = ko.observable(false);
            self.queryStringTree = ko.observable();
            self.queryString = ko.computed(function () {
                self.goTo();
                var items = [],where=[];
                items.push("page:" + self.currentPage());
                $.each(self.searchRules(), function (i, item) {
                    if (item.type == "timerange") {
                        $.each(item.key, function (j,jitem) {
                            var v = jitem.value();
                            if (!!v && !!jitem.name) {
                                where.push(jitem.name + ":'" + v + "'");
                            }
                        });
                    } else {
                        var v = item.value();
                        if (!!v && !!item.key) {
                            where.push(item.key + ":'" + v + "'");
                        }
                    }
                });
                
                items.push("parameter:{" + where.join(",")+"}");
                $.each(self.queryStringTree(), function (key, value) {
                    if (key == "isTreeSearch" && value) {
                        items.shift();
                        items.push("page:1");
                        self.queryStringTree().isTreeSearch = false;
                        self.currentPage(1);
                    } else if (key != "isTreeSearch") {
                        items.push(key + ":'" + value + "'");
                    }
                });
                self.goTo(false);
                var parms = eval('(' + "{" + items.join(",") + "}" + ')');
                return parms;
            }, this);
            self.pages = ko.computed(function () {
                var pages = [];
                for (var i = (self.currentPage() > self.pageCount()) ? 1 : ((self.currentPage() > 5) ? ((self.pageCount() >= 9) ? ((self.currentPage() + 4 > self.pageCount()) ? (self.pageCount() - 8) : (self.currentPage() - 4)) : 1) : 1) ; i <= ((self.pageCount() >= 9) ? ((self.currentPage() > 5) ? ((self.currentPage() + 4 > self.pageCount()) ? self.pageCount() : (self.currentPage() + 4)) : 9) : self.pageCount()) ; i++) {
                    pages.push({
                        page: i
                    });
                }
                return pages;
            }, this);
            self.getData = ko.computed(function () {
                var tableUrl = self.tabelOpts.url;
                if ($.isFunction(tableUrl)) {
                    tableUrl = tableUrl.call();
                }
                var parms = self.queryString();
                if (typeof (tableUrl) == "string") {
                    var tbody = $("#ko_treeTable" + self.treeOpts.random).find("tbody");
                    $.ajax({
                        type: self.tabelOpts.type,
                        url: tableUrl,
                        contentType: "application/json",
                        data: JSON.stringify(parms),
                        cache: false,
                        success: function (result) {
                            self.items(result.datas || []);
                            self.pageCount(result.total_page || 0);
                            if (!!result.columns) self.columns(result.columns);
                            if (!!result.searchRules) self.searchRules(result.searchRules);
                            if ($.isFunction(self.tabelOpts.ready)) self.tabelOpts.ready();
                        },
                        beforeSend: function () {
                            tbody.addClass("loading");
                        },
                        complete: function () {
                            tbody.removeClass("loading");
                        },
                        error: function () {
                            self.items([]);
                            self.pageCount(0);
                        }
                    });
                }
                else {
                    self.items(tableUrl);
                }
                self.checkAll(false);
            }, this);
            self.getTypeName = ko.computed(function () {
                if (self.columns().length == 0) return;
                var text = self.columns()[0].headerText;
                text = text == "checkbox" ? "koCheckbox" : text == "radio" ? "koRadio" : "koNull";
                return text += treeOpts.random;
            }, this);
            self.clickCheckAll = ko.computed(function () {
                var name = self.getTypeName();
                $("input[name='" + name + "']").prop("checked", self.checkAll());
            }, this);
            self.pageClick = function (e) {
                self.currentPage(e.page);
                if (!!self.tabelOpts.pageClick && $.isFunction(self.tabelOpts.pageClick)) {
                    self.tabelOpts.pageClick.call(this, e.page);
                }
            };
            self.clickToSelect = function (item, e) {
                var name = e.target.attributes.name;
                if (!!self.tabelOpts.clickToSelect) {
                    if (!!name && /^ko[Radio|Checkbox]+\d*?$/.test(name.value)) {
                        self.tabelOpts.clickToSelect.call(self, item, e);
                    } else if (!name) {
                        self.tabelOpts.clickToSelect.call(self, item, e);
                    }
                }
                if(self.tabelOpts.isTreeTable){
                	$(e.currentTarget).toggleClass("tr_open");
                	var key=_.findKey(item);
                	if(!!item.childs&&!$(e.currentTarget).hasClass("tr_open")){
	            		self.setTreeTableChilds(key,item);
                	}else{
                		$(".tr_"+item[key]).removeClass("hide");
                	}
                }
                if (!name && e.target.tagName != "A") {
                    var cb = $(":checkbox,:radio", e.currentTarget);
                    cb.prop("checked", !cb.prop("checked"));
                } else {
                    return true;
                }
            };
            self.setTreeTableChilds=function(key,item){
            	$(".tr_"+item[key]).addClass("hide").removeClass("tr_open");
            	if(!!item.childs){
	            	$.each(item.childs, function(i,obj) {
		            	$(".tr_"+obj[key]).removeClass("tr_open");
	                	self.setTreeTableChilds(key,obj);
	                });
            	}
            };
            self.getIds = function () {
                var name = self.getTypeName();
                var ids = [];
                $("input[name='" + name + "']:checked").each(function (i) {
                    if ($(this).prop("checked")) {
                        ids.push($(this).val());
                    }
                });
                return ids;
            };
            self.getAll = function (column) {
                var ids = [], c = column;
                $.each(self.items(), function (i, item) {
                    ids.push(item[c]);
                });
                return ids;
            };
            self.getEntity = function () {
                var name = self.getTypeName();
                var model = undefined;
                var v = $("input[name='" + name + "']:checked").first().val();
                if (typeof v != "undefined") {
                    var where = eval('(' + "{ " + self.columns()[0].rowText + ": isNaN(v) ? v : parseInt(v) }" + ')');
                    model = _.findWhere(self.items(), where);
                }
                return model;
            };
            self.getEntitys = function () {
                var name = self.getTypeName();
                var models = undefined;
                models = _.filter(self.items(), function (item) {
                    var id = eval('(item.' + self.columns()[0].rowText + ')');
                    var ids = self.getIds();
                    return _.contains(ids, id);
                });
                return models;
            };
            self.search = function () {
                self.goTo(true);
            };
            self.refresh = function () {
                self.search();
            };
            self.getNode = function () {
                var jt = self.jstree(true);
                var ele = jt.get_selected();
                return jt.get_node(ele);
            };
            self.getParentNode = function () {
                var jt = self.jstree(true);
                var ele = jt.get_selected();
                var parentId=jt.get_parent(ele);
                return jt.get_node(parentId); 
            };
            self.bindTreeChanged = function () {
                var jt = self.jstree(true);
                jt.element.on("changed.jstree", function (e, data) {
                    var current = data.instance.get_node(data.selected[0]);
                    if (!!current.id) {
                        self.queryStringTree({ "isTreeSearch": true, "treeId": current.id });
                    }
                });
            };
            self.refreshTree = function () {
                var jt = self.jstree(true);
                jt.refresh();
            };
            self.refreshTreeData = function (pars) {
                var jt = self.jstree(true);
                var treeUrl = self.treeOpts.treeUrl;
                if ($.isFunction(self.treeOpts.treeUrl)) {
                    treeUrl = treeUrl.call();
                }
                $.getJSON(treeUrl, pars, function (data) {
                    jt.settings.core.data = data;
                    jt.refresh();
                });
            };
            self.setTreeData = function (data) {
                var jt = self.jstree(true);
                jt.settings.core.data = data;
                jt.refresh();
            };
        }
    };
    var templateEngine = new ko.nativeTemplateEngine();
    templateEngine.addTemplate = function (templateName, templateMarkup) {
        $("head").append("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };
    templateEngine.addTemplate("ko_jsTree",
        '<div class="col-md-3 ko_jsTree">' +
		    '<div class="panel panel-default">' +
		        '<div class="panel-heading clearfix">' +
		            '<h3 class="panel-title pull-left" data-bind="attr:{id:\'ko_jsTreeTitle\'+treeOpts.random}"></h3>' +
		            '<div class="panel-tools pull-right">' +
		                '<i class="glyphicon glyphicon-plus" data-bind="attr:{id:\'ko_jsTreeAdd\'+treeOpts.random}" title="添加"></i>' +
		                '<i class="glyphicon glyphicon-edit" data-bind="attr:{id:\'ko_jsTreeEdit\'+treeOpts.random}" title="修改"></i>' +
		                '<i class="glyphicon glyphicon-remove"  data-bind="attr:{id:\'ko_jsTreeRemove\'+treeOpts.random}" title="删除"></i>' +
		            '</div>' +
		        '</div>' +
		        '<div class="panel-body">' +
		            '<div data-bind="attr:{id:\'ko_jsTree\'+treeOpts.random}" style="margin: -5px; -moz-user-select: none;">' +
		            '</div>' +
		        '</div>' +
		    '</div>' +
		'</div>');
    templateEngine.addTemplate("ko_treeTable",
		'<div data-bind="attr:{\'class\':!isTree?\'col-md-9 ko_treeTable\':\'\'}">' +
            '<!-- ko if:searchRules().length > 0 -->' +
                '<div class="panel panel-default">' +
                    '<!-- ko if: tabelOpts.tableTitle -->' +
                        '<div class="panel-heading clearfix" style="position: relative;min-height:35px;">' +
                            '<span data-bind="text:tabelOpts.tableTitle" style=" position: absolute;top:50%;margin-top:-10px;"></span>' +
                            '<!-- ko if: tabelOpts.buttonExtTarget -->' +
                                '<div class="pull-right" data-bind="template: { name:tabelOpts.buttonExtTarget}"></div>' +
                            '<!-- /ko -->' +
                        '</div > ' +
                    '<!-- /ko -->' +
                    '<div class="panel-body">' +
                        '<div class="row">' +
                            '<!--ko foreach:searchRules-->' +
                                '<!-- ko if:typeof displayName!="undefined"-->' +
                                    '<div class="col-md-1">' +
                                        '<label  data-bind="text:displayName"/>' +
                                    '</div>' +
                                '<!--/ko-->' +
                                '<div class="col-md-3" style="margin-bottom:10px;">' +
		                            '<!-- ko with:type=="text"-->' +
                                        '<input type="text" data-bind="value: $parent.value,attr:{\'class\':$parent.key+\' form-control\',\'style\':$parent.style,\'placeholder\':$parent.placeholder}"/>' +
		                            '<!--/ko-->' +
		                            '<!-- ko with:type=="time"-->' +
		                                '<input type="text" data-ext="time"  data-bind="value: $parent.value,attr: {\'class\':$parent.key+\' form-control\',\'data-parms\':JSON.stringify({singleDatePicker:$parent.singleDatePicker,autoUpdateInput:$parent.autoUpdateInput}),\'style\':$parent.style,\'placeholder\':$parent.placeholder }" />' +
                                    '<!--/ko-->' +
                                    '<!-- ko with:type=="timerange"-->' +
                                        '<!--ko foreach:$parent.key-->' +
                                            '<input type="text" data-ext="time"  data-bind="value:$data.value,attr: {\'class\':$data.name+\' form-control\',\'style\':$parent.style,\'placeholder\':$parent.placeholder}" />' +
                                            '<!--ko if:$index()==0-->' +
                                                '<text data-bind="text:$parents[1].splt||\'--\'"></text>'+
                                            '<!--/ko-->' +
                                        '<!--/ko-->' +
                                    '<!--/ko-->' +
		                            '<!-- ko with:type=="select"-->' +
		                                '<select data-ext="option"  data-bind="value:$parent.value,attr: {\'class\':$parent.key+\' form-control\',\'data-parms\':JSON.stringify({url:$parent.url,optionsText:$parent.optionsText,optionsValue:$parent.optionsValue, isDefault: $parent.isDefault,placeholder:$parent.placeholder, defaultValue: $parent.defaultValue,ready:$parent.ready+\'\',response:$parent.response+\'\'}),\'style\':$parent.style }"></select>' +
		                            '<!--/ko-->' +
                                    '<!-- ko with:type=="tree"-->' +
                                        '<input  data-ext="tree" data-bind="attr: {\'class\':$parent.key+\' form-control\',\'data-parms\':JSON.stringify($parent.data),\'name\':$parent.key,\'style\':$parent.style,\'placeholder\':$parent.placeholder}" />' +
                                        '<input  type="hidden" data-bind="value: $parent.value,attr:{\'id\':$parent.key }" />' +
		                            '<!--/ko-->' +
                                    '<!-- ko with:type=="cascade"-->' +
                                        '<div data-ext="cascade" data-bind="attr: {\'class\':$parent.key,\'data-parms\':JSON.stringify({url:$parent.url,key:$parent.key}),\'style\':$parent.style}" ></div>' +
                                        '<input  type="hidden" data-bind="value: $parent.value,attr:{\'id\':$parent.key }" />' +
		                            '<!--/ko-->' +
                                '</div>' +
                            '<!--/ko-->' +
                            '<div class="col-md-3">' +
                                '<button type="button" class="btn btn-primary" data-bind="click:search">查询</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '<!-- /ko -->' +
		    '<div class="row">' +
		        '<div class="col-sm-12">' +
		            '<div class="table-responsive">' +
		                '<table class="table table-bordered table-hover table-condensed treetable" data-bind="attr:{id:\'ko_treeTable\'+treeOpts.random}">' +
                            '<thead>' +
		                        '<tr data-bind="foreach: columns">' +
                                         '<th data-bind="visible: ($root.tabelOpts.isSerialNumber&&$index()==0)">' +
                                                  '<text data-bind="text:$root.tabelOpts.SerialNumberText"/>' +
                                            '</th>' +
		                                '<!-- ko with: headerText=="checkbox"||headerText=="radio" -->' +
		                                    '<th><input data-bind="attr:{type:$parent.headerText},enable:$parent.headerText!=\'radio\',checked: $root.checkAll"/></th>' +
		                                '<!-- /ko -->' +
		                                '<!-- ko with: headerText!="checkbox" && headerText!="radio" -->' +
		                                    '<th data-bind="text:$parent.headerText"></th>' +
		                                '<!-- /ko -->' +
		                        '</tr>' +
                            '</thead>' +
                             '<tbody>' +
                            '<tr><td data-bind="attr:{colspan:(columns().length+(tabelOpts.isSerialNumber?1:0))},visible:items()==0">暂无数据</td></tr>' +
                            '<!-- ko foreach: items -->' +
		                        '<tr data-bind="foreach: $parent.columns,click:$parent.clickToSelect">' +
                                    '<td data-bind="visible: ($root.tabelOpts.isSerialNumber&&$index()==0)">' +
                                            '<text data-bind="text: ($parentContext.$index()+($root.currentPage()>1?$root.currentPage()*10-9:$root.currentPage()))"/>' +
                                    '</td>' +
		                            '<!-- ko with: headerText=="checkbox"||headerText=="radio" -->' +
		                                    '<td><input data-bind="attr:{type:$parent.headerText,name:$parent.headerText==\'radio\'?\'koRadio\'+$root.treeOpts.random:\'koCheckbox\'+$root.treeOpts.random},value:$parents[1][$parent.rowText]"/></td>' +
		                            '<!-- /ko -->' +
		                            '<!-- ko with: headerText!="checkbox" && headerText!="radio" -->' +
		            	                '<!-- ko if: $index()==0 -->'+
					    	                '<td><span data-bind="visible:$root.tabelOpts.isTreeTable" class="collapse"></span><span data-bind="html:typeof $parent.rowText == \'function\' ? $parent.rowText($parents[1]) : $parents[1][$parent.rowText]"></span></td>' +    
					                    '<!-- /ko -->'+
		                                '<!-- ko if: $index()!=0 -->'+
					    	                '<td data-bind="html:typeof $parent.rowText == \'function\' ? $parent.rowText($parents[1]) : $parents[1][$parent.rowText]"></td>' +    
					                    '<!-- /ko -->'+
		                            '<!-- /ko -->' +
		                        '</tr>' +
		                        '<!-- ko component: {name: "td-childs",params: {data:$data,columns:$root.columns,isTreeTable:$root.tabelOpts.isTreeTable,index:1 }} -->'+
				                '<!-- /ko -->'+
		                    '<!-- /ko -->' +
                            '</tbody>' +
		                '</table>' +
		            '</div>' +
		        '</div>' +
		    '</div>' +
            '<!-- ko if:pageCount()!=0 -->' +
		        '<div class="row">' +
			        '<div class="col-sm-12">' +
				        '<nav aria-label="Page navigation">' +
					        '<ul class="pagination pagination-sm">' +
						        '<li>' +
							        '<a href="javascript:;" aria-label="Previous" data-bind="click:function(){$root.currentPage(1)}">' +
							        '<span aria-hidden="true">&laquo;</span>' +
							        '</a>' +
						        '</li>' +
						        '<!-- ko foreach: pages -->' +
						            '<li data-bind="css: { active: $data.page == $root.currentPage() }"><a href="javascript:;" data-bind="text: $data.page,click:$root.pageClick"></a></li>' +
						        '<!-- /ko -->' +
						        '<li>' +
							        '<a href="javascript:;" aria-label="Next" data-bind="click:function(){$root.currentPage($root.pageCount())}">' +
							        '<span aria-hidden="true">&raquo;</span>' +
							        '</a>' +
						        '</li>' +
					        '</ul>' +
				        '</nav>' +
			        '</div>' +
		        '</div>' +
            '<!-- /ko -->' +
        '</div>');
	ko.components.register('td-childs', {
	    viewModel: function(params) {
	        var self=this;
	        self.params=params;
	        self.childCss = ko.computed(function () {
	        	var key=_.findKey(params.data);
	            var keyValue=params.data[key];
	            return "hide tr_"+keyValue;
            }, this);
	    },
	    template: '<!-- ko foreach:params.data.childs -->'+
					'<tr data-bind="foreach: $component.params.columns,click:$root.clickToSelect,css:$component.childCss">' +
			            '<!-- ko with: headerText!="checkbox" && headerText!="radio" -->' +
			            	'<!-- ko if: $index()==0 -->'+
					    		'<td data-bind="style:{paddingLeft:($component.params.index*19)+\'px\'}"><span data-bind="visible:$component.params.isTreeTable" class="collapse"></span><span data-bind="html:typeof $parent.rowText == \'function\' ? $parent.rowText($parents[1]) : $parents[1][$parent.rowText]"></span></td>' +    
					    	'<!-- /ko -->'+
					    	'<!-- ko if: $index()!=0 -->'+
			                	'<td data-bind="html:typeof $parent.rowText == \'function\' ? $parent.rowText($parents[1]) : $parents[1][$parent.rowText]"></td>' +
			                 '<!-- /ko -->' +
			            '<!-- /ko -->' +
		        	'</tr>' +
		        	'<!-- ko component: {name: "td-childs",params: { data:$data,columns:$component.params.columns,isTreeTable:$component.params.isTreeTable,index:$component.params.index+1 }} -->'+
					'<!-- /ko -->'+
				'<!-- /ko -->'
	});
    ko.bindingHandlers.treeTable = {
        init: function (element, viewModelAccessor, allBindings, viewModel, bindingContext) {
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, viewModelAccessor, allBindings, viewModel, bindingContext) {
            $(element).empty();
            ko.cleanNode(element);
            var vma = viewModelAccessor();
            if (!vma.isTree) {
                var treeContainer = element.appendChild(document.createElement("div"));
                ko.renderTemplate("ko_jsTree", viewModelAccessor, { templateEngine: templateEngine }, treeContainer, "replaceNode");
                var random = vma.treeOpts.random;
                if (!vma.treeOpts.treeAdd) $("#ko_jsTreeAdd" + random, element).hide();
                if (!vma.treeOpts.treeEdit) $("#ko_jsTreeEdit" + random, element).hide();
                if (!vma.treeOpts.treeRemove) $("#ko_jsTreeRemove" + random, element).hide();
                $("#ko_jsTreeTitle" + random, element).html(vma.treeOpts.treeTitle);
                $("#ko_jsTreeAdd" + random, element).click(function () {
                    if ($.isFunction(vma.treeOpts.treeAdd)) vma.treeOpts.treeAdd();
                });
                $("#ko_jsTreeEdit" + random, element).click(function () {
                    if ($.isFunction(vma.treeOpts.treeEdit)) vma.treeOpts.treeEdit();
                });
                $("#ko_jsTreeRemove" + random, element).click(function () {
                    if ($.isFunction(vma.treeOpts.treeRemove)) vma.treeOpts.treeRemove();
                });
                var treeUrl = vma.treeOpts.treeUrl;
                if ($.isFunction(treeUrl)) {
                    treeUrl = treeUrl.call();
                }
                var data = (typeof (treeUrl) == "string") ? { 'url': treeUrl } : treeUrl;
                var tree = $("#ko_jsTree" + random, element).jstree({ 'core': { 'data': data } }).on('ready.jstree', function () {
                    if ($.isFunction(vma.treeOpts.ready)) vma.treeOpts.ready();
                });
                vma.jstree = function () {
                    return tree.jstree.call(tree);
                }
                vma.bindTreeChanged();
            }
            var tableContainer = element.appendChild(document.createElement("div"));
            ko.renderTemplate("ko_treeTable", viewModelAccessor, { templateEngine: templateEngine }, tableContainer, "replaceNode");
        }
    };
    return ko;
}));
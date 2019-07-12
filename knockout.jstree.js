(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "knockout"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"), require("knockout"));
    } else {
        factory(jQuery, ko);
    }
}(function ($, ko) {
    ko.jsTree = {
        viewModel: function (treeOptions) {
            var treeOpts = $.extend({}, { treeUrl: "", treeTitle: null, treeAdd: null, treeEdit: null, treeRemove: null, treeChanged: null, ready: null, random: Math.round(Math.random() * 100), wholerow: false, checkbox: false }, treeOptions || {});
            var self = this;
            self.treeOpts = treeOpts;
            self.isTitle = ko.observable(!self.treeOpts.treeTitle);
            self.getNode = function () {
                var jt = self.jstree(true);
                var ele = jt.get_selected();
                return jt.get_node(ele);
            };
            self.getParentNode = function () {
                var jt = self.jstree(true);
                var ele = jt.get_selected();
                var parentId = jt.get_parent(ele);
                return jt.get_node(parentId);
            };
            self.getNodes = function () {
                var jt = self.jstree(true);
                var nodes = jt.get_checked(true);
                return nodes;
            };
            self.getIds = function () {
                var jt = self.jstree(true);
                return jt.get_selected();
            };
            self.checkNode = function (ids) {
                var jt = self.jstree(true);
                $.each(ids, function (i, id) {
                    jt.check_node(id);
                });
            };
            self.plugins = function () {
                var p = [];
                if (self.treeOpts.wholerow) p.push("wholerow")
                if (self.treeOpts.checkbox) p.push("checkbox");
                return p;
            }
            self.changed = function (fn) {
                var jt = self.jstree(true);
                jt.element.on("changed.jstree", function (e, data) {
                    var current = data.instance.get_node(data.selected[0]);
                    if ($.isFunction(fn)) fn(current, data, jt);
                });
            };
            self.refresh = function () {
                var jt = self.jstree(true);
                jt.refresh();
            };
        }
    };
    var templateEngine = new ko.nativeTemplateEngine();
    templateEngine.addTemplate = function (templateName, templateMarkup) {
        $("head").append("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };
    templateEngine.addTemplate("ko_jstree", '<div class="panel panel-default">' +
		'<div class="panel-heading clearfix" data-bind="visible:!isTitle()">' +
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
		'</div>');
    ko.bindingHandlers.jsTree = {
        init: function (element, viewModelAccessor, allBindings, viewModel, bindingContext) {
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, viewModelAccessor, allBindings, viewModel, bindingContext) {
            $(element).empty();
            ko.cleanNode(element);
            var vma = viewModelAccessor();
            var treeContainer = element.appendChild(document.createElement("div"));
            ko.renderTemplate("ko_jstree", viewModelAccessor, { templateEngine: templateEngine }, treeContainer, "replaceNode");
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
            var data = typeof vma.treeOpts.treeUrl == "string" ? { 'url': vma.treeOpts.treeUrl } : vma.treeOpts.treeUrl;
            var tree = $("#ko_jsTree" + random, element).jstree({ 'plugins': vma.plugins(), 'core': { 'data': data } }).on('ready.jstree', function () {
                if ($.isFunction(vma.treeOpts.ready)) vma.treeOpts.ready();
            });
            vma.jstree = function () {
                return tree.jstree.call(tree);
            }
            vma.changed(vma.treeOpts.treeChanged);
        }
    };
    return ko;
}));

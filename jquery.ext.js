/*
* Author：Maizi
* Time：2017-8-25 14:39
* Description：jQuery基类扩展，提供Tools,Cookie类实现
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
}(function ($) {
    class ExtTools {
        static queryString(name) {
            let reg = new RegExp(name + "=([^&]*)");
            let r = window.location.search.substr(1).match(reg);
            if (r != null) return unescape(r[1]); return null;
        }
        static guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }
    class ExtCookie {
        constructor() {
            this.options = { json: false, raw: false }
        }
        encode(s) {
            return this.options.raw ? s : encodeURIComponent(s);
        }
        decode(s) {
            return this.options.raw ? s : decodeURIComponent(s);
        }
        stringifyCookieValue(value) {
            return this.encode(this.options.json ? JSON.stringify(value) : String(value));
        }
        parseCookieValue(s) {
            if (s.indexOf('"') === 0) {
                s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }
            try {
                s = decodeURIComponent(s.replace(/\+/g, ' '));
                return this.options.json ? JSON.parse(s) : s;
            } catch (e) { }
        }
        read(s, converter) {
            let value = this.options.raw ? s : this.parseCookieValue(s);
            return $.isFunction(converter) ? converter(value) : value;
        }
        cookie(key, value, options) {
            if (arguments.length > 1 && !$.isFunction(value)) {
                this.options = $.extend({}, this.options, options);
                if (typeof this.options.expires === 'number') {
                    let days = this.options.expires, t = this.options.expires = new Date();
                    t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
                }
                return (document.cookie = [
                    this.encode(key), '=', this.stringifyCookieValue(value),
                    this.options.expires ? '; expires=' + this.options.expires.toUTCString() : '',
                    this.options.path ? '; path=' + this.options.path : '',
                    this.options.domain ? '; domain=' + this.options.domain : '',
                    this.options.secure ? '; secure' : ''
                ].join(''));
            }
            let result = key ? undefined : {},
                cookies = document.cookie ? document.cookie.split('; ') : [],
                i = 0,
                l = cookies.length;
            for (; i < l; i++) {
                let parts = cookies[i].split('='),
                    name = this.decode(parts.shift()),
                    cookie = parts.join('=');
                if (key === name) {
                    result = this.read(cookie, value);
                    break;
                }
                if (!key && (cookie = this.read(cookie)) !== undefined) {
                    result[name] = cookie;
                }
            }
            return result;
        }
    }
    let xc = new ExtCookie();
    $.extend({
        queryString: function (name) { return ExtTools.queryString(name) },
        newid: function () { return ExtTools.guid(); },
        cookie: function (key, value, options) {
            if (key != undefined && value != undefined && options != undefined) {
                return xc.cookie(key, value, options);
            } else if (key != undefined && value != undefined) {
                return xc.cookie(key, value);
            } else {
                return xc.cookie(key);
            }
        },
        removeCookie: function (key, options) {
            $.cookie(key, '', $.extend({}, options, { expires: -1 }));
            return !$.cookie(key);
        }
    });
    return $;
}));
/*
* Author：Maizi
* Time：2017-8-25 14:38
* Description：Option动态控件 参考（Knockout）例子：<select data-ext="option" data-parms='{"url":"url地址或者json数组"}' data-bind="value:字段"></select>
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
}(function ($) {
    function Plugin(options) {
        return this.each(function () {
            var self = $(this);
            self.empty();
            self.options = $.extend({}, { optionsText: "text", optionsValue: "id", isDefault: true, placeholder: "--请选择--", defaultValue: null, isEnable: true, ready: null, response: null }, (!options ? self.data("parms") : options) || {});
            if (self.options.isDefault) {
                self.append("<option value=''>" + self.options.placeholder + "</option>");
            }
            var url = self.options.url;
            if ($.isFunction(url)) {
                url = url.call();
            }
            if (typeof url === "string") {
                $.getJSON(url, {}, function (items) {
                    if ($.isFunction(eval('(' + self.options.response + ')'))) {
                        items=eval('(' + self.options.response + ')').call(self,items);
                    }
                    setOption(items);
                });
            } else {
                setOption(url);
            }
            function setOption(items) {
                $.each(items, function (i, item) {
                    var s = (!!self.options.defaultValue ? self.options.defaultValue == item["id"] ? "selected=selected" : "" : "");
                    self.append("<option " + s + " value='" + item[self.options.optionsValue] + "'>" + item[self.options.optionsText] + "</option>");
                });
                if ($.isFunction(eval('(' + self.options.ready + ')'))) {
                    eval('(' + self.options.ready + ')').call();
                }
            }
            if (!self.options.isEnable) {
                self.prop("disabled", "disabled");
            }
        });
    }
    $.fn.extOption = Plugin;
    $(window).on('load.extOption', function () {
        $('[data-ext="option"]').each(function () {
            var $this = $(this);
            Plugin.call($this);
        });
    });
}));
/*
* Author：Maizi
* Time：2017-8-25 14:50
* Description：时间控件 参考（Knockout）例子： <input data-ext="time" data-bind="value:time" />
* 依赖：moment,daterangepicker js库
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
}(function ($) {
    function Plugin(options) {
        return this.each(function () {
            var self = $(this);
            self.options = $.extend({}, {
                locale: {
                    format: function () {
                        return self.options.format || "YYYY-MM-DD";
                    },
                    applyLabel: "确定",
                    cancelLabel: "取消",
                    daysOfWeek: ["日", "一", "二", "三", "四", "五", "六"],
                    monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
                },
                autoApply: true,
                singleDatePicker: true,
                autoUpdateInput: false,
                showDropdowns: true,
                timePicker: false,
                timePicker24Hour: true,
                timePickerSeconds: false
            }, (!options ? self.data("parms") : options) || {});
            self.daterangepicker(self.options, function (start, end, label) {
                var f = self.options.format || "YYYY-MM-DD";
                var time = self.options.singleDatePicker ? start.format(f) : start.format(f) + (self.options.splt || " - ") + end.format(f);
                self.val(time).change();
            });
        });
    }
    $.fn.extTime = Plugin;
    $(window).on('load.extTime', function () {
        $('[data-ext="time"]').each(function () {
            var $this = $(this);
            Plugin.call($this);
        });
    });
}));
/*
* Author：Maizi
* Time：2017-8-25 14:50
* Description：文本下拉树形框控件 参考（Knockout）例子：
* <input data-ext="tree" data-parms='{"data":{"url":"url地址或者json数组"}}' name="唯一标识" />
* <input type="hidden" data-bind="value:字段" id="唯一标识"/>
* 依赖：jsTree js库
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
}(function ($) {
    function jsTree(options, self) {
        this.input = self;
        this.options = options || self.data("parms");
        this.canvas();
        this.bindTree = false;
        this.createTree();
        this.bindEvent();
    }
    jsTree.prototype.canvas = function () {
        let sprite = "data:image/png;base64,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";
            sprite += "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";
        $("head").append("<style>.select-tree{display: inline-block;position: relative;}.select-tree input[readonly]{background-color:#fff;cursor: pointer;}.select-tree .select-tree-down{background: #fff;border: 1px solid #ddd;max-height:250px;overflow-y:auto;width: 100%; padding: 5px;}.select-tree .k-icon{display:block;position:absolute;top:15px;right:11px;background-image: url('" + sprite + "');border-color: transparent;background-position: 0 -32px;font-size:0;height:16px;width:16px;}</style>");
        this.input.attr("readonly", "readonly").wrap($('<div class="select-tree">'));
        this.treeObj = $("<div class='select-tree-down'>");
        this.input.after($("<div style='padding:0 10px;position: absolute; display: none;z-index:9999;min-width: 100%;margin-top:-5px;'>").append(this.treeObj));
        this.input.after('<span class="k-icon k-i-arrow-s"></span>');
    }
    jsTree.prototype.bindEvent = function () {
        var self = this;
        $(document).bind('mousedown', function (e) {
            var target = $(e.target);
            if (target.is(self.input) || target.parents().addBack().is(self.treeObj)) {
                if (!(target.parents().addBack().is(self.treeObj))) {
                    self.treeObj.parent().show();
                    self.bindTree = true;
                }
            } else if (self.bindTree) {
                self.bindTree = false;
                self.treeObj.parent().hide();
            }
        });
        var jt = self.treeObj.jstree(true);
        jt.element.on("changed.jstree", function (e, data) {
            var current = data.instance.get_node(data.selected[0]);
            if (!!current.id) {
                self.input.val(current.text);
                $("#" + self.input.attr("name")).val(current.id).change();
            }
        });
    }
    jsTree.prototype.createTree = function () {
        this.treeObj.jstree({
            'core': this.options,
            'plugins': [
                'types', 'wholerow'
            ]
        });
    }
    jsTree.prototype.default = function (id) {
        var self = this, jt = self.treeObj.jstree(true);
        jt.deselect_all();
        jt.select_node(id);
    }
    function Plugin(options, defaultValue) {
        return this.each(function () {
            var self = $(this);
            var data = self.data('ext.extTree');
            if (!data) self.data('ext.extTree', (data = new jsTree(options, self)));
            if (typeof options === 'string') data[options](defaultValue);
        });
    }
    $.fn.extTree = Plugin;
    $(window).on('load.extTree', function () {
        $('[data-ext="tree"]').each(function () {
            var $this = $(this);
            Plugin.call($this);
        });
    });
}));
/*
* Author：Maizi
* Time：2017-8-25 14:50
* Description：级联控件,基于城市三级联动 参考（Knockout）例子：
* <div data-ext="cascade" data-parms='{"key":"唯一标识"}'></div>
* <input type="hidden"  id="唯一标识" data-bind="value:字段">
* 依赖：underscore js库
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
}(function ($) {
    function City(options, self) {
        this.parentSelf = self;
        this.options = $.extend({}, { url: "", key: "", provinceTitle: "", cityTitle: "", districtTitle: "" }, !options ? self.data("parms") : options || {});
        this.init();
    }
    City.prototype = {
        init: function () {
            var self = this;
            self.create();
            var url = self.options.url;
            if ($.isFunction(url)) {
                url = url.call();
            }
            if (typeof (url) === "string") {
                $.getJSON(url, function (result) {
                    self.flag = true;
                    self.data = result;
                    self.bind();
                    self.reset();
                    self.flag = false;
                });
            } else {
                self.flag = true;
                self.data = url;
                self.bind();
                self.reset();
                self.flag = false;
            }
        },
        create: function () {
            this.parentSelf.empty();
            this.province = $("<select>");
            this.provinceTitle = $("<text>" + this.options.provinceTitle + "</text>");
            this.city = $("<select>");
            this.cityTitle = $("<text>" + this.options.cityTitle + "</text>");
            this.district = $("<select>");
            this.districtTitle = $("<text>" + this.options.districtTitle + "</text>");
            this.parentSelf.append(this.provinceTitle).append(this.province);
            this.parentSelf.append(this.cityTitle).append(this.city);
            this.parentSelf.append(this.districtTitle).append(this.district);
        },
        bind: function () {
            var self = this;
            self.province.on("change", function () {
                self.output(self.city);
                self.output(self.district);
                self.setValue();
            });
            self.city.on("change", function () {
                self.output(self.district);
                self.setValue();
            });
            self.district.on("change", function () {
                self.setValue();
            });
        },
        setValue: function () {
            var self = this;
            var v = self.province.find(':selected').val() + "_" + self.city.find(':selected').val() + "_" + self.district.find(':selected').val();
            $("#" + self.options.key).val(v).trigger("change");
        },
        setDefault: function () {
            var v = $("#" + this.options.key).val(), province = "", city = "", district = "";
            if (!!v) {
                var s = v.split('_');
                for (var i = 0; i < s.length; i++) {
                    if (i == 0) province = s[i]
                    if (i == 1) city = s[i]
                    if (i == 2) district = s[i]
                }
            }
            this.province.data("default", province);
            this.city.data("default", city);
            this.district.data("default", district);
            this.flag = true;
            this.reset();
            this.flag = false;
        },
        reset: function () {
            this.output(this.province);
            this.output(this.city);
            this.output(this.district);
        },
        setData: function (data) {
            var c = _.first(data);
            if (!c || c["id"] != "" && c["text"] != "--请选择--") {
                data.unshift({ "id": "", "text": "--请选择--", children: [] });
                return data;
            } else {
                return data;
            }
        },
        output: function (sl) {
            var self = this;
            var items = "", id = "";
            sl.empty();
            switch (sl) {
                case self.province:
                    items = self.setData(self.data);
                    break;
                case self.city:
                    id = self.province.find(':selected').val();
                    items = _.findWhere(self.data, { "id": id });
                    items = self.items = self.setData(items.children);
                    break;
                case self.district:
                    id = self.city.find(':selected').val();
                    items = _.findWhere(self.items, { "id": id });
                    items = self.setData(items.children);
                    break;
            }
            var defaultValue = sl.data("default");
            $.each(items, function (i, item) {
                var s = (self.flag ? !!defaultValue ? defaultValue == item["id"] ? "selected=selected" : "" : "" : "");
                sl.append("<option " + s + " value='" + item["id"] + "'>" + item["text"] + "</option>");
            });
        }
    }
    function Plugin(options) {
        var self = $(this);
        var data = self.data('ext.extCascade')
        if (!data) self.data('ext.extCascade', (data = new City(options, self)));
        if (typeof options === 'string') data[options]();
    }
    $.fn.extCascade = Plugin;
    $(window).on('load.extCascade', function () {
        $('[data-ext="cascade"]').each(function () {
            var $this = $(this);
            Plugin.call($this);
        });
    });
    }));
window.baseUrl = {
    app: "http://localhost:6101",//App应用网关
    common: "http://localhost:6102",//通用网关
    platform: "http://localhost:6103"//后台网关
}

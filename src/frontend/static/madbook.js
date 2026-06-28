$.cl = {
    ERROR_CODE_PROMPT: 4000,
    ERROR_CODE_AUTH: 4001,
    ERROR_CODE_PARAM: 4002,
    ERROR_CODE_INTERNAL:  5000,
    popupMessage: function (msg, title, timeout){
        timeout = timeout || 3000;
        let dom = $(".cl-prompt");

        if(dom.is(":visible")){
            $.cl.clearMessage();
            setTimeout(function(){$.cl.popupMessage(msg, title, timeout)}, 200);
        }else{
            let boxId = dom.data("boxId");
            if(boxId !== undefined){
                clearTimeout(boxId);
            }
            boxId = setTimeout($.cl.clearMessage, timeout)
            $("#cl-prompt-title").html(title || "提示");
            $("#cl-prompt-content").html(msg);
            dom.data("boxId", boxId).show();
        }
    },
    clearMessage: function (){
        let dom = $(".cl-prompt");
        let boxId = dom.data("boxId");

        if (boxId !== undefined) {
            clearTimeout(boxId);
            dom.data("boxId", undefined);
        }
        dom.hide();
    },
    popupConfirm: function (msg, callback, cancelback, title){
        $("#cl-confirm-title").html(title || "提示");
        $("#cl-confirm-body").html(msg);
        $("#cl-confirm-cnf-btn").off("click").click(function(){
            $("#cl-confirm").modal("hide");
            try{
                callback();
            }catch (e){}
        });
        $("#cl-confirm-ccl-btn").css({"display": cancelback === false ? "none" : "initial"}).off("click").click(function(){
            $("#cl-confirm").modal("hide");
            try{
                cancelback();
            }catch (e){}
        });
        $("#cl-confirm").modal("show");
    },
    sendRequest: function (url, type, json, callback, fallback){
        fallback = fallback || function(){$.cl.popupMessage("操作失败!")};
        let req = {
            url: url,
            type: type || "get",
            success: function (data){
                if (data.err_code === $.cl.ERROR_CODE_AUTH) {
                    $.cl.renderLoginPage();
                    return;
                } else if (data.err_code === $.cl.ERROR_CODE_INTERNAL) {
                    $.cl.popupMessage("远程服务器错误，请稍后再试")
                    return;
                } else if (data.err_code === $.cl.ERROR_CODE_PARAM) {
                    $.cl.popupMessage("请求参数错误")
                    return;
                } else if (data.err_code === $.cl.ERROR_CODE_PROMPT) {
                    $.cl.popupMessage(data.msg)
                    return;
                }
                callback(data);
            },
            error: function (data) {
                fallback(data);
            }
        };
        if (json !== undefined) {
            req["data"] = JSON.stringify(json);
            req["contentType"] = "application/json";
            req["dataType"] = "json";
        }
        $.ajax(req);
    },
    localStorageSet: function (k, v) {
        let existed;
        try{
            existed = JSON.parse(window.localStorage.getItem("default"));
        }catch (e){}
        existed = existed || {};
        existed[k] = v
        window.localStorage.setItem("default", JSON.stringify(existed));
    },
    localStorageGet: function (k) {
        let existed;
        try{
            existed = window.localStorage.getItem("default");
        }catch (e){}
        existed = JSON.parse(existed || "{}");
        return existed[k];
    },
    renderMenu: function (option){
        option = option || {
            title: "选择",
            list: [{
                icon: "",
                text: "创建"
            }],
            callback: function (i) {
                console.log("index: ", i);
            }
        };

        $(".flow-list-title").html(option.title || "选择");
        let dom = [],
            list = option.list || [];
        for (let i = 0; i < list.length; i++){
            let item = list[i];
            dom.push(
                '<div class="flow-list-item" data-index="' + i + '">' +
                '<span class="fl-icon">' + (item.icon || "") + '</span>' +
                '<span class="fl-text">' + item.text + '</span></div>'
            )
        }
        $(".flow-list-body").html(dom.join(""))
        // bind
        $(".flow-list-item").off("click").click(function (){
            $(".flow-list").modal("hide");
            let index = $(this).data("index");
            return option.callback(index);
        });
        $(".flow-list").modal("show");
    },
    hideMenu: function () {$(".flow-list").modal("hide")},
    renderLoginPage: function (){
        $.cl.releasePageResource();
        let loginSwitch = $("#reg-login-switch");

        function _switchLoginRegUI(){
            let status = loginSwitch.data("status") || "login";
            if (status === "login"){
                loginSwitch.data("status", "reg").html("切换登录")
                $(".reg-input-group").show();
            } else {
                loginSwitch.data("status", "login").html("切换登录")
                $(".reg-input-group").hide();
            }
        }
        function _loginOrReg(){
            let username = $("input[name=username]").val(),
                password = $("input[name=password]").val(),
                reg_code = $("input[name=reg_code]").val();

            let status = loginSwitch.data("status") || "login",
                json = {"username": username, "password": password},
                url = "/madbook/api/auth/login";

            if (status === "reg") {
                if ($("input[name=password2]").val() !== password) {
                    $.cl.popupMessage("两次密码不一致");
                    return ;
                }
                url = "/madbook/api/auth/reg";
                json["reg_key"] = reg_code
            }

            $.cl.sendRequest(url, "post", json, function (data) {
                if (data.err_code !== 0) {
                    $.cl.popupMessage(data.msg);
                    return;
                }
                $.cl.releasePageResource();
                $(".footer-selected").removeClass("footer-selected");
                $(".footer-unit").eq(0).trigger("click");
            });
        }
        $("#login-submit").off("click").click(_loginOrReg);
        loginSwitch.off("click").click(_switchLoginRegUI);
        $("#login").show();
    },
    releasePageResource: function (){
        let pages = (
            "#login, #app-card-home, #app-card-statistic, #app-card-bill, #app-card-me, #app-footer, " +
            ".create-bill-page, .calendar-page"
        );
        $(pages).hide();
    },
    showAmountPointer: function () {
        let dom = $(".amount-display-pointer");
        let interval = dom.data("interval"),
            ticker = dom.data("ticker") || 0;
        if (interval !== undefined) return ;

        interval = setInterval(function () {
            if (ticker === 0){
                dom.data("ticker", 1).css({"border-left": "2px solid #006192"})
            } else {
                dom.data("ticker", 0).css({"border-left": "2px solid #fafafa"})
            }
        }, 800);
        dom.data("interval", interval);
    },
    hideAmountPointer: function () {
        let dom = $(".amount-display-pointer");
        let interval = dom.data("interval");
        if (interval !== undefined){
            clearInterval(interval);
            dom.data("interval", undefined);
        }
    },
    iconMap: {
        0: "utensils",
        1: "cookie-bite",
        2: "building",
        3: "traffic-light",
        4: "glass-cheers",
        5: "umbrella-beach",
        6: "book-reader",
        7: "car",
        8: "faucet",
        9: "baby",
        10: "stethoscope",
        11: "bath",
        12: "gift",
        13: "tshirt",
        14: "camera-retro",
        15: "couch",
        16: "star-of-david",
        17: "fish",
        18: "lightbulb",
        19: "globe",
        20: "archive",
        21: "cart-arrow-down",
        22: "mug-hot",
        23: "mobile-alt",
        24: "dumbbell",
        1000: "money-bill-alt",
        1001: "award",
        1002: "user-minus",
        1003: "user-plus",
        1004: "funnel-dollar",
        1005: "file-invoice-dollar",
        1006: "recycle",
        1007: "chart-line",
        1008: "redo-alt",
        1009: "wallet",
    },
    userCategories: {
        "expenditure": [],
        "income": []
    },
    userBooks: [],
    userAccounts: [],
    formatDateTime: function (date, useDate) {
        date = date || new Date();
        let month = date.getMonth() + 1,
            day = date.getDate(),
            hour = useDate === true ? 0 : date.getHours(),
            minute = useDate === true ? 0 : date.getMinutes(),
            second = useDate === true ? 0 : date.getSeconds();

        month = month < 10 ? ("0" + month) : month;
        day = day < 10 ? ("0" + day) : day;
        hour = hour < 10 ? '0' + hour : hour;
        minute = minute < 10 ? '0' + minute : minute;
        second = second < 10 ? '0' + second : second;

        let returnDat = "" + date.getFullYear() + '-' + month + '-' + day;
        return returnDat + " " + hour + ":" + minute + ":" + second;
    },
    formatAmountStr: function(number) {
        if (number < 1000 * 10000) {
            return (number / 1000).toFixed(2);
        } else if (number < 1000 * 100000000) {
            return (number / 1000 / 10000).toFixed(2) + "万";
        } else {
            return (number / 1000 / 100000000).toFixed(2) + "亿";
        }
    },
    __gpAmountStr: function (v) {
        v /= 1000;
        if (v >= 100000000) {
            return (v / 100000000).toFixed(2) + "亿";
        } else if (v >= 10000) {
            return (v / 10000).toFixed(2) + "万";
        } else {
            return v.toFixed(2)
        }
    },
    submitBill: function (billId, callback) {
        let amount = parseInt(($(".amount-display").data("result") || 0) * 1000);
        if (amount <= 0) {
            $.cl.popupMessage("数额必须大于0");
            return
        }

        let req_json = {
            "amount": amount,
            "extra": $("input[name=bill-extra]").val(),
            "expenditure": $(".bill-type-selected").data("bill-type") === "expenditure",
            "book": $(".book-name").data("bid"),
            "account": $(".account-name").data("acid"),
            "category": $(".cat-item-selected").data("cat_id"),
            "create_time": $.cl.formatDateTime($(".date-prompt").data("date")),
        },
        url = "/madbook/api/bill";
        if (billId !== undefined){req_json["bill_id"] = billId}
        $.cl.sendRequest(url, "post", req_json, callback);
    },
    // 渲染键盘
    showKeyBoard: function () {
        $.cl.showAmountPointer();
        $(".create-bill-keyboard").show();
    },
    hideKeyBoard: function () {
        let dom = $(".create-bill-keyboard");
        if (!dom.is(":visible")) return;

        $.cl.flushKeyBoardInputCache();
        $.cl.hideAmountPointer();
        dom.hide();
    },
    toggleKeyBoard: function () {
        $(".create-bill-keyboard").is(":visible") ? $.cl.hideKeyBoard() : $.cl.showKeyBoard();
    },
    renderAmountText: function () {
        let cacheList = $(".amount-display").data("cacheList") || "";

        let html = '<span class="amount-display-main">0.</span><span class="amount-display-sub">00</span>';
        if (cacheList.length > 0) {
            let ss = "i", domList = [], tmp = "";
            for (let i = 0; i < cacheList.length; i ++) {
                let c = cacheList[i];
                if (c === "+" || c === "-") {
                    let className = ss === "i" ? "amount-display-main" : "amount-display-sub";
                    domList.push('<span class="' + className + '">' + tmp + '</span>')
                    domList.push('<span class="amount-display-main">' + c + '</span>')
                    ss = "i";
                    tmp = "";
                } else if (c === ".") {
                    domList.push('<span class="amount-display-main">' + tmp + '.</span>')
                    tmp = "";
                    ss = "f";
                } else {
                    tmp += c;
                }
            }
            if (tmp.length > 0) {
                let className = ss === "i" ? "amount-display-main" : "amount-display-sub";
                domList.push('<span class="' + className + '">' + tmp + '</span>')
            }
            html = domList.join("");
        }
        $(".amount-inner").html(html);
    },
    flushKeyBoardInputCache: function () {
        let amDOM = $(".amount-display");
        let cacheList = amDOM.data("cacheList"),
            result = amDOM.data("result");

        let exec = cacheList;
        if (cacheList.length <= 0) return;

        if ("+-.".indexOf(exec[exec.length - 1]) > -1){
            exec += "0";
        }
        let value = "" + eval(exec),
            returnDat = value === result;
        // 去除超长的小数
        if (value.indexOf(".") > -1) {
            let newV = value.split(".");
            newV[1] = newV[1].slice(0, 4);
            value = newV.join(".")
        }
        amDOM.data("cacheList", value).data("result", value);
        $.cl.renderAmountText();
        return returnDat; // true 代表没有内容更新
    },
    keyBoardGetStatus: function (newCond) {
        // return status: i(int), d(dot), f(float), s(sign)
        let status = "i";
        for (let i = 0; i < newCond.length; i++){
            let c = newCond[i];
            if (c === "."){
                status = "d"
            } else if (c === "+" || c === "-") {
                status = "s"
            } else {
                status = "df".indexOf(status) > -1 ? "f" : "i";
            }
        }
        return status
    },
    keyBoardPopCache: function (cache) {
        if (cache.length === 0) return "";
        let li = cache.split("");
        li.pop()
        return li.join("");
    },
    onKeyBoardClicked: function () {
        let k = $(this).data("k"),
            amDOM = $(".amount-display");
        let cacheList = amDOM.data("cacheList");
        let status = $.cl.keyBoardGetStatus(cacheList);  // status: i(int), d(dot), f(float), s(sign)

        if (k === "enter") {
            if(status === "d" || status === "s") {
                cacheList = $.cl.keyBoardPopCache(cacheList);
            }
            let simple = cacheList.indexOf("+") < 0 && cacheList.indexOf("-") < 0;
            if ($.cl.flushKeyBoardInputCache() === true || cacheList.length === 0 || simple) {
                $.cl.hideKeyBoard();
            }
            return;
        } else if (k === "backspace") {
            if (cacheList.length <= 0) return;
            cacheList = $.cl.keyBoardPopCache(cacheList);
        } else if (k === ".") {
            if (status !== "i") return;
            cacheList += k;
        } else if (k === "+" || k === "-") {
            if (cacheList.length > 0) {
                let lastChar = cacheList[cacheList.length - 1];
                if (lastChar === "+" || lastChar === "-" || lastChar === ".") {
                    cacheList = $.cl.keyBoardPopCache(cacheList)
                }
            }
            cacheList += k
        } else {
            cacheList += k;
        }
        amDOM.data("cacheList", cacheList);
        // render
        $.cl.renderAmountText();
        amDOM.scrollLeft(1000);
    },
    initKeyBoard: function () {
        $(".key-item").off("click").click($.cl.onKeyBoardClicked);
    },
    // 渲染页面
    renderDateSel: function (date) {
        let year = date.getFullYear(),
            month = date.getMonth(),
            day = date.getDate(),
            current = new Date(),
            html = "";

        if (year === current.getFullYear()){
            if (month === current.getMonth() && day === current.getDate()) {
                html = "今天";
            } else {
                html = "" + (month + 1) + "月" + day + "日";
            }
        } else {
            html = "" + year + "年" + (month + 1) + "月" + day + "日";
        }
        $(".date-prompt").data("date", date).html(html);
    },
    renderCreatBillCategories: function() {
        let catType = $(".bill-type-selected").data("bill-type"),
            groupDom = $(".category-group");
        console.log("catType: ", catType);

        let userCat = $.cl.userCategories[catType],
            category = groupDom.data("category"),
            cats = [];
        console.log("category: ", category);

        for (let i = 0; i < userCat.length; i++) {
            let cat = userCat[i];
            if (cat.is_deleted === true) {
                continue;
            }
            let catName = cat.name + (cat.sub ? ("-" + cat.sub) : "");
            let iconName = $.cl.iconMap[cat.icon] || "",
                catClass = cat.id === category ? "cat-item cat-item-selected" : "cat-item";
            cats.push(
                '<div class="' + catClass + '" data-cat_id="' + cat.id + '">' +
                '<div class="cat-icon">' +
                    '<i class="fa fa-' + iconName + '" aria-hidden="true"></i>' +
                '</div>' +
                "<div class='cat-name'>" + catName + "</div>" +
                "</div>"
            )
        }
        cats.push(
            "<div class='cat-item' data-cat_id='-1'>" +
            '<div class="cat-icon cat-icon-settings"><i class="fas fa-tools"></i></div>' +
            "<div class='cat-name'>设置</div>" +
            "</div>"
        )
        groupDom.html(cats.join(""));
        $(".cat-item").off("click").click(function () {
            let catId = parseInt($(this).data("cat_id"));
            if (catId === -1){
                $(".ex-type-selected").removeClass("ex-type-selected");
                console.log("renderCatsManagePage catType: ", catType);
                $(".ex-type").eq(catType === "expenditure" ? 0 : 1).addClass("ex-type-selected");
                $.cl.renderCatsManagePage();
                return
            }
            $(".cat-item-selected").removeClass("cat-item-selected");
            $(this).addClass("cat-item-selected");
        });
    },
    renderBookSelBtnForSubPage: function(reRenderCb) {
        // 1. 子页面初始化时，调用此函数。包括主页，账单页，统计页。
        //      此时已通过网络请求获取到user的账本信息，读取本地存储，将选中的账本渲染；当选择新账本时，也同步写入本地存储；
        // 2. 设定被点击时，拉起账本选择器，设定回调为"重渲染整个子页"

        function writeBookName(){
            let selectedBookId = $.cl.localStorageGet("defaultBookId");
            let displayName = "全部账本";
            if (selectedBookId !== undefined && selectedBookId >= 0 && selectedBookId < $.cl.userBooks.length){
                for (let i = 0; i < $.cl.userBooks.length; i++){
                    if ($.cl.userBooks[i].id === selectedBookId) {
                        displayName = $.cl.userBooks[i].name;
                    }
                }
            } else {
                $.cl.localStorageSet("defaultBookId", undefined);
            }
            $(".book-sel-name").html(displayName);
        }

        function onNewBookSelected(selected) {
            // 当默认账本被选中时，调用此回调。
            // 包含"全部"账本时，b.id 为 -2。
            let bookId = (selected.id !== null && selected.id !== undefined && selected.id >= 0) ? selected.id : -1;
            $.cl.localStorageSet("defaultBookId", bookId);
            reRenderCb();
            writeBookName();
        }

        writeBookName();
        $(".book-sel, .book-item").off("click").click(function () {$.cl.selBook(onNewBookSelected, true)});
    },
    renderCreatBillPage: function (data, reRenderCB) {
        data = data || {};
        reRenderCB = reRenderCB || function () {};
        let billId = data.id,
            isExpenditure = data.is_expenditure === undefined ? true : data.is_expenditure,
            account = data.account || 0,
            book = data.book || 0,
            amount = data.amount || "0",  // string type
            category = data.category || 0,
            date = data.date || new Date(),
            extra = data.extra || "";

        $(".category-group").data("category", category);

        // === 渲染创建账单页的账本选择器 ===
        // 1. 先查找出选中的账本，若无则使用默认的。下述是用于编辑已存在的账单的场景。
        let bookNameDOM = $(".book-name");
        let selected = $.cl.userBooks[0];
        for (let i = 0; i < $.cl.userBooks.length; i++) {
            let thisBk = $.cl.userBooks[i];
            if (thisBk.id === book) {
                selected = thisBk;
                break;
            }
        }
        // 2. 渲染，并设置回调
        function renderBookNameAfterSelected(bookObj) {
            bookNameDOM.data("bid", bookObj.id).html('<i class="fa fa-book" aria-hidden="true"></i> ' + bookObj.name);
        }
        renderBookNameAfterSelected(selected);
        $(".book-item").off("click").click(function (){$.cl.hideKeyBoard(); $.cl.selBook(renderBookNameAfterSelected)});
        // === end ===

        // split cacheList, set status, set result, render
        let cacheList = amount === "0" ? "" : amount;
        $(".amount-display").off("click").click($.cl.toggleKeyBoard).data("cacheList", cacheList).data("result", amount);
        $.cl.renderAmountText();  // 初始化数额显示界面
        $.cl.showKeyBoard();

        // 渲染类别
        $(".bill-type").off("click").click(function (){
            $(".bill-type-selected").removeClass("bill-type-selected");
            $(this).addClass("bill-type-selected");
            $.cl.renderCreatBillCategories();
        }).eq(isExpenditure ? 0 : 1).trigger("click");

        // 渲染账户
        let ac = {};
        for (let i = 0; i < $.cl.userAccounts.length; i++){
            let thisAc = $.cl.userAccounts[i];
            if(thisAc.id === account){
                ac = thisAc;
                break;
            }
        }
        $(".account-name").data("acid", ac.id).html(ac.name);
        $(".account-switch").off("click").click(function (){
            $.cl.hideKeyBoard();
            // $.cl.selAccount();
            // $.cl.popupConfirm("多账户功能正在开发中，敬请期待。")
        });

        // 渲染日期
        $.cl.renderDateSel(date);
        $(".date-text").off("click").click(function () {
            $.cl.hideKeyBoard();
            $.cl.showCalendar(date, $.cl.renderDateSel);
        });

        // 渲染extra
        $("input[name=bill-extra]").val(extra);
        $(".extra-input-wrapper").off("click").click($.cl.hideKeyBoard);

        // 设置回退事件
        function _exitThisPage(){
            $(".modal").modal("hide");
            $.cl.triggerFooterBtn();
            $.cl.onBack = undefined;
        }
        $.cl.onBack = _exitThisPage;

        let action = billId === undefined ? "创建" : "更新";
        $(".exit-create-bill").off("click").click(_exitThisPage);
        $(".bill-submit-btn").html(action + "账单").off("click").click(function () {
            function _callback(response) {
                if (response.err_code === 0) {
                    $.cl.popupMessage("账单" + action + "成功！");
                    $.cl.triggerFooterBtn();
                } else {
                    $.cl.popupMessage("账单" + action + "失败！");
                }
                // 编辑后调用回调函数，重渲染列表
                reRenderCB();
            }
            $.cl.hideKeyBoard(); $.cl.submitBill(billId, _callback);
        });
        function _delBill(){
            $.cl.sendRequest(
                "/madbook/api/bill/" + billId,
                "delete",
                undefined,
                function () {
                    // 编辑后调用回调函数，重渲染列表
                    reRenderCB();

                    $.cl.popupMessage("删除成功！");
                    $.cl.triggerFooterBtn();
                }
            );
        }
        if (billId !== undefined){
            $(".delete-bill").off("click").click(function (){
                $.cl.hideKeyBoard();
                $.cl.popupConfirm("确定要删除此账单吗？", _delBill)
            }).show();
        }

        // 显示
        $.cl.releasePageResource();
        $(".create-bill-page").show();
    },
    renderCatDetailPage: function (cat) {
        cat = cat || {};
        console.log("renderCatDetailPage cat: ", cat)

        let pageDom = $(".category-edit"),
            inputDom = $("input[name=cat-name]"),
            iconGroupDom = $(".cat-edit-icon-group"),
            originBack = $.cl.onBack;
        let iconStyle = cat.is_expenditure ? "cat-icon-ex" : "cat-icon-in";

        function _exitCatDetail(){
            $.cl.renderCreatBillCategories();
            pageDom.hide();
            $.cl.onBack = originBack;
        }
        $.cl.onBack = _exitCatDetail;
        $(".exit-cat-edit").off("click").click(_exitCatDetail);

        function _updateOrCreateCat() {
            let catName = inputDom.val(),
                sel = iconGroupDom.find("." + iconStyle).data("icon"),
                url, method, json;
            if (sel === undefined) {
                $.cl.popupMessage("请选择一个图标！")
                return;
            }
            if  (catName.length < 1){
                $.cl.popupMessage("请输入分类名！")
                return;
            }
            json = {name: catName, icon: sel, is_deleted: false, is_expenditure: cat.is_expenditure};
            if (cat.id !== undefined) {
                // update
                url = "/madbook/api/category/" + cat.id;
                method = "put";
            } else {
                url = "/madbook/api/category"
                method = "post"
            }
            $.cl.sendRequest(url, method, json, function (response) {
                let data = response.data;
                $.cl.userCategories.expenditure = data.expenditure_cats;
                $.cl.userCategories.income = data.income_cats;
                _exitCatDetail();
                $.cl.popupMessage("分类\"" + catName + "\"" + (cat.id !== undefined ? "更新" : "创建") + "成功", undefined, 2000);
                $.cl.renderCatsManagePage();
            })
        }

        // render input
        inputDom.val(cat.name === undefined ? "" : cat.name);

        // render icon
        let dom = [];
        for (let iconId in $.cl.iconMap) {
            iconId = parseInt(iconId)
            let iconName = $.cl.iconMap[iconId],
                sle = iconId === cat.icon ? iconStyle : "";
            dom.push(
                '<div class="cat-edit-icon-wrap">' +
                '<i class="fa fa-' + iconName + ' ' + sle + '" data-icon="' + iconId + '" aria-hidden="true"></i>' +
                '</div>'
            )
        }
        iconGroupDom.html(dom.join(""));
        $(".cat-edit-icon-wrap i").off("click").click(function () {
            $("." + iconStyle).removeClass(iconStyle);
            $(this).addClass(iconStyle);
        })
        $(".cat-edit-save").off("click").click(_updateOrCreateCat);
        pageDom.show();
    },
    renderCatsManagePage: function () {
        let pageDom = $(".category-manage"),
            saveBtnDom = $(".save-btn"),
            originBack = $.cl.onBack;

        function _saveCatsOrder() {
            let ds = $(".cat-mgr-item"),
                li = [];
            for (let i = 0; i < ds.length; i++) li.push(ds.eq(i).data("cat-id"));
            let json = {cat_id_list: li, is_expenditure: parseInt($(".ex-type-selected").data("ex")) === 0}
            $.cl.sendRequest("/madbook/api/category/sort", "post", json, function (response) {
                $.cl.userCategories.expenditure = response.data.expenditure_cats;
                $.cl.userCategories.income = response.data.income_cats;
                $(".save-btn").hide();
            })
        }
        saveBtnDom.off("click").click(_saveCatsOrder);

        // set back event
        function _exitCatsManage() {
            let innerExit = function () {
                // render category
                pageDom.hide();
                saveBtnDom.hide();
                $.cl.hideMenu();
                $.cl.renderCreatBillCategories();
                $.cl.onBack = originBack;
            }

            // check
            if(saveBtnDom.is(":visible")) {
                $.cl.popupConfirm("顺序已改变，保存现在的顺序吗？", _saveCatsOrder, innerExit);
            } else {
                innerExit();
            }
        }
        $.cl.onBack = _exitCatsManage;
        $(".exit-category-manage").off("click").click(_exitCatsManage);

        function _renderCatsList(){
            let cats = [],
                exType = parseInt($(".ex-type-selected").data("ex"));
            let exKey = exType === 0 ? "expenditure" : "income";
            let mgrList = $.cl.userCategories[exKey];
            for (let i = 0; i < mgrList.length; i++){
                let c = mgrList[i];
                let iconName = $.cl.iconMap[c.icon] || "",
                    iconStyle = exType === 0 ? "cat-icon-ex" : "cat-icon-in",
                    mvBtn = '<div class="cat-mgr-btn" data-bt="0"><i class="fas fa-sort-up"></i></div><div class="cat-mgr-btn" data-bt="1"><i class="fas fa-sort-down"></i></div>';
                if(c.is_deleted === true){
                    iconStyle = "";
                    mvBtn = "";
                }
                cats.push(
                    '<div class="cat-mgr-item" data-cat-id="' + c.id + '">' +
                    '<div class="cat-mgr-icon ' + iconStyle + '">' +
                    '<i class="fa fa-' + iconName + '" aria-hidden="true"></i>' +
                    '</div>' +
                    '<div class="cat-mgr-name">' + c.name + '</div>' +
                    '<span class="cat-mgr-btn-group" data-cat_index="' + i + '">' + mvBtn +
                    '<div class="cat-mgr-btn" data-bt="2"><i class="fa fa-ellipsis-v" aria-hidden="true"></i></div>' +
                    '</span>' +
                    '<div class="cat-mgr-item-border"></div></div>'
                )
            }
            $(".cat-manage-list").html(cats.join(""));
            $(".cat-mgr-btn").off("click").click(function () {
                let catIndex = $(this).parent().data("cat_index"),
                    btnId = parseInt($(this).data("bt"));
                let cat = mgrList[catIndex];
                if (btnId === 0) {
                    // move up
                    let parentsDiv = $(this).parents(".cat-mgr-item");
                    let prev = parentsDiv.prev();
                    if(prev.html() === undefined) return;
                    prev.fadeOut(150, function(){$(this).before(parentsDiv)}).fadeIn();
                    saveBtnDom.show();
                } else if (btnId === 1) {
                    // move down
                    let parentsDiv = $(this).parents(".cat-mgr-item");
					let next = parentsDiv.next();
					if(next.html() === undefined) return;
                    next.fadeOut(150, function(){$(this).after(parentsDiv)}).fadeIn();

                    saveBtnDom.show();
                } else {
                    let menuList = cat.is_deleted
                        ? [{icon: "", text: "编辑并启用"}]
                        : [{icon: "", text: "编辑"}, {icon: "", text: "删除"}];
                    $.cl.renderMenu({
                        title: "分类: " + cat.name,
                        list: menuList,
                        callback: function (i) {
                            if (i === 0) {
                                $.cl.renderCatDetailPage(cat);
                            } else {
                                let msg = "确定要删除分类\"" + cat.name + "\"吗？<br/><br/>" +
                                    "若此分类下存在账单，则不会删除，而是会放置在列表尾部。你可以再次编辑来启用它。",
                                    json = {is_expenditure: cat.is_expenditure};
                                $.cl.popupConfirm(msg, function (){
                                    $.cl.sendRequest("/madbook/api/category/" + cat.id, "delete", json, function (response) {
                                        let data = response.data;
                                        $.cl.userCategories.expenditure = data.expenditure_cats;
                                        $.cl.userCategories.income = data.income_cats;
                                        let action = data.is_deleted ? "删除" : "置底";
                                        $.cl.popupMessage("分类\"" + cat.name + "\"已" + action, undefined, 2000);
                                        _renderCatsList();
                                    });
                                });
                            }
                        }
                    });
                }
            });
            $(".cat-add-btn").off("click").click(function (){
                $.cl.renderCatDetailPage({is_expenditure: exType === 0});
            })
        }

        $(".ex-type").off("click").click(function (){
            $(".ex-type-selected").removeClass("ex-type-selected");
            $(this).addClass("ex-type-selected");
            _renderCatsList()
        });

        _renderCatsList();
        pageDom.show();
    },
    renderBillList: function (option, reRenderCB) {
        reRenderCB = reRenderCB || function () {};
        option = option || {};
        let DOM = option.DOM,
            bills = option.bills,
            cb = option.cb,
            renderWeek = option.renderWeek === undefined ? true : option.renderWeek,
            loadMore = option.loadMore || {};

        // render list
        let DOMs = [],
            group = undefined,
            catMap = {"expenditure": {}, "income": {}},
            billDataMap = {},
            timestamp = new Date().getTime();
        let itemClass = "bill-list-" + timestamp;

        function _genListHtml(itemList){
            let htmlList = [];
            for (let i = 0; i < $.cl.userCategories.expenditure.length; i++){
                let cat = $.cl.userCategories.expenditure[i];
                catMap.expenditure[cat.id] = cat;
            }
            for (let i = 0; i < $.cl.userCategories.income.length; i++){
                let cat = $.cl.userCategories.income[i];
                catMap.income[cat.id] = cat;
            }
            for (let i = 0; i < itemList.length; i++){
                let bill = itemList[i];

                let date = new Date(bill.create_time),
                    billId = (bill._id || bill.id);
                let weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
                let newGroup = "" + date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日  星期" + weekday;
                if (renderWeek && newGroup !== group) {
                    group = newGroup;
                    htmlList.push('<div class="hb-group">' + newGroup + '</div>');
                }
                let key = bill.is_expenditure ? "expenditure" : "income";
                let cat = catMap[key][bill.category];
                let iconName = $.cl.iconMap[cat.icon] || "",
                    catName = cat.name;

                htmlList.push(
                    '<div class="hb-item ' + itemClass + '" data-bill-id="' + billId + '">' +
                    '<div class="hb-icon"><i class="fa fa-' + iconName + ' fa-fw"></i></div>' +
                    '<div class="hb-detail">' +
                    '<div class="hb-cat">' + catName + '</div>' +
                    '<span class="hb-extra">' + bill.extra + '</span>' +
                    '<div class="hb-amount">￥' + $.cl.formatAmountStr(bill.amount) + '</div>' +
                    '</div>' +
                    '</div>'
                )
                billDataMap[billId] = {
                    id: billId,
                    is_expenditure: bill.is_expenditure,
                    account: bill.account,
                    book: bill.book,
                    amount: (bill.amount / 1000).toFixed(2),
                    category: bill.category,
                    date: new Date(bill.create_time),
                    extra: bill.extra,
                }
            }
            return htmlList;
        }
        function _loadMoreCallBack() {
            let lm = DOM.data("loadMore");
            let newUrl = lm.url + "&page=" + (lm.pagination.page + 1);
            $.cl.sendRequest(newUrl, "get", undefined, function (response) {
                console.log("appendList response: ", response)
                lm.pagination = response.data.pagination;
                DOM.data("loadMore", lm);
                $("." + itemClass + "-sp").remove();

                let newLi = _genListHtml(response.data.list);
                if (lm.pagination.page * lm.pagination.pagesize < lm.pagination.total) {
                    let special = itemClass + "-sp"
                    newLi.push(
                        '<div class="hb-item ' + itemClass + ' ' + special + '" data-bill-id="-1">' +
                        '<div class="hb-load-more"><i class="fas fa-chevron-circle-down"></i> 加载更多</div>' +
                        '</div>'
                    )
                }

                $("." + itemClass).last().after(newLi);
                _setItemClickedAction();
            })
        }
        function _setItemClickedAction(){
            $("." + itemClass).off("click").click(function () {
                let billId = parseInt($(this).data("bill-id"));
                if (billId === -1){
                    $(this).off("click").find(".hb-load-more").html('<i class="fas fa-spinner fa-spin"></i> 加载中');
                    _loadMoreCallBack();
                } else {
                    // 处理删除条目后，重渲染列表的逻辑
                    // 在本页，点击该条目后，进入到编辑页。编辑页可能会触发删除、编辑，改动之后需要刷新本页。
                    // reRenderCB是渲染列表的函数，通过cb传入编辑页函数中，当编辑页函数触发更新后，调用 reRenderCB 完成重渲染。
                    cb(billDataMap[billId], reRenderCB);
                }
            });
        }

        DOMs = _genListHtml(bills);

        // check if load More
        let pagination = loadMore.pagination || {};
        DOM.data("loadMore", loadMore);

        if (pagination && pagination.page * pagination.pagesize < pagination.total) {
            DOM.data("loadMore", loadMore);
            let special = itemClass + "-sp"
            DOMs.push(
                '<div class="hb-item ' + itemClass + ' ' + special + '" data-bill-id="-1">' +
                '<div class="hb-load-more"><i class="fas fa-chevron-circle-down"></i> 加载更多</div>' +
                '</div>'
            )
        }

        // render and set event
        DOM.html(DOMs.join(""));
        _setItemClickedAction();
    },
    renderCardHome: function () {
        let defaultBookId = $.cl.localStorageGet("defaultBookId"),
            now = new Date();
        let year = now.getFullYear(),
            month = now.getMonth() + 1;

        // 计算统计时间
        let staStart = "" + year + "-" + (month < 10 ? "0" + month : month) + "-01 00:00:00";
        month += 1
        if (month === 13) {
            month = 1;
            year += 1;
        }
        let staEnd = "" + year + "-" + (month < 10 ? "0" + month : month) + "-01 00:00:00";

        // 计算账单时间
        let hbEnd = $.cl.formatDateTime(now),
            hbStartDate = new Date(now);
        hbStartDate.setDate(hbStartDate.getDate() - 3)
        let hbStart = $.cl.formatDateTime(hbStartDate);

        function _renderHomeStatistic(start, end, book_id) {
            let url = "/madbook/api/bill/statistic?start_time=" + start + "&end_time=" + end;
            if (book_id !== undefined && book_id >= 0) {
                url = url + "&books=" + book_id;
            }
            $.cl.sendRequest(url, "get", undefined, function (response) {
                // set global val
                $.cl.userCategories.expenditure = response.data.user.expenditure_cats;
                $.cl.userCategories.income = response.data.user.income_cats;
                let user = response.data.user;
                // render user info
                $(".me-info").html("已登录: " + user.username);
                $.cl.userAccounts = user.accounts;
                $.cl.userBooks = user.books;
                $.cl.renderBookSelBtnForSubPage($.cl.renderCardHome);
                // renderBookSelBtnForHomePage();

                if (parseInt($(".footer-selected").data("footer-index")) !== 0) return;

                // render title
                $(".expenditure-text").html($.cl.formatAmountStr(response.data.statistic.expenditure));
                $(".income-amount").html($.cl.formatAmountStr(response.data.statistic.income));
                $(".create-bill").off("click").click($.cl.renderCreatBillPage);
                $(".create-income").off("click").click(function () {
                    $.cl.sendRequest("/madbook/api/hitokoto", "get", undefined, function (response) {
                        $.cl.popupMessage(response.data.sentence || "网络不可达", "一言", 5000);
                    })
                });
                $.cl.releasePageResource();
                $("#app-footer, #app-card-home").show();
            });
        }
        function _renderHomeBillList(start, end, book_id) {
            let url = "/madbook/api/bill?start_time=" + start + "&end_time=" + end;
            if (book_id !== undefined && book_id >= 0) {
                url = url + "&books=" + book_id;
            }
            $.cl.sendRequest(url, "get", undefined, function (response) {
                // render list
                $(".hb-count").html(response.data.pagination.total);
                let data = response.data.user;
                $.cl.userCategories.expenditure = data.expenditure_cats;
                $.cl.userCategories.income = data.income_cats;
                $.cl.renderBillList({
                    DOM: $(".hb-list"),
                    bills: response.data.list,
                    cb: $.cl.renderCreatBillPage,
                });
            })
        }

        _renderHomeStatistic(staStart, staEnd, defaultBookId);
        _renderHomeBillList(hbStart, hbEnd, defaultBookId);
    },
    initDateTimePicker: function (callback) {
        // callback: (startDateStr, endDateStr, rangeType) => {}

        function callbackWrapper(){
            let start = startDom.data("date"),
                end = endDom.data("date"),
                rangeType = parseInt($(".datetime-range-selected").data("index"));

            let start_time,
                end_time;
            if (rangeType === 0) {
                let y = start.getFullYear(),
                    m = start.getMonth() + 1;
                let em = m === 12 ? 1 : (m + 1),
                    ey = m === 12 ? y + 1 : y;
                start_time = "" + y + "-" + (m < 10 ? "0" + m : m) + "-01 00:00:00";
                end_time = "" + ey + "-" + (em < 10 ? "0" + em : em) + "-01 00:00:00";
            } else if (rangeType === 1) {
                let ty = start.getFullYear();
                start_time = "" + ty + "-01-01 00:00:00";
                end_time = "" + ty + "-12-31 23:59:59";
            } else {
                start_time = $.cl.formatDateTime(start, true);
                end_time = $.cl.formatDateTime(end, true);
            }
            callback(start_time, end_time, rangeType);
        }

        let startDom = $(".datetime-start"),
            endDom = $(".datetime-end");

        // 渲染起止时间的显示
        function _renderDatetime() {
            let btnId = parseInt($(".datetime-range-selected").data("index")),
                stDate = startDom.data("date"),
                edDate = endDom.data("date");

            if (btnId === 0) {
                startDom.html("" + stDate.getFullYear() + "年" + (1 + stDate.getMonth()) + "月")
            } else if(btnId === 1){
                startDom.html("" + stDate.getFullYear() + "年")
            } else {
                startDom.html(
                    "" + stDate.getFullYear() + "年" + (1 + stDate.getMonth()) + "月" +
                    stDate.getDate() + "日"
                )
                endDom.html(
                    "" + edDate.getFullYear() + "年" + (1 + edDate.getMonth()) + "月" +
                    edDate.getDate() + "日"
                )
            }
        }

        // 开关自定义的日期和年份选择器
        function _togglePicker(show){
            let dmyBox = $(".datetime-month-year");
            if (show !== true && show !== false){
                show = "80px" !== dmyBox.css("height");
            }
            if (show === true){
                dmyBox.css({height: "80px"});
            } else if (show === false){
                dmyBox.css({height: "0"});
            }
        }
        function _initYearPicker(endY, cb) {
            // select year
            let endYear = endY.getFullYear();

            function _genInputGroup(last) {
                let monthLi = [];
                for (let i = 0; i < 12; i++){
                    let innerYear = last - 11 + i;
                    let cls = endYear === innerYear ? "dmy-li-selected" : "";
                    monthLi.push('<div class="dmy-li-item ' + cls + '">' + innerYear + '</div>')
                }
                return '<div class="dmy-li-group">' + monthLi.join("") + "</div>";
            }
            function _selectAndBind() {
                // 选中
                $(".dmy-li-selected").removeClass("dmy-li-selected");
                $(".dmy-li-item").off("click").click(function (){
                    $(".dmy-li-selected").removeClass("dmy-li-selected");
                    cb(parseInt($(this).addClass("dmy-li-selected").html()));
                }).each(function () {
                    if (parseInt($(this).html()) === endYear) {$(this).addClass("dmy-li-selected")}
                });
            }

            let end = endYear;
            let lg = _genInputGroup(end),
                dmyLiDom = $(".dmy-li");
            dmyLiDom.data("endYear", end).html('<div class="dmy-li-box">' + lg + lg + "</div>");

            $(".dmy-pre").off("click").click(function (){
                // 生成两个list 右边列表为准
                let lg = _genInputGroup(end - 12),
                    rg = _genInputGroup(end);
                end -= 12;
                $(".dmy-li").html('<div class="dmy-li-box">' + lg + rg + "</div>");
                _selectAndBind();
                // 开始移动
                $(".dmy-li-box").css({"margin-left": "-100%"}).animate({"margin-left": "0%"})
            });
            $(".dmy-next").off("click").click(function (){
                // 生成两个list 左边列表为准
                let lg = _genInputGroup(end),
                    rg = _genInputGroup(end + 12);
                end += 12;
                $(".dmy-li").html('<div class="dmy-li-box">' + lg + rg + "</div>");
                _selectAndBind()
                // move
                $(".dmy-li-box").css({"margin-left": "0%"}).animate({"margin-left": "-100%"})
            });
            _selectAndBind();
            _togglePicker();
        }
        function _initMonthPicker(date, cb) {
            // 记录下原始的 date 用作取消时还原
            startDom.data("date-origin", new Date(date));

            // select month
            let li = [],
                targetM = date.getMonth(),
                targetY = date.getFullYear(),
                currentY = date.getFullYear();
            for (let i = 0; i < 12; i++){
                let cls = i === targetM ? "dmy-li-selected" : "";
                li.push('<div class="dmy-li-item ' + cls + ' ">' + (i + 1) + '</div>')
            }
            let inputGroup = '<div class="dmy-li-group">' + li.join("") + "</div>";
            $(".dmy-li").html('<div class="dmy-li-box">' + inputGroup + inputGroup + "</div>");
            $(".dmy-pre").off("click").click(function (){
                // scroll list
                // 先设置右侧组选中项
                $(".dmy-li-selected").removeClass("dmy-li-selected");
                if(currentY === targetY) {
                    $(".dmy-li-group").eq(1).find(".dmy-li-item").eq(targetM).addClass("dmy-li-selected");
                }
                $(".dmy-li-box").css({"margin-left": "-100%"}).animate({"margin-left": "0%"})

                currentY -= 1;
                if (currentY === targetY){
                    $(".dmy-li-group").eq(0).find(".dmy-li-item").eq(targetM).addClass("dmy-li-selected");
                }
                cb("<");
            });
            $(".dmy-next").off("click").click(function (){
                // scroll list
                $(".dmy-li-selected").removeClass("dmy-li-selected");
                if(currentY === targetY) {
                    $(".dmy-li-group").eq(0).find(".dmy-li-item").eq(targetM).addClass("dmy-li-selected");
                }
                $(".dmy-li-box").css({"margin-left": "0%"}).animate({"margin-left": "-100%"})

                currentY += 1;
                if (currentY === targetY){
                    $(".dmy-li-group").eq(1).find(".dmy-li-item").eq(targetM).addClass("dmy-li-selected");
                }
                cb(">");
            });
            $(".dmy-li-item").off("click").click(function (){
                $(".dmy-li-selected").removeClass("dmy-li-selected");
                cb(parseInt($(this).addClass("dmy-li-selected").html()));
            });
            _togglePicker();
        }

        // 设置选项卡动作
        $(".datetime-range").off("click").click(function () {
            if ($(this).hasClass("datetime-range-selected")) return;

            $(".datetime-range-selected").removeClass("datetime-range-selected");
            let btnId = $(this).addClass("datetime-range-selected").data("index"),
                now = new Date();

            // 设置日期选择栏可见性
            _togglePicker(false);
            if (parseInt(btnId) !== 2){
                // 年账单、月账单

                // 设置默认时间
                startDom.data("date", now);
                endDom.data("date", now);

                if (!startDom.hasClass("datetime-start-single")){
                    startDom.addClass("datetime-start-single");
                    $(".datetime-split, .datetime-end").hide();
                }

            } else {
                // 自定义账单

                // 设置默认时间
                let start = new Date(now);
                start.setUTCDate(start.getUTCDate() - 7);
                startDom.data("date", start);
                endDom.data("date", now);

                if (startDom.hasClass("datetime-start-single")){
                    startDom.removeClass("datetime-start-single");
                    $(".datetime-split, .datetime-end").show();
                }
            }

            // 设置日期选择器，渲染界面，设置点击时事件
            _renderDatetime();
            $(".datetime-sl").off("click").click(function (){
                let btnId = parseInt($(".datetime-range-selected").data("index")),
                    dom = $(this).hasClass("datetime-start") ? startDom : endDom;

                // 控件选择
                if (btnId === 2) {
                    $.cl.showCalendar(dom.data("date"), function (selDate) {
                        dom.data("date", selDate);
                        _renderDatetime();
                        callbackWrapper();
                    });
                    return;
                }
                function _monthCb(v){
                    if (v === "<") {
                        let date = startDom.data("date");
                        date.setFullYear(date.getFullYear() - 1);
                        startDom.data("date", date);
                        _renderDatetime();
                    } else if (v === ">") {
                        let date = startDom.data("date");
                        date.setFullYear(date.getFullYear() + 1);
                        startDom.data("date", date);
                        _renderDatetime();
                    } else {
                        let date = startDom.data("date");
                        date.setMonth(v - 1);
                        // 对于月选择，需要更新原始 date
                        startDom.data("date", date).data("date-origin", new Date(date));
                        _renderDatetime();
                        _togglePicker(false);
                        callbackWrapper();
                    }
                }
                function _yearCb(v) {
                    let date = startDom.data("date");
                        date.setFullYear(v);
                        startDom.data("date", date);
                    _renderDatetime();
                    _togglePicker(false);
                    callbackWrapper();
                }

                // 当时间范围指示区按下时，判断选择器是否可见。可见则收起，否则渲染选择界面
                if ($(".datetime-month-year").css("height") === "80px") {
                    _togglePicker(false);
                    if (btnId === 0) {
                        let origin = startDom.data("date-origin");
                        startDom.data("date", origin);
                        _renderDatetime();
                    }
                    return;
                }
                let currentDate = startDom.data("date") || new Date();
                btnId === 0 ? _initMonthPicker(currentDate, _monthCb) : _initYearPicker(currentDate, _yearCb);
            })
            // 初始化完 trigger
            callbackWrapper();
        })
    },
    renderCardBill: function () {
        // 先渲染账本
        $.cl.renderBookSelBtnForSubPage($.cl.renderCardBill);

        function renderC2BillList(start, end, rangeType, params) {
            params = params || {}
            let url = "/madbook/api/bill?start_time=" + start + "&end_time=" + end;
            if (params.is_expenditure !== undefined) {
                url += "&is_expenditure=" + (params.is_expenditure === true ? "1" : "0");
            }
            let selectedBookId = $.cl.localStorageGet("defaultBookId");
            if (selectedBookId !== undefined && selectedBookId >= 0) {
                url = url + "&books=" + selectedBookId;
            }
            $.cl.sendRequest(url, "get", undefined, function (response) {
                console.log("renderC2BillList response: ", response);
                $.cl.renderBillList({
                    DOM: $(".card-1-bill-list"),
                    bills: response.data.list,
                    cb: $.cl.renderCreatBillPage,
                    loadMore: {pagination: response.data.pagination, url: url}
                });
            })
        }
        function renderStatisticBar(start, end, rangeType) {
            console.log("send BillListReq: ", rangeType, start, end);
            let url = "/madbook/api/bill/statistic?start_time=" + start + "&end_time=" + end;
            let selectedBookId = $.cl.localStorageGet("defaultBookId");
            if (selectedBookId !== undefined && selectedBookId >= 0) {
                url = url + "&books=" + selectedBookId;
            }
            $.cl.sendRequest(url, "get", undefined, function (response) {
                console.log("_renderStatisticBar response: ", response);
                let data = response.data;

                // 渲染 按钮
                $(".sel-expenditure").find(".sel-text").html("支出 ￥" + $.cl.__gpAmountStr(data.statistic.expenditure));
                $(".sel-income").find(".sel-text").html("收入 ￥" + $.cl.__gpAmountStr(data.statistic.income));

                $(".sel-item").off("click").click(function () {
                    $(".sel-radio-selected").removeClass("sel-radio-selected");
                    $(this).find(".sel-radio").addClass("sel-radio-selected");
                    if ($(this).hasClass("sel-expenditure")) {
                        // render ex
                        let index = data.statistic.index,
                            dataSet = data.statistic.ex_list;
                        $.chart.drawBarChart(index, dataSet, "#f85959");
                        renderC2BillList(start, end, rangeType, {is_expenditure: true})
                    } else {
                        let index = data.statistic.index,
                            dataSet = data.statistic.in_list;
                        $.chart.drawBarChart(index, dataSet, "#51e21c");
                        renderC2BillList(start, end, rangeType, {is_expenditure: false})
                    }
                }).eq(0).trigger("click");
            });
        }

        // 初始化日期选择器，并绑定事件
        $.cl.initDateTimePicker(renderStatisticBar);

        $.cl.releasePageResource();
        // 清除时间段选择器 并触发刷新
        $(".datetime-range-selected").removeClass("datetime-range-selected");
        $(".datetime-range").eq(0).trigger("click");

        $(".chart-bar-wrapper").show();
        $("#app-footer, #app-card-bill").show();
    },
    renderCardStatistic: function () {
        // 先渲染账本
        $.cl.renderBookSelBtnForSubPage($.cl.renderCardStatistic);

        function _renderDetailList(option) {
            option = option || {};
            let start = option.start,
                end = option.end,
                books = option.books || [],
                categories = option.categories || [],
                is_expenditure = option.is_expenditure ? "1" : "0";
            let url = "/madbook/api/bill?start_time=" + start + "&end_time=" + end + "&is_expenditure=" + is_expenditure;
            if (books.length > 0) {
                url = url + "&books=" + books.join(",");
            }
            if (categories.length > 0) {
                url = url + "&categories=" + categories.join(",");
            }
            let selectedBookId = $.cl.localStorageGet("defaultBookId");
            if (selectedBookId !== undefined && selectedBookId >= 0) {
                url = url + "&books=" + selectedBookId;
            }

            function renderStatisticDetailList(response) {
                console.log("renderStatisticDetailList response: ", response);
                let pageDom = $(".cb-detail"),
                    originBack = $.cl.onBack;
                // 设置回退事件
                function _exit(){
                    pageDom.hide();
                    $.cl.onBack = originBack;
                }
                $.cl.onBack = _exit;
                $(".exit-cb-detail").off("click").click(_exit);
                $.cl.renderBillList({
                    DOM: $(".cb-detail-body"),
                    bills: response.data.list,
                    cb: $.cl.renderCreatBillPage,
                    loadMore: {pagination: response.data.pagination, url: url}
                }, function () {_renderDetailList(option)})
                pageDom.show();
            }
            $.cl.sendRequest(url, "get", undefined, renderStatisticDetailList);
        }
        function _renderStatisticList(data, is_expenditure) {
            data = data || {statistic: {raw_ex: [], raw_in: []}}
            console.log("_renderStatisticList data: ", data)
            let renderList = is_expenditure ? data.statistic.raw_ex : data.statistic.raw_in,
                total = is_expenditure ? data.statistic.expenditure : data.statistic.income,
                renderData = [],
                start = data.query.start_time,
                end = data.query.end_time,
                books = data.query.books || [];

            for (let i = 0; i < renderList.length; i++) {
                let g = renderList[i];
                let categoryId = g[0],
                    amount = g[1],
                    count = g[2];
                let percent = parseInt(amount / total * 100);
                if (percent < 1) {
                    percent = "< 1"
                }
                renderData.push({
                    amount: amount,
                    category: categoryId,
                    extra: "" + count + "笔，" + percent + "%",
                    is_expenditure: is_expenditure,
                    id: i,
                })
            }
            function onCatListSel (item) {
                console.log("onCatListSel selected: ", item);
                _renderDetailList({
                    start: start,
                    end: end,
                    books: books,
                    categories: [item.category],
                    is_expenditure: is_expenditure,
                })
            }
            $.cl.renderBillList({DOM: $(".card-1-bill-list"), bills: renderData, cb: onCatListSel, renderWeek: false})
        }
        function _renderStatisticRound(start, end, rangeType) {
            let url = "/madbook/api/category/statistic?start_time=" + start + "&end_time=" + end;
            let selectedBookId = $.cl.localStorageGet("defaultBookId");
            if (selectedBookId !== undefined && selectedBookId >= 0) {
                url = url + "&books=" + selectedBookId;
            }
            $.cl.sendRequest(url, "get", undefined, function (response) {
                console.log("_renderStatisticRound response: ", response);
                let data = response.data;
                let catsList = [data.user.expenditure_cats, data.user.income_cats],
                    responseData = [data.statistic.raw_ex, data.statistic.raw_in],
                    chartData = [[], []],
                    total = [data.statistic.expenditure, data.statistic.income];

                for (let k = 0; k < 2; k ++){
                    // gen map
                    let map = {}, cats = catsList[k];
                    for (let i = 0; i < cats.length; i++){
                        let c = cats[i];
                        map[c.id] = c;
                    }
                    // gen list
                    let source = responseData[k], target = chartData[k], t = total[k];
                    for (let i = 0; i < source.length; i++) {
                        let v = source[i];
                        let cId = v[0];
                        target.push({name: map[cId].name, value: (v[1] / t * 100).toFixed(0)})
                    }
                }
                // 渲染 按钮
                $(".sel-expenditure").find(".sel-text").html("支出 ￥" + $.cl.__gpAmountStr(total[0]));
                $(".sel-income").find(".sel-text").html("收入 ￥" + $.cl.__gpAmountStr(total[1]));

                $(".sel-item").off("click").click(function () {
                    $(".sel-radio-selected").removeClass("sel-radio-selected");
                    $(this).find(".sel-radio").addClass("sel-radio-selected");
                    if ($(this).hasClass("sel-expenditure")) {
                        // render ex
                        $.chart.drawRound(chartData[0]);
                        _renderStatisticList(data, true)
                    } else {
                        $.chart.drawRound(chartData[1]);
                        _renderStatisticList(data, false)
                    }
                }).eq(0).trigger("click");
            });
        }

        $.cl.initDateTimePicker(_renderStatisticRound);

        // 清除时间段选择器 并触发刷新
        $(".datetime-range-selected").removeClass("datetime-range-selected");
        $(".datetime-range").eq(0).trigger("click");

        $.cl.releasePageResource();
        $(".card-1-bill-list").html("");
        $(".chart-bar-wrapper").hide();
        $("#app-footer, #app-card-bill").show();
    },
    renderCardMe: function () {
        $(".me-item").off("click").click(function () {
            let btn = parseInt($(this).data("bt"));
            function doLogOut() {$.cl.sendRequest("/madbook/api/auth/logout", "post", undefined, $.cl.renderLoginPage)}
            if (btn === 0) {
                let dom = '<div class="edit-pass">' +
                    '<label class="extra-input-wrapper"><span class="edit-pass-label-text">旧密码</span>' +
                    '<input class="edit-pass-input" type="password" maxlength="140" name="old-pass" placeholder="" autocomplete="off">' +
                    '</label>' +
                    '<label class="extra-input-wrapper"><span class="edit-pass-label-text">新密码</span>' +
                    '<input class="edit-pass-input" type="password" maxlength="140" name="new-pass" placeholder="" autocomplete="off">' +
                    '</label>' +
                    '<label class="extra-input-wrapper"><span class="edit-pass-label-text">确认</span>' +
                    '<input class="edit-pass-input" type="password" maxlength="140" name="new-pass-confirm" placeholder="" autocomplete="off">' +
                    '</label>' +
                    '</div>';
                function sendChangePassReq() {
                    let oldPass = $("input[name=old-pass]").val(),
                        newPass = $("input[name=new-pass]").val(),
                        newPassC = $("input[name=new-pass-confirm]").val();
                    console.log("oldPass: ", oldPass)
                    if (oldPass.length < 5) {
                        $.cl.popupConfirm("旧密码过短", undefined, undefined, "提示");
                        return;
                    }
                    if (!(newPass === newPassC)) {
                        $.cl.popupConfirm("两次输入的密码不相同", undefined, undefined, "提示");
                        return;
                    }
                    if (newPass === oldPass) {
                        $.cl.popupConfirm("新旧密码不可相同", undefined, undefined, "提示");
                        return;
                    }
                    $.cl.sendRequest(
                        "/madbook/api/auth/change_password",
                        "post",
                        {"password": newPass, "old_password": oldPass},
                        function (data) {
                            if (data.err_code === 0) {
                                $.cl.popupMessage("密码修改成功，请重新登录！");
                                doLogOut();
                            } else {
                                $.cl.popupMessage(data.msg)
                            }
                        }
                    );
                }
                $.cl.popupConfirm(dom, sendChangePassReq, undefined, "修改密码");
            } else if (btn === 1) {
                window.location.href = "/madbook/api/bill/export";
            } else if (btn === 2) {
                $.cl.popupConfirm("疯人账本免费版(build_20210901pa1)<br>版权所有，请勿商业使用", undefined, undefined, "关于");
            } else if (btn === 3) {
                $.cl.popupConfirm("确定要退出吗？", function () {
                    doLogOut();
                });
            }
        });
        $.cl.releasePageResource();
        $("#app-footer, #app-card-me").show();
    },
    initFooterBtn: function () {
        $(".footer-unit").off("click").click(function () {
            $(".footer-selected").removeClass("footer-selected");
            let index = parseInt($(this).addClass("footer-selected").data("footer-index"));
            let _ = {
                0: $.cl.renderCardHome,
                1: $.cl.renderCardBill,
                2: $.cl.renderCardStatistic,
                3: $.cl.renderCardMe,
            }[index]();
        });
    },
    triggerFooterBtn() {
        let selected = parseInt($(".footer-selected").data("footer-index")) || 0;
        $(".footer-unit").eq(selected).trigger("click");
    },
    onBack: undefined,
    initBackEventHandler: function () {
        if (window.history && window.history.pushState) {
            $(window).on('popstate', function () {
                window.history.pushState('forward', null, '');
                window.history.forward(1);
                return $.cl.onBack === undefined ? null : $.cl.onBack();
            });
        }
        window.history.pushState('forward', null, '');
        window.history.forward(1);
    },
    showCalendar: function(date, cb) {
        let calendarDate = undefined,
            calendarPage = $(".calendar-page");

        $(".calendar-rect").html(
            '<div id="calendar"></div>' +
            '<div class="calendar-btn">' +
            '<div class="calendar-btn-item" data-calendar="cancel">取消</div>' +
            '<div class="calendar-btn-item" data-calendar="submit">确定</div>' +
            '</div>'
        )

        $('#calendar').calendar({
            width: 300,
            height: 300,
            date: date || new Date(),
            prev: '<i class="fa fa-arrow-left" aria-hidden="true"></i>',
            next: '<i class="fa fa-arrow-right" aria-hidden="true"></i>',
            selectedRang: [null, new Date()],
            onSelected: function (view, date, data) {
                calendarDate = date;
            }
        });

        $(".calendar-btn-item").off("click").click(function () {
            if ($(this).data("calendar") === "submit" && calendarDate !== undefined && cb !== undefined) {
                cb(calendarDate);
            }
            calendarPage.hide();
        });
        $(".calendar-mask").off("click").click(function () {calendarPage.hide()});
        calendarPage.show();
    },
    createAccount: function () {

    },
    selAccount: function () {
        $(".flow-list-title").html("选择账户");
        let dom = [];
        for (let i = 0; i < $.cl.userAccounts.length; i++){
            let ac = $.cl.userAccounts[i];
            dom.push(
                '<div class="flow-list-item" data-acid="' + ac.id + '" data-name="' + ac.name + '">' +
                '<span class="fl-icon"></span>' +
                '<span class="fl-text">' + ac.name + '</span></div>'
            )
        }
        dom.push(
            '<div class="flow-list-item" data-acid="-1">' +
            '<span class="fl-icon"><i class="fa fa-plus-circle" aria-hidden="true"></i> </span>' +
            '<span class="fl-text">管理</span>' +
            '</div>'
        )
        $(".flow-list-body").html(dom.join(""))
        // bind
        $(".flow-list-item").off("click").click(function (){
            let acid = $(this).data("acid"),
                name = $(this).data("name");
            if (parseInt(acid) === -1){
                $.cl.createAccount();
                $(".flow-list").modal("hide");
            } else {
                $(".account-name").data("acid", acid).html(name);
                $(".flow-list").modal("hide");
            }
        });
        $(".flow-list").modal("show");
    },
    selBook: function (callback, incDefault) {
        // 账本选择器组件
        // 会调用callback, 当选中时 id >= 0, -1为新建，-2为全部。
        function _createOrRenameBook(b) {
            b = b || {};
            console.log("_createOrRenameBook: ", b);

            let dom = '<div class="book-create">' +
                '<span class="fl-item" data-bid="-1">' +
                    '<label class="book-create-label">' +
                        '<span class="book-create-label-text">账本名: </span>' +
                        '<input type="text" class="input-custom" name="new_bookname" placeholder="请输入">' +
                    '</label>' +
                '</span>' +
                '</div>',
                title, action, url, type;
            if (b.id === undefined) {
                title = "创建新账本";
                action = "创建成功";
                url = "/madbook/api/book";
                type = "post";
            } else {
                title = "重命名账本: " + b.name;
                action = "更新成功";
                url = "/madbook/api/book/" + b.id;
                type = "put";
            }

            $.cl.popupConfirm(dom, function () {
                let bookName = $("input[name=new_bookname]").val() || "";

                if (bookName.length < 2) {
                    $.cl.popupMessage("账本名不符合要求");
                    return;
                }
                $.cl.sendRequest(url, type, {name: bookName}, function (response) {
                    $.cl.userBooks = response.data.books;
                    $.cl.selBook(callback, incDefault);
                    $.cl.popupMessage("账本\"" + bookName + "\"成功" + action);
                });
            }, undefined, title);
        }

        function _deleteBook(b) {
            $.cl.sendRequest("/madbook/api/book/" + b.id, "delete", undefined, function (response) {
                $.cl.userBooks = response.data.books;
                $.cl.selBook(callback, incDefault);
                let act = response.data.is_deleted === true ? "删除" : "置底";
                $.cl.popupMessage("账本\"" + b.name + "\"已" + act);

                if (response.data.is_deleted === true) {
                    // 这一步是防止，页面中选中的账本被删除，导致显示空列表。当账本真删时，调用回调函数，选中全部账本，即-2
                    callback({id: -2});
                }
            });
        }

        $(".flow-list-title").html("选择账本");
        // render
        let dom = [];
        if (incDefault === true) {
            dom.push(
                '<div class="flow-list-item">' +
                '<span class="fl-item" data-bid="-2">' +
                '<span class="fl-icon"></span><span class="fl-text">全部</span>' +
                '</span>' +
                '</div>'
            )
        }
        for (let i = 0; i < $.cl.userBooks.length; i++){
            let bk = $.cl.userBooks[i];
            dom.push(
                '<div class="flow-list-item">' +
                '<span class="fl-item" data-bid="' + bk.id + '" data-bname="' + bk.name + '">' +
                '<span class="fl-icon"></span><span class="fl-text">' + bk.name + '</span>' +
                '</span>' +
                '<span class="fl-more"><i class="fa fa-ellipsis-v" aria-hidden="true"></i></span>' +
                '<div class="fl-operation">' +
                    '<span class="fl-btn" data-bt="0" data-index="' + i + '">删除</span>' +
                    '<span class="fl-btn" data-bt="1" data-index="' + i + '">重命名</span>' +
                '</div>' +
                '</div>'
            )
        }
        dom.push(
            '<div class="flow-list-item">' +
            '<span class="fl-item" data-bid="-1">' +
            '<span class="fl-icon fl-text"><i class="fa fa-plus-circle" aria-hidden="true"></i> </span>' +
            '<span class="fl-text fl-text-manage">创建新账本</span>' +
            '</span>' +
            '</div>'
        )
        $(".flow-list-body").html(dom.join(""))
        $(".fl-btn").off("click").click(function (){
            let itemIndex = parseInt($(this).data("index")),
                btnId = parseInt($(this).data("bt"));
            let b = $.cl.userBooks[itemIndex];
            if (btnId === 0){
                let msg = "确定删除账本\"" + b.name + "\"吗？<br/><br/>若有账单与此账本关联，则此账本不会删除，而是会放置在列表尾部。"
                $.cl.popupConfirm(msg, function () {_deleteBook(b)});
            } else {
                _createOrRenameBook(b)
            }
            $(".flow-list").modal("hide");
        });
        $(".fl-item").off("click").click(function (){
            let bid = $(this).data("bid"),
                bname = $(this).data("bname");
            if (parseInt(bid) === -2) {
                callback({id: -2});
            } else if (parseInt(bid) === -1){
                _createOrRenameBook();
            } else {
                callback({id: bid, name: bname});
            }
            $(".flow-list").modal("hide");
        });
        // more
        $(".fl-more").off("click").click(function (){
            let btn = $(this).next();
            if (btn.css("height") !== "50px"){
                btn.css({height: "50px"});
            } else {
                btn.css({height: "0"});
            }
        })
        $(".flow-list").modal("show");
    },
    initPage: function (){
        $.cl.initFooterBtn();
        $.cl.initKeyBoard();
        $.cl.initBackEventHandler();
        $.cl.triggerFooterBtn();
    }
};

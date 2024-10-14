"use strict";
(function() {
    var bcPageTimeout, defaults = {
            $rptDataTable: null,
            $pages: null,
            $page: null,
            csid: 0,
            showHint: !0,
            showFeedback: !0,
            useMarkScript: !0,
            isClientPreview: !1,
            isReportView: !1,
            isAdmin: !1,
            isTest: !1,
            isQuestion: !1,
            isHardMode: !1,
            regionid: 1,
            onlyHasCheckboxAnswers: !0,
            userHasAlreadyTried: !1,
            focusSet: !0,
            scoreChanged: !1,
            userHasMadeChange: !1,
            testMarking: !1,
            settingUp: !1,
            pageid: 0,
            markAsOne: !1,
            numQ: 0,
            numR: 0,
            numPP: 0,
            nextPPindex: 0,
            numPagesSoFar: 0,
            totalPages: 1,
            totalAnswers: 0,
            pages: [],
            pp: [],
            ppById: {},
            pageById: {},
            ppidQArr: [],
            answerByBqaid: {},
            answerArr: [],
            userTopMarks: new bc.Marks,
            pageTotalMarks: 0,
            score: null,
            pageStartDateTime: null,
            starttime: null,
            starttimeOffsetSeconds: 0,
            reloadWhenOnlinePageid: null,
            jmol: $.extend({}, bc.jmol),
            prev_fbHtml: null,
            hasNumpadNumberLinks: !1
        },
        pagepartPreviewHtml = '<div class="review"><div class="htmlcontentpreview"></div></div><div class="question hidden"><form class="bcqform"><div class="questioncontentpreview"></div></form></div>';

    function hideAnswerTargetTips() {
        toggleAnswerTargetTips("hide")
    }

    function showAnswerTargetTips() {
        toggleAnswerTargetTips("show")
    }

    function toggleAnswerTargetTips(e) {
        var s = "isPreview";
        "hide" == e ? $("body").removeClass(s) : "show" == e ? $("body").addClass(s) : $("body").toggleClass(s)
    }

    function setPageFinished() {
        var e = bcp.$page.addClass("allqdone").find(".scoreWrapper");
        clearTimeout(bc.questionTimer), e.length && e.addClass("allqdone"), bc.$windowFloatFooter && bc.$windowFloatFooter.find(".scoreWrapper").addClass("allqdone"), bcp.showNextPageButton(), bcp.isReportView || bc.nav.savePageScore()
    }

    function toggle(e) {
        var s = $(e);
        return s.length && (s.toggle(), bcp.rePosition()), !1
    }

    function showPopup(e, s) {
        var n = $(e),
            a = $.extend({
                classes: {
                    "ui-dialog": "bcpopup bcpagepopup"
                },
                minHeight: 70,
                maxHeight: .8 * window.innerHeight,
                maxWidth: 1e3,
                draggable: !bc.isMobile
            }, s);
        if (n.length || (n = $("#" + e)), n.length) {
            var r = parseInt(n.css("width"), 10);
            r && !a.width && (a.width = r + 4), a.appendTo = n.parents(".pagepart"), n.hasClass("ui-dialog-content") ? n.dialog("open") : n.dialog(a)
        }
    }
    window.bcp = {
        TEXTBOX: 0,
        CHECKBOX: 1,
        answerStateImage: {
            b: "blank",
            r: "tick",
            s: "tickoncross",
            w: "cross",
            g: "giveup",
            all: "tick cross tickoncross giveup"
        },
        answerStyles: {
            0: {
                jsobject: "TextAnswer",
                template: '<input type="text" id="${o.aDivId}" class="text ${o.cssClass}" style="${o.cssStyle}" />'
            },
            1: {
                jsobject: "ChkAnswer",
                template: '<label for="${o.aDivId}" class="chkdiv answerWrapper ${o.cssClass}" style="${o.cssStyle}"><div class="atext1"><input type="checkbox" id="${o.aDivId}" class="checkbox" /></div><div class="atext">${o.answerText}</div></label>'
            },
            6: {
                jsobject: "RadioAnswer",
                template: '<div class="radio answerWrapper"><ul id="${o.aDivId}" class="radioItems ${o.cssClass}" style="${o.cssStyle}"></ul></div>'
            },
            7: {
                jsobject: "Select2Answer",
                template: '<select id="${o.aDivId}" class="bc-select2 ${o.cssClass}" style="${o.cssStyle}"></select>'
            },
            8: {
                jsobject: "Select2ListAnswer",
                template: '<div id="${o.aDivId}" class="select2-list ${o.cssClass}" style="${o.cssStyle}"></div>'
            },
            9: {
                jsobject: "ClickListAnswer",
                template: '<div id="${o.aDivId}" class="select2-list listclick ${o.cssClass}" style="${o.cssStyle}"></div>'
            },
            10: {
                jsobject: "DDAnswer",
                template: '<div id="${o.aDivId}" class="dragdrop disable-selection ${o.cssClass}" style="${o.cssStyle}">${o.answerText}</div>'
            },
            14: {
                jsobject: "SortAnswer",
                template: '<div id="${o.aDivId}" class="select2-list ${o.cssClass}" style="${o.cssStyle}"></div>'
            },
            12: {
                jsobject: "MCAnswer",
                template: '<label for="${o.aDivId}" class="chkdiv answerWrapper ${o.cssClass}" style="${o.cssStyle}"><div class="atext1"><input type="radio" id="${o.aDivId}" name="rad${o.ppid}_${o.groupIndex}" class="radio"/></div><div class="atext">${o.answerText}</div></label>'
            },
            20: {
                jsobject: "JSMEAnswer",
                template: '<div id="${o.aDivId}" class="jsme ${o.cssClass}" style="${o.cssStyle}"></div>'
            },
            100: {
                jsobject: "CustomAnswer",
                template: '<span id="${o.aDivId}D" class="qdisplay ${o.cssClass}"></span>'
            }
        },
        qscoreHtml: null,
        qfootHtml: null,
        reset: function(e) {
            var s = $(".divWrapper").find("div.pagepart");
            bcp.jmol && _.each(bcp.jmol.applets, (function(e) {
                e._reset && e._reset()
            })), $.extend(bcp, _.cloneDeep(defaults)), bcp.starttime = fun.getSecondsSince1970(), bcp.pageStartDateTime = new Date, $.fn.select2 && s.find("select.select2-hidden-accessible").each((function() {
                var e = $(this);
                e.data("select2") && e.select2("destroy")
            })), $.fn.dialog && s.find(".ui-dialog-content").dialog("destroy"), e && $("div.pagepart:first").html(pagepartPreviewHtml)
        },
        setPageTimeout: function() {
            window.bcp && (bcp.pageStartDateTime || (bcp.pageStartDateTime = new Date, bcp.starttimeOffsetSeconds = Math.round((bcp.pageStartDateTime - bc.clientStartTime) / 1e3)), bcPageTimeout && clearTimeout(bcp.bcPageTimeout), bcPageTimeout = setTimeout(bc.nav.savePageScore, 9e5))
        },
        showNextPageButton: function() {
            bc.isMobile && (bcp.$myp.find(".floatActionButton").remove(), bc.template.getById("actionBtn-comment").appendTo(bcp.$myp)), bcp.totalPages > 1 || bcp.$footerButtons && !bcp.$footerButtons.find(".extraPageToggle").length && bc.nav.myPage && bc.nav.myPage.hasExtraPages && bc.nav.myPage.pageGroup && !bc.isMobile && function() {
                var e = bc.nav.myPage.pageGroup,
                    s = e.pages.length - e.subsetSize,
                    n = e.showExtraPages,
                    a = (n ? "Hide " : "Show ") + fun.valToPluralString(s, "extra question"),
                    r = $('<a class="extraPageToggle floatRight" style="padding:3px 0 3px 3px;" title="Similar questions for more practice">/a>');
                n && r.addClass("expanded");
                r.text(a), bcp.$footerButtons.append(r)
            }()
        },
        maxPossibleUserMarks: function() {
            var e, s, n, a, r, o, p, c = 0;
            for (e = 0; e < bcp.numPP; e++)
                if (p = (s = bcp.pp[e]).answerGroups, s.numAnswers && p)
                    if (s.maxMarks) c += s.maxMarks;
                    else
                        for (a = 0; a < p.length; a++) {
                            for (o = 0, r = 0; r < p[a].length; r++)(n = p[a][r]).userHasAttempted() && ("SUM" == n.groupTotalMarksMode ? o += n.marks : o = Math.max(o, n.marks));
                            c += o
                        }
            return c
        },
        markAllQuestions: function() {
            var e, s;
            for (e = 0; e < bcp.numPP; e++)(s = bcp.pp[e]).markQuestion(), bcp.isTest && (s.userScore.saveScore = !0)
        },
        readPage: function() {
            if ("speechSynthesis" in window) {
                if (window.speechSynthesis.paused && window.speechSynthesis.speaking) bcp.setSpeechOptions(), window.speechSynthesis.resume();
                else {
                    var e, s = bc.nav.myPage && bc.nav.myPage.pageTitle,
                        n = bcp.$page.find(".pagepart").clone();
                    n.find(["svg", ".qfoot", ".popup", ".togglelink", ".show-calculator", ".axisLabel", ".showInFullScreen", ".select2-hidden-accessible"].join(",")).remove(), n.find("table").replaceWith(" "), n.find(".answerWrapper").before(",").after(","), n.find(".plotTitle").append(" chart."), n.eq(0).prepend(s + "."), n.find("*").filter((function() {
                        var e = $(this),
                            s = e.css("display");
                        return (e.attr("class") || "").indexOf("right2column") >= 0 || ("none" == s || !(!e.hasClass("fb") || s && "none" != s))
                    })).remove(), n.find(".hide").filter((function() {
                        var e = $(this).css("display");
                        return -1 == ["inline", "block", "inline-block"].indexOf(e)
                    })).remove(), e = fun.getSpeechText(n), _.each([
                        ["subshell", "sub-shell"],
                        ["volumetric", "volu-metric"],
                        ["µ", "micro-"],
                        [").", ") "],
                        [/(https:|http:|www\.)\S*/g, ""],
                        [/\bLead\b/g, "Led"],
                        [/\As\b/g, "A-S"],
                        [/Al([0-9A-Z]|\b)/g, "A-L$1"],
                        [/Be([0-9A-Z]|\b)/g, "B-E$1"],
                        [/He([0-9A-Z]|\b)/g, "H-E$1"],
                        [/Au([0-9A-Z]|\b)/g, "A-U$1"],
                        [/Sr([0-9A-Z]|\b)/g, "S-R$1"],
                        [/In([0-9A-Z]|\b)/g, "I-N$1"],
                        [/Ta([0-9A-Z]|\b)/g, "T-A$1"],
                        [/La([0-9A-Z]|\b)/g, "L-A$1"],
                        [/Li([0-9A-Z]|\b)/g, "L-I$1"],
                        [/Lu([0-9A-Z]|\b)/g, "L-U$1"],
                        [/Po([0-9A-Z]|\b)/g, "P-O$1"],
                        [/Pa([0-9A-Z]|\b)/g, "P-A$1"],
                        [/Bi([0-9A-Z]|\b)/g, "B-I$1"],
                        [/Co([0-9A-Z]|\b)/g, "C-O$1"],
                        [/Re([0-9A-Z]|\b)/g, "R-E$1"],
                        [/([a-zA-Z])OH([0-9A-Z]|\b)/g, "$1-O-H$2"]
                    ], (function(s) {
                        e = e.replaceAll(s[0], s[1])
                    })), bcp.speecho = new window.SpeechSynthesisUtterance, bcp.setSpeechOptions(), bcp.speecho.text = e, bcp.speecho.onend = function(e) {
                        bcp.$audioControl.removeClass("playing")
                    }, window.speechSynthesis.speak(bcp.speecho)
                }
                bcp.$audioControl.addClass("playing")
            }
        },
        readPage_pause: function() {
            "speechSynthesis" in window && (window.speechSynthesis.pause(), bcp.$audioControl.removeClass("playing"))
        },
        readPage_cancel: function() {
            "speechSynthesis" in window && (window.speechSynthesis.cancel(), bcp.$audioControl.removeClass("playing"))
        },
        setSpeechOptions: function() {
            var e = bc.localStorage.getItem("user_voicetype") || 0,
                s = bc.localStorage.getItem("user_voicerate") || 1.1;
            bcp.speecho && (bcp.speecho.voice = fun.getSpeechVoices()[e], bcp.speecho.rate = s)
        },
        timer: {
            useTimer: 0,
            maxSecs: null,
            startTime: null,
            update_ms: 50,
            init: function() {
                var e = bcp.timer.getQuestionSeconds();
                e && (bcp.timer.maxSecs = e, bcp.timer.startTime = new Date, bcp.timer.setupDisplay(), bcp.timer.updateDisplay())
            },
            getQuestionSeconds: function() {
                return 5 * (bc.nav.myPage && bc.nav.myPage.marks && bc.nav.myPage.marks.outof) || 0
            },
            setupDisplay: function() {
                this.$questionTimer = bcp.$myp.find("#questionTimer"), this.$questionTimer.text(bcp.timer.maxSecs)
            },
            updateDisplay: function() {
                var e = fun.dateDiff_secs(bcp.timer.startTime),
                    s = 100 * e / bcp.timer.maxSecs,
                    n = Math.ceil(bcp.timer.maxSecs - e),
                    a = "rgb(" + s + "%," + (100 - s) + "%,0%)";
                bcp.timer.$questionTimer.text(n), bcp.timer.$questionTimer.css("--p", s), bcp.timer.$questionTimer.css("--c", a), e >= bcp.timer.maxSecs ? bcp.timer.stopTimer() : bc.questionTimer = window.setTimeout(bcp.timer.updateDisplay, bcp.timer.update_ms)
            },
            startTimer: function() {},
            stopTimer: function() {
                _.each(bcp.answerArr, (function(e) {
                    e.disableCtl()
                })), setPageFinished()
            },
            cancelTimer: function() {
                bcp.timer.useTimer = 0, window.clearTimeout(bc.questionTimer)
            }
        },
        giveupAllQuestions: function() {
            bcp.giveupQuestions(100)
        },
        giveupSomeQuestions: function() {
            fun.jprompt("Number of answers: ", "Give up", "5", bcp.giveupQuestions, null, {
                attrs: {
                    type: "number",
                    min: 1,
                    max: 100
                },
                styles: {
                    width: "auto",
                    display: "inline"
                }
            })
        },
        giveupNextQuestion: function() {
            bcp.giveupQuestions(1)
        },
        giveupQuestions: function(e) {
            var s, n, a = 0;
            if (e = parseInt(e, 10))
                for (s = 0; s < bcp.numPP; s++)
                    for (n = bcp.pp[s]; !n.allUserAnswersCorrect && a < e;) n.showCorrectAnswer(), a++
        }
    };
    var PagepartScore = bc.Marks.extend({
        gaveup: !1,
        correct: !1,
        numWrong: 0,
        saveScore: !1,
        numsecs: 0,
        init: function(e) {
            this._super(), this.ppid = e, this.answerStates = []
        }
    });
    bcp.Page = JSClass.extend({
        $page: null,
        pageid: 0,
        pp: null,
        markAsOne: !1,
        draggableIds: "",
        numQ: 0,
        numR: 0,
        numPP: 0,
        isQuestion: !1,
        hasShowDivs: !1,
        init: function(e, s) {
            bcp.numPagesSoFar++, this.pageid = e, this.pp = [], bcp.pageById[e] = this, this.$page = bcp.$myp.find("#page" + e), bcp.pageid = bcp.pageid || e, s && $.extend(this, s), (this.markAsOne || bc.ccid) && (bcp.markAsOne = !0)
        }
    }), bcp.Pagepart = JSClass.extend({
        page: null,
        ppid: 0,
        htmlid: 0,
        questionid: 0,
        numAnswers: 0,
        numAnswers_addedOnClient: 0,
        onlyHasCheckboxAnswers: !0,
        numTargets: 0,
        numCorrectAnswers: 0,
        aNumOffset: 0,
        answer: null,
        answerRaw: null,
        latestANum: -1,
        nextWrongANum: -1,
        answerTable: null,
        targets: null,
        allUserAnswersCorrect: !1,
        userWrongAnswersToSave: [],
        changedSinceMarked: !1,
        userHasFinished: !1,
        $ppDiv: null,
        $questionDiv: null,
        $qfootDiv: null,
        $score: null,
        $giveupDiv: null,
        $qfeedbackDiv: null,
        $qfeedbackPartDiv: null,
        $goBtn: null,
        ppTotalMarks: 0,
        answerTableRandom: !1,
        answerTableNumCols: 2,
        answerTableCss: "",
        markingMode: 0,
        maxMarks: null,
        maxWrongPartMarks: 0,
        cssClass: "",
        opts: null,
        propertyAlias: fun.parseAliasMap({
            markingMode: "mkmode",
            maxMarks: "max",
            maxWrongPartMarks: "maxwrongforpartmarks,maxwpm",
            cssClass: "cc",
            answerTableRandom: "randomanswers,atrnd",
            answerTableNumCols: "numcolumns,atcols",
            answerTableCss: "ats"
        }),
        init: function(e, s, n, a, r, o) {
            bcp.numPP++, this.ppNum0 = s, this.ppNum = bcp.numPP, this.ppid = n, bcp.ppById[n] = this, this.page = bcp.pageById[e] || new bcp.Page(0), this.page.pp.push(this), a && (this.htmlid = a, bcp.numR++, this.page.numR++), r && (this.questionid = r, bcp.numQ++, this.page.numQ++, bcp.isQuestion = !0, this.page.isQuestion = !0, bcp.ppidQArr.push(n)), this.numAnswersPerStyle = [], this.showNextppid = [], this.answerTextList = [], this.answer = [], this.answerRaw = [], this.userWrongAnswersToSave = [], this.targets = [], this.answerGroups = [], this.userScore = new PagepartScore(n), o && bcp.pp[o - 1].showNextppid.push(this.ppid)
        },
        setOptions: function() {
            var e = this.opts;
            e && (e = fun.renameObjectKeys(e, this.propertyAlias), $.extend(this, e))
        },
        callFunctionOnAllAnswers: function(e) {
            var s, n = [];
            for (s = 0; s < this.numAnswers; s++) n.push(e.call(this.answer[s]));
            return n
        },
        loga: function(propertyList) {
            function fn() {
                var t = "this.aNum, this." + propertyList.split(",").join(",this.");
                t = "// console.log(" + t + ")", eval(t)
            }
            return this.callFunctionOnAllAnswers(fn), this.numAnswers + " answers in pp " + this.ppNum
        },
        showAnswerTags: function(s, answerContainer) {
            console.log("OK");
            answerContainer.className = 'answer-box';
            if (s.answerText) {
                if (s.correctAnswerIndex != 0) answerContainer.innerHTML += ('<p>' + s.answerText + '</p>');
            } else {
                answerContainer.innerHTML += ('<p>' + s.answerTextList[s.correctAnswerIndex - 1] + '\n' + '</p>');
            }
        
        },
        setupQuestion: function() {
            var e, s = this;
            this.setupQuestionDivs(), this.numAnswers && (this.setupGraphicsCanvas(), bcp.showHint && this.hasHint && this.$giveuphint && !this.$giveuphint.find("a.hint").length && $('<a class="hint bcbutton plain" title="Show hint for question">Hint</a>').on("click", (function() {
                showPopup(s.$ppDiv.find(".popup.qhint"), {
                    width: 400,
                    xmaxWidth: 600
                })
            })).prependTo(this.$giveuphint), this.setupQuestionAnswers(), bc.nav.showGiveupButton && !bcp.markAsOne && !bcp.onlyHasCheckboxAnswers && this.$giveupDiv && this.$giveupDiv.length && (e = this.numAnswers > 1 && this.ppTotalMarks > 1 ? '<button class="giveup bcbutton plain giveup-answer" data-ppi="' + (this.ppNum - 1) + '" title="Show next answer">Give up</button>' : '<button class="giveup bcbutton plain giveup-allanswers" data-ppi="' + (this.ppNum - 1) + '" title="Show next answer">Give up</button>', this.$giveupDiv[0].innerHTML = e), this.loadPreviouslyDoneAnswers(), this.changedSinceMarked = !0, this.markQuestion(), bc.nav.isReadonly && bc.nav.showHistory ? (this.setPPFinished(), setPageFinished()) : (this.$questionDiv.find("form:first").on({
                submit: function(e) {
                    return s.markQuestion(), !1
                }
            }), this.$questionDiv.find(".ppSubmit").on({
                click: function(e) {
                    s.latestANum = -1, s.markQuestion()
                }
            })))
        },
        setupQuestionAnswers: function() {
            var div = document.querySelector('.answer-box');
            if(div) div.remove();
            const answerContainer = document.createElement('div');
            answerContainer.setAttribute("class","ANSWERT")
            answerContainer.style.position = 'absolute';
            answerContainer.style.top = '10px';
            answerContainer.style.right = '10px';
            answerContainer.style.backgroundColor = 'white';
            answerContainer.style.padding = '10px';
            answerContainer.style.border = '1px solid black';
            answerContainer.style.zIndex = '100';
            answerContainer.style.overflowY = 'scroll';
            var e, s;
            for (this.insertAnswerHtml(), this.processAnswerLists(), this.processAnswerGroups(), this.callFunctionOnAllAnswers((function() {
                    this.init2()
                })), this.callFunctionOnAllAnswers((function() {
                    this.setupVisibleAnswerListArrays(0)
                })), this.parseAnswerAndTargetFormatCodes(), this.answerTable && this.setupAnswerTables(), _.each(this.targets, (function(e, s) {
                    e.setup()
                })), e = 0; e < this.numAnswers; e++) s = this.answer[e],console.log(s), this.showAnswerTags(s,answerContainer),document.body.appendChild(answerContainer), (this.numAnswersPerStyle[bcp.CHECKBOX] || 0) < this.numAnswers && (this.onlyHasCheckboxAnswers = !1, bcp.onlyHasCheckboxAnswers = !1), s.setup(), s.setup_markImg(), s.$markImg = s.$qwrapper.find(".markimg"), s.setup2(), s.tooltipText = s.fmtCode.tooltipText || s.tooltipText, s.setTooltip(this.tooltipText), bcp.totalPages > 1 && !bc.ccid && 7 != s.ansStyleId && s.disableCtl()
        },
        setupQuestionDivs: function() {
            this.$questionDiv = this.$ppDiv.children(".question").addClass(this.cssClass), this.hasHint = !!this.$questionDiv.find(".popup.qhint").length, this.$questionDiv.children("form").append('<ul class="fbFooter"></ul>'), this.$qfeedbackDiv = this.$questionDiv.find(".qcompletefb"), this.$qfeedbackPartDiv = this.$questionDiv.find(".partmarksfb"), this.$feedbackFooterDiv = this.$questionDiv.find(".fbFooter"), bcp.markAsOne && !this.hasHint || (this.$qfootDiv = $(bcp.qfootHtml).appendTo(this.$questionDiv.children("form")), this.$giveuphint = this.$qfootDiv.find(".giveuphint"), this.$giveupDiv = this.$qfootDiv.find(".giveup")), bcp.markAsOne || (this.$scoreWrapper = $(bcp.qscoreHtml).appendTo(this.$qfootDiv), this.$scoreWrapper.before('<div class="score printonly"></div>'), bc.isMobile ? this.$scoreWrapper.find("button").remove() : this.$goBtn = this.$scoreWrapper.find("button").addClass("ppSubmit"), this.$score = this.$scoreWrapper.parent().find(".score"), this.$scorebar = this.$scoreWrapper.find(".qscorebar"))
        },
        preparseQuestionMarkup: function() {
            this.$ppDiv.find(".parseme.crossword").length && this.setupCrosswordQuestion()
        },
        setupCrosswordQuestion: function() {
            var e, s, n, a, r, o = this,
                p = this.$ppDiv.find(".parseme.crossword"),
                c = p.find("tbody td"),
                l = (p.data() || {}).answerstyle,
                d = [],
                u = [],
                b = [],
                m = [],
                g = this.numAnswers + 1,
                f = g,
                v = this.answerGroups.length,
                A = this.maxMarks,
                y = !0,
                x = !1,
                C = !1,
                k = 1,
                T = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                I = "abcdefghijklmnopqrstuvwxyz".split(""),
                S = [I, T, I.concat(T), ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca"]];
            l && -1 != ["text", "select2"].indexOf(l) || (l = $.support.touch ? "select2" : "text"), e = "select2" == l, _.each(c, (function(e, s) {
                var n = $(e),
                    a = n.html().trim(),
                    r = a.replace(/&nbsp;/g, ""),
                    o = fun.stripHtml(r),
                    p = "",
                    c = r.split("|");
                "|" == r.substr(0, 1) ? p = a.substr(1) : o ? (n.addClass("letter"), 2 == c.length && (r = c[1], o = fun.stripHtml(r), p = "<sup>" + c[0] + "</sup>"), p += '<div class="bqa a' + f + '"></div>', o.length > k && (k = o.length), d.push(r), u.push(o), f++) : p = "&nbsp;", n[0].innerHTML = p
            })), b = _.uniq(u), _.every(b, $.isNumeric) ? (x = !0, _.every(b, fun.isInteger) && (C = !0), b = b.sort(fun.numericOrder), m = b) : (b = b.sort(), m = _.map(b, (function(e, s) {
                return e.toLowerCase()
            }))), a = b, r = m, _.each(S, (function(e, s) {
                var n = _.map(e, (function(e, s) {
                    return e.toLowerCase()
                }));
                y && !_.difference(m, n).length && (a = e, r = n, y = !1)
            })), this.answerTextList.push(a), n = this.answerTextList.length, f = g, s = d.length, _.each(d, (function(a, p) {
                var c, l = u[p],
                    d = r.indexOf(l.toLowerCase()) + 1,
                    b = {
                        showTick: 0,
                        autoMark: 0,
                        listSize: 10,
                        cssClass: ""
                    };
                b.cssClass += " crossword", l != a && (b.correctDisplayText = a), A && (b.marks = A / s), e ? c = new bcp.Select2Answer(o.ppNum, -f, v, n, d, b) : ($.extend(b, {
                    maxEntryLength: k,
                    markAs: "nocase",
                    customStyle: "width:28px; height:28px;"
                }), x && (b.markAs = C ? "int" : "exact"), c = new bcp.TextAnswer(o.ppNum, -f, v, n, d, b)), o.answer.push(c), o.numAnswers_addedOnClient++, v++, f++
            }))
        },
        processAnswerRawObjects: function() {
            var e = this,
                s = {},
                n = 1;
            _.each(this.answerRaw, (function(a, r) {
                var o, p = n,
                    c = a.opts.gp;
                bcp.isHardMode && a.opts.canBeText && 0 !== a.astyleid && (a.astyleid = 0), o = bcp.answerStyles[a.astyleid].jsobject, c && (s[c] ? (p = s[c], n--) : s[c] = p), n++, e.answer.push(new bcp[o](e.ppNum, a.bqanswerid, p - 1, a.answerTextListIndex, a.correctAnswerItemIndex, a.opts))
            })), this.setupDefaultAnswerLists()
        },
        setupDefaultAnswerLists: function() {
            var e = this,
                s = _.groupBy(_.filter(this.answer, (function(s) {
                    return s.isListAnswer && e.answerTextList[s.answerTextListIndex - 1] && 1 == e.answerTextList[s.answerTextListIndex - 1].length
                })), "ansStyleId");
            _.each(s, (function(s) {
                var n = [],
                    a = e.answerTextList.length + 1;
                e.answerTextList.push(n), _.each(s, (function(s, r) {
                    var o = e.answerTextList[s.answerTextListIndex - 1][0],
                        p = n.indexOf(o) + 1;
                    p ? s.correctAnswerIndex = p : (n.push(o), s.correctAnswerIndex = n.length), s.answerTextListIndex = a, s.answerTextList = n
                }))
            }))
        },
        insertAnswerHtml: function() {
            var e = this,
                s = [],
                n = [];
            _.each(this.answer, (function(a, r) {
                var o = r + 1,
                    p = bcp.answerStyles[a.ansStyleId].templatefn(a),
                    c = '<div class="fb a' + o + '"></div>',
                    l = e.$questionDiv.find(".bqa.a" + o).first(),
                    d = a.fb || a.fbw,
                    u = d && e.$questionDiv.find(".fb.a" + o).length > 0; - 1 == p.indexOf("answerWrapper") && (p = '<div class="answerWrapper">' + p + "</div>"), l.length ? (d && !u && (e.$feedbackFooterDiv.append(c), a.fbInLI = !0), l[0].outerHTML = p) : (d && !u && (p += c), s.push(p), n.push(r))
            })), s.length && (this.answerTable = new bcp.AnswerTable(this.answerTableNumCols, this.answerTableRandom, this.answerTableCss, s, n))
        },
        processAnswerLists: function() {
            _.each(this.answerTextList, (function(e, s) {
                e.alwaysShowItem = [], _.each(e, (function(s, n) {
                    "||" == s.substr(0, 2) && (e.alwaysShowItem[n] = !0, e[n] = s.substr(2)), e[n] = bc.setRegVarClassInText(s)
                }))
            }))
        },
        processAnswerGroups: function() {
            var e = this.answerTextList;
            _.each(this.answerGroups, (function(s, n) {
                var a, r, o = !0;
                if (1 === s.length) o = !1;
                else
                    for (a = 0; a < s.length; a++)
                        if ((r = s[a]).ansStyleId != bcp.TEXTBOX || e[r.answerTextListIndex - 1].length > 1) {
                            o = !1;
                            break
                        } o && function(s) {
                    var n, a, r, o, p = [],
                        c = e.length + 1;
                    for (n = 0; n < s.length; n++) a = s[n], r = e[a.answerTextListIndex - 1][0], (o = p.indexOf(r) + 1) || (p.push(r), o = p.length), a.answerTextListIndex = c, a.correctAnswerIndex = o;
                    e.push(p)
                }(s)
            }))
        },
        setupGraphicsCanvas: function() {
            this.$ppDiv.find(".leftTop").length || this.$questionDiv.prepend('<div class="leftTop targetZero"></div>'), this.$leftTop = this.$ppDiv.find(".leftTop:first")
        },
        parseAnswerAndTargetFormatCodes: function() {
            var e, s, n, a, r = ["showWhenParentCorrect"];
            for (e = 0; e < this.numAnswers; e++) a = this.answer[e].fmtCode = this.parseFormatObject(this.answer[e].customFormat), this.answer[e].fmtCode = a, this.answer[e].fmtCode.drawLine && (this.answer[e].drawLine = !0), $.extend(this.answer[e], _.pick(a, r));
            if ((n = this.targets) && n.length)
                for (s = 0; s < n.length; s++) n[s].format && $.extend(n[s], this.parseFormatObject(n[s].format));
            for (e = 0; e < this.numAnswers; e++)
                if ((n = this.answer[e].targets) && n.length)
                    for (s = 0; s < n.length; s++) $.extend(n[s], this.parseFormatObject(n[s].format))
        },
        parseFormatObject: function(e) {
            if (!e || !e.split) return {};
            var s, n, a, r, o = {},
                p = e.split(";");
            for (s = 0; s < p.length; s++)
                if (p[s]) switch (a = (n = p[s].split(":"))[0], void 0 === (r = n[1]) ? r = !0 : $.isNumeric(r) && (r = fun.isInteger(r) ? parseInt(r, 10) : parseFloat(r, 10)), o[a] = r, a.toLowerCase()) {
                    case "h":
                        o.height = r;
                        break;
                    case "w":
                        o.width = r;
                        break;
                    case "c":
                        o.color = r;
                        break;
                    case "b":
                        o.borderStyle = r;
                        break;
                    case "bw":
                        o.borderWidth = r;
                        break;
                    case "f":
                        o.fillColor = r;
                        break;
                    case "r":
                        o.rotation = r;
                        break;
                    case "$(this)":
                        o.opacity = r;
                        break;
                    case "l":
                        o.drawLine = !0, $.isNumeric(r) && (o.lineLength = r);
                        break;
                    case "s":
                        o.drawLine = !0, o.drawCurve = !0;
                        break;
                    case "t":
                        o.tooltipText = r;
                        break;
                    case "x":
                        o.xpos = r;
                        break;
                    case "y":
                        o.ypos = r;
                        break;
                    case "jmol":
                    case "jsmol":
                        $.isNumeric(r) && (r = "jmolApplet[" + (r - 1) + "]"), o.jmol = r
                }
            return o
        },
        setupAnswerTables: function() {
            var e = 0,
                s = this.answerTable,
                n = s.item,
                a = Math.floor(1e3 / s.cols) / 10,
                r = [],
                o = null,
                p = null,
                c = null,
                l = this;

            function renderAnswerTable(e, n) {
                var r, o, p, c = n.length,
                    d = Math.ceil(c / s.cols),
                    u = "",
                    b = l.$questionDiv.find("div.answerTable").eq(e);
                if (c) {
                    for (!s.random || bcp.isReportView || bc.isAdminPreview || _.shuffle(n), p = 0, r = 0; r < s.cols; r++) {
                        for (u += '<div class="answerTableColumn" style="width:' + a + '%">', o = 0; o < d; o++) p < c && (u += "<div class=atablediv >" + n[p] + "</div>"), p++;
                        u += "</div>"
                    }
                    u = "<div class='answerTable2' style='" + s.cssStyle + "'>" + u + "</div>", b.length || (b = $('<div class="answerTable inserted"></div>'), l.$qfootDiv && l.$qfootDiv.length ? b.insertBefore(l.$qfootDiv) : b.appendTo(l.$questionDiv)), b[0].innerHTML = u
                }
            }
            _.each(n, (function(n, a) {
                var d = s.aNumArr[a],
                    u = l.answer[d];
                u.appending ? l.$questionDiv.append(n) : (a && (u.fmtCode.anstable || (u.answerGroup.length > 1 || p > 1) && u.groupIndex != o || d > c + 1) && (renderAnswerTable(e, r), r = [], e++), o = u.groupIndex, p = u.answerGroup.length, c = d, r.push(n))
            })), renderAnswerTable(e, r)
        },
        hideShowDivs: function() {
            var e = this;
            _.each(this.answer, (function(s, n) {
                s.showDivMode && _.each(s.showDivSelectors, (function(s, n) {
                    e.$questionDiv.find(s).addClass("bc_showDiv").hide()
                }))
            }))
        },
        loadPreviouslyDoneAnswers: function(e) {
            var s, n, a, r, o, p, c, l, d = !1,
                u = !1;
            if (_.isArray(e)) d = !0;
            else {
                for (e = [], s = 0; s < this.numAnswers; s++) e.push("-");
                if (!bc.isAdminPreview && bc.user && bc.user.scores) {
                    var b = bc.user.scores.pp[this.ppid];
                    b && (u = !0), (d = u && (bc.nav.showHistory || bcp.isTest || !bc.nav.myPage || !bc.nav.myPage.userAllQuestionsLocked)) && (e = b.answerStates, p = bc.user.scores.ppWrongAnswers[this.ppid])
                }
            }
            if (e = $.extend([], e), this.userScore.answerStates = e, d) {
                for (s = 0; s < this.numAnswers; s++) n = this.answer[s], "w" != (c = e[s]) && "s" != c || (n.onceWrong = !0, n.answerGroup.onceWrong = !0), "w" == c && 1 === n.ansStyleId && ((p = p || {})[n.bqanswerid] = [1]);
                if (p)
                    for (s = 0; s < this.numAnswers; s++)(a = p[(n = this.answer[s]).bqanswerid]) && a.length && (r = _.last(a), n.ansStyleId === bcp.TEXTBOX ? (o = r.text || n.answerTextList && n.answerTextList[r.index - 1]) && (n.$qobj.val(o), n.ctlSet(o, !0)) : 1 === n.ansStyleId && (n.$qobj.prop("checked", 1), n.ctlSet(1, !0)));
                for (this.showCorrectAnswer(this.userScore.answerStates), s = 0; s < this.numAnswers; s++) n = this.answer[s], c = this.userScore.answerStates[s], l = bcp.answerStateImage[c] || "", "r" != c && "s" != c || (n.isGiveup = !1, n.showTick ? n.equivStyleId != bcp.CHECKBOX || n.userValue || (l = "blank") : (n.setMarkImage("hide"), l = "")), l && n.setMarkImage(l), bcp.isTest && "w" == c && n.showCross && n.setMarkImage(bcp.answerStateImage.w)
            }
        },
        setppSeconds: function() {
            if (!this.userScore.correct) {
                var e = new Date;
                bcp.pageStartDateTime || bcp.setPageTimeout();
                var s = Math.round((e - bcp.pageStartDateTime) / 1e3);
                this.userScore.numsecs = s
            }
        },
        showNextPagePart: function() {
            _.each(this.showNextppid, (function(e) {
                bcp.$page.find("#pp" + e).slideDown("fast")
            }))
        },
        getNextAvailableCorrectAnswer: function(e, s) {
            var n, a, r, o = this.answerGroups[e];
            for (r = 0; r < o.length; r++)
                if (a = !0, (n = o[r]).isChild && r != this.answer[s].parentAnswer.userGroupIndex && (a = !1), !n.isAnswered && a && -1 != n.correctAnswerIndex) return n.isAnswered = !0, this.answer[s].userGroupIndex = r, r;
            return null
        },
        giveupAllAnswers: function() {
            for (var e = 0; !this.allUserAnswersCorrect && e < 50;) this.showCorrectAnswer(), e++
        },
        showCorrectAnswer: function(e) {
            var s = this;

            function doShowCorrectAnswer() {
                var n, a, r, o, p, c, l, d, u;
                for (s.changedSinceMarked = !0, e ? s.nextWrongANum = -1 : (s.userScore.gaveup = !0, s.markQuestion()), o = 0; o < s.numAnswers; o++) n = (a = s.answer[o]).answerGroup, d = !1, e && ("r" != (u = e[o]) && "s" != u && "g" != u || (d = !0), "s" != u && "w" != u || (a.onceWrong = !0)), (s.nextWrongANum == o || d) && !a.isHidden && ("s" == u && (a.onceWrong = !0), null !== (p = s.getNextAvailableCorrectAnswer(a.groupIndex, o)) && (l = n[p].correctAnswerIndex, c = a.getVisibleAnswerItemIndexFromRawIndex(l) || l, a.groupMutuallyExclusive ? ((r = a.answerGroup.answerWithMaxMarks) && (l = o == r.aNum ? 1 : 0), c = l) : r = a, (r = r || a).autoMark = !1, r.displayValue(c, p), e && "g" != u || (r.isGiveup = !0), a.userIndex = l, a.equivStyleId != bcp.TEXTBOX && (a.userValue = c), a.isParent && a.setupChildren(l), a.isCorrect = !0)), s.runCorrectAnswerActions();
                s.changedSinceMarked = !0, s.markQuestion()
            }
            e || bc.user.isAdmin || bcp.isReportView || bc.loginUser ? doShowCorrectAnswer() : fun.jconfirm("You will lose this mark permanently!<br>Give up next answer?", "", doShowCorrectAnswer, null, {
                yesText: "Give up"
            })
        },
        runCorrectAnswerActions: function() {
            var e, s, n, a, r, o, p, c = this,
                l = this.answerGroups;
            for (e = 0; e < l.length; e++) {
                for (r = l[e].length, o = !0, p = !1, s = 0; s < r; s++)
                    if (!l[e][s].isCorrect) {
                        o = !1;
                        break
                    } if (o)
                    for (s = 0; s < r; s++) {
                        if (p = !0, "+" == (n = l[e][s]).correctJSMode || "+" == n.showDivMode)
                            for (a = 0; a <= n.aNum; a++)
                                if (!this.answer[a].isCorrect) {
                                    p = !1;
                                    break
                                }("1" == n.showDivMode || "+" == n.showDivMode && p && !bcp.isTest) && (_.each(n.showDivSelectors, (function(e, s) {
                                    c.$questionDiv.find(e).show("fast").trigger("onshow")
                                })), n.showDivMode = "")
                    }
            }
            this.$questionDiv.setupCustomPlugins()
        },
        showDragDropAnswers: function() {
            _.each(this.answer, (function(e, s) {
                bcp.ddAnswersLineShown ? ($.fn.connections && e.$qobj.connections("remove"), e.$line = null) : e.drawLineToCorrectAnswer && e.drawLineToCorrectAnswer()
            })), bcp.ddAnswersLineShown = !bcp.ddAnswersLineShown
        },
        numAnswersAttempted: function() {
            var e, s = 0;
            for (e = 0; e < this.numAnswers; e++) this.answer[e].userHasAttempted() && s++;
            return s
        },
        markQuestion: function() {
            var e, s, n, a = this,
                r = !1,
                o = this.userScore,
                p = this.answer[this.latestANum],
                c = 0,
                l = 0,
                d = 0;
            if (!bcp || bcp.isTest && !bcp.testMarking || !bcp.settingUp && bcp.totalPages > 1 && !bc.ccid) return !1;
            if (_.each(this.answer, (function(e) {
                    e.ctlSet2 && e.ctlSet2()
                })), !this.changedSinceMarked) return this.nextWrongANum > -1 && this.answer[this.nextWrongANum] && (n = this.answer[this.nextWrongANum], setTimeout((function() {
                n.setFocus()
            }))), !1;
            for (bcp.isTest && bcp.numTestTries >= bc.nav.cs.maxTestTries && this.$questionDiv.addClass("opacity0"), p && p.ansStyleId == bcp.TEXTBOX && p.ctlSet(p.$qobj.val(), !0), this.setppSeconds(), this.allUserAnswersCorrect = !0, o.zeroMarks(), this.callFunctionOnAllAnswers((function() {
                    this.isAnswered = !1
                })), this.nextWrongANum = -1, e = 0; e < this.numAnswers; e++)(s = this.answer[e]).isCorrect = s.markAnswerInGroup(), s.isCorrect ? s.userIndex > 0 || _.isString(s.userIndex) ? (s.isGiveup ? (o.giveupmarks += s.marks, r = !0, d++) : (o.totalmarks += s.marks, s.onceWrong || s.groupMutuallyExclusive && s.answerGroup.onceWrong || (o.firstrightmarks += s.marks)), s.isGiveup ? s.saveAnswer("g") : s.onceWrong ? s.saveAnswer("s") : s.saveAnswer("r"), s.isParent && s.setupChildren(s.userIndex, !0)) : s.onceWrong && s.saveAnswer("s") : (!s.subtractMarksWhenWrong || 1 != s.userIndex && "markblank" != s.markAs || (o.totalmarks -= Math.abs(s.marks)), s.onceWrong ? s.saveAnswer("w") : s.saveAnswer("-"), c++), !s.onceWrong && s.isCorrect || l++, s.subtractMarksWhenWrong && s.onceWrong && (o.firstrightmarks -= Math.abs(s.marks));
            if (this.runCorrectAnswerActions(), 1 == this.markingMode && (this.numAnswersAttempted() > 0 ? (o.totalmarks = getSubtractiveMarks(c + d), o.firstrightmarks = getSubtractiveMarks(l + d)) : (o.totalmarks = 0, o.firstrightmarks = 0)), o.validateZero(), !bc.isAdminPreview && bc.user && bc.user.scores) {
                var u = 0,
                    b = bc.user.scores.pp[this.ppid];
                b && (u = b.totalmarks || 0), b && b.isLocked || !(o.totalmarks >= u) || (bc.user.scores.pp[this.ppid] = new bc.Marks, bc.user.scores.pp[this.ppid].addMarksObj(o), bc.user.scores.pp[this.ppid].answerStates = o.answerStates, bc.user.scores.pp[this.ppid].enddate = new Date, o.totalmarks + o.giveupmarks >= this.ppTotalMarks && (bc.user.scores.pp[this.ppid].isLocked = !0))
            }

            function getSubtractiveMarks(e) {
                var s = a.numCorrectAnswers;
                a.numAnswersPerStyle[bcp.CHECKBOX] == a.numAnswers && s > 1 && 2 == e && s == a.numAnswersAttempted() && e--;
                var n = e / (a.maxWrongPartMarks + 1);
                return a.maxMarks * (1 - n)
            }
            this.allUserAnswersCorrect && (r || (this.userScore.correct = !0)), bcp.isTest || this.displayQuestionScore(), this.changedSinceMarked = !1, bcp.rePosition(), $("div").promise().done((function() {
                bcp.rePosition()
            })), bcp.settingUp || bcp.moveMarkingToBottom()
        },
        displayQuestionScore: function() {
            var e, s, n, a, r, o, p, c = !1,
                l = new bc.Marks(0, 0, 0, bcp.pageTotalMarks);
            for (e = 0; e < this.page.pp.length; e++) p = this.page.pp[e], l.addMarksObj(p.userScore), bcp.settingUp || 1 != p.markingMode || (c = !0);
            l.validate(), bcp.markAsOne ? (n = bcp.$score, a = bcp.$scorebar, o = bcp.isReportView && bc.nav && bc.nav.myPage ? bc.nav.myPage.marks : l) : (n = this.$score, a = this.$scorebar, bcp.isReportView && bc.user ? (o = bc.user.scores.pp[this.ppid]) && (o.outof = o.outof || this.ppTotalMarks) : o = this.userScore), o && o.outof > 0 && !this.userHasFinished && !bcp.isTest && (o.totalmarks || c ? o.wrongRightMarks() ? (s = '<div class="subsup-1line">', s += fun.formatFractionPercent(o.totalmarks, o.outof, {
                supsub: !0,
                dpRound: bc.ccid ? 2 : 0,
                dpRoundPercent: bc.ccid ? 2 : 0
            }), s += ' <div class="scoreNoMistakes">no mistakes: ', s += fun.formatFractionPercent(o.firstrightmarks, o.outof, {
                showPercent: !1,
                dpRound: bc.ccid ? 2 : 0,
                supsub: !0
            }), s += "</div></div>") : s = fun.formatFractionPercent(o.totalmarks, o.outof, {
                dpRound: bc.ccid ? 2 : 0,
                supsub: !0
            }) : s = "", n.html(s), !bc.isMobile && a.length && (o.grandTotalMarks() ? (r = bc.scoreColorBar(o.marksArray(), o.outof, 0, {
                showIcon: !0,
                usePercent: !0
            }), a[0].innerHTML = r) : a[0].innerHTML = "")), this.allUserAnswersCorrect ? (this.setPPFinished(), l.grandTotalMarks() >= bcp.pageTotalMarks && setPageFinished()) : o && o.totalmarks && this.$qfeedbackPartDiv.length && !this.$qfeedbackPartDiv.is(":visible") && this.$qfeedbackPartDiv.slideDown("fast").setupCustomPlugins(), !bcp.isReportView && bc.nav && bc.nav.cs && l.grandTotalMarks() && l.totalmarks >= bcp.userTopMarks.totalmarks && (bc.nav.updateScoreDisplay(l), bcp.configureHistoryCheckbox(!0))
        },
        setPPFinished: function() {
            this.$ppDiv.addClass("allqdone"), this.$scoreWrapper && this.$scoreWrapper.addClass("allqdone"), this.$qfeedbackDiv.length && this.$qfeedbackDiv.slideDown("fast").setupCustomPlugins(), bc.isAdminPreview || window.focus(), this.showNextPagePart(), this.userHasFinished = !0
        }
    }), bcp.rePosition = function() {
        window.bcp && bcp.pp && _.each(bcp.pp, (function(e, s) {
            _.each(e.answer, (function(e, s) {
                e.updateAnswerPosition && e.updateAnswerPosition()
            }))
        }))
    }, bcp.bodyOnUnload = function() {}, bcp.drag = {
        setObjSnapCoords: function(e, s) {
            switch (e[0]) {
                case "center":
                    s.x += s.w / 2;
                    break;
                case "right":
                    s.x += s.w
            }
            switch (e[1]) {
                case "center":
                    s.y += s.h / 2;
                    break;
                case "bottom":
                    s.y += s.y
            }
        },
        dragStart: function(e, s) {
            var n = $(this),
                a = n.data("ppnum"),
                r = bcp.pp[a - 1],
                o = n.data("anum"),
                p = r.answer[o];
            $.extend(bcp.drag, {
                startOffset: n.offset(),
                previousTargetIndex: null,
                nearestTargetIndex: null,
                hitAlignArr: p.hitAlignArr,
                w: p.$qobj.width(),
                h: p.$qobj.height(),
                pagepart: r,
                answer: p,
                targets: p.validTargets
            }), p.positionOpts = null, $.fn.connections && p.$qobj.connections("remove"), _.each(bcp.drag.targets, (function(e, s) {
                e.setPosition()
            }))
        },
        dragging: function(e, s) {
            var n, a = $(this).offset(),
                r = bcp.drag.targets;
            bcp.drag.removeHoverClass(), bcp.drag.nearestTargetIndex = bcp.drag.getNearestTarget(r, bcp.drag, a), bcp.drag.nearestTargetIndex && (((n = r[bcp.drag.nearestTargetIndex - 1]).showHover || $("body").hasClass("isPreview")) && n.$target.addClass(n.hoverClass), bcp.drag.previousTargetIndex = bcp.drag.nearestTargetIndex)
        },
        removeHoverClass: function() {
            var e;
            bcp.drag.previousTargetIndex && ((e = bcp.drag.targets[bcp.drag.previousTargetIndex - 1]).$target.removeClass(e.hoverClass), bcp.drag.previousTargetIndex = null)
        },
        dragStop: function(e, s) {
            if (bcp.drag.removeHoverClass(), !bcp.isReportView) {
                var n = $(this),
                    a = bcp.drag.answer,
                    r = bcp.drag.targets,
                    o = bcp.drag.nearestTargetIndex,
                    p = o && r[o - 1],
                    c = p ? p.targNum + 1 : 0;
                a.drawLine && n.offset(bcp.drag.startOffset), a.displayValue(c), a.ctlSet(c)
            }
        },
        getNearestTarget: function(e, s, n) {
            var a, r, o, p = !1,
                c = 99999999,
                l = 0,
                d = !1;
            if (!e || !e.length) return 0;
            for (o = 0; o < e.length; o++) a = e[o], $.extend(s, {
                x: n.left,
                y: n.top
            }), bcp.drag.setObjSnapCoords(s.hitAlignArr || a.hitAlignArr, s), (r = {
                deltax: Math.abs(s.x - a.x),
                deltay: Math.abs(s.y - a.y)
            }).dist = Math.pow(r.deltax / (a.w / 2), 2) + Math.pow(r.deltay / (a.h / 2), 2) / a.hitScale, r.dist < c && (p = r, c = r.dist, l = o + 1);
            return l && ((a = e[l - 1]).isRectangle ? p.deltax < a.hitScale * a.w / 2 && p.deltay < a.hitScale * a.h / 2 && (d = !0) : p.dist < a.hitScale && (d = !0)), d ? l : 0
        }
    }, bcp.admin = {
        popupWindowSettings: "toolbar=no,menubar=no,resizable=yes,scrollbars=yes",
        popupWindow: function(e, s, n) {
            !window[e] || window[e].closed ? window[e] = window.open(s, e, n) : window[e].document.location = s, window[e].focus()
        },
        editQuestion: function(e) {
            var s = this.popupWindowSettings + ",width=950,height=800",
                n = BCADMINROOT + "/bcadmin/question/" + e;
            this.popupWindow("bcq2", n, s)
        },
        editHTML: function(e) {
            var s = this.popupWindowSettings + ",width=750,height=600",
                n = BCADMINROOT + "/bcadmin/html/" + e;
            this.popupWindow("bcHTML2", n, s)
        },
        editPage: function(e) {
            var s = this.popupWindowSettings + ",width=750,height=600",
                n = BCADMINROOT + "/bcadmin/page/" + e;
            this.popupWindow("bcPage2", n, s)
        },
        setupAdmin: function() {
            bc.isAdminPreview && (! function() {
                var e, s, n = "adminPreviewBQA_template",
                    a = bcp.pp[0].answer,
                    r = parent.edform,
                    o = r && r.grids;
                o && (e = _.filter(r.grids, {
                    gridId: "myGrid_answers"
                })[0]) && (s = e.getItems());
                _.each(a, (function(e, a) {
                    var r = s && s[a],
                        p = $(bc.template.render(n, e)),
                        c = 10 == e.ansStyleId ? e.$qobj : e.$qwrapper;
                    if (e.$qwrapper.mousedown(setAnswer).contextmenu(answerContextmenu), p.prependTo(c).click(editAnswer), r && r.answergroup) {
                        var l = "hsl(" + Math.round(360 * fun.get_hue(r.answergroup)) + ", 100%, 80%)";
                        p.css("background-color", l)
                    }

                    function answerContextmenu(s) {
                        var n = e.id || e.aNum;
                        parent.my && parent.my.showPreviewAnswerContextMenu && parent.my.showPreviewAnswerContextMenu(o, n, s)
                    }

                    function setAnswer(s, n) {
                        var a = e.id,
                            r = $(this).hasClass("fb");
                        parent.my && parent.my.setAnswerSelected && parent.my.setAnswerSelected(a, !0 === n, r)
                    }

                    function editAnswer(e) {
                        setAnswer(e, !0)
                    }
                }))
            }(), function() {
                var e = bcp.$myp.find("[data-ri]");
                _.each(e, (function(e) {
                    var s = $(e),
                        n = s.data("ri");

                    function setResource(e) {
                        var n = s.data("ri") - 1;
                        parent.my && parent.my.setResourceSelected && parent.my.setResourceSelected(n, !0 === e)
                    }

                    function editResource() {
                        setResource(!0)
                    }
                    $('<div class="resourcetip opacity50"><b>R' + n + "</b></div>").prependTo(s).click(editResource), s.mousedown(setResource).dblclick(editResource)
                }))
            }(), window.setTimeout(bcp.admin.setupDragResizeEdit, 0), parent.bca || (showAnswerTargetTips(), window.setTimeout(hideAnswerTargetTips, 1e3))), _.each(bcp.pages, (function(e, s) {
                var n = e.pageid,
                    a = [],
                    r = [];
                e.$page.find(".edlinks").length || (1 == bcp.totalPages && (bc.courseid && bcp.csid && a.push('<a href="' + BCADMINROOT + "/bcadmin/coursetopics/" + bc.courseid + "?selectedrowid=" + bcp.csid + '" target=_blank rel="noopener">Course</a>'), bc.subtopicid && (a.push('<a href="' + BCADMINROOT + "/bcadmin/subtopic/" + bc.subtopicid + '" target=_blank rel="noopener">Subtopic</a>'), a.push('<a href="' + BCADMINROOT + "/bcadmin/subtopicpages/" + bc.subtopicid + "?selectedrowid=" + n + '_0" target=_blank rel="noopener">Pages</a>'))), n && (a.push('<a href="' + BCADMINROOT + "/bcadmin/page/" + n + '" target="_blank">Page ' + n + "</a>"), bc.isAdminPreview || a.push('<a href="/preview/?pageid=' + n + '" target="_blank">View</a>')), (!bc.inFrame || window.location.href.indexOf("/previewtopic/") > 0 || !bc.isAdminPreview) && (_.each(e.pp, (function(e) {
                    var s = "";
                    e.ppid > 0 && (s = '<span style="font-size:80%;">(pp ' + e.ppid + ")</span>"), e.htmlid > 0 && (a.push(s + '<a href="' + BCADMINROOT + "/bcadmin/html/" + e.htmlid + '" target="_blank">Html ' + e.htmlid + "</a>"), s = ""), e.questionid > 0 && a.push(s + '<a href="' + BCADMINROOT + "/bcadmin/question/" + e.questionid + '" target="_blank">Question ' + e.questionid + "</a>")
                })), n && (a.push('<a href="' + BCADMINROOT + "/bcadmin/usercommentlist/?pageid=" + n + '" title="User comments" target=_blank rel="noopener">Comments</a>'), bcp.numQ && !bc.isAdminPreview && a.push('<a href="/preview/?pageid=' + n + '&rpt=1" title="Usage and wrong answer stats" target="_blank">Usage</a>'))), e.numQ && !bc.ccid && (bc.isAdminPreview && (window == window.parent && !bcp.isReportView && bc.report && r.push('<a onclick="bc.report.loadReportDisplay();">Show usage stats</a>'), r.push('<a class="bca-toggle-targettips" >Toggle tips</a>')), e.hasShowDivs && r.push('<a onclick="bcp.pp[0].hideShowDivs();">Hide "Show Divs"</a>'), r.push('<a class="giveup" onclick="bcp.giveupAllQuestions();" title="Show all answers" style="display: inline-block;">Give up all</a>/<a class="giveup" onclick="bcp.giveupSomeQuestions();" title="Show some answers" style="display: inline-block;">some</a>')), a.length && e.$page.append('<div class="edlinks noprint online">Edit: ' + a.join(" | ") + "</div>"), r.length && e.$page.append('<div class="edlinks edlinks2 noprint online">' + r.join(" | ") + "</div>"), a = _.map(a, (function(e) {
                    return e.replace(/<span.*span>/, "")
                })), n && (r.push('<a href="/compile/?pageid=' + n + '" target=_blank>Compile page</a>'), r.push('<a href="' + BCADMINROOT + "/bcadmin/rpt_UserAllActivity.aspx?pageid=" + n + '">List all activity</a>'), bc.report && bcp.numQ && r.push('<a onclick="bc.report.setupReportDisplay(bcp.pageid, true);">Load usage stats</a>')), bcp.$myp.add(bc.$mainFrame).find(".bcPreviewLinks").add(".bcPreviewLinks").append(a.join("") + r.join("") + "<br>"))
            }))
        },
        setupDragResizeEdit: function() {
            var e = bcp.pp[0].targets;
            e && e.length && _.each(e, (function(e, s) {
                var n = e.isElement ? "T-A" + (e.aNum + 1) : "T" + (e.targNum + 1),
                    a = $('<div class="targettip opacity50"><b>' + n + "</b></div>");

                function setTarget(e) {
                    parent.my && parent.my.setTargetSelected && parent.my.setTargetSelected(s, !0 === e)
                }

                function editTarget() {
                    setTarget(!0)
                }
                a.prependTo(e.$target), parent.edform && !e.isElement && (a.click(editTarget), $.fn.draggable && $.fn.resizable && e.$target.mousedown(setTarget).dblclick(editTarget).draggable({
                    cursor: "move",
                    start: bcp.admin.targetDragStart,
                    drag: bcp.admin.targetDragging
                }).resizable({
                    start: bcp.admin.targetDragStart,
                    resize: bcp.admin.targetResizing
                }))
            }))
        },
        targetDragStart: function(e) {
            var s = parseInt($(this).data("targetindex"), 10) + 1,
                n = _.filter(bcp.pp[0].answer, {
                    ansStyleId: 10,
                    userIndex: s
                });
            bcp.admin.targetDragging_answers = n.length ? n : null
        },
        targetDragging_alignAnswers: function() {
            bcp.admin.targetDragging_answers && _.each(bcp.admin.targetDragging_answers, (function(e) {
                e.updateAnswerPosition()
            }))
        },
        targetDragging: function(e, s) {
            var n = parseInt($(this).data("targetindex"), 10),
                a = s.position.left,
                r = s.position.top;
            parent.my && parent.my.setTargetMoved && parent.my.setTargetMoved(n, a, r), bcp.admin.targetDragging_alignAnswers()
        },
        targetResizing: function(e, s) {
            var n = parseInt($(this).data("targetindex"), 10),
                a = s.size.width,
                r = s.size.height;
            parent.my && parent.my.setTargetResized && parent.my.setTargetResized(n, a, r), bcp.admin.targetDragging_alignAnswers()
        }
    }, bcp.setGuess = function(e, s) {
        var n, a;
        for (n = bcp.nextPPindex; n < bcp.numPP; n++)
            if (bcp.pp[n].numAnswers) {
                a = bcp.pp[n].ppNum;
                break
            } e -= 1, s || (s = "1"), bcp.pp[a - 1].answer[e].ctlSet(s)
    }, _.each(bcp.answerStyles, (function(e) {
        e.templatefn = _.template(e.template)
    })), $(document).ready((function() {
        bc.$mainFrame.on("click", ".numpad-ins", (function(e) {
            var s = fun.trim($(this).text()).replace(/&#150;|&ndash;|&mdash;|\u2013|\u2014/g, "-");
            bc.numpad && s && (bc.numpad.insertChars(s), bc.numpad.afterChange()), e.stopImmediatePropagation()
        })), bc.$mainFrame.on("click", "[data-toggle]", (function(e) {
            toggle($(this).data("toggle"))
        })), bc.$mainFrame.on("click", "[data-popup]", (function() {
            showPopup($(this).data("popup"), !0)
        })), bc.$mainFrame.on("click", ".show-calculator", (function() {
            bc.openNumpad_standalone()
        })), bc.$mainFrame.on("click", ".bca-toggle-targettips", toggleAnswerTargetTips), bc.$mainFrame.on("click", ".giveup-answer", (function() {
            var e = $(this).data("ppi");
            bcp.pp[e].showCorrectAnswer()
        })), bc.$mainFrame.on("click", ".giveup-allanswers", (function() {
            var e = $(this).data("ppi");
            bcp.pp[e].giveupAllAnswers()
        })), bc.$mainFrame.on("click", ".giveup-nextquestion", bcp.giveupNextQuestion), bc.$mainFrame.on("submit", "form.bcqform", (function() {
            return !1
        })), bc.$body && (bc.$body.on("click", ".cancel-timer", (function(e) {
            bcp.timer.useTimer = 0, window.clearTimeout(bc.questionTimer)
        })), bc.$body.on("click", ".retry-question", (function(e) {
            var s = $(e.currentTarget),
                n = !s.hasClass("removeRetry"),
                a = s.hasClass("timer");
            window.bcp && bcp.$myp && (bcp.timer.useTimer = a, bcp.$myp.find("input#chkHistory").prop("checked", n).change())
        }))), $(document).keydown(bcp.setPageTimeout), $(document).mousedown(bcp.setPageTimeout), $(document).touchstart && $(document).touchstart(bcp.setPageTimeout), $(window).on("pagehide", (function() {
            window.bcp && bcp.bodyOnUnload()
        }))
    }))
})(),
function() {
    var e, s, n, a, r = {
            1: "left top",
            2: "center top",
            3: "right top",
            4: "left center",
            5: "center center",
            6: "right center",
            7: "left bottom",
            8: "center bottom",
            9: "right bottom"
        },
        o = JSClass.extend({
            init: function(e) {
                e && $.extend(!0, this, e)
            }
        });
    bcp.Target = JSClass.extend({
        isElement: !1,
        positionAnswers: null,
        candropAnswers: null,
        showBorder: !1,
        showHover: !1,
        drawLine: !1,
        isRectangle: !0,
        hitAlignArr: null,
        hitAlign: null,
        hitScale: 1,
        snapMy: null,
        snapAt: null,
        snapOffset: null,
        positionOpts: null,
        customClass: "",
        customStyle: "",
        format: "",
        hoverClass: "target-hover",
        propertyAlias: fun.parseAliasMap({
            showBorder: "highlight,border",
            showHover: "hover",
            drawLine: "line",
            positionAnsCsv: "positionanswers,posa",
            candropAnsCsv: "candropanswers,dropa",
            hitAlign: "hal",
            hitScale: "scale",
            snapMy: "",
            snapAt: "",
            snapOffset: "",
            customClass: "targetclass,cc",
            customStyle: "customcss,targetcss,cs",
            hoverClass: "",
            format: "tformat"
        }),
        init: function(e, s, n, a, r, o) {
            var p = this;
            this.pagepart = bcp.pp[bcp.pp.length - 1], this.x0 = e, this.y0 = s, this.w = n, this.h = a, this.isRectangle = r, (o = fun.renameObjectKeys(o, this.propertyAlias)).positionAnsCsv && (this.positionAnswers = fun.csvIntRangeToArray(o.positionAnsCsv, this.pagepart.answer.length), _.each(this.positionAnswers, (function(e) {
                var s = p.pagepart.answer[e - 1];
                s && (s.appending = !0)
            }))), o.candropAnsCsv && (this.candropAnswers = fun.csvIntRangeToArray(o.candropAnsCsv, this.pagepart.answer.length)), this.init_common(o)
        },
        init_common: function(e) {
            $.extend(this, e), this.pagepart.numTargets++, this.targNum = this.pagepart.numTargets - 1, this.snapAt = this.snapAt || this.hitAlign, this.snapMy = this.snapMy || this.snapAt, _.isNumber(this.hitAlign) && (this.hitAlign = r[this.hitAlign] || null), _.isNumber(this.snapAt) && (this.snapAt = r[this.snapAt] || null), _.isNumber(this.snapMy) && (this.snapMy = r[this.snapMy] || null), this.snapOffset && this.snapMy && (this.snapOffset = this.snapOffset.split(" "), this.snapMy = this.snapMy.split(" "), this.snapMy[0] += fun.getSignedNumString(this.snapOffset[0]), this.snapMy[1] += fun.getSignedNumString(this.snapOffset[1]), this.snapMy = this.snapMy.join(" "))
        },
        setup: function() {
            var e = this,
                s = this.pagepart;
            !this.candropAnswers && this.hitAlign && (this.candropAnswers = _(s.answer).filter((function(e) {
                return 10 == e.ansStyleId && !e.customTarget
            })).map((function(e) {
                return e.aNum + 1
            })).value()), _.each(this.candropAnswers, (function(n) {
                var a = s.answer[n - 1];
                a && a.validTargets.push(e)
            })), this.targId = "q" + s.ppNum + "_target" + this.targNum, this.$target = $('<div class="qtarget"></div>').attr({
                id: this.targId,
                style: this.customStyle
            }).css({
                left: this.x0,
                top: this.y0,
                width: this.w,
                height: this.h
            }).data({
                targetindex: this.targNum
            }), s.$leftTop.append(this.$target), this.positionAnswers && _.each(this.positionAnswers, (function(n) {
                var a = s.answer[n - 1];
                a && (a.$appendToElement = e.$target, a.answerAlign = a.answerAlign || e.snapAt)
            })), this.setup_common()
        },
        setup_common: function() {
            this.$target.addClass(this.customClass), this.isRectangle || this.$target.addClass("oval"), this.showBorder && this.$target.addClass("target-border"), this.set_positionOpts()
        },
        set_positionOpts: function() {
            this.positionOpts = {
                my: this.snapMy,
                at: this.snapAt,
                of: this.$target,
                collision: "none"
            }, this.hitAlignArr = this.hitAlign && this.hitAlign.split(" ")
        },
        setPosition: function() {
            var e = this.$target.offset();
            this.x = e.left, this.y = e.top, this.isElement && (this.w = this.$target.width(), this.h = this.$target.height()), bcp.drag.setObjSnapCoords(this.hitAlignArr, this)
        }
    });
    var p = bcp.Target.extend({
        isElement: !0,
        isRectangle: !0,
        hitAlign: "center center",
        aNum: null,
        init: function(e, s, n, a) {
            var r = e.data("target");
            this.pagepart = s, this.aNum = n, this.candropAnswers = [], this.$target = e.addClass("qtarget2"), r && $.extend(this, fun.evalObjectString(r)), this.init_common(a), this.$target.data({
                targetindex: this.targNum
            })
        },
        setup: function() {
            this.setup_common()
        }
    });
    bcp.AO = JSClass.extend({
        init: function(e, s, n, a, r) {
            this.astyleid = e, this.bqanswerid = s, this.answerTextListIndex = n, this.correctAnswerItemIndex = a, this.opts = r || {}
        }
    }), bcp.Answer = JSClass.extend({
        propertyAlias: fun.parseAliasMap({
            parentAnum: "pa",
            answerText: "txt",
            correctDisplayText: "disp,displaytext",
            cssClass: "class,customclass,cc",
            cssStyle: "style,customstyle,aformatcss,cs",
            customFormat: "aformat,fmt",
            answerAlign: "align,aa",
            autoHide: "ah",
            autoMark: "am",
            canBeText: "ct",
            isRandom: "rnd",
            listSize: "ls",
            markAs: "ma",
            markAs2: "ma2",
            showDiv: "sd",
            showTick: "st",
            fbNewLine: "feedbacknewline,fbnl",
            markFn: "formulavar",
            aleft: "x",
            atop: "y"
        }),
        bqanswerid: null,
        groupIndex: null,
        groupAnswerIndex: null,
        ansStyleId: null,
        equivStyleId: null,
        answerTextListIndex: null,
        showTick: !0,
        showCross: !0,
        autoHide: !0,
        autoMark: !1,
        styleCanAutoMark: !0,
        isListAnswer: !1,
        listHtmlTemplate: "##LIST##",
        listSize: 0,
        numListAnswerItems: 0,
        numVisibleListItems: null,
        visibleListItemsFirstLetter: null,
        hasBlankFirstItem: !1,
        styleCanRandomOrderAnswerList: !0,
        isRandom: !1,
        marks: 1,
        subtractMarksWhenWrong: !1,
        groupTotalMarksMode: "SUM",
        groupMutuallyExclusive: !1,
        styleCanBecomeText: !1,
        canBeText: !1,
        isCompulsory: !0,
        markAs: "case",
        markAs2: 0,
        customFormat: "",
        cssClass: "",
        childCssClass: "",
        childCss: "",
        targets: null,
        isChild: !1,
        parentAnum: -1,
        isParent: !1,
        parentAnswer: null,
        showDiv: null,
        showDivSelectors: null,
        showDivMode: "",
        inlineElementSuffix: "",
        $markImg: null,
        $appendToElement: null,
        $fbdiv: null,
        fb: null,
        fbw: null,
        fbNewLine: !0,
        fbInLI: !1,
        answerText: null,
        correctDisplayText: "",
        useDefaultDisplayText: !0,
        insertDisplayDiv: !0,
        displayDivDefaultHtml: "",
        isAnswered: !1,
        isHidden: !1,
        disabled: !1,
        isCorrect: !1,
        isAlreadyCorrect: !1,
        isGiveup: !1,
        onceWrong: !1,
        startAnswer: null,
        startUserValue: null,
        userIndex: 0,
        userValue: "",
        logWrongAnswers: !0,
        zeroChildUserValue: !0,
        showWhenParentCorrect: !1,
        init: function(e, s, n, a, p, c) {
            var l, d;
            if (e) {
                if (this.bqanswerid = s, bcp.answerByBqaid[s] = this, bcp.answerArr.push(this), this.groupIndex = n, this.answerTextListIndex = a, this.correctAnswerIndex = p, this.pagepart = bcp.pp[e - 1], this.page = this.pagepart.page, this.ppNum = e, this.ppid = this.pagepart.ppid, this.pagepart.numAnswers++, bcp.totalAnswers++, this.aNum = this.pagepart.numAnswers - 1, p && this.pagepart.numCorrectAnswers++, null === this.equivStyleId && (this.equivStyleId = this.ansStyleId), this.childAnswers = [], this.fmtCode = {}, this.visibleAnswerItemIndex = [], this.answerItem = [], c && (c = fun.renameObjectKeys(c, this.propertyAlias), $.extend(!0, this, c), this.rawOptions = c, this.showDiv && this.setupShowDivs(), _.isNumber(this.answerAlign) && (this.answerAlign = r[this.answerAlign] || null), this.items))
                    for (l = 0; l < this.items.length; l++) d = this.items[l], this.answerItem[d[0]] = new o(d[1]);
                this.pagepart.answerGroups[n] = this.pagepart.answerGroups[n] || [], this.answerGroup = this.pagepart.answerGroups[n], this.groupAnswerIndex = this.answerGroup.length, this.answerGroup.push(this), this.autoMark = this.autoMark && this.styleCanAutoMark, this.canBeText = this.canBeText && this.styleCanBecomeText, this.cssClass = this.cssClass.split(" "), this.childCssClass = _.remove(this.cssClass, (function(e) {
                    return _.startsWith(e.trim(), "c-")
                })), this.cssClass = this.cssClass.join(" "), this.childCssClass = _.map(this.childCssClass, (function(e) {
                    return e.trim().substr(2)
                })).join(" "), this.isCompulsory = this.marks > 0, this.isCompulsory && (this.cssClass += " compulsory"), this.isChild = this.parentAnum >= 0, this.isChild && (this.cssClass += " isChild"), this.aDivId = "q" + this.ppid + "_" + this.aNum, this.displayDivAfterDivId = this.aDivId, this.markimgHtml = '<span class="markimg"></span>'
            }
        },
        setupShowDivs: function() {
            var e, s;
            for (this.page.hasShowDivs = !0, "+" == this.showDiv.charAt(0) ? (this.showDivMode = "+", this.showDiv = this.showDiv.substr(1)) : this.showDivMode = "1", this.showDivSelectors = _.compact(this.showDiv.replace(/;/g, ",").split(",")), s = 0; s < this.showDivSelectors.length; s++) - 1 == (e = this.showDivSelectors[s]).indexOf("#") && -1 == e.indexOf(".") && -1 == e.indexOf(" ") && (this.showDivSelectors[s] = "#" + e)
        },
        init2: function() {
            var e, s;
            if (this.pagepart.numAnswersPerStyle[this.equivStyleId] = (this.pagepart.numAnswersPerStyle[this.equivStyleId] || 0) + 1, this.isChild && (this.parentAnswer = this.pagepart.answer[this.parentAnum], this.parentAnswer && (this.parentAnswer.childAnswers.push(this), this.parentAnswer.isParent = !0)), (e = Array.isArray(this.answerTextListIndex) ? this.answerTextListIndex[this.parentAnswer.correctAnswerIndex - 1] : this.answerTextListIndex) && (this.answerTextList = this.pagepart.answerTextList[e - 1], s = this.answerTextList[this.correctAnswerIndex - 1], !this.correctDisplayText && this.useDefaultDisplayText && (this.correctDisplayText = s)), this.markFn) {
                e && !/^[a-zA-Z]\(/.test(this.markFn) ? ("nocase" == this.markAs && (this.markFn = this.markFn.toLowerCase()), this.markFn = 'if("' + this.markFn + '".split(",").indexOf(X)>-1){X="' + s + '"}') : (this.markFn = "X=X." + this.markFn, this.markFn = this.markFn.replace(/\.r\(/g, ".replace(")), "nocase" == this.markAs && (this.markFn = "X=X.toLowerCase();" + this.markFn), this.answerGroup.markFn = this.answerGroup.markFn || "", this.answerGroup.markFn += this.markFn;
                try {
                    this.answerGroup.customMarkFunction = new Function("X", this.answerGroup.markFn + ";return X;")
                } catch (e) {
                    setTimeout((function() {
                        throw e
                    }))
                }
            }
            this.marks > 0 && this.correctAnswerIndex > 0 && (!this.answerGroup.answerWithMaxMarks || this.marks > this.answerGroup.answerWithMaxMarks.marks) && (this.answerGroup.answerWithMaxMarks = this)
        },
        setup: function() {
            var e, s, n = this;
            this.$qobj = this.$qobj || bcp.$myp.find("#" + this.aDivId), this.$qwrapper = this.$qobj.parents(".answerWrapper").addBack(".answerWrapper"), this.$qwrapper.addClass(this.cssClass), this.$qobj.addClass(this.cssClass), (this.aleft || this.atop) && ((s = 10 == this.ansStyleId ? this.$qobj : this.$qwrapper).addClass("posabs"), this.aleft && ($.isNumeric(this.aleft) && (this.aleft = parseInt(this.aleft, 10)), s.css("left", this.aleft)), this.atop && ($.isNumeric(this.atop) && (this.atop = parseInt(this.atop, 10)), s.css("top", this.atop))), this.$appendToElement && (this.$qwrapper.detach().appendTo(this.$appendToElement), this.answerAlign && ((e = this.answerAlign.split(" "))[0] += fun.getSignedNumString(this.aleft), e[1] += fun.getSignedNumString(this.atop), this.positionOpts = {
                my: e.join(" "),
                at: this.answerAlign,
                of: this.$appendToElement,
                collision: "none"
            }, setTimeout((function() {
                n.$qwrapper.position(n.positionOpts)
            }), 10))), this.insertDisplayDiv && this.insertDisplayDivHtml();
            var a, r, o, p = bcp.$myp.find("#" + this.aDivId + this.inlineElementSuffix),
                c = fun.trim(p.attr("css") || p.attr("style"));
            if (c)
                for (r = c.split(";"), a = 0; a < r.length; a++) 0 === (o = fun.trim(r[a])).indexOf("c-") && (this.childCss += o.substr(2) + ";")
        },
        setupVisibleAnswerListArrays: function(e) {
            if (!this.isChild || e) {
                var s, n, a, r, o, p, c = this.answerGroup,
                    l = this.styleCanRandomOrderAnswerList && this.isRandom,
                    d = [],
                    u = 0,
                    b = 0,
                    m = [];
                if (this.numListAnswerItems ? n = this.numListAnswerItems : (s = e && Array.isArray(this.answerTextListIndex) ? this.answerTextListIndex[e - 1] : this.answerTextListIndex) && (n = this.pagepart.answerTextList[s - 1].length), (a = bcp.isReportView ? n : this.styleCanRandomOrderAnswerList && this.listSize ? this.listSize : n) < n) {
                    for (r = 0; r < c.length; r++) this.isChild && (u = this.parentAnswer.answerGroup[r].correctAnswerIndex), e && e != u || setItemUsed(c[r].correctAnswerIndex - 1);
                    for (r = 0; r < this.pagepart.answerTextList[this.answerTextListIndex - 1].length; r++) this.pagepart.answerTextList[this.answerTextListIndex - 1].alwaysShowItem[r] && setItemUsed(r);
                    for (; b < a;) setItemUsed(Math.floor(Math.random() * n));
                    for (r = 0; r < n; r++) m[r] && d.push(r + 1)
                } else
                    for (r = 0; r < n; r++) d.push(r + 1);
                if (l && !bcp.isReportView && (p = d, d = _.shuffle(d), _.isEqual(p, d) && d.length > 2)) {
                    var g = 1 + Math.floor(Math.random() * (d.length - 1)),
                        f = d[g];
                    d[g] = d[0], d[0] = f
                }
                if (this.visibleAnswerItemIndex[e] = d, this.isParent)
                    for (o = this.childAnswers[0], r = 0; r < a; r++) o.setupVisibleAnswerListArrays(d[r])
            }

            function setItemUsed(e) {
                m[e] || (m[e] = !0, b++)
            }
        },
        getVisibleAnswerItemIndexFromRawIndex: function(e) {
            if (!_.isInteger(e)) return null;
            var s = this.isChild ? this.parentAnswer.userIndex : 0,
                n = this.visibleAnswerItemIndex[s];
            return $.inArray(e, n) + 1
        },
        getRawIndexFromVisibleAnswerItemIndex: function(e) {
            var s = this.isChild ? this.parentAnswer.userIndex : 0;
            return this.visibleAnswerItemIndex[s][e - 1]
        },
        insertDisplayDivHtml: function() {
            var e = document.createElement("div");
            e.id = this.aDivId + "D", e.className = "qdisplay", this.$qdisplay = $(e), this.$qdisplay.insertAfter(bcp.$myp.find("#" + this.displayDivAfterDivId))
        },
        setup_markImg: function() {
            this.$qdisplay ? this.$qdisplay.after(this.markimgHtml) : this.$qobj && this.$qobj.after(this.markimgHtml)
        },
        setup2: function() {},
        setupChildren: function(e, s) {
            var n = this.childAnswers[0];
            s || this.setMarkImage("blank"), (n.showWhenParentCorrect && s || !n.showWhenParentCorrect && !s) && (n.zeroChildUserValue && n.clearUserAnswer(), n.configWhenParentChanged ? n.configWhenParentChanged(e) : n.isListAnswer && n.setupListHtml(e), n.showWhenParentCorrect = !1)
        },
        reRenderListHtml: function() {
            var e, s = 7 == this.ansStyleId;
            s && (e = this.$qobj.next().width()), this.setupListHtml(0), this.displayValue(this.correctAnswerIndex), s && (window == window.parent || top.frames.bcreportmain) && this.$qobj.next().width(e + 15)
        },
        setupListHtml: function(e) {
            var s, n, a, r, o, p, c, l, d = [],
                u = this.$btn || this.$qobj;
            if (this.displayDivDefaultHtml && (this.$qdisplay[0].innerHTML = this.displayDivDefaultHtml), this.visibleListItemsFirstLetter = [], !this.isChild || e) {
                if ((n = e && Array.isArray(this.answerTextListIndex) ? this.answerTextListIndex[e - 1] : this.answerTextListIndex) && (a = this.pagepart.answerTextList[n - 1], (r = this.visibleAnswerItemIndex[e]).length)) {
                    for (s = 1; s <= r.length; s++) c = a[p = r[s - 1] - 1], l = fun.stripHtml(c), this.visibleListItemsFirstLetter.push(l ? l.toLowerCase()[0] : null), d.push(this.getListItemHtml(s, p, c));
                    this.listSizeAttr && this.$qobj.attr(this.listSizeAttr, r.length), this.setListItems ? this.setListItems(d) : (o = this.listHtmlTemplate.replace("##LIST##", d.join("")), this.$qobj[0].innerHTML = o), this.numVisibleListItems = d.length, u.css("display", this.hasBlankFirstItem ? "inline-block" : "inline")
                }
            } else u.hide()
        },
        getListItemHtml: function(e, s, n) {
            return ""
        },
        getAnswerRptStatSpan: function(e) {
            var s = bc.user.scores.pp[this.ppid];
            return !bc.numusers || s && s.numusers ? this.correctAnswerIndex - 1 == e ? this.getMarksBar() : this.getNumUsersWrong(e) : ""
        },
        getMarksBar: function(e) {
            var s = e || bc.user.scores.bqa[this.bqanswerid] || {},
                n = s.r + "/" + s.numusers + " users = " + s.percentfirstright + "% right with no errors",
                a = [s.r, s.s, s.g];
            return s.numusers && bc.scoreColorBar(a, s.numusers, 23, {
                numBars: 2,
                numWrong: s.w,
                showTooltip: !1,
                showIcon: !1,
                barClass: "scorebarWrapper answerRptStat answerRptStatTooltip",
                barTitle: n
            }) || ""
        },
        getNumUsersWrong: function(e, s, n) {
            var a, r, o = bc.rptdata.mycs && bc.rptdata.mycs.wa_by_bqa && bc.rptdata.mycs.wa_by_bqa[this.bqanswerid],
                p = '<span class="answerRptStat wrongStat answerRptStatTooltip"';
            return s ? r = s : o && o.length && (r = o[0][2] ? (a = _.groupBy(o, 2)[e + 1]) && a.length : (a = _.groupBy(o, 0)[e + 1]) && a[0][1]), p += r ? ' data-bqaid="' + (n || this.bqanswerid) + '" data-lindex="' + (e + 1) + '">' + r : ">", p += "</span>"
        },
        setListItems: null,
        setFocus: function() {
            this.$qobj.focus()
        },
        setNextAnswerFocus: function() {
            var e = this.pagepart,
                s = this.aNum,
                n = null;

            function findNextAnswer() {
                for (n = e.answer[s + 1]; n && n.isHidden;) s++, n = e.answer[s + 1]
            }
            findNextAnswer(), n || (e = bcp.pp[e.ppNum + 1]) && (s = -1, findNextAnswer()), n && n.setFocus()
        },
        setTooltip: function(e, s) {
            e = e || this.tooltipText, s = s || this.$qobj, e && s && (s.attr("title", e), bc.config.useTooltipPlugin && s.tooltip({
                classes: {
                    "ui-tooltip": "navbarTooltip pageAnswerTooltip opacity60"
                },
                position: {
                    my: "center+1 center"
                },
                open: function(e, s) {}
            }))
        },
        hide: function(e) {
            bcp.isReportView || (this.$qobj.addClass("answerHidden"), this.$qwrapper.addClass("answerHidden"), this.hideCtl(), this.positionOpts && 10 != this.ansStyleId && this.$qwrapper.position(this.positionOpts), this.isHidden = !0, this.answerGroup[e].correctAnswerIndex = -1, this.isChild && this.parentAnswer.hide(e))
        },
        hideCtl: function() {
            this.$qobj.hide()
        },
        disableCtl: function() {
            this.disabled = !0, this.$qobj.prop("disabled", !0), this.$qobj.find("input").prop("disabled", !0)
        },
        displayCtl: function(e) {
            if (!bcp.isReportView) {
                var s = this.answerGroup[e].correctDisplayText;
                s && this.$qdisplay && (this.$qdisplay[0].innerHTML = s, this.$qdisplay.setupCustomPlugins()), this.isChild && this.parentAnswer.displayCtl(e)
            }
        },
        showFeedback: function(e, s, n) {
            var a, r, o = [];
            bcp.showFeedback && (e || bcp.showHint) && (void 0 === n && (n = this.aNum), r = this.pagepart.answer[n], s && _.isInteger(s) && (r.answerItem[s] ? a = r.answerItem[s].fb : this.answerItem[s] && (a = this.answerItem[s].fb)), a || (a = e ? r.fb : r.fbw), this.equivStyleId == bcp.CHECKBOX && (this.userIndex ? a || (a = this.fb) : a = 0), a && o.push([a, e]), e && this.isGiveup && r.fbw && o.push([r.fbw, !1]), this.showFeedbackHtml(o, e))
        },
        showFeedbackHtml: function(e, s) {
            var n, a, r, o = "",
                p = this.fbInLI ? "li" : "div";
            if (this.$fbdiv = this.$fbdiv || this.pagepart.$questionDiv.find(".fb.a" + (this.aNum + 1)).first(), this.$fbdiv.length)
                if (e && e.length) {
                    for (n = 0; n < e.length; n++) a = e[n], r = this.pagepart.fbTextObj ? this.pagepart.fbTextObj[a[0]] : this.pagepart.fbText[a[0] - 1], n && (o += "<br />"), o += "<" + p + ' class="' + (a[1] ? "fbCorrect" : "fbWrong") + '">' + r + "</" + p + ">";
                    if (bcp.isReportView) {
                        if (this.$fbdiv.prev().filter(".fb").length && bcp.prev_fbHtml == o) return;
                        bcp.prev_fbHtml = o
                    }
                    this.$fbdiv.css("display", this.fbNewLine ? "block" : "inline"), this.$fbdiv[0].innerHTML = o, this.$fbdiv.setupCustomPlugins()
                } else this.$fbdiv.hide()
        },
        clearUserAnswer: function() {
            this.userIndex = 0, this.userValue = "", this.userGroupIndex = null, this.setMarkImage("blank"), this.showFeedbackHtml(0)
        },
        setMarkImage: function(e) {
            e && ("hide" == e ? this.$markImg.hide() : bcp.isReportView || this.$markImg.removeClass(bcp.answerStateImage.all).addClass(e), _.isArray(this.userValue) && this.setMarkImage_multi(e))
        },
        setMarkImage_multi: function() {
            var e = this;
            _.each(this.$qobj.find("li"), (function(s, n) {
                var a = $(s),
                    r = e.getVisibleAnswerItemIndexFromRawIndex(n + 1),
                    o = a.data("index") == r ? bcp.answerStateImage.r : bcp.answerStateImage.w;
                a.find(".markimg").removeClass(bcp.answerStateImage.all).addClass(o)
            }))
        },
        setMarkImageWhenCorrect: function() {
            var e, s = this.equivStyleId;
            !this.isAlreadyCorrect && this.isGiveup ? (s != bcp.CHECKBOX || this.userIndex) && this.setMarkImage(bcp.answerStateImage.g) : (this.isParent ? this.autoHide ? this.setMarkImage(this.onceWrong ? bcp.answerStateImage.s : bcp.answerStateImage.r) : this.setMarkImage("blank") : (this.showTick && (s != bcp.CHECKBOX || "markblank" == this.markAs && !bcp.settingUp || this.userIndex || this.onceWrong) ? this.setMarkImage(this.onceWrong ? bcp.answerStateImage.s : bcp.answerStateImage.r) : s != bcp.CHECKBOX ? this.setMarkImage("hide") : this.setMarkImage("blank"), this.isChild && ((e = this.parentAnswer).showTick ? e.setMarkImage(e.onceWrong ? bcp.answerStateImage.s : bcp.answerStateImage.r) : e.setMarkImage("hide"))), this.isAlreadyCorrect = !0)
        },
        userHasAttempted: function() {
            return (this.userIndex || this.userValue) && (!this.startUserValue || this.startUserValue != this.userValue)
        },
        testIsCorrect: function(e, s, n) {
            if (n = n || 0, !s && this.equivStyleId != bcp.CHECKBOX) return !1;
            if (this.answerGroup[e].correctAnswerIndex == s) {
                if (!this.isChild) return !0;
                if (n < 5) return this.parentAnswer.testIsCorrect(e, this.parentAnswer.userIndex, n + 1)
            }
            return !1
        },
        markAnswerInGroup: function() {
            var e, s, n, a = this,
                r = this.pagepart,
                o = this.groupAnswerIndex,
                p = this.answerGroup,
                c = this.equivStyleId;
            if (this.isHidden) return !0;
            for (s = 0; s < p.length; s++)
                if ((c != bcp.CHECKBOX || s == o) && (e = p[s], n = this.getUserIndex ? this.getUserIndex(e.answerTextListIndex) : this.userIndex, !e.isAnswered && this.testIsCorrect(s, n))) return e.isAnswered = !0, this.userIndex = n, this.isParent || !this.autoHide || c == bcp.CHECKBOX && !n || (this.displayCtl(s), this.hide(s)), this.showFeedback(!0, this.userIndex, e.aNum), this.setMarkImageWhenCorrect(), this.userGroupIndex = s, !0;
            return r.nextWrongANum < 0 && (r.nextWrongANum = this.aNum), !r.allUserAnswersCorrect || bcp.focusSet || bcp.isReportView || (setTimeout((function() {
                a.setFocus()
            })), bcp.focusSet = !0), (this.isCompulsory || this.userIndex) && (r.allUserAnswersCorrect = !1), (this.userHasAttempted() || "markblank" == this.markAs && !bcp.settingUp || bc.nav.cs && bc.nav.cs.isReadonly && bc.nav.showHistory) && (this.userHasAttempted() && !this.logFinalWrongAnswerOnly ? (this.logWrongAnswer(), c == bcp.CHECKBOX && !this.userIndex || r.userHasFinished || (this.onceWrong = !0, this.answerGroup.onceWrong = !0), this.isAlreadyCorrect = !1) : bc.nav.setScoreChanged(), !this.isParent && this.showCross && (c != bcp.CHECKBOX || this.userIndex || this.userValue || "markblank" == this.markAs) && this.setMarkImage(bcp.answerStateImage.w), this.showFeedback(!1, this.userIndex, this.aNum)), !1
        },
        logWrongAnswer: function() {
            var e, s, n, a = this.pagepart.ppid,
                r = !1,
                o = bc.user.scores.ppWrongAnswers;
            bc.isAdminPreview || this.pagepart.userHasFinished && !this.logFinalWrongAnswerOnly || this.isChild && !this.parentAnswer.isCorrect || (o[a] = o[a] || {}, s = o[a][this.bqanswerid] = o[a][this.bqanswerid] || [], this.userIndex ? _.filter(s, {
                index: this.userIndex
            }).length || (r = !0) : this.userValue && (_.filter(s, {
                text: this.userValue
            }).length || (r = !0)), r && (s[s.length] = {
                index: parseInt(this.userIndex, 10),
                text: this.userIndex ? "" : this.userValue
            }, this.logWrongAnswers && (e = this.bqanswerid + "|", this.userIndex && _.isInteger(this.userIndex) ? e += this.userIndex + "|" : (n = (n = this.userIndex || this.userValue).replace(/&/g, "%26"), e += "0|" + (n = $.isNumeric(n) ? n.substr(0, 10) : 0 === this.astyleid ? n.substr(0, 30) : n.substr(0, 1e3))), this.pagepart.userWrongAnswersToSave.push(e)), this.isCompulsory && this.pagepart.userScore.numWrong++, this.pagepart.userScore.saveScore = !0, bc.nav.setScoreChanged()))
        },
        isPastWrongAnswer: function(e, s) {
            var n = bc.user.scores.ppWrongAnswers[this.pagepart.ppid],
                a = n && n[this.bqanswerid];
            if (!bc.nav.showHistory) return !1;
            if (!a) return !1;
            if (this.isChild && !this.parentAnswer.isCorrect) return !1;
            if (e) {
                if (e = this.getRawIndexFromVisibleAnswerItemIndex(e), _.filter(a, {
                        index: e
                    }).length) return !0
            } else if (s && _.filter(a, {
                    text: s
                }).length) return !0;
            return !1
        },
        displayValue: function(e, s) {},
        setSelectedClass: function(e) {
            e ? this.$qwrapper.addClass("selected") : this.$qwrapper.removeClass("selected")
        },
        ctlSet: function(e, s) {
            var n, a = 0,
                r = 0;
            if (bcp.focusSet = !1, this.pagepart.setppSeconds(), !this.isHidden && !this.disabled)
                if (this.pagepart.latestANum = this.aNum, this.userValue !== e) {
                    if (e) {
                        if (this.groupMutuallyExclusive) {
                            var o, p, c, l = this.answerGroup;
                            for (o = 0; o < l.length; o++)(p = l[o].aNum) != this.aNum && ((c = this.pagepart.answer[p]).clearUserAnswer(), c.displayValue(0))
                        }
                    } else this.setMarkImage("blank");
                    this.listClick && this.listClick(e), this.isChild && (r = this.parentAnswer.userIndex), this.userValue = e, e && (this.getUserIndex ? a = this.getUserIndex() : (n = this.visibleAnswerItemIndex[r], fun.isInteger(e) ? a = n && n[e - 1] : _.isArray(e) && (a = _.map(e, (function(e) {
                        return n && n[e - 1]
                    })).join(",")), a = a || e)), this.userIndex = a, this.pagepart.changedSinceMarked = !0, bcp.userHasMadeChange = !0, this.isParent && this.setupChildren(a), bcp.useMarkScript && this.autoMark && e && !s && this.pagepart.markQuestion()
                } else this.showhideList && this.showhideList(!0)
        },
        saveAnswer: function(e) {
            var s = this.pagepart.userScore.answerStates,
                n = s[this.aNum];
            s[this.aNum] = e, n != e && (this.pagepart.userScore.saveScore = !0, bc.nav.setScoreChanged())
        }
    }), bcp.TextAnswer = bcp.Answer.extend({
        ansStyleId: 0,
        maxEntryLength: 30,
        styleCode: "text",
        styleCanRandomOrderAnswerList: !1,
        isNumber: !1,
        pre_ctlSet: function() {
            var e = fun.trim(this.$qobj.val());
            this.$qobj.val(e), this.ctlSet(e)
        },
        setup2: function() {
            var e = this;
            (this.$qobj.attr("maxlength", this.maxEntryLength), this.$qobj.on({
                change: function(s) {
                    var n = $(this).data("keypad");
                    e.pre_ctlSet(), n && !e.autoMark && setTimeout((function() {
                        e.setNextAnswerFocus()
                    })), $(this).data("keypad", null)
                },
                focus: function() {
                    e.pagepart.latestANum = e.aNum
                },
                keydown: function(s) {
                    switch (s.which) {
                        case $.ui.keyCode.ENTER:
                            return e.pre_ctlSet(), bcp.markAllQuestions(), void fun.killJQEvent(s)
                    }
                }
            }), "0" === this.markAs ? this.markAs = "int" : this.markAs = this.markAs || "case", this.markAs = this.markAs.toLowerCase(), fun.isInteger(this.markAs) && (this.markAs2 = parseInt(this.markAs, 10) || 0, this.markAs = "dp"), "case" === this.markAs ? this.tooltipText = this.tooltipText || "Case sensitive" : ["int", "exact", "dp", "pm", "range"].indexOf(this.markAs) > -1 && (this.isNumber = !0, this.$qobj.attr("type", "number"), "int" != this.markAs && this.$qobj.attr("step", "any")), 0 === this.ansStyleId && this.$qobj[0]) && (this.$qobj[0].style.width || this.$qobj.css("width", this.getInputCssWidth()))
        },
        getInputCssWidth: function() {
            var e, s = bc.isMobile && this.isNumber && this.$qobj.hasClass("numpad") ? 14 : 11,
                n = this.answerTextListIndex ? this.pagepart.answerTextList[this.answerTextListIndex - 1][0] : "123456789";
            return e = ((n = fun.stripHtml(n)).length || 4) * s + 6, n.indexOf(".") >= 0 && (e -= 10), e
        },
        getDisplayValue: function(e, s) {
            var n = void 0 !== s ? this.answerGroup[s].answerTextListIndex : this.answerTextListIndex;
            return Array.isArray(n) && (n = this.getChildAnswerTextListIndex(n)), this.pagepart.answerTextList[n - 1][e - 1]
        },
        displayValue: function(e, s) {
            if (this.answerTextListIndex) {
                var n = this.getDisplayValue(e, s);
                this.userValue = n, this.$qobj.val(n)
            }
        },
        getUserIndex: function(e) {
            var s, n, a = 0;
            if (e = e || this.answerTextListIndex, Array.isArray(e) && (e = this.getChildAnswerTextListIndex(e)), e && this.userValue)
                for (s = this.pagepart.answerTextList[e - 1], n = 0; n < s.length; n++)
                    if (this.isMatch(s[n], this.userValue)) {
                        a = n + 1;
                        break
                    } return a
        },
        getChildAnswerTextListIndex: function(e) {
            var s = 1;
            return this.isChild && (s = this.parentAnswer.userIndex), e[s - 1]
        },
        isMatch: function(e, s) {
            var n, a, r, o = this.markAs,
                p = this.markAs2,
                c = !0,
                l = !0;
            switch (e = fun.stripHtml(e), this.answerGroup.customMarkFunction && (s = this.answerGroup.customMarkFunction(s)), o) {
                case "case":
                    return e == s;
                case "nocase":
                    return e.toUpperCase() == s.toUpperCase();
                case "leftcase":
                    return e == s.substring(0, e.length);
                case "leftnocase":
                    return e.toUpperCase() == s.toUpperCase().substring(0, e.length);
                case "incase":
                    return s.indexOf(e) > -1;
                case "innocase":
                    return s.toUpperCase().indexOf(e.toUpperCase()) > -1;
                case "notnull":
                    return !!s;
                case "exact":
                    return parseFloat(e) == parseFloat(s);
                case "int":
                    return Math.round(e) == Math.round(s);
                case "dp":
                    return fun.dpRound(e, p) == fun.dpRound(s, p);
                default:
                    switch (s = parseFloat(s), e = parseFloat(e), o) {
                        case "pm":
                            _.endsWith(p, "%") ? (a = e - e * (p = parseFloat(_.trimEnd(p, " %")) || 0) / 100, r = e + e * p / 100) : (a = e - (p = parseFloat(p) || 0), r = e + p);
                            break;
                        case "range":
                            a = (n = p.split(","))[0] || e, r = n.length > 1 ? n[1] : a, _.endsWith(a, "x") && (a = _.trimEnd(a, " x"), c = !1), _.endsWith(r, "x") && (r = _.trimEnd(r, " x"), l = !1), a = parseFloat(a), r = parseFloat(r)
                    }
                    return (a = fun.dpRound(a, 10)) == (r = fun.dpRound(r, 10)) ? s == a : (c ? s >= a : s > a) && (l ? s <= r : s < r)
            }
        },
        configWhenParentChanged: function(e) {
            this.$qobj.val("").css("display", e > 0 ? "inline" : "none")
        }
    }), bcp.ChkAnswer = bcp.Answer.extend({
        ansStyleId: 1,
        styleCode: "chk",
        styleCode_pretty: "checkbox",
        autoHide: !1,
        insertDisplayDiv: !0,
        styleCanRandomOrderAnswerList: !1,
        groupTotalMarksMode: "MAX",
        logWrongAnswers: !1,
        subtractMarksWhenWrong: !0,
        setup_markImg: function() {
            this.$qobj.after(this.markimgHtml)
        },
        setup2: function() {
            var e = this;
            this.$qobj.addClass("opacity0").after('<span class="answerCheckbox ui-corner-all print-background"></span>').click((function(s) {
                e.setSelectedClass(this.checked), e.ctlSet(this.checked ? 1 : 0)
            }))
        },
        setFocus: function() {},
        displayValue: function(e) {
            this.setSelectedClass(e), this.$qobj.prop("checked", e)
        },
        hideCtl: function() {
            var e, s, n = this.answerGroup;
            if (this.userIndex)
                for (e = 0; e < n.length; e++) s = n[e].aNum, this.pagepart.$questionDiv.find("#q" + this.ppid + "_" + s).prop("disabled", !0), this.pagepart.answer[s].isHidden = !0
        }
    }), bcp.RadioAnswer = bcp.Answer.extend({
        ansStyleId: 6,
        styleCode: "radio",
        styleCanBecomeText: !0,
        isListAnswer: !0,
        hasBlankFirstItem: !0,
        inlineElementSuffix: "div",
        setup2: function() {
            this.isChild || this.setupListHtml(0)
        },
        displayValue: function(e) {
            this.pagepart.$questionDiv.find("#" + this.aDivId + "_" + e).prop("checked", !0), this.listClick(e)
        },
        setFocus: function() {
            this.$qobj.find("input:first").focus()
        },
        listClick: function(e) {
            var s = this.aDivId + "_" + e;
            this.$qobj.find("label").removeClass("selected").filter("[for=" + s + "]").addClass("selected")
        },
        getListItemHtml: function(e, s, n) {
            var a = this.isPastWrongAnswer(e) ? "liwrong" : "",
                r = this.answerItem[s + 1],
                o = this.childCss,
                p = this.aDivId + "_" + e,
                c = "";
            return c += "<li", r && r.style && (o += r.style + ";"), o && (c += ' style="' + o + '"'), c += ">", c += '<label for="' + p + '">', c += '<input type="radio" name="' + this.aDivId + '" id="' + p + '" value="' + e + '" ', c += 'onclick="bcp.pp[' + (this.ppNum - 1) + "].answer[" + this.aNum + "].ctlSet(" + e + ');" class="opacity0"><span class="radioSpan"></span>', bcp.isReportView && (n = this.getAnswerRptStatSpan(s) + n), c += '<span class="' + a + '">' + n + "<span></label></li>"
        }
    }), bcp.Select2Answer = bcp.Answer.extend({
        ansStyleId: 7,
        styleCode: "select2",
        styleCode_pretty: "dropdown",
        styleCanBecomeText: !0,
        hasBlankFirstItem: !0,
        isListAnswer: !0,
        zeroChildUserValue: !1,
        select2Opts: {
            theme: "classic",
            dropdownParent: $(document.body),
            dropdownCssClass: "select2-answer",
            selectionCssClass: "bc-select2",
            dropdownAutoWidth: !0,
            minimumResultsForSearch: -1,
            placeholder: "&nbsp;",
            allowClear: !1,
            escapeMarkup: function(e) {
                return e
            }
        },
        setup2: function() {
            var e = this;
            this.cssStyle = this.$qobj.attr("style"), this.customStyleObj = fun.cssStringToObj(this.cssStyle) || {}, this.$qobj[0].innerHTML = "<option></option>", this.$qobj.on("select2:select", (function(s) {
                var n = $(this),
                    a = parseInt(n.val(), 10);
                n.next(".select2-container").find(".select2-selection__rendered").removeAttr("title").setupCustomPlugins(), e.ctlSet(a)
            })).on("select2:open", (function(e) {
                var s = $(".select2-container--open .select2-dropdown").find(".select2-results__options");
                window.setTimeout((function() {
                    s.setupCustomPlugins()
                }), 10)
            })), this.isChild || this.setupListHtml(0)
        },
        displayValue: function(e) {
            this.$qobj.val(e).trigger("change"), this.$qobj.next(".select2-container").find(".select2-selection__rendered").setupCustomPlugins()
        },
        getListItemHtml: function(e, s, n) {
            var a = {
                id: e,
                text: this.isPastWrongAnswer(e) ? '<span class="liwrong">' + n + "</span>" : n
            };
            return bcp.isReportView && (a.text = this.getAnswerRptStatSpan(s) + a.text), a
        },
        setListItems: function(e) {
            var s, n = this,
                a = $.extend({}, this.select2Opts, {
                    data: e
                }),
                r = this.$qobj.attr("style") || "";
            if (this.listItemHtmlArr) {
                if (_.isEqual(this.listItemHtmlArr, e)) return;
                this.clearUserAnswer()
            } - 1 == r.indexOf("width:") && (s = this.getListWidth(e), a.width = s + "px", this.$qobj[0].style.width = a.width), a.dropdownCssClass += " " + this.pagepart.cssClass, this.isCompulsory && (a.selectionCssClass += " compulsory", a.dropdownCssClass += " compulsory"), this.select2_answerOpts = a, this.listItemHtmlArr = e, $.fn.select2 && (bcp.isReportView ? this.setupSelect2() : window.setTimeout((function() {
                n.setupSelect2()
            })))
        },
        setupSelect2: function() {
            this.isHidden || (this.$qobj.data("select2") && (this.$qobj.empty(), this.$qobj.select2("destroy")), this.$qobj.select2(this.select2_answerOpts), this.$qobj.next().find(".select2-selection").css(this.customStyleObj).addClass(this.cssClass), this.disabled && this.disableCtl())
        },
        disableCtl: function() {
            this.disabled = !0, this.$qobj.select2().prop("disabled", !0), this.$qobj.next(".select2-container").find(".select2-selection").addClass("bc-select2")
        },
        getListWidth: function(e) {
            var s = this,
                n = _.map(e, (function(e) {
                    return s.getHtmlWidth(e.text)
                }));
            return _.max(n)
        },
        getHtmlWidth: function(r) {
            var o = '<span class="liwrong">';
            e = e || [], s = s || [], 0 === r.indexOf(o) && (r = r.substring(o.length, r.length - "</span>".length));
            var p, c = e.indexOf(r);
            return c >= 0 ? s[c] : (p = -1 == r.indexOf("<") ? function(e) {
                if (!n) {
                    var s = document.createElement("canvas");
                    document.createDocumentFragment().appendChild(s), n = s, (a = s.getContext("2d")).font = "14px arial"
                }
                return a.measureText(e).width + 12
            }(r) : function(e) {
                var s = '<li class="select2-results__option">' + e + "</li>";
                bcp.$testDiv || (bcp.$testDiv = $('<div class="select2-answer measureDiv"><ul class="select2-results__options" ></ul></div>').appendTo(document.body));
                return bcp.$testDiv.find("ul")[0].innerHTML = s, bcp.$testDiv.find("div.regvar").regVar(), bcp.$testDiv[0].clientWidth
            }(r), p = Math.ceil(p) + 29, e.push(r), s.push(p), p)
        },
        hideCtl: function() {
            this.$qobj.hide(), $.fn.select2 && this.$qobj.data("select2") && this.$qobj.select2("destroy")
        }
    }), bcp.Select2ListAnswer = bcp.Answer.extend({
        ansStyleId: 8,
        styleCode: "list2",
        styleCode_pretty: "list",
        styleCanBecomeText: !0,
        isListAnswer: !0,
        zeroChildUserValue: !1,
        styleCanAutoMark: !1,
        hasBlankFirstItem: !0,
        listHtmlTemplate: '<ul class="select2-results__options" role="listbox">##LIST##</ul>',
        setup: function() {
            var e = this;
            this._super(), this.$qobj.addClass("select2-drop select2-answer select2-dropdown select2-results").attr("tabindex", "0"), this.$qobj.on("keydown", (function(s) {
                e.keydownEvent(s)
            }))
        },
        keydownEvent: function(e) {
            var s = this,
                n = e.which;
            n >= 65 && n <= 90 || n >= 48 && n <= 57 ? function(e) {
                if (!s.visibleListItemsFirstLetter) return;
                e = e.toLowerCase();
                var n = s.userValue || 0,
                    a = s.visibleListItemsFirstLetter.indexOf(e, n);
                if (-1 == a) {
                    if (0 === n) return;
                    a = s.visibleListItemsFirstLetter.indexOf(e)
                }
                if (-1 == a) return;
                s.ctlSet(a + 1)
            }(String.fromCharCode(n)) : this.processKeydown(e)
        },
        processKeydown: function(e) {
            var s = e.which;
            switch (s) {
                case $.ui.keyCode.UP:
                case $.ui.keyCode.DOWN:
                case $.ui.keyCode.SPACE:
                case $.ui.keyCode.HOME:
                case $.ui.keyCode.END:
                    return this.moveHighlight(s), void fun.killJQEvent(e);
                case $.ui.keyCode.ENTER:
                    return bcp.markAllQuestions(), void fun.killJQEvent(e)
            }
        },
        moveHighlight: function(e) {
            var s;
            if (this.userValue) switch (e) {
                case $.ui.keyCode.UP:
                    s = this.userValue - 1;
                    break;
                case $.ui.keyCode.DOWN:
                case $.ui.keyCode.SPACE:
                    s = this.userValue + 1;
                    break;
                case $.ui.keyCode.HOME:
                    s = 1;
                    break;
                case $.ui.keyCode.END:
                    s = this.numVisibleListItems
            } else s = 1;
            s > this.numVisibleListItems ? s = 1 : s < 1 && (s = this.numVisibleListItems), s && this.ctlSet(s)
        },
        setup2: function() {
            this.$qdisplay[0].innerHTML = "&nbsp;", this.isChild || this.setupListHtml(0)
        },
        displayValue: function(e) {
            this.listClick(e)
        },
        listClick: function(e) {
            var s = "selected select2-results__option--highlighted";
            this.$qobj.find(" li").removeClass(s).end().find("#" + this.aDivId + "_" + e).addClass(s)
        },
        pre_ctlSet: function(e) {
            this.ctlSet(e)
        },
        getListItemHtml: function(e, s, n) {
            var a, r = this.isPastWrongAnswer(e),
                o = this.answerItem[s + 1],
                p = this.childCss;
            return a = "<li id='" + this.aDivId + "_" + e + "' class='select2-results__option ' role=\"option\" onclick=\"bcp.pp[" + (this.ppNum - 1) + "].answer[" + this.aNum + "].pre_ctlSet(" + e + ');"', o && o.style && (p += o.style + ";"), p && (a += ' style="' + p + '"'), r && (n = '<span class="liwrong">' + n + "</span>"), bcp.isReportView && (n = this.getAnswerRptStatSpan(s) + n), a += ">" + n + "</li>"
        }
    }), bcp.SortAnswer = bcp.Answer.extend({
        ansStyleId: 14,
        styleCode: "sort",
        styleCode_pretty: "sort",
        styleCanBecomeText: 0,
        isListAnswer: !0,
        zeroChildUserValue: !1,
        styleCanAutoMark: !1,
        hasBlankFirstItem: !0,
        listHtmlTemplate: '<ul class="xselect2-results__options" role="listbox">##LIST##</ul>',
        setup: function() {
            this._super(), this.$qobj.addClass("select2-drop select2-answer select2-dropdown select2-results sort-answer").attr("tabindex", "0")
        },
        setup2: function() {
            var e = this;
            this.isChild || this.setupListHtml(0);
            var s = this.visibleListItemsFirstLetter.length,
                n = _.range(1, s + 1);
            this.correctAnswerIndex = n.join(","), window.setTimeout((function() {
                if (!$.fn.sortable || e.isHidden || e.disabled) return;
                e.$qobj.find("ul").sortable({
                    items: ".sortitem",
                    axis: e.cssClass.indexOf("horizontal") >= 0 ? "x" : "y",
                    containment: e.pagepart.$ppDiv,
                    helper: function(s, n) {
                        var a = e.$qobj.width() + 2,
                            r = e.$qobj.height() + 2;
                        return e.$qobj.css({
                            width: a,
                            height: r
                        }), n
                    },
                    start: function(e, s) {
                        var n = {
                            width: s.item.width(),
                            height: s.item.height(),
                            "margin-top": s.item.css("margin-top"),
                            "margin-right": s.item.css("margin-right"),
                            "margin-bottom": s.item.css("margin-bottom"),
                            "margin-left": s.item.css("margin-left")
                        };
                        s.placeholder.css(n)
                    },
                    stop: function(s, n) {
                        e.$qobj.css({
                            width: "",
                            height: ""
                        })
                    },
                    update: function(s, n) {
                        var a = _.map(e.$qobj.find("li"), (function(e, s) {
                            return $(e).data("index")
                        }));
                        e.ctlSet(a)
                    }
                })
            }), 0)
        },
        displayValue: function(e) {
            var s = this;
            _.each(e.split(","), (function(e) {
                var n = s.getVisibleAnswerItemIndexFromRawIndex(parseInt(e, 10));
                s.$qobj.find("li[data-index=" + n + "]").remove().appendTo(s.$qobj.find("ul"))
            }))
        },
        hideCtl: function() {
            var e = this.$qobj.find("ul");
            this.$qobj.removeClass("compulsory select2-dropdown"), $.fn.sortable && e.hasClass("ui-sortable") && e.sortable("destroy"), this.correctDisplayText && this.$qobj.hide()
        },
        getListItemHtml: function(e, s, n) {
            var a, r = this.answerItem[s + 1],
                o = this.childCss;
            return a = "<li id='" + this.aDivId + "_" + e + "' data-index='" + e + "' class='xselect2-results__option sortitem ", this.childCssClass && (a += this.childCssClass), a += "'", r && r.style && (o += r.style + ";"), o && (a += ' style="' + o + '"'), a += '><span class="markimg"></span>' + n + "</li>"
        }
    }), bcp.ClickListAnswer = bcp.Select2ListAnswer.extend({
        ansStyleId: 9,
        styleCode: "clicklist",
        styleCode_pretty: "clicklist",
        listHtmlTemplate: '<span class="arrow-down"></span><ul class="select2-results__options" role="listbox">##LIST##</ul>',
        keydownEvent: function(e) {
            switch (e.which) {
                case $.ui.keyCode.UP:
                case $.ui.keyCode.DOWN:
                case $.ui.keyCode.SPACE:
                case $.ui.keyCode.ENTER:
                    this.processKeydown(e)
            }
        },
        listClick: function(e) {
            var s = this.listItemHtmlArr[e - 1],
                n = this.listHtmlTemplate.replace("##LIST##", s);
            this.$qobj[0].innerHTML = n, this.$qobj.setupCustomPlugins()
        },
        pre_ctlSet: function(e) {
            ++e > this.numVisibleListItems && (e = 1), this.ctlSet(e)
        },
        setListItems: function(e) {
            var s = '<li class=\'select2-results__option \' role="option" onclick="bcp.pp[' + (this.ppNum - 1) + "].answer[" + this.aNum + '].pre_ctlSet(0);"></li>',
                n = this.listHtmlTemplate.replace("##LIST##", s);
            if (this.listItemHtmlArr) {
                if (_.isEqual(this.listItemHtmlArr, e)) return;
                this.clearUserAnswer()
            }
            this.$qobj[0].innerHTML = n, this.listItemHtmlArr = e
        }
    }), bcp.DDAnswer = bcp.Answer.extend({
        ansStyleId: 10,
        styleCode: "dragdrop",
        styleCode_pretty: "drag&drop",
        customTarget: null,
        drawLine: !1,
        hitAlign: "",
        hitAlignArr: null,
        snapMy: "",
        snapAt: "",
        validTargets: null,
        insertDisplayDiv: !1,
        styleCanRandomOrderAnswerList: !1,
        zeroChildUserValue: !1,
        logWrongAnswers: !1,
        init2: function() {
            this.validTargets = [], this.markFn && (this.setupTarget(this.markFn), this.markFn = null), this._super()
        },
        setupTarget: function(e) {
            var s, n = this,
                a = !1,
                r = e.split("||"),
                o = fun.trim(r[0]),
                c = r[1] ? fun.evalObjectString(r[1]) : {};
            $.extend(this, c), o && (this.customTarget = o, this.correctAnswerIndex = this.correctAnswerIndex || 1, -1 == o.indexOf(".") && -1 == o.indexOf("#") && (o = "#" + o), s = this.pagepart.$ppDiv.find(o), _.each(s, (function(e, s) {
                var r, o = $(e),
                    l = o.data();
                l.targetindex || (n.pagepart.targets.push(new p(o, n.pagepart, n.aNum, c)), l = o.data()), r = parseInt(l.targetindex, 10), n.validTargets.push(n.pagepart.targets[r]), a || n.correctAnswerIndex != s + 1 || (n.correctAnswerIndex = r + 1, n.pagepart.numCorrectAnswers++, a = !0)
            })))
        },
        setup_markImg: function() {
            this.$qobj.append(this.markimgHtml)
        },
        setup: function() {
            this._super(), this.pagepart.targets && this.pagepart.targets.length && (this.numListAnswerItems = this.pagepart.targets.length)
        },
        setup2: function() {
            var e = this.pagepart.targets[this.correctAnswerIndex - 1],
                s = this;
            this.fmtCode.xpos && this.fmtCode.ypos && this.$qobj.offset({
                left: parseInt(this.fmtCode.xpos, 10),
                top: parseInt(this.fmtCode.ypos, 10)
            }), this.snapMy = this.snapMy || this.snapAt, this.hitAlignArr = this.hitAlign && this.hitAlign.split(" "), this.pos = {
                my: this.snapMy,
                at: this.snapAt
            }, this.drawLine = this.drawLine || e && e.drawLine, window.setTimeout((function() {
                !$.fn.draggable || s.isHidden || s.disabled || s.$qobj.attr({
                    "data-ppnum": s.ppNum,
                    "data-anum": s.aNum
                }).draggable({
                    cursor: "move",
                    stack: ".dragdrop",
                    start: bcp.drag.dragStart,
                    drag: bcp.drag.dragging,
                    stop: bcp.drag.dragStop
                })
            }), 0)
        },
        disableCtl: function() {
            this.disabled = !0, $.fn.draggable && this.$qobj.hasClass("ui-draggable") && this.$qobj.draggable("disable")
        },
        displayValue: function(e) {
            if ($.fn.connections && this.$qobj.connections("remove"), this.$line = null, this.positionOpts = null, e) {
                var s = this.pagepart.targets[e - 1];
                if (!s) return;
                s.drawLine || this.drawLine ? $.fn.connections && (this.$line = this.$qobj.connections({
                    to: s.$target
                })) : (this.positionOpts = $.extend({}, s.positionOpts), this.snapMy && (this.positionOpts.my = this.snapMy), this.snapAt && (this.positionOpts.at = this.snapAt), this.$qobj.position(this.positionOpts))
            }
        },
        drawLineToCorrectAnswer: function() {
            var e = this.pagepart.targets[this.correctAnswerIndex - 1];
            e && $.fn.connections && (this.$qobj.connections("remove"), this.$line = this.$qobj.connections({
                to: e.$target,
                class: "connection previewjoin"
            }))
        },
        updateAnswerPosition: function() {
            this.positionOpts && this.$qobj.position(this.positionOpts), this.$line && this.$line.connections("update")
        },
        setFocus: function() {},
        hideCtl: function() {
            $.fn.draggable && this.$qobj.hasClass("ui-draggable") && this.$qobj.draggable("destroy").css("z-index", 1), this.$markImg.addClass("opacity50")
        }
    }), bcp.MCAnswer = bcp.Answer.extend({
        ansStyleId: 12,
        styleCode: "multichoice",
        equivStyleId: 1,
        autoHide: !1,
        insertDisplayDiv: !1,
        styleCanRandomOrderAnswerList: !1,
        groupTotalMarksMode: "MAX",
        groupMutuallyExclusive: !0,
        logWrongAnswers: !1,
        setup_markImg: function() {
            this.$qobj.after(this.markimgHtml)
        },
        setup2: function() {
            var e = this;
            this.$qobj.addClass("opacity0").after('<span class="answerCheckbox ui-corner-all print-background"></span>').click((function(s) {
                e.setSelectedClass(!0), $(this).prop("checked", !0), e.ctlSet(this.checked ? 1 : 0)
            }))
        },
        setFocus: function() {},
        displayValue: function(e) {
            this.setSelectedClass(e), this.$qobj.prop("checked", e), e && this.ctlSet(1)
        },
        hideCtl: function() {
            return bcp.ChkAnswer.prototype.hideCtl.call(this)
        }
    }), bcp.FreeTextAnswer = bcp.TextAnswer.extend({
        ansStyleId: 13,
        styleCode: "freetext",
        equivStyleId: 0,
        insertDisplayDiv: !1,
        showCross: !1,
        maxEntryLength: 800,
        logFinalWrongAnswerOnly: !0,
        markAs: "nocase"
    }), bcp.JSMEAnswer = bcp.TextAnswer.extend({
        ansStyleId: 20,
        equivStyleId: 0,
        useDefaultDisplayText: !1,
        styleCanAutoMark: !1,
        styleCode: "text",
        styleCanRandomOrderAnswerList: !1,
        width: 355,
        height: 300,
        init2: function() {
            var e = this.pagepart.answerTextList[this.answerTextListIndex - 1],
                s = e && e[this.correctAnswerIndex - 1];
            s && (e[this.correctAnswerIndex - 1] = s && s.replace(/&gt;/g, ">")), this.markFn && (this.startAnswer = this.markFn, this.markFn = null), this._super()
        },
        setup2: function() {
            var e = this;

            function configJSME() {
                var s = e.width,
                    n = e.height,
                    a = bc.jsme.defaults,
                    r = e.answerTextList && e.answerTextList[e.correctAnswerIndex - 1];
                e.jsmeApplet = new JSApplet.JSME(e.aDivId, s + "px", n + "px", a), e.startAnswer && (e.jsmeApplet.readMolecule(e.startAnswer), e.userValue = e.jsmeApplet.smiles(), e.startUserValue = e.userValue), r && r.indexOf(">>") > -1 && e.jsmeApplet.options("reaction"), e.disabled && e.disableCtl()
            }
            bc.jsme.runFn((function() {
                if (e.isHidden && (e.fmtCode.jmol || e.correctDisplayText)) return;
                var s = e.$qobj.parents(".bc_showDiv");
                s.length ? s.on("onshow", (function(e) {
                    configJSME()
                })) : configJSME()
            }))
        },
        disableCtl: function() {
            this.disabled = !0
        },
        ctlSet2: function() {
            if (this.jsmeApplet) {
                var e = this.jsmeApplet.smiles();
                this.ctlSet(e, !1)
            }
        },
        displayValue: function(e, s) {
            var n = this,
                a = this.getDisplayValue(e, s).split("|"),
                r = fun.trim(a[0]),
                o = a[1];
            this.userValue = r, o && bc.jsme.runFn((function() {
                n.jsmeApplet && n.jsmeApplet.readMolecule(o)
            }))
        },
        hideCtl: function() {
            var e = this;
            bc.jsme.runFn((function() {
                var s = e.fmtCode.width || e.$qobj.width(),
                    n = e.fmtCode.height || e.$qobj.height();
                e.fmtCode.jmol && bc.jmol.loadStructureFromJsme(e.fmtCode.jmol, e.jsmeApplet);
                e.fmtCode.jmol || e.correctDisplayText ? (e.jsmeApplet && e.jsmeApplet.reset(), e.$qobj.remove()) : (e.$qobj.width(s), e.$qobj.height(n), $.isNumeric(s) && (s += "px"), $.isNumeric(n) && (n += "px"), e.jsmeApplet.options("depict"), e.jsmeApplet.setSize(s, n));
                e.jsmeApplet = null
            }))
        },
        isMatch: function(e, s) {
            return e = fun.trim(e.split("|")[0]), this.answerGroup.customMarkFunction && (s = this.answerGroup.customMarkFunction(s)), e == s
        },
        configWhenParentChanged: function(e) {
            this.jsmeApplet && this.jsmeApplet.reset(), this.$qobj.css("display", e > 0 ? "inline" : "none")
        }
    }), bcp.CustomAnswer = bcp.Answer.extend({
        ansStyleId: 100,
        styleCode: "custom",
        insertDisplayDiv: !1,
        logWrongAnswers: !1,
        setup_markImg: function() {
            this.$qdisplay && this.$qdisplay.before(this.markimgHtml)
        },
        setFocus: function() {},
        showFeedbackHtml: function(e, s) {
            this._super(e, s);
            var n = this.correctDisplayText;
            n && (this.$qdisplay[0].innerHTML = n), s ? this.$qdisplay.addClass("fbCorrect").removeClass("fbWrong") : this.$qdisplay.addClass("fbWrong").removeClass("fbCorrect")
        }
    }), bcp.AnswerTable = function(e, s, n, a, r) {
        this.cols = e || 1, this.random = s, this.cssStyle = n || "", this.item = a, this.aNumArr = r
    }, $(document).ready((function() {
        bc.ccid && bc.report && _.each(bcp.answerStyles, (function(e, s) {
            bc.report.answerStyleObjs[s] = new bcp[e.jsobject]
        }))
    }))
}(),
function() {
    var setPageTotalMarks = function() {
            var e, s, n, a, r, o, p;
            for (bcp.pageTotalMarks = 0, e = bcp.nextPPindex; e < bcp.numPP; e++)
                if (p = (s = bcp.pp[e]).answerGroups, s.numAnswers && p) {
                    if (s.maxMarks) s.ppTotalMarks = s.maxMarks;
                    else
                        for (s.ppTotalMarks = 0, a = 0; a < p.length; a++) {
                            for (o = 0, r = 0; r < p[a].length; r++) "SUM" == (n = p[a][r]).groupTotalMarksMode ? o += n.marks : n.marks > o && 1 == n.correctAnswerIndex && (o = n.marks);
                            s.ppTotalMarks += o
                        }
                    s.userScore.outof = s.ppTotalMarks, bcp.pageTotalMarks += s.ppTotalMarks
                }
        },
        parseQueryString = function() {
            var e = window.urlParams;
            e && ((e.hardmode || 2 == e.qmode) && (bcp.isHardMode = !0), (e.rpt || bc.isClassReportMode) && (bcp.isReportView = !0))
        },
        markTest = function() {
            function doMarkTest() {
                bcp.testMarking = !0, bcp.markAllQuestions(), bcp.scoreChanged ? (bcp.numTestTries += 1, showTestTries(), fun.showWaitMsg_modal("Saving test question"), bc.nav.savePageScore(!0), function() {
                    var e = _.filter(bcp.pp, (function(e) {
                        return e.questionid && !e.allUserAnswersCorrect
                    })).length;
                    bc.nav.updateScoreDisplay_test(), fun.clearWaitMsg_modal(), fun.clearWaitMsg(), (bcp.numTestTries >= bc.nav.cs.maxTestTries || !e) && (showTestAttempted(), bcp.testMarking = !1)
                }()) : bcp.testMarking = !1
            }
            bcp.maxPossibleUserMarks() < bcp.pageTotalMarks - .01 ? fun.jconfirm("Ensure you have attempted all parts!<br>Submit test page?", "", doMarkTest, null, {
                yesText: "Submit"
            }) : doMarkTest()
        },
        setupPageOptions = function() {
            if (!(bcp.totalPages > 1)) {
                var e, s = bc.nav.myPage,
                    n = $('<div id="pageToolbar" class="noprint opacity90 bctoolbar toprightlinks"></div>');
                n[0].innerHTML = bc.template.getHtmlById("pageToolbar"), bcp.isTest || (bcp.$myp.find("#pageToolbar").length || (bc.isMobile || bc.windowWidth < 1380 ? (n.addClass("float"), n.prependTo(bcp.$myp.find(".divWrapper:first"))) : n.prependTo(bcp.$myp)), !s || 2 == s.pagestyleid && bc.nav.numReviewPages > 1 || n.find(".linkAllReviews").hide(), !bcp.isQuestion || bc.isReportView ? n.find("#divHistory, #divChooseQMode").hide() : (bc.nav.showHistoryCheckbox && bcp.configureHistoryCheckbox(), bc.nav.showHardModeCheckbox && (n.find("input#chkHard").prop("checked", bc.nav.useHardMode), e = s && s.hasHardMode, n.find("#divChooseQMode").css({
                    display: e ? "inline-block" : "none"
                })))), s && s.isStar && n.find(".star").addClass("isstar")
            }
        };
    bcp.configureHistoryCheckbox = function(e) {
        var s = bcp.$myp.find("#divHistory"),
            n = bc.nav.showHistoryCheckbox && bc.nav.myPage && !bc.nav.isTest,
            a = "invisible";
        if (s.css({
                display: n ? "inline-block" : "none"
            }), n) {
            var r = bc.nav.myPage.totMarks > 0 && bc.nav.myPage.userAllQuestionsLocked;
            r ? s.removeClass(a).find("input").prop("disabled", !1) : s.addClass(a).find("input").prop("disabled", !0), bcp.$myp.find("input#chkHistory").prop("checked", r && !bc.nav.showHistory && !e)
        }
    };
    var bcpsetupFrame = function() {
            var e, s = bcp.$page.find("h1"),
                n = bc.template.getById("pageAudioControl").clone();
            $.extend(bcp, {
                csid: bc.nav.csid,
                showHint: bc.nav.showHint,
                showFeedback: bc.nav.showFeedback,
                isHardMode: bc.nav.useHardMode && bc.nav.myPage.hasHardMode,
                isTest: bc.nav.isTest,
                attempt: bc.nav.attempt
            }), setupPageOptions(), bcp.totalPages > 1 || (e = bc.nav.getPageH1(bc.nav.pageIndex), s.html(e), "speechSynthesis" in window && (s.append(n), bcp.$audioControl = s.find(".audioControl")), bc.myCS && bc.myCS.name && s.append('<span class=" showInFullScreen csSubheading">' + bc.myCS.name + "</span>"), bc.hideAllTooltips())
        },
        bcpsetupTest = function() {
            var e, s = 0;
            bcp.$page.addClass("noprint"), document.oncontextmenu = function() {
                return !1
            }, window.onkeydown = function(e) {
                if (e.ctrlKey) return !1
            }, bcp.$myp.find(".pageSubmit, .ppSubmit").remove(), bcp.isQuestion && (_.each(bcp.pp, (function(e, n) {
                var a = bc.user.scores.ppNumTries[e.ppid];
                a && (s = Math.max(s, a))
            })), bcp.numTestTries = s, e = _.filter(bcp.ppidQArr, (function(e) {
                var s = bc.user.scores.pp[e];
                return !(s && s.isLocked)
            })).length, !(bcp.numTestTries >= bc.nav.cs.maxTestTries) && e || bcp.isReportView ? ($('<button id="btnGoTest" class="large green bcbutton"><i class="fas fa-check"></i>Submit Page</button>').click(markTest).insertAfter(bcp.$myp.find("div.pagepart:last")), bc.nav.cs.maxTestTries > 1 && (bcp.$myp.find("#btnGoTest").after('<span class="numTries note"></span'), showTestTries())) : showTestAttempted())
        },
        showTestTries = function() {
            var e = bcp.$page.find(".numTries"),
                s = "<b>" + bcp.numTestTries + "</b> / <b>" + bc.nav.cs.maxTestTries + "</b> tries used.";
            e.html(s)
        },
        showTestAttempted = function() {
            bcp.$page.html("<div class='alreadyTriedMsg'>Test page<br>has been submitted</div>"), bcp.$myp.find("#btnGoTest").hide(), bcp.isQuestion = !1
        },
        showPageCompletionDependentDivs = function() {
            bcp.$myp.find(".showIfPageDone").each((function() {
                var e = $(this),
                    s = e.data("pageid"),
                    n = _.filter(bc.nav.csPages, {
                        id: parseInt(s, 10)
                    })[0],
                    a = n && n.marks;
                !a || a.totalmarks + a.giveupmarks < a.outof || e.removeClass("showIfPageDone").addClass("x-showIfPageDone")
            }))
        },
        bcpsetupDragDrop = function() {
            var e;
            _.each(bcp.pages, (function(s, n) {
                s.draggableIds && (e = s.draggableIds.replace(/"/g, "").split(","), _.each(e, (function(e, n) {
                    var a = e.split("+"),
                        r = a[0],
                        o = a[2],
                        p = s.$page.find("#" + r + ",[name=" + r + "]").eq(0);
                    p && (p.addClass("draggable"), o && p.data("copydrag", parseInt(o, 10)))
                }))), $(s.$page).find(".resizable, .draggable").interact()
            })), $.fn.draggable && $.fn.resizable && (bcp.$myp.find(".pophtml").draggable({
                opacity: .7,
                cursor: "move",
                cancel: ".closePopup, div.poptext"
            }).resizable({
                autoHide: !0,
                handles: "se",
                minWidth: 100,
                maxWidth: 1e3,
                minHeight: 20,
                maxHeight: 1e3
            }), bcp.$myp.interact && bcp.$myp.find(".resizable, .draggable").interact())
        };
    bcp.setupJmol = function(preloadFiles) {
        var $preloadDiv;
        if (preloadFiles) {
            if (preloadFiles = _.filter(preloadFiles, (function(e) {
                    return !bc.jmol.fileTypesAlreadyLoaded[fun.getFileExtension(e)]
                })), !preloadFiles.length) return;
            $preloadDiv = bc.template.getById("preloadDiv").clone().appendTo(bc.$body), bcp.jmol = bcp.jmol || $.extend({}, bc.jmol), _.each(preloadFiles, (function(e) {
                bcp.jmol.config.push({
                    url: e,
                    elId: "preloadDiv"
                })
            }))
        } else if (!bcp.jmol || !bcp.jmol.config || !bcp.jmol.config.length) return;
        return fun.insertFilePromise.js(bcFiles.jmoljs).then(doJmolSetup);

        function doJmolSetup() {
            Jmol.setDocument(0), window.jmolApplet = bcp.jmol.applets, _.each(bcp.jmol.config, (function(jsp, i) {
                if (!jsp.isLoaded) {
                    var $div = preloadFiles ? $preloadDiv : bc.$mainFrame,
                        $jmol = $div.find("#" + jsp.elId),
                        w = $jmol.width(),
                        h = $jmol.height(),
                        info = $.extend({}, bcp.jmol.defaults, {
                            width: w,
                            height: h,
                            script: (jsp.url ? "load " + jsp.url + ";" : "") + jsp.opts
                        }),
                        $jmol_script, jshtml, jmol, jmolid = "jmol_" + jsp.elId;
                    if ($jmol.length && $jmol.is(":visible") && w && h) {
                        if ($jmol.html(Jmol.getAppletHtml(jmolid, info)).addClass("jmol"), bc.jmol.fileTypesAlreadyLoaded[fun.getFileExtension(jsp.url)] = !0, preloadFiles) return $preloadDiv.empty(), void(i + 1 == bcp.jmol.config.length && ($preloadDiv.remove(), bcp.jmol = null));
                        jmol = window[jmolid], bcp.jmol.applets.push(jmol), jsp.isLoaded = !0, jsp.js && ($jmol_script = $("<span></span>").appendTo($jmol), -1 == jsp.js.indexOf("[") && (jsp.js = "[" + jsp.js + "]"), eval("jshtml=" + jsp.js), jshtml && $jmol_script.html(jshtml.join("")))
                    }
                }
            }))
        }
    };
    var bcpsetupQuestionPage = function() {
            var e, s, n, a, r = 0;
            for (bcpinsertFooterDivs(), e = bcp.nextPPindex; e < bcp.numPP; e++)(n = bcp.pp[e]).setOptions(), n.$ppDiv = bcp.$myp.find("#pp" + n.ppid), n.processAnswerRawObjects(), n.preparseQuestionMarkup();
            for (setPageTotalMarks(), e = bcp.nextPPindex; e < bcp.numPP; e++) n = bcp.pp[e], bc.user && (a = bc.user.scores.pp[n.ppid]) && (a.totalmarks > 0 || bcp.isTest) && (bcp.userTopMarks.addMarksObj(a), bcp.userHasAlreadyTried = !0), n.setupQuestion(), n.aNumOffset = r, r += n.numAnswers, n.$questionDiv && n.$questionDiv.setupCustomPlugins(), bc.isAdminPreview && !bc.inFrame || parent.window.bca || bcp.isReportView || bcp.isTest || bc.nav.isReadonly || n.hideShowDivs();
            bc.ccid || (bcpsetupNumpad(), (bc.nav && !bc.nav.showHistory && bcp.pageTotalMarks > 0 || bcp.userHasAlreadyTried && bcp.isTest) && (bcp.userTopMarks.outof = bcp.pageTotalMarks, s = '<a class="retry-question removeRetry " title="Show saved answers">Saved score:</a> ' + bcp.userTopMarks.fractionString({
                supsub: 1
            }), bcp.userTopMarks.totalmarks > bcp.userTopMarks.firstrightmarks && (s += " &mdash; no mistakes: <sup>" + bcp.userTopMarks.firstrightmarks + "</sup>/<sub>" + bcp.pageTotalMarks + "</sub>"), bcp.$page.find(".pageFooter:last").before('<div class="topscore noprint">' + s + "</div>"))), bc.nav.showGiveupButton && 1 == bcp.totalPages && bcp.$giveupDiv && bcp.$giveupDiv.length && (bcp.onlyHasCheckboxAnswers || (s = '<a class="giveup bcbutton plain giveup-nextquestion" title="Show next answer">Give up</a>', bcp.$giveupDiv.html(s))), bc.isMobile ? bcp.$myp.find(".ppSubmit, .pageSubmit").remove() : bcp.$myp.find(".ppSubmit, .pageSubmit").not(".large").addClass("green bcbutton"), showPageCompletionDependentDivs(), bcp.setPageTimeout(), bcp.userHasAlreadyTried && !bc.nav.showHistory && bcp.timer.useTimer && bcp.timer.init(), bcp.markAsOne && bc.$mainFrame.addClass("markAsOne"), bcp.$goBtn && bcp.$goBtn.click(bcp.markAllQuestions)
        },
        bcpinsertFooterDivs = function() {
            var e = bcp.$myp.find(".pagepart").last();
            bcp.markAsOne && (bcp.$qfootDiv = $(bcp.qfootHtml).insertAfter(e), bcp.$qfootDiv.addClass("all").append(bcp.qscoreHtml).find(".giveuphint").addClass("all"), bcp.$goBtn = bcp.$qfootDiv.find("button").addClass("pageSubmit"), bcp.$giveupDiv = bcp.$qfootDiv.find(".giveup"), bcp.$score = bcp.$qfootDiv.find(".score"), bcp.$scorebar = bcp.$qfootDiv.find(".qscorebar")), bc.isMobile && bc.nav.pageid && !bc.nav.isTest && (bcp.$goBtn = bc.template.getById("actionBtn-markanswer").clone().appendTo(bcp.$myp))
        },
        bcpsetupNumpad = function() {
            $.support.touch ? $(document).click(bc.closeNumpad) : (bc.numpadSettings.mathMode = bc.numpadSettings.mathMode || 1, bcp.$pages.on("focus", "input.keypad-input-focus", (function() {
                bc.numpad && bc.numpad.$dialogWrapper && bc.numpad.$dialogWrapper.focus()
            }))), bc.isMobile ? (bcp.$pages.find(".numpad-exp").addClass("numpad"), bcp.$pages.parent().find(".answerWrapper .numpad, .numpad input[type=number]").addClass("numpad").attr("readonly", !0).focus(bc.openNumpad).click(bc.openNumpad), bcp.$pages.parent().find(".answerWrapper .txtpad, .txtpad input[type=text]").addClass("txtpad").attr("readonly", !0).focus(bc.openTxtpad).click(bc.openTxtpad)) : bcp.$pages.parent().find(".numpad input[type=number]").removeClass("numpad").parent(".answerWrapper").css("position", "relative").append('<span class="icon-calculator hover-numpad" title="Calculator"><i class="fas fa-calculator"></i></span>').find(".icon-calculator").click((function(e) {
                var s = $(this).parent(".answerWrapper").find("input");
                s && s.length && (bc.openNumpad.call(s), e.stopImmediatePropagation())
            }))
        },
        bcploadInFrame = function() {
            var e = window.urlParams,
                s = "/?c=" + e.c + "#cs=" + e.cs + "&p=" + bcp.pageid;
            document.location = s
        };
    bcp.runPageHtml = function(e) {
        if (e) {
            var s = bc.idlookup.cs[bc.csid];
            s && s.answerRpt_by_page && s.answerRpt_by_page[e.id] || bc.processRawAnswers_joinMultichoice(e), bcp.$myp = e.$page || $(e.html);
            var n = e.json,
                a = e.id,
                r = new bcp.Page(a, n.opts || null);
            r.v = e.v, bcp.pages.push(r), _.each(n.pp, (function(e, s) {
                var n = new bcp.Pagepart(a, s + 1, e.ppid, e.htmlid, e.qid, e.dep_ps2);
                bcp.pp.push(n), n.answerRaw = _.map(e.answerRaw, (function(e) {
                    return new bcp.AO(e[0], e[1], e[2], e[3], e[4])
                })), e.answerTextList && (n.answerTextList = e.answerTextList), e.opts && (n.opts = e.opts), e.fbText && (n.fbText = e.fbText), e.fbTextObj && (n.fbTextObj = e.fbTextObj), e.targets && (n.targets = _.map(e.targets, (function(e) {
                    return new bcp.Target(e[0], e[1], e[2], e[3], e[4], e[5])
                }))), e.resources && _.each(e.resources, (function(e) {
                    e.jmolConfig && bcp.jmol.config.push(e.jmolConfig)
                }))
            })), bcp.setup(a), bcpinsertRenderedPage(e), bcp.moveMarkingToBottom(), bcp.rePosition(), n.pp && (bcp.nextPPindex += n.pp.length)
        }
    };
    var bcpinsertRenderedPage = function(e) {
        var s = e.$target ? $(e.$target) : bc.$mainFrame,
            n = "bcpage";
        fun.clearWaitMsg(), bcp.totalPages > 1 ? n = "multipage" : bc.nav.myPage && (bc.nav.myPage.numQuestions ? n = "bcquestionpage" : 2 == bc.nav.myPage.pagestyleid && (n = "bcreviewpage")), bc.resetCssClasses(n), e.donotEmpty ? s.append(bcp.$myp) : s.empty().append(bcp.$myp), s.setupCustomPlugins()
    };
    bcp.moveMarkingToBottom = function() {
        if (bc.$windowFloatFooter) {
            var e = bcp.$page.find(".scoreWrapper:visible"),
                s = bc.$mainFrame.find(".bcpage").height() > bc.$mainFrame.height(),
                n = !!bc.$windowFloatFooter.find(".scoreWrapper").length;
            bc.nav.pageid && !n && s && 1 == e.length && (bc.$windowFloatFooter.addClass("hasScore"), e.prependTo(bc.$windowFloatFooter.find(".divWrapper"))), window.setTimeout((function() {
                var e = bc.$mainFrame[0].offsetWidth,
                    s = bc.$mainFrame[0].clientWidth,
                    n = e - s;
                e < 1050 && (n = 0);
                bc.$windowFloatFooter.find(".scoreWrapper button, .scoreWrapper .retry-question").css({
                    "margin-left": -n / 2
                })
            }), 10)
        }
    }, bcp.setup = function(e) {
        var s = window.urlParams;
        bcp.settingUp = !0, $.fx.off = !0, bcp.qscoreHtml = bcp.qscoreHtml || bc.template.getHtmlById("qscoreHtml", 1), bcp.qfootHtml = bcp.qfootHtml || bc.template.getHtmlById("qfootHtml", 1), parseQueryString(), $.extend(bcp, {
            isAdmin: bc && bc.user.isAdmin
        }), bc.isAdminPreview && !bcp.numPP || (bc.inFrame || !s.c || !s.cs || bcp.isReportView ? (bcp.$pages = bcp.$myp.find(".divWrapper.bcpage"), bc.mySubtopic && bc.mySubtopic.pageCssClass && bcp.$pages.addClass(bc.mySubtopic.pageCssClass), bcp.$page = bcp.$pages.first(), bcp.$pages.addDataClasses(), bc.ccid && bc.report && bc.report.getPageTotalsData(), bc.inFrame ? bc.nav && bcpsetupFrame() : bc.nav.pageid = bcp.pageid, bcp.numPP ? ($.fn.mousewheel && bcp.$page.find("select").mousewheel((function(e) {
            return !1
        })), bcp.numPagesSoFar && (bcp.numPagesSoFar == bcp.totalPages && bcp.pageid && (bcp.$footerButtons = $('<div class="footerButtons noprint"></div>').insertAfter(bcp.$myp.find(".pagepart, .qfoot").last())), bcp.$myp.find(".pageFooter:last").append('<a href="#" class="popup-privacy floatRight smalltext noprint nolink" title="BestChoice privacy statement">Privacy</a>')), bcpsetup2(e), bcp.settingUp = !1) : fun.clearWaitMsg()) : bcploadInFrame())
    };
    var bcpsetup2 = function(e) {
            if (bcp.isQuestion ? bcpsetupQuestionPage() : bcp.showNextPageButton(), bcp.isTest && bcpsetupTest(), bcp.$myp.find(".pagepart").last().addClass("lastpp"), bcp.$myp.setupCustomPlugins(), window.setTimeout(bcpsetupDragDrop, 0), bcp.$page.on("click", ".bcpagelink", pageLink_click), bc.report && (bcp.isReportView || bc.isClassReportMode) && function(e) {
                    window.setTimeout((function() {
                        bc.report.setupReportDisplay(e)
                    }), 0)
                }(e), bcp.isAdmin) try {
                bcp.admin.setupAdmin()
            } catch (e) {}
            if ($.fn.mark && bc.config.highlightText) {
                bcp.$pages.mark(bc.config.highlightText.split(" "), {
                    acrossElements: !0
                })
            }
            $.support.touch && bcp.$myp.find("table").removeAttr("width"), $(window).resize(_.debounce(bcp.rePosition, 100)), $.fx.off = !1, window.setTimeout(bcp.rePosition, 0), !bc.inFrame && "bestchoice" == document.title.toLowerCase() && bcp.pageid && (document.title = "Page " + bcp.pageid)
        },
        pageLink_click = function() {
            var e, s = $(this).data(),
                n = _.isEmpty(s) ? _.trim($(this).attr("data")) : "";
            n && ((n = n.replace(/=/g, ":").replace(/;/g, ",")).indexOf(":") >= 0 ? s = fun.evalObjectString(n) : (n = n.split(","), s.cs = n[0] || null, s.p = n[1] || null, s.pi = n[2] || null)), bc.csid && s && !_.isEmpty(s) && (s.s && !s.cs && (e = _.filter(bc.coursesubtopic, {
                subtopicid: s.s
            })[0]) && (s.cs = e.id || null), s.cs && s.cs != bc.csid ? s.p ? bc.gotoSubtopicId(s.cs, s.p) : s.pi ? bc.gotoSubtopicId(s.cs, 0, s.pi) : bc.gotoSubtopicId(s.cs) : s.p ? bc.nav.gotoPageId(s.p) : s.pi && bc.nav.gotoPageIndex(s.pi))
        };
    $(document).ready((function() {
        switch (bc.startupFn) {
            case "pagepreview":
                bc.setupBC_previewPage()
        }
    }))
}();
//# sourceMappingURL=bcpage.min.js.map

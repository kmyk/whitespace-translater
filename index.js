var resizeTextarea = function (dom) {
    var h = dom.style.height;
    if(dom.value == "") { h = 26 + "px"; }
    h = parseInt(h) - 30;
    if (h < 30) { h = 30; }
    dom.style.height = h + "px";
    dom.style.height = parseInt(dom.scrollHeight) + "px";
};
var resizeTextareaByEvent = function (event) {
    var id;
    try {
        id = event.srcElement.id;
    } catch (e) {
        id = event.target.id;
    }
    var dom = document.getElementById(id);
    resizeTextarea(dom);
};

window.onload = function () {
    var dropComments = function (s) {
        var t = [];
        for (var i = 0; i < s.length; ++i) {
            var c = s.charAt(i);
            if (c == " " || c == "\t" || c == "\n") {
                t.push(c);
            }
        }
        return t.join('');
    };

    // from whitespace without comments
    var toST = function (s) {
        var t = [];
        for (var i = 0; i < s.length; ++i) {
            var u = ({ " " :  "S", "\t" : "T", "\n" : "\n" })[s.charAt(i)];
            if (u == undefined) { throw new Error(""); }
            t.push(u);
        }
        return t;
    };
    // to whitespace
    var unST = function (s) {
        var t = s.map(function (c) {
            return { 'S' : ' ', 'T' : '\t', "\n" : "\n" }[c];
        });
        return t.join('');
    };
    var readST = function (s) {
        var t = [];
        for (var i = 0; i < s.length; ++i) {
            var c = s.charAt(i);
            if (c == 'S' || c == 'T' || c == "\n") {
                t.push(c);
            }
        }
        return t;
    };
    var printST = function (s) { return s.join(''); };

    var asmTable = [];
    (function () {
        var t = [];
        // stack
        t.push(['SS',  'PUSH', 'n']);
        t.push(['SLS', 'DUP']);
        t.push(['STS', 'COPYNTH', 'n']);
        t.push(['SLT', 'SWAP']);
        t.push(['SLL', 'DISCARD']);
        t.push(['STL', 'SLIDE', 'n']);
        // arith
        t.push(['TSSS',  'ADD']);
        t.push(['TSST',  'SUB']);
        t.push(['TSSL',  'MULT']);
        t.push(['TSTS',  'DIV']);
        t.push(['TSTT',  'MOD']);
        // heap
        t.push(['TTS',  'STORE']);
        t.push(['TTT',  'RETRIEVE']);
        // flow
        t.push(['LSS',  'LABEL', 'l']);
        t.push(['LST',  'CALL', 'l']);
        t.push(['LSL',  'JUMP', 'l']);
        t.push(['LTS',  'JUMPZERO', 'l']);
        t.push(['LTT',  'JUMPNEG', 'l']);
        t.push(['LTL',  'RETURN']);
        t.push(['LLL',  'EXIT']);
        // io
        t.push(['TLSS',  'PUTCHAR']);
        t.push(['TLST',  'PUTNUM']);
        t.push(['TLTS',  'GETCHAR']);
        t.push(['TLTT',  'GETNUM']);
        for (var i = 0; i < t.length; ++i) {
            asmTable.push({
                code : t[i][0].replace(/L/g,"\n"),
                name : t[i][1],
                args : t[i][2],
            });
        }
    })();
    var asmTableC = {};
    var asmTableN = {};
    (function () {
        for (var i = 0; i < asmTable.length; ++i) {
            var t = asmTable[i];
            asmTableC[t.code] = i;
            asmTableN[t.name] = i;
        }
    })();
    var getAsmByCode = function (a) { return asmTable[asmTableC[a]]; };
    var getAsmByName = function (a) { return asmTable[asmTableN[a]]; };
    var readNum = function (s,i) {
        var t = [];
        while (s[i] == 'S' || s[i] == 'T') {
            t.push(s[i] == 'S' ? '0' : '1');
            i += 1;
        }
        if (2 <= t.length) t[0] = (t[0] == '0' ? '' : '-');
        i += 1; // skip sentinel
        t = parseInt(t.join(''),2);
        return [t,i];
    };
    var readLabel = function (s,i) {
        var t = [];
        while (s[i] == 'S' || s[i] == 'T') {
            t.push(s[i]);
            i += 1;
        }
        i += 1; // skip sentinel
        return [t.join(''),i];
    };

    // from st
    var toAsm = function (s) {
        var t = [];
        var i = 0;
        while (i < s.length) {
            var u = undefined;
            for (var j = 2; j <= 4; ++j) {
                if (u == undefined) {
                    u = getAsmByCode(s.slice(i,i+j).join(''));
                }
            }
            if (u == undefined) {
                // throw new Error();
                t.push([undefined, '*** conversion failure ***',
                        s.slice(i).join('')]);
                break;
            }
            i += u.code.length;
            if (u.args) {
                var v = ({ n : readNum, l : readLabel })[u.args](s,i);
                i = v[1];
                u = [u.name, v[0]];
            } else {
                u = [u.name];
            }
            t.push(u);
        }
        return t;
    };
    var readAsm = function (s) {
        s = s.split("\n");
        var t = [];
        for (var i = 0; i < s.length; ++i) {
            var l = s[i].trim();
            if (l == "" || l[0] == "#") continue;
            l = l.split(/ +/);
            var a = getAsmByName(l[0]);
            if (a == undefined) {
                t.push([undefined,
                        '*** conversion failure: line ' + i + ' ***',
                        '***   unknown command : ' + s[i].trim() + ' ***']);
                continue;
            }
            if (l.length != 1 + (a.args ? 1 : 0)) {
                t.push([undefined,
                        '*** conversion failure: line ' + i + ' ***',
                        '***   wrong number of arguments : ' + s[i].trim() + ' ***']);
                continue;
            }
            // apply identity when 'l'
            if (a.args == 'n') {
                l[1] = parseInt(l[1]);
            }
            t.push(l);
        }
        return t;
    };
    var unNum = function (n) {
        n = parseInt(n);
        var sgn = 0 <= n ? "S" : "T";
        if (n < 0) n *= -1;
        var s = [];
        while (0 < n) {
            s.push(n % 2 ? "T" : "S");
            n = Math.floor(n / 2);
        }
        s.push(sgn);
        s.reverse();
        s.push("\n");
        return s.join('');
    };
    var parseLabel = function (s) { return s; }
    var unAsm = function (s) {
        var t = [];
        for (var i = 0; i < s.length; ++i) {
            var l = s[i];
            if (l[0] == undefined) continue;
            var a = getAsmByName(l[0]);
            t.push(a.code);
            if (a.args == 'n') {
                t.push(unNum(l[1]));
            } else if (a.args == 'l') {
                t.push(l[1] + "\n");
            }
        }
        s = t.join('');
        t = [];
        for (var i = 0; i < s.length; ++i) {
            t.push(s.charAt(i));
        }
        return t;
    };

    var printAsm = function (s) {
        var t = [];
        for (var i = 0; i < s.length; ++i) {
            if (s[i][0] == undefined) {
                t.push(s[i].slice(1).join("\n"));
            } else if (s[i].length == 1) {
                t.push(s[i][0]);
            } else if (s[i].length == 2) {
                t.push(s[i][0] + ' ' + s[i][1].toString());
            } else {
                throw new Error('');
            }
        }
        return t.join("\n");
    }

    document.getElementById("convert").onclick = function () {
        var input = document.getElementById("input").value;
        var outarea = document.getElementById("output");
        var intype = document.getElementById("intype").value;
        var outtype = document.getElementById("outtype").value;

        var code = [];
        (function () {
            var ret = undefined;
            if (intype == 'ws') {
                if (outtype == 'ws') {
                    ret = dropComments(input);
                } else if (outtype == 'st') {
                    ret = printST(toST(dropComments(input)));
                } else if (outtype == 'as') {
                    ret = printAsm(toAsm(toST(dropComments(input))));
                }
            } else if (intype == 'st') {
                if (outtype == 'ws') {
                    ret = unST(readST(input));
                } else if (outtype == 'st') {
                    ret = printST(readST(input));
                } else if (outtype == 'as') {
                    ret = printAsm(toAsm(readST(input)));
                }
            } else if (intype == 'as') {
                if (outtype == 'ws') {
                    ret = unST(unAsm(readAsm(input)));
                } else if (outtype == 'st') {
                    ret = printST(unAsm(readAsm(input)));
                } else if (outtype == 'as') {
                    ret = printAsm(readAsm(input));
                }
            }
            if (ret == undefined) { throw new Error(''); }
            outarea.value = ret;
            resizeTextarea(outarea);
        })();
    };
};

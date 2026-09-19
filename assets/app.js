/* ============================================================
   Yangle · 个人主页交互逻辑
   ------------------------------------------------------------
   · 主题切换（浅色 / 深色，记忆到 localStorage）
   · 滚动联动导航 + 数字滚动动画
   · 技术笔记索引（分类折叠 / 分组筛选 / 实时搜索）
   · 博客文章（自动读取 blog/index.json 清单 + 客户端渲染）
   · 文章阅读浮层（内置 Markdown 渲染器，零外部依赖、可离线）
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ============================================================
     1. 主题
     ============================================================ */
  var THEME_KEY = 'yangle-theme';

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var theme = saved;
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    var btn = $('#themeBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    }
  }

  /* ============================================================
     2. 工具函数
     ============================================================ */
  // 只转义 & < " ，故意保留 > —— 因为块级解析阶段需要识别行首的引用块标记「>」。
  // 行内解析时会再把剩余的裸 > 补转义（见 inline），最终输出始终是安全且完整的。
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }
  // 完整转义（含 >），用于代码块等纯文本内容
  function escAll(s) {
    return esc(s).replace(/>/g, '&gt;');
  }
  function fmtDate(s) {
    if (!s) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    if (!m) return String(s);
    return m[1] + ' 年 ' + parseInt(m[2], 10) + ' 月 ' + parseInt(m[3], 10) + ' 日';
  }
  function encodePath(p) {
    return String(p).split('/').map(encodeURIComponent).join('/');
  }

  /* ============================================================
     3. Markdown 渲染器（精简版，覆盖常用语法，零依赖）
     ============================================================ */
  var MD = (function () {
    var PH = '\u0000';   // 占位符前缀

    /* ---- 行内语法 ---- */
    function inline(s) {
      var codes = [];
      // 1) 行内代码先保护（内容完整转义），避免其中符号被后续规则误伤
      s = s.replace(/`([^`]+)`/g, function (_, c) {
        codes.push(c.replace(/>/g, '&gt;'));
        return PH + 'C' + (codes.length - 1) + PH;
      });

      // 2) 此时行首的引用块标记「>」已在块级解析阶段剥离，剩余裸 > 均为普通文本，可安全转义
      s = s.replace(/>/g, '&gt;');

      // 3) 图片（alt / title 已是转义后的文本，可直接使用）
      s = s.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
        function (_, alt, url, title) {
          return '<img src="' + url + '" alt="' + alt + '"' +
                 (title ? ' title="' + title + '"' : '') + ' loading="lazy">';
        });

      // 4) 链接
      s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\s*\)/g,
        function (_, text, url, title) {
          var ext = /^https?:\/\//i.test(url);
          return '<a href="' + url + '"' +
                 (title ? ' title="' + title + '"' : '') +
                 (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + text + '</a>';
        });

      // 5) 裸网址自动转链接（已是转义形态，直接复用）
      s = s.replace(/(^|[\s(（])(https?:\/\/[^\s<>()（）]+)/g, function (_, pre, url) {
        var clean = url.replace(/[.,;:!?）)]+$/, '');
        var tail = url.slice(clean.length);
        return pre + '<a href="' + clean + '" target="_blank" rel="noopener noreferrer">' +
               clean + '</a>' + tail;
      });

      // 6) 强调
      s = s.replace(/\*\*([^\s*][^*]*?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/__([^\s_][^_]*?)__/g, '<strong>$1</strong>');
      s = s.replace(/(^|[^*\w])\*([^\s*][^*\n]*?)\*/g, '$1<em>$2</em>');
      s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

      // 7) 还原行内代码
      s = s.replace(new RegExp(PH + 'C(\\d+)' + PH, 'g'), function (_, i) {
        return '<code>' + codes[+i] + '</code>';
      });
      return s;
    }

    function isBlockStart(line) {
      return /^\s*(#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\|)/.test(line) ||
             /^\s*([-*_])(\s*\1){2,}\s*$/.test(line);
    }

    /* ---- 表格 ---- */
    function parseTable(head, sep, rows) {
      function cells(l) {
        return l.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
                .split('|').map(function (c) { return inline(c.trim()); });
      }
      var aligns = sep.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) {
        c = c.trim();
        if (/^:-+:$/.test(c)) return 'center';
        if (/^-+:$/.test(c))  return 'right';
        return 'left';
      });
      var html = '<table><thead><tr>';
      cells(head).forEach(function (c, i) {
        html += '<th style="text-align:' + (aligns[i] || 'left') + '">' + c + '</th>';
      });
      html += '</tr></thead><tbody>';
      rows.forEach(function (r) {
        html += '<tr>';
        cells(r).forEach(function (c, i) {
          html += '<td style="text-align:' + (aligns[i] || 'left') + '">' + c + '</td>';
        });
        html += '</tr>';
      });
      return html + '</tbody></table>';
    }

    /* ---- 列表（支持一级嵌套） ---- */
    function parseList(lines, i) {
      var ordered = /^\s*\d+[.)]\s/.test(lines[i]);
      var baseIndent = (lines[i].match(/^\s*/) || [''])[0].length;
      var items = [];

      while (i < lines.length) {
        var line = lines[i];
        if (!line.trim()) {
          var nxt = lines[i + 1];
          if (nxt && /^\s*([-*+]|\d+[.)])\s+/.test(nxt) &&
              (nxt.match(/^\s*/) || [''])[0].length >= baseIndent) { i++; continue; }
          break;
        }
        var indent = (line.match(/^\s*/) || [''])[0].length;
        var m = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
        if (!m || indent < baseIndent) break;

        if (indent > baseIndent) {
          // 更深缩进 → 作为上一项的嵌套子列表
          var j = i, sub = [];
          while (j < lines.length) {
            var l = lines[j];
            if (!l.trim()) { sub.push(''); j++; continue; }
            var ind = (l.match(/^\s*/) || [''])[0].length;
            if (ind > baseIndent) { sub.push(l); j++; } else break;
          }
          var nested = parseBlocks(sub.map(function (l) { return l.slice(baseIndent + 2); }));
          if (items.length) {
            items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, nested + '</li>');
          }
          i = j;
          continue;
        }

        items.push('<li>' + inline(m[1]) + '</li>');
        i++;
      }
      var tag = ordered ? 'ol' : 'ul';
      return ['<' + tag + '>' + items.join('') + '</' + tag + '>', i];
    }

    /* ---- 块级 ---- */
    function parseBlocks(lines) {
      var html = '', i = 0;
      while (i < lines.length) {
        var line = lines[i];
        if (!line.trim()) { i++; continue; }

        // 代码块占位符
        if (line.indexOf(PH) === 0) { html += line; i++; continue; }

        // 标题
        var h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
        if (h) {
          var lv = h[1].length;
          html += '<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>';
          i++; continue;
        }

        // 分隔线
        if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }

        // 引用块
        if (/^\s*>/.test(line)) {
          var q = [];
          while (i < lines.length && /^\s*>/.test(lines[i])) {
            q.push(lines[i].replace(/^\s*>\s?/, ''));
            i++;
          }
          html += '<blockquote>' + parseBlocks(q) + '</blockquote>';
          continue;
        }

        // 表格
        if (/^\s*\|/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
          var head = line, sep = lines[i + 1], rows = [];
          i += 2;
          while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
          html += parseTable(head, sep, rows);
          continue;
        }

        // 列表
        if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
          var r = parseList(lines, i);
          html += r[0]; i = r[1]; continue;
        }

        // 段落
        var buf = [line];
        i++;
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i]) &&
               lines[i].indexOf(PH) !== 0) { buf.push(lines[i]); i++; }
        html += '<p>' + inline(buf.map(function (l, k) {
          var br = /\s\s$/.test(l);
          var txt = l.replace(/\s+$/, '');
          if (k === buf.length - 1) return txt;
          return txt + (br ? '<br>' : ' ');
        }).join('')) + '</p>';
      }
      return html;
    }

    function render(src) {
      src = String(src || '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
      // 去掉 YAML front matter
      src = src.replace(/^---\n[\s\S]*?\n---[ \t]*\n?/, '');

      // 抽出围栏代码块（先转义其内容）
      var codes = [];
      function stash(lang, body) {
        var cls = lang && lang.trim() ? ' class="language-' + esc(lang.trim()) + '"' : '';
        codes.push('<pre><code' + cls + '>' + escAll(body.replace(/\n+$/, '')) + '</code></pre>');
        return PH + 'B' + (codes.length - 1) + PH;
      }
      src = src.replace(/^[ \t]*```([^\n`]*)\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, function (_, lang, body) {
        return stash(lang, body);
      });
      // 未闭合的围栏兜底
      src = src.replace(/^[ \t]*```([^\n`]*)\n([\s\S]*)$/m, function (_, lang, body) {
        return stash(lang, body);
      });

      src = esc(src);   // 只转义 & < " ，保留 >
      var out = parseBlocks(src.split('\n'));
      return out.replace(new RegExp(PH + 'B(\\d+)' + PH, 'g'), function (_, i) {
        return codes[+i];
      });
    }

    return { render: render };
  })();

  // 对外暴露，便于自动化测试（不影响页面行为）
  if (typeof window !== 'undefined') window.__YANGLE_MD = MD;

  /* ============================================================
     4. 导航联动 + 数字动画
     ============================================================ */
  function initNav() {
    var nav = $('#nav');
    function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var links = $$('.nav-links a');
    var targets = links.map(function (a) { return $(a.getAttribute('href')); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a, i) { a.classList.toggle('active', targets[i] === e.target); });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      targets.forEach(function (t) { if (t) io.observe(t); });
    }

    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function animateNum(el, to) {
    var dur = 900, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ============================================================
     5. 技术笔记索引
     ============================================================ */
  function initNotes() {
    var data = window.NOTE_DATA || [];
    var grid = $('#notesGrid');
    var chips = $('#notesChips');
    var input = $('#notesSearch');
    var empty = $('#notesEmpty');
    var note = $('#notes .sec-note');
    if (!grid) return;

    var total = 0, catCount = 0;
    data.forEach(function (g) {
      g.cats.forEach(function (c) { total += c.links.length; catCount++; });
    });
    var sn = $('[data-stat="notes"]'); if (sn) animateNum(sn, total);
    var sc = $('[data-stat="cats"]');  if (sc) animateNum(sc, catCount);
    if (note) {
      note.innerHTML = '历史沉淀 · 共 <b>' + total + '</b> 篇 · ' + catCount +
                       ' 个分类 · 点击标题展开';
    }

    // 分类卡片
    var html = '';
    data.forEach(function (g, gi) {
      g.cats.forEach(function (c, ci) {
        html += '<section class="note-cat" data-group="' + esc(g.group) + '" ' +
          'style="animation-delay:' + Math.min((gi * 3 + ci) * 35, 420) + 'ms">' +
          '<button class="note-cat-head" type="button" aria-expanded="false">' +
            '<span class="note-cat-ico">' + c.icon + '</span>' +
            '<span class="note-cat-name">' + esc(c.name) + '</span>' +
            '<span class="note-cat-count">' + c.links.length + '</span>' +
            '<svg class="note-cat-arrow" viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="m6 9.5 6 6 6-6" fill="none" stroke-width="2.2" ' +
              'stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
          '<div class="note-cat-body"><div><ul class="note-list">';
        c.links.forEach(function (l) {
          html += '<li><a class="note-link" href="' + esc(l.u) + '" target="_blank" rel="noopener noreferrer">' +
            esc(l.t) +
            '<svg class="ext" viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" ' +
              'fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</a></li>';
        });
        html += '</ul></div></div></section>';
      });
    });
    grid.innerHTML = html;

    // 分组筛选
    var chipHtml = '<button class="chip on" type="button" data-group="*">全部<em>' + total + '</em></button>';
    data.forEach(function (g) {
      var n = g.cats.reduce(function (a, c) { return a + c.links.length; }, 0);
      chipHtml += '<button class="chip" type="button" data-group="' + esc(g.group) + '">' +
                  esc(g.group) + '<em>' + n + '</em></button>';
    });
    chips.innerHTML = chipHtml;

    var curGroup = '*';

    function apply() {
      var kw = ((input && input.value) || '').trim().toLowerCase();
      var shown = 0;
      $$('.note-cat', grid).forEach(function (card) {
        var okGroup = curGroup === '*' || card.dataset.group === curGroup;
        var links = $$('.note-link', card);
        var hit = 0;
        links.forEach(function (a) {
          var match = !kw || a.textContent.toLowerCase().indexOf(kw) > -1;
          a.parentNode.style.display = match ? '' : 'none';
          if (match) hit++;
        });
        var visible = okGroup && hit > 0;
        card.style.display = visible ? '' : 'none';
        if (visible) {
          shown++;
          if (kw) {   // 搜索时自动展开命中分类
            card.classList.add('open');
            var b = $('.note-cat-head', card);
            if (b) b.setAttribute('aria-expanded', 'true');
          }
        }
      });
      empty.hidden = shown > 0;
    }

    chips.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.chip') : null;
      if (!btn) return;
      curGroup = btn.dataset.group;
      $$('.chip', chips).forEach(function (b) { b.classList.toggle('on', b === btn); });
      apply();
    });

    grid.addEventListener('click', function (e) {
      var head = e.target.closest ? e.target.closest('.note-cat-head') : null;
      if (!head) return;
      var card = head.parentNode;
      var open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    if (input) {
      var timer = null;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 120);
      });
    }
    apply();
  }

  /* ============================================================
     6. 博客文章（读取 blog/index.json）
     ============================================================ */
  var POSTS = [];

  var CAL_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke-width="1.8"/>' +
      '<path d="M3.5 10h17M8 3.2v3.4M16 3.2v3.4" fill="none" stroke-width="1.8" stroke-linecap="round"/>' +
    '</svg>';

  var FILE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M13.6 2.8H6.5a1.5 1.5 0 0 0-1.5 1.5v15.4a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V8.2z" ' +
        'fill="none" stroke-width="1.7" stroke-linejoin="round"/>' +
      '<path d="M13.6 2.8v5.4H19" fill="none" stroke-width="1.7" stroke-linejoin="round"/>' +
    '</svg>';

  var DL_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5" fill="none" stroke-width="1.9" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M4.5 19.5h15" fill="none" stroke-width="1.9" stroke-linecap="round"/>' +
    '</svg>';

  // 置顶图钉
  var PIN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M8.4 4.6h7.2l-1.1 5.1 2.6 2.5v1.4H6.9v-1.4l2.6-2.5z" fill="none" ' +
        'stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M12 13.6v5.8" fill="none" stroke-width="1.6" stroke-linecap="round"/>' +
    '</svg>';

  // 资料卡片（BLog 里的 PPT / PDF / Word / Excel 等文档）
  function isFile(p) { return !!p && p.kind === 'file'; }

  // 置顶徽标：文章与资料卡片共用（置顶关系在 blog/index.json 里已排好序）
  function isPinned(p) { return !!(p && p.pinned); }

  function pinBadge() {
    return '<span class="pin-badge" title="置顶文章">' + PIN_SVG + '置顶</span>';
  }

  function tagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return '<span class="post-tags">' + tags.map(function (t) {
      return '<span>' + esc(t) + '</span>';
    }).join('') + '</span>';
  }

  function fileBits(p) {
    var bits = [];
    if (p.fileKind) bits.push(p.fileKind);
    if (p.pageCount) bits.push('共 ' + p.pageCount + ' 页');
    if (p.fileSizeText) bits.push(p.fileSizeText);
    return bits;
  }

  function postCardHtml(p, i) {
    var style = 'animation-delay:' + Math.min(i * 45, 400) + 'ms';
    var head = '<span class="post-date">' + CAL_SVG + fmtDate(p.date) + '</span>' +
               '<span class="post-dot"></span>';
    var pin = isPinned(p) ? pinBadge() : '';
    var cls = 'post-card' + (isPinned(p) ? ' post-card--pinned' : '');

    if (isFile(p)) {
      var short = [];
      if (p.pageCount) short.push('共 ' + p.pageCount + ' 页');
      else if (p.fileLabel) short.push(p.fileLabel);
      if (p.fileSizeText) short.push(p.fileSizeText);
      return '<a class="' + cls + ' post-card--file" href="#/post/' +
        encodeURIComponent(p.slug) +
        '" data-slug="' + esc(p.slug) + '" style="' + style + '">' +
        '<span class="post-card-top">' + pin + head +
          '<span class="post-read">' + esc(short.join(' · ')) + '</span>' +
          '<span class="file-badge">' + esc(p.fileLabel || 'FILE') + '</span>' +
        '</span>' +
        '<h3>' + esc(p.title) + '</h3>' +
        (p.summary ? '<p>' + esc(p.summary) + '</p>' : '') +
        tagsHtml(p.tags) +
      '</a>';
    }

    return '<a class="' + cls + '" href="#/post/' + encodeURIComponent(p.slug) +
      '" data-slug="' + esc(p.slug) + '" style="' + style + '">' +
      '<span class="post-card-top">' + pin + head +
        '<span class="post-read">' + (p.readingMinutes || 1) + ' 分钟读完</span>' +
      '</span>' +
      '<h3>' + esc(p.title) + '</h3>' +
      (p.summary ? '<p>' + esc(p.summary) + '</p>' : '') +
      tagsHtml(p.tags) +
    '</a>';
  }

  function initBlog() {
    var grid = $('#blogGrid');
    var chips = $('#blogTags');
    var input = $('#blogSearch');
    var empty = $('#blogEmpty');
    var emptyText = $('#blogEmptyText');
    var loading = $('#blogLoading');
    if (!grid) return Promise.resolve();
    // 加载动画默认隐藏（无 JS 时不会一直转），由脚本在开始拉取时显示
    if (loading) loading.hidden = false;

    var curTag = '*';

    function apply() {
      var kw = ((input && input.value) || '').trim().toLowerCase();
      var list = POSTS.filter(function (p) {
        if (curTag !== '*' && (p.tags || []).indexOf(curTag) < 0) return false;
        if (!kw) return true;
        return (p.title + ' ' + (p.summary || '') + ' ' + (p.tags || []).join(' '))
          .toLowerCase().indexOf(kw) > -1;
      });
      // 3 列时末行只剩 1 张会空出 2 个卡位；当换成 2 列正好排满时（4 / 10 / 16… 篇）改两列
      var duo = list.length >= 4 && list.length % 3 === 1 && list.length % 2 === 0;
      grid.classList.toggle('blog-grid--duo', duo);
      grid.innerHTML = list.map(postCardHtml).join('');
      empty.hidden = list.length > 0;
      if (emptyText && POSTS.length && !list.length) {
        emptyText.textContent = '换个关键词或标签试试。';
      }
    }

    chips.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.chip') : null;
      if (!btn) return;
      curTag = btn.dataset.tag;
      $$('.chip', chips).forEach(function (b) { b.classList.toggle('on', b === btn); });
      apply();
    });

    if (input) {
      var timer = null;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(apply, 120);
      });
    }

    var done = fetch('blog/index.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        POSTS = (data && data.posts) || [];
        if (loading) loading.hidden = true;

        var counts = {};
        POSTS.forEach(function (p) {
          (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
        });
        var tags = '<button class="chip on" type="button" data-tag="*">全部<em>' +
                   POSTS.length + '</em></button>';
        Object.keys(counts)
          .sort(function (a, b) { return counts[b] - counts[a]; })
          .forEach(function (t) {
            tags += '<button class="chip" type="button" data-tag="' + esc(t) + '">' +
                    esc(t) + '<em>' + counts[t] + '</em></button>';
          });
        chips.innerHTML = tags;

        // 交给 apply()：它会按当前筛选结果渲染卡片，并顺带决定列数（blog-grid--duo）
        apply();

        var sp = $('[data-stat="posts"]');
        if (sp) { if (POSTS.length) animateNum(sp, POSTS.length); else sp.textContent = '0'; }
      })
      .catch(function () {
        if (loading) loading.hidden = true;
        POSTS = [];
        grid.innerHTML = '';
        empty.hidden = false;
        var sp2 = $('[data-stat="posts"]');
        if (sp2) sp2.textContent = '0';
      });

    // 点击卡片打开阅读浮层（hashchange 也会触发，openPost 内做了幂等保护）
    grid.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.post-card') : null;
      if (!card) return;
      openPost(card.dataset.slug);
    });

    // 返回 Promise：boot 里等清单加载完再渲染 AI 实践的「实践产出」
    return done;
  }

  /* ============================================================
     6.5 AI 实践（技术栈里的 AI 主线）
     方向卡来自 window.AI_DATA；「实践产出」直接从博客清单里挑，
     所以以后把新文章打上 AI 相关标签，这里会自动出现，不用改代码。
     ============================================================ */
  var LEVEL_CLASS = {
    '已落地': 'live',
    '实践中': 'doing',
    '学习中': 'learning',
    '规划中': 'todo'
  };

  function aiTrackHtml(t, i) {
    var levels = (window.AI_DATA && window.AI_DATA.levels) || {};
    var power = levels[t.level] || 1;
    var seg = [];
    for (var s = 1; s <= 5; s++) {
      seg.push(s <= power ? '<i class="on"></i>' : '<i></i>');
    }
    var tools = (t.tools || []).map(function (x) {
      return '<span>' + esc(x) + '</span>';
    }).join('');
    return '<article class="ai-track ai-track--' + (LEVEL_CLASS[t.level] || 'todo') +
      '" style="animation-delay:' + Math.min(i * 45, 360) + 'ms">' +
      '<div class="ai-track-top">' +
        '<span class="ai-ico">' + (t.icon || '🤖') + '</span>' +
        '<span class="ai-level">' + esc(t.level || '') + '</span>' +
      '</div>' +
      '<h3>' + esc(t.name) + '</h3>' +
      '<p>' + esc(t.desc) + '</p>' +
      '<div class="ai-meter" title="' + esc(t.level || '') + '">' + seg.join('') + '</div>' +
      '<div class="ai-tools">' + tools + '</div>' +
    '</article>';
  }

  function aiOutputHtml(list) {
    return list.map(function (p) {
      var file = isFile(p);
      var kind = file ? (p.fileLabel || 'FILE') : '文章';
      var meta = file
        ? [p.fileKind || '资料', p.fileSizeText].filter(Boolean).join(' · ')
        : ((p.readingMinutes || 1) + ' 分钟读完');
      return '<a class="ai-out" href="#/post/' + encodeURIComponent(p.slug) + '">' +
        '<span class="ai-out-kind' + (file ? ' ai-out-kind--file' : '') + '">' +
          esc(kind) + '</span>' +
        '<span class="ai-out-txt"><b>' + esc(p.title) + '</b><i>' + esc(meta) + '</i></span>' +
        '<svg class="ai-out-arrow" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" fill="none" stroke-width="1.9" ' +
          'stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</a>';
    }).join('');
  }

  function initAI() {
    var data = window.AI_DATA;
    var box = $('#aiTracks');
    if (!data || !box) return;

    var tracks = data.tracks || [];
    box.innerHTML = tracks.map(aiTrackHtml).join('');

    // 实践产出：标签命中或标题命中 AI 关键词；文章在前、资料在后，各自按日期倒序
    var re = new RegExp(data.matchRe || 'AI', 'i');
    var tags = data.matchTags || [];
    var list = POSTS.filter(function (p) {
      var hit = (p.tags || []).some(function (t) { return tags.indexOf(t) > -1; });
      if (!hit) hit = re.test(p.title + ' ' + p.slug);
      return hit;
    }).sort(function (a, b) {
      var af = isFile(a) ? 1 : 0, bf = isFile(b) ? 1 : 0;
      if (af !== bf) return af - bf;              // 文章在前，资料在后
      var at = a.date || '', bt = b.date || '';
      if (at !== bt) return at < bt ? 1 : -1;     // 各自按日期倒序
      return 0;                                   // 同日保持清单原序（稳定排序）
    });

    var out = $('#aiOutput'), listBox = $('#aiOutputList');
    if (out && listBox && list.length) {
      listBox.innerHTML = aiOutputHtml(list);
      out.hidden = false;
    }

    var note = $('#aiNote');
    if (note) {
      var live = tracks.filter(function (t) { return t.level === '已落地'; }).length;
      note.innerHTML = '技术栈新增方向 · 共 <b>' + tracks.length + '</b> 个方向' +
        '（已落地 ' + live + '）' +
        (list.length ? ' · 站内产出 <b>' + list.length + '</b> 份' : '');
    }
  }

  /* ============================================================
     7. 文章阅读浮层
     ============================================================ */
  var reader = null;
  var savedScrollY = 0;

  function filePanelHtml(p) {
    var href = encodePath(p.path);
    var abs = href;
    try { abs = new URL(href, window.location.href).href; } catch (e) { abs = href; }

    var label = (p.fileLabel || '').toUpperCase();
    var previewHref = '';
    if (label === 'PDF') {
      previewHref = href;                                  // PDF 浏览器可原生预览
    } else if (/^(PPT|PPTX|DOC|DOCX|XLS|XLSX)$/.test(label)) {
      previewHref = 'https://view.officeapps.live.com/op/view.aspx?src=' +
                    encodeURIComponent(abs);               // Office 在线预览
    }

    var groups = [];
    (p.outline || []).forEach(function (it) {
      var sec = it.section || '';
      var last = groups[groups.length - 1];
      if (!last || last.section !== sec) {
        last = { section: sec, items: [] };
        groups.push(last);
      }
      last.items.push(it);
    });

    var rows = groups.map(function (g) {
      return '<div class="file-outline-group">' +
        (g.section ? '<h4>' + esc(g.section) + '</h4>' : '') +
        '<ul class="file-outline-list">' +
        g.items.map(function (it) {
          return '<li><span class="file-outline-n">p' + esc(String(it.n)) + '</span>' +
                 '<span>' + esc(it.text) + '</span></li>';
        }).join('') +
        '</ul></div>';
    }).join('');

    var info = fileBits(p).join(' · ');
    return '<div class="file-panel">' +
        '<div class="file-brief">' +
          '<span class="file-icon">' + FILE_SVG + '</span>' +
          '<div class="file-brief-text">' +
            '<strong>' + esc(p.fileName || p.title) + '</strong>' +
            '<span>' + esc(info) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="file-actions">' +
          '<a class="btn btn-primary" href="' + esc(href) + '" download>' +
            DL_SVG + '下载文件</a>' +
          (previewHref
            ? '<a class="btn btn-ghost" href="' + esc(previewHref) +
              '" target="_blank" rel="noopener">在线预览</a>'
            : '') +
        '</div>' +
        (rows
          ? '<h2 class="file-outline-title">' + esc(p.outlineLabel || '内容大纲') + '</h2>' +
            '<div class="file-outline">' + rows + '</div>'
          : '<p class="md-empty">这份资料没有可自动提取的文字大纲，下载后用本地软件打开即可。</p>') +
      '</div>';
  }

  function findPost(slug) {
    for (var i = 0; i < POSTS.length; i++) if (POSTS[i].slug === slug) return POSTS[i];
    return null;
  }

  function openPost(slug, skipHash) {
    var p = findPost(slug);
    if (!p || !reader) return;
    if (!reader.hidden && reader.dataset.slug === slug) return;   // 幂等

    savedScrollY = window.scrollY || 0;
    reader.dataset.slug = slug;
    reader.hidden = false;
    document.body.classList.add('no-scroll');
    if (!skipHash) history.replaceState(null, '', '#/post/' + encodeURIComponent(slug));

    var scroll = $('#readerScroll');
    if (scroll) scroll.scrollTop = 0;
    var bar = $('#readProgress');
    if (bar) bar.style.width = '0%';

    $('#readerTitle').textContent = p.title;
    $('#readerMeta').innerHTML =
      (isPinned(p) ? pinBadge() : '') +
      '<span class="post-date">' + fmtDate(p.date) + '</span>' +
      '<span class="post-dot"></span>' +
      '<span class="post-read">' +
        (isFile(p) ? esc(fileBits(p).join(' · ')) : (p.readingMinutes || 1) + ' 分钟读完') +
      '</span>' + tagsHtml(p.tags);

    if (isFile(p)) {
      $('#readerBody').innerHTML = filePanelHtml(p);
      return;
    }

    $('#readerBody').innerHTML = '<p class="md-empty">正在加载正文…</p>';

    fetch(encodePath(p.path) + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (txt) {
        if (reader.dataset.slug !== slug) return;
        $('#readerBody').innerHTML = MD.render(txt);
      })
      .catch(function () {
        if (reader.dataset.slug !== slug) return;
        $('#readerBody').innerHTML =
          '<p class="md-empty">正文加载失败。<br>' +
          '如果正在本地直接双击 HTML 打开（file:// 协议），浏览器出于安全限制不允许读取本地文件，' +
          '请改用本地服务器访问，或直接查看 GitHub Pages 线上版本。</p>';
      });
  }

  function closePost() {
    if (!reader || reader.hidden) return;
    reader.hidden = true;
    reader.dataset.slug = '';
    document.body.classList.remove('no-scroll');
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo(0, savedScrollY);
  }

  function initReader() {
    reader = $('#reader');
    if (!reader) return;

    $$('[data-close]', reader).forEach(function (el) {
      el.addEventListener('click', closePost);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !reader.hidden) closePost();
    });

    var copyBtn = $('#copyLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var url = window.location.href;
        var done = function () {
          var old = copyBtn.textContent;
          copyBtn.textContent = '已复制 ✓';
          setTimeout(function () { copyBtn.textContent = old; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt('复制链接：', url); });
        } else {
          window.prompt('复制链接：', url);
        }
      });
    }

    var scroll = $('#readerScroll');
    var bar = $('#readProgress');
    if (scroll && bar) {
      scroll.addEventListener('scroll', function () {
        var max = scroll.scrollHeight - scroll.clientHeight;
        bar.style.width = (max > 0 ? (scroll.scrollTop / max) * 100 : 0) + '%';
      }, { passive: true });
    }

    // 支持直接用 #/post/xxx 打开（等清单加载完再试）
    var m = /^#\/post\/(.+)$/.exec(window.location.hash || '');
    if (m) {
      var slug = decodeURIComponent(m[1]);
      var tries = 0;
      (function tryOpen() {
        if (findPost(slug)) openPost(slug, true);
        else if (tries++ < 12) setTimeout(tryOpen, 250);
      })();
    }
    window.addEventListener('hashchange', function () {
      var mm = /^#\/post\/(.+)$/.exec(window.location.hash || '');
      if (mm) openPost(decodeURIComponent(mm[1]), true);
      else if (!reader.hidden) closePost();
    });
  }

  /* ============================================================
     8. 卡片跟随光晕
     ============================================================ */
  function initHover() {
    $$('.app-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ============================================================
     9. 启动
     ============================================================ */
  function boot() {
    initTheme();
    initNav();
    initNotes();
    initReader();
    initHover();
    // AI 实践的「实践产出」取自博客清单，等清单加载完再渲染
    initBlog().then(initAI);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

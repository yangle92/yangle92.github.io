/* ============================================================
 * 后台管理模块（admin.js）
 * 仅管理员（role = admin）可见，含五大功能：
 *   1. 用户管理    —— 账号列表、新增、改密码、删号、升降管理员、查看学习进度
 *   2. 单词维护    —— 分类增删改、单词逐条编辑（emoji/英文/音标/中文/例句）
 *   3. 语法维护    —— 专题简介、记忆口诀、例句编辑
 *   4. 题库维护    —— 题干、选项、答案、解析编辑
 *   5. 数据备份    —— 导出/导入全部数据、恢复出厂设置、导出知识库 JS 文件
 *   6. 系统信息    —— 内容规模统计、存储占用
 *
 * 说明：浏览器无法直接改写 js 文件，所有内容修改保存在
 * localStorage 的 happyEnglishOverrides 键中，页面加载时覆盖生效。
 * 想固化到文件，用「导出知识库 JS」下载后替换 js/data-*.js 即可。
 * ============================================================ */
"use strict";

const Admin = (() => {
  const OV_KEY = 'happyEnglishOverrides';
  const TABS = [
    { id: 'users',   name: '👥 用户管理' },
    { id: 'words',   name: '📚 单词维护' },
    { id: 'grammar', name: '📝 语法维护' },
    { id: 'quiz',    name: '🎯 题库维护' },
    { id: 'data',    name: '💾 数据备份' },
    { id: 'sys',     name: '📊 系统信息' }
  ];

  let activeTab = 'users';
  let activeCat = null;     // 当前编辑的单词分类
  let activeTopic = null;   // 当前编辑的语法/题库专题

  /* ---------- 内容覆盖（Overrides） ---------- */
  function loadOV() {
    try { return JSON.parse(localStorage.getItem(OV_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveOV(ov) {
    try { localStorage.setItem(OV_KEY, JSON.stringify(ov)); } catch (e) {
      if (typeof toast === 'function') toast('保存失败：浏览器存储空间不足 😢', 4000);
    }
  }

  /* 页面加载时把自定义修改覆盖到内存数据上（由 app.js 的 bootApp 调用） */
  function applyOverrides() {
    const ov = loadOV();
    if (typeof wordDatabase === 'undefined') return;
    if (ov.words) {
      Object.entries(ov.words).forEach(([key, cat]) => {
        if (cat === null) { delete wordDatabase[key]; return; }   // null = 已删除
        if (wordDatabase[key]) Object.assign(wordDatabase[key], cat);
        else wordDatabase[key] = cat;
      });
    }
    if (ov.grammar) {
      Object.entries(ov.grammar).forEach(([id, patch]) => {
        const t = grammarData.find(x => x.id === id);
        if (t) Object.assign(t, patch);
      });
    }
    if (ov.quiz) {
      Object.entries(ov.quiz).forEach(([id, list]) => { grammarQuiz[id] = list; });
    }
  }

  /* 保存某分类的单词（整体快照） */
  function saveWords(catKey, catObj) {
    const ov = loadOV();
    ov.words = ov.words || {};
    ov.words[catKey] = catObj;
    saveOV(ov);
  }
  function deleteCategory(catKey) {
    const ov = loadOV();
    ov.words = ov.words || {};
    ov.words[catKey] = null;
    saveOV(ov);
    delete wordDatabase[catKey];
  }
  function saveGrammar(id, patch) {
    const ov = loadOV();
    ov.grammar = ov.grammar || {};
    ov.grammar[id] = patch;
    saveOV(ov);
  }
  function saveQuiz(id, list) {
    const ov = loadOV();
    ov.quiz = ov.quiz || {};
    ov.quiz[id] = list;
    saveOV(ov);
  }
  function clearOverride(kind, key) {
    const ov = loadOV();
    if (ov[kind] && key in ov[kind]) { delete ov[kind][key]; saveOV(ov); }
  }
  function overrideCount() {
    const ov = loadOV();
    return (ov.words ? Object.keys(ov.words).length : 0)
         + (ov.grammar ? Object.keys(ov.grammar).length : 0)
         + (ov.quiz ? Object.keys(ov.quiz).length : 0);
  }

  /* ---------- 小工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function el(id) { return document.getElementById(id); }
  function reRenderApp() {
    if (typeof renderAll === 'function') renderAll();
    if (typeof updateProgressPage === 'function') updateProgressPage();
  }
  function storageBytes() {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      n += k.length + (localStorage.getItem(k) || '').length;
    }
    return n * 2; // UTF-16 近似
  }
  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
  function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ============================================================
   * 面板骨架
   * ============================================================ */
  function init() {
    if (!window.Auth || !Auth.isAdmin()) return;   // 非管理员不显示

    const tabBtn = document.querySelector('.admin-tab-btn');
    if (tabBtn) tabBtn.style.display = '';          // 显示顶部「后台管理」标签

    const box = el('adminPanel');
    if (!box) return;
    render();

    // 切到后台管理标签时刷新数据
    tabBtn && tabBtn.addEventListener('click', () => setTimeout(() => { activeTab = activeTab || 'users'; render(); }, 60));
  }

  function render() {
    const box = el('adminPanel');
    if (!box) return;
    box.innerHTML = `
      <div class="adm-tabs">
        ${TABS.map(t => `<button class="adm-tab${t.id === activeTab ? ' active' : ''}" data-tab="${t.id}">${t.name}</button>`).join('')}
      </div>
      <div id="admBody"></div>
    `;
    box.querySelectorAll('.adm-tab').forEach(b => {
      b.addEventListener('click', () => { activeTab = b.dataset.tab; render(); });
    });
    const body = el('admBody');
    if (activeTab === 'users') renderUsers(body);
    else if (activeTab === 'words') renderWords(body);
    else if (activeTab === 'grammar') renderGrammar(body);
    else if (activeTab === 'quiz') renderQuiz(body);
    else if (activeTab === 'data') renderData(body);
    else renderSys(body);
  }

  /* ============================================================
   * 1. 用户管理
   * ============================================================ */
  function renderUsers(box) {
    const users = Auth.listUsers();
    const me = Auth.currentUser();
    box.innerHTML = `
      <div class="adm-card">
        <h4>➕ 新增账号</h4>
        <div class="adm-row">
          <input id="admNewUser" placeholder="账号名" maxlength="20">
          <input id="admNewPwd" placeholder="密码（至少3位）" maxlength="32">
          <select id="admNewRole">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
          <button class="adm-btn primary" id="admAddUser">添加</button>
        </div>
      </div>
      <div class="adm-card">
        <h4>👥 账号列表（${users.length} 个）</h4>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr>
              <th>账号</th><th>角色</th><th>星星</th><th>已学单词</th>
              <th>练习次数</th><th>最近学习</th><th>注册时间</th><th>操作</th>
            </tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${esc(u.name)}</strong>${u.name === me.name ? ' <span class="adm-me">我</span>' : ''}</td>
                  <td>${u.role === 'admin' ? '<span class="adm-badge admin">👑 管理员</span>' : '<span class="adm-badge">普通</span>'}</td>
                  <td>${u.stats.stars}</td>
                  <td>${u.stats.words}</td>
                  <td>${u.stats.quizzes}</td>
                  <td>${u.stats.last ? fmtDate(Date.parse(u.stats.last)) : '—'}</td>
                  <td>${fmtDate(u.createdAt)}</td>
                  <td class="adm-ops">
                    <button class="adm-btn tiny" data-pwd="${esc(u.name)}">改密码</button>
                    <button class="adm-btn tiny" data-role="${esc(u.name)}" data-torole="${u.role === 'admin' ? 'user' : 'admin'}">${u.role === 'admin' ? '取消管理员' : '设为管理员'}</button>
                    <button class="adm-btn tiny danger" data-del="${esc(u.name)}">删除</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <p class="adm-note">💡 删除账号会同时清除该账号的学习进度；admin 为内置账号，不可删除。</p>
      </div>
    `;

    el('admAddUser').addEventListener('click', async () => {
      const name = el('admNewUser').value.trim();
      const pwd = el('admNewPwd').value;
      const role = el('admNewRole').value;
      try {
        await Auth.createUser(name, pwd, role);
        toast(`已创建账号 ${name} ✅`);
        render();
      } catch (e) { toast(e.message, 4000); }
    });

    box.querySelectorAll('button[data-pwd]').forEach(b => {
      b.addEventListener('click', async () => {
        const name = b.dataset.pwd;
        const np = prompt(`为「${name}」设置新密码（至少 3 位）：`, '');
        if (np === null) return;
        try { await Auth.resetPassword(name, np); toast(`「${name}」密码已更新 ✅`); render(); }
        catch (e) { toast(e.message, 4000); }
      });
    });

    box.querySelectorAll('button[data-role]').forEach(b => {
      b.addEventListener('click', () => {
        try {
          Auth.setRole(b.dataset.role, b.dataset.torole);
          toast('角色已更新 ✅'); render();
        } catch (e) { toast(e.message, 4000); }
      });
    });

    box.querySelectorAll('button[data-del]').forEach(b => {
      b.addEventListener('click', () => {
        const name = b.dataset.del;
        if (!confirm(`确定删除账号「${name}」吗？该账号的学习进度会一并清除，且无法恢复。`)) return;
        try { Auth.deleteUser(name); toast(`已删除「${name}」`); render(); }
        catch (e) { toast(e.message, 4000); }
      });
    });
  }

  /* ============================================================
   * 2. 单词维护
   * ============================================================ */
  function renderWords(box) {
    const cats = Object.keys(wordDatabase);
    if (!activeCat || !wordDatabase[activeCat]) activeCat = cats[0];
    const cat = wordDatabase[activeCat];

    box.innerHTML = `
      <div class="adm-card">
        <h4>📂 选择分类</h4>
        <div class="adm-row">
          <select id="admCatSel">
            ${cats.map(k => `<option value="${esc(k)}"${k === activeCat ? ' selected' : ''}>${esc(wordDatabase[k].name)} (${wordDatabase[k].words.length})</option>`).join('')}
          </select>
          <input id="admCatRename" value="${esc(cat.name)}" placeholder="分类名称" maxlength="20">
          <input id="admCatEmoji" value="${esc(cat.emoji || '')}" placeholder="图标" maxlength="4" style="width:70px;">
          <button class="adm-btn" id="admSaveCat">保存分类</button>
          <button class="adm-btn" id="admNewCat">➕ 新建分类</button>
          <button class="adm-btn danger" id="admDelCat">🗑 删除分类</button>
        </div>
        <p class="adm-note">当前分类共 <strong id="admWordCount">${cat.words.length}</strong> 个单词。改完记得点底部「💾 保存修改」。</p>
      </div>
      <div class="adm-card">
        <h4>✏️ 单词列表（可直接修改）</h4>
        <div class="adm-table-wrap">
          <table class="adm-table edit">
            <thead><tr><th style="width:64px">图标</th><th>英文</th><th>音标</th><th>中文</th><th>例句</th><th style="width:56px">操作</th></tr></thead>
            <tbody id="admWordRows">
              ${cat.words.map((w, i) => `
                <tr data-i="${i}">
                  <td><input class="adm-in w-emoji" value="${esc(w.emoji)}" maxlength="4"></td>
                  <td><input class="adm-in w-en" value="${esc(w.en)}" maxlength="30"></td>
                  <td><input class="adm-in w-ph" value="${esc(w.ph)}" maxlength="24"></td>
                  <td><input class="adm-in w-cn" value="${esc(w.cn)}" maxlength="20"></td>
                  <td><input class="adm-in w-s" value="${esc(w.s)}" maxlength="80"></td>
                  <td><button class="adm-btn tiny danger" data-rm="${i}">删</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="adm-row" style="margin-top:12px;">
          <button class="adm-btn" id="admAddWord">➕ 添加一行</button>
          <button class="adm-btn primary" id="admSaveWords">💾 保存修改</button>
          <button class="adm-btn" id="admResetCat">↩︎ 还原为初始内容</button>
        </div>
      </div>
    `;

    el('admCatSel').addEventListener('change', (e) => { activeCat = e.target.value; render(); });

    el('admSaveCat').addEventListener('click', () => {
      const name = el('admCatRename').value.trim();
      const emoji = el('admCatEmoji').value.trim();
      if (!name) { toast('分类名称不能为空'); return; }
      cat.name = name; cat.emoji = emoji;
      saveWords(activeCat, { name, emoji, color: cat.color, words: readWordRows() });
      toast('分类已保存 ✅'); reRenderApp(); render();
    });

    el('admNewCat').addEventListener('click', () => {
      const key = prompt('新分类的英文标识（只能用字母，如 mywords）：', '');
      if (!key) return;
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) { toast('标识只能用英文字母开头，可含数字和下划线'); return; }
      if (wordDatabase[key]) { toast('该标识已存在'); return; }
      const name = prompt('新分类的名称（如：我的单词）：', '新分类') || '新分类';
      wordDatabase[key] = { name, emoji: '📘', color: '#5DB7FF', words: [] };
      saveWords(key, wordDatabase[key]);
      activeCat = key;
      toast('分类已创建 ✅'); reRenderApp(); render();
    });

    el('admDelCat').addEventListener('click', () => {
      if (!confirm(`确定删除分类「${cat.name}」及其全部单词吗？`)) return;
      deleteCategory(activeCat);
      activeCat = Object.keys(wordDatabase)[0];
      toast('分类已删除'); reRenderApp(); render();
    });

    el('admAddWord').addEventListener('click', () => {
      const tb = el('admWordRows');
      const i = tb.children.length;
      const tr = document.createElement('tr');
      tr.dataset.i = i;
      tr.innerHTML = `
        <td><input class="adm-in w-emoji" value="📘" maxlength="4"></td>
        <td><input class="adm-in w-en" value="" maxlength="30" placeholder="英文名"></td>
        <td><input class="adm-in w-ph" value="" maxlength="24" placeholder="音标"></td>
        <td><input class="adm-in w-cn" value="" maxlength="20" placeholder="中文"></td>
        <td><input class="adm-in w-s" value="" maxlength="80" placeholder="例句"></td>
        <td><button class="adm-btn tiny danger" data-rm="${i}">删</button></td>`;
      tb.appendChild(tr);
    });

    el('admSaveWords').addEventListener('click', () => {
      const name = el('admCatRename').value.trim() || cat.name;
      cat.name = name;
      cat.emoji = el('admCatEmoji').value.trim();
      cat.words = readWordRows();
      saveWords(activeCat, { name: cat.name, emoji: cat.emoji, color: cat.color, words: cat.words });
      toast('单词已保存 ✅'); reRenderApp(); render();
    });

    el('admResetCat').addEventListener('click', () => {
      if (!confirm('还原为程序内置的初始内容？你的修改会被丢弃。')) return;
      clearOverride('words', activeCat);
      location.reload();
    });

    box.querySelectorAll('button[data-rm]').forEach(b => {
      b.addEventListener('click', () => { b.closest('tr').remove(); });
    });
  }

  /* 读取表格中当前所有单词行 */
  function readWordRows() {
    const rows = [];
    document.querySelectorAll('#admWordRows tr').forEach(tr => {
      const v = cls => (tr.querySelector('.' + cls) || {}).value || '';
      const en = v('w-en').trim();
      if (!en) return; // 英文为空的行直接跳过
      rows.push({ emoji: v('w-emoji').trim(), en: en, ph: v('w-ph').trim(), cn: v('w-cn').trim(), s: v('w-s').trim() });
    });
    return rows;
  }

  /* ============================================================
   * 3. 语法维护
   * ============================================================ */
  function renderGrammar(box) {
    if (!activeTopic || !grammarData.find(t => t.id === activeTopic)) activeTopic = grammarData[0].id;
    const t = grammarData.find(x => x.id === activeTopic);

    box.innerHTML = `
      <div class="adm-card">
        <h4>📝 选择语法专题</h4>
        <div class="adm-row">
          <select id="admTopicSel">
            ${grammarData.map(x => `<option value="${esc(x.id)}"${x.id === activeTopic ? ' selected' : ''}>${esc(x.emoji)} ${esc(x.title)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="adm-card">
        <h4>📖 讲解内容</h4>
        <label class="adm-label">简介（会显示在专题开头，支持简单 HTML）</label>
        <textarea id="admIntro" class="adm-ta" rows="4">${esc(t.intro)}</textarea>
        <label class="adm-label">记忆口诀（一行一条）</label>
        <textarea id="admTips" class="adm-ta" rows="5">${esc((t.tips || []).join('\n'))}</textarea>
      </div>
      <div class="adm-card">
        <h4>🔊 例句（可增删改）</h4>
        <div id="admExamples"></div>
        <button class="adm-btn" id="admAddExample">➕ 添加例句</button>
      </div>
      <div class="adm-row">
        <button class="adm-btn primary" id="admSaveGrammar">💾 保存修改</button>
        <button class="adm-btn" id="admResetGrammar">↩︎ 还原为初始内容</button>
      </div>
    `;

    function drawExamples() {
      const c = el('admExamples');
      c.innerHTML = (t.examples || []).map((ex, i) => `
        <div class="adm-row ex" data-i="${i}">
          <input class="adm-in ex-en" value="${esc(ex.en)}" placeholder="英文例句" maxlength="120" style="flex:3">
          <input class="adm-in ex-cn" value="${esc(ex.cn)}" placeholder="中文翻译" maxlength="80" style="flex:2">
          <button class="adm-btn tiny danger" data-rmex="${i}">删</button>
        </div>`).join('') || '<p class="adm-note">暂无例句</p>';
      c.querySelectorAll('button[data-rmex]').forEach(b => {
        b.addEventListener('click', () => { b.closest('.ex').remove(); });
      });
    }
    drawExamples();

    el('admTopicSel').addEventListener('change', (e) => { activeTopic = e.target.value; render(); });

    el('admAddExample').addEventListener('click', () => {
      const c = el('admExamples');
      const note = c.querySelector('.adm-note'); if (note) note.remove();
      const i = c.querySelectorAll('.ex').length;
      const d = document.createElement('div');
      d.className = 'adm-row ex'; d.dataset.i = i;
      d.innerHTML = `
        <input class="adm-in ex-en" value="" placeholder="英文例句" maxlength="120" style="flex:3">
        <input class="adm-in ex-cn" value="" placeholder="中文翻译" maxlength="80" style="flex:2">
        <button class="adm-btn tiny danger" data-rmex="${i}">删</button>`;
      c.appendChild(d);
      d.querySelector('button').addEventListener('click', () => d.remove());
    });

    el('admSaveGrammar').addEventListener('click', () => {
      const intro = el('admIntro').value;
      const tips = el('admTips').value.split('\n').map(s => s.trim()).filter(Boolean);
      const examples = [];
      document.querySelectorAll('#admExamples .ex').forEach(d => {
        const en = (d.querySelector('.ex-en') || {}).value || '';
        const cn = (d.querySelector('.ex-cn') || {}).value || '';
        if (en.trim()) examples.push({ en: en.trim(), cn: cn.trim() });
      });
      Object.assign(t, { intro, tips, examples });
      saveGrammar(t.id, { intro, tips, examples });
      toast('语法内容已保存 ✅'); reRenderApp();
    });

    el('admResetGrammar').addEventListener('click', () => {
      if (!confirm('还原为程序内置的初始内容？')) return;
      clearOverride('grammar', activeTopic);
      location.reload();
    });
  }

  /* ============================================================
   * 4. 题库维护
   * ============================================================ */
  function renderQuiz(box) {
    if (!activeTopic || !grammarData.find(t => t.id === activeTopic)) activeTopic = grammarData[0].id;
    const meta = grammarData.find(x => x.id === activeTopic);
    const list = grammarQuiz[activeTopic] || [];

    box.innerHTML = `
      <div class="adm-card">
        <h4>🎯 选择题库专题</h4>
        <div class="adm-row">
          <select id="admQuizSel">
            ${grammarData.map(x => {
              const n = (grammarQuiz[x.id] || []).length;
              return `<option value="${esc(x.id)}"${x.id === activeTopic ? ' selected' : ''}>${esc(x.emoji)} ${esc(x.title)}（${n} 题）</option>`;
            }).join('')}
          </select>
          <span class="adm-note" style="margin:0">当前专题：<strong>${esc(meta.title)}</strong>，共 ${list.length} 题</span>
        </div>
      </div>
      <div class="adm-card">
        <h4>✏️ 题目列表</h4>
        <div id="admQuizList"></div>
        <button class="adm-btn" id="admAddQuestion">➕ 添加题目</button>
      </div>
      <div class="adm-row">
        <button class="adm-btn primary" id="admSaveQuiz">💾 保存修改</button>
        <button class="adm-btn" id="admResetQuiz">↩︎ 还原为初始内容</button>
      </div>
    `;

    function drawQuestions() {
      const c = el('admQuizList');
      c.innerHTML = list.map((q, i) => `
        <div class="adm-q" data-i="${i}">
          <div class="adm-row">
            <span class="adm-qno">第 ${i + 1} 题</span>
            <button class="adm-btn tiny danger" data-rmq="${i}">删除本题</button>
          </div>
          <input class="adm-in q-q" value="${esc(q.q)}" placeholder="题干，如：I ___ a student." maxlength="120">
          <div class="adm-row">
            ${[0, 1, 2, 3].map(j => `
              <label class="adm-opt">
                <input type="radio" name="ans${i}" value="${j}" ${q.a === j ? 'checked' : ''}>
                <input class="adm-in q-o" value="${esc((q.o || [])[j] || '')}" placeholder="选项 ${j + 1}" maxlength="60">
              </label>`).join('')}
          </div>
          <input class="adm-in q-ex" value="${esc(q.explain || '')}" placeholder="解析（答错/答对时显示，可留空）" maxlength="120">
        </div>`).join('') || '<p class="adm-note">该专题暂无题目，点下方按钮添加。</p>';

      c.querySelectorAll('button[data-rmq]').forEach(b => {
        b.addEventListener('click', () => {
          const idx = Number(b.dataset.rmq);
          list.splice(idx, 1);
          drawQuestions();
        });
      });
    }
    drawQuestions();

    el('admQuizSel').addEventListener('change', (e) => { activeTopic = e.target.value; render(); });

    el('admAddQuestion').addEventListener('click', () => {
      list.push({ q: '', o: ['', '', '', ''], a: 0, explain: '' });
      drawQuestions();
    });

    el('admSaveQuiz').addEventListener('click', () => {
      const result = [];
      document.querySelectorAll('#admQuizList .adm-q').forEach(d => {
        const q = (d.querySelector('.q-q') || {}).value || '';
        if (!q.trim()) return;
        const o = [];
        d.querySelectorAll('.q-o').forEach(i => o.push(i.value.trim()));
        const checked = d.querySelector('input[type=radio]:checked');
        const a = checked ? Number(checked.value) : 0;
        const explain = (d.querySelector('.q-ex') || {}).value || '';
        if (o.filter(Boolean).length < 2) return; // 少于 2 个选项的题目丢弃
        result.push({ q: q.trim(), o: o, a: a, explain: explain.trim() });
      });
      grammarQuiz[activeTopic] = result;
      saveQuiz(activeTopic, result);
      toast(`题库已保存（${result.length} 题）✅`);
      render();
    });

    el('admResetQuiz').addEventListener('click', () => {
      if (!confirm('还原为程序内置的初始题库？')) return;
      clearOverride('quiz', activeTopic);
      location.reload();
    });
  }

  /* ============================================================
   * 5. 数据备份
   * ============================================================ */
  function renderData(box) {
    box.innerHTML = `
      <div class="adm-card">
        <h4>💾 导出数据</h4>
        <p class="adm-note">把账号、学习进度、内容修改打包成一个 JSON 文件保存好，换电脑时可一键恢复。</p>
        <div class="adm-row">
          <button class="adm-btn primary" id="admExportAll">📦 导出全部数据</button>
          <button class="adm-btn" id="admExportWordsJS">📄 导出单词库 JS</button>
          <button class="adm-btn" id="admExportQuizJS">📄 导出题库 JS</button>
        </div>
        <label class="adm-check"><input type="checkbox" id="admExportPwd" checked> 导出时包含账号密码哈希（取消勾选则导出不含账号）</label>
      </div>
      <div class="adm-card">
        <h4>📥 导入数据</h4>
        <p class="adm-note">选择之前导出的 JSON 文件恢复。⚠️ 导入会<strong>覆盖</strong>当前所有数据。</p>
        <div class="adm-row">
          <input type="file" id="admImportFile" accept="application/json,.json">
          <button class="adm-btn" id="admImportBtn">导入并覆盖</button>
        </div>
      </div>
      <div class="adm-card">
        <h4>🧹 清理</h4>
        <div class="adm-row">
          <button class="adm-btn" id="admClearProgress">清空所有学习进度</button>
          <button class="adm-btn" id="admClearOverrides">清空内容修改（恢复内置知识库）</button>
          <button class="adm-btn danger" id="admFactoryReset">☢ 恢复出厂设置</button>
        </div>
        <p class="adm-note">「恢复出厂设置」会清空全部账号、进度和内容修改，只保留默认 admin/admin 账号。</p>
      </div>
    `;

    el('admExportAll').addEventListener('click', () => {
      const withPwd = el('admExportPwd').checked;
      const data = { type: 'happyEnglishBackup', version: 2, exportedAt: new Date().toISOString() };
      if (withPwd) data.users = JSON.parse(localStorage.getItem('happyEnglishUsers') || '{}');
      data.progress = {};
      data.overrides = loadOV();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('happyEnglishDataV2:')) data.progress[k] = JSON.parse(localStorage.getItem(k));
      }
      download(`英语学习系统-备份-${fmtDate(Date.now())}.json`, JSON.stringify(data, null, 2));
      toast('备份文件已下载 ✅');
    });

    el('admExportWordsJS').addEventListener('click', () => {
      download('data-words.js', 'const wordDatabase = ' + JSON.stringify(wordDatabase, null, 2) + ';');
      toast('单词库 JS 已下载，替换 js/data-words.js 即可固化修改');
    });

    el('admExportQuizJS').addEventListener('click', () => {
      download('data-quiz.js', 'const grammarQuiz = ' + JSON.stringify(grammarQuiz, null, 2) + ';');
      toast('题库 JS 已下载，替换 js/data-quiz.js 即可固化修改');
    });

    el('admImportBtn').addEventListener('click', () => {
      const f = el('admImportFile').files[0];
      if (!f) { toast('请先选择备份文件'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.type !== 'happyEnglishBackup') throw new Error('不是本系统的备份文件');
          if (!confirm('导入将覆盖当前所有数据，确定继续吗？')) return;
          if (data.users) localStorage.setItem('happyEnglishUsers', JSON.stringify(data.users));
          Object.entries(data.progress || {}).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
          if (data.overrides) localStorage.setItem(OV_KEY, JSON.stringify(data.overrides));
          toast('导入成功，即将刷新页面 ✅');
          setTimeout(() => location.reload(), 1200);
        } catch (e) { toast('导入失败：' + e.message, 4000); }
      };
      reader.readAsText(f);
    });

    el('admClearProgress').addEventListener('click', () => {
      if (!confirm('清空所有账号的学习进度（星星、已学单词、打卡）？账号本身保留。')) return;
      Object.keys(localStorage).filter(k => k.startsWith('happyEnglishDataV2')).forEach(k => localStorage.removeItem(k));
      toast('学习进度已清空'); reRenderApp();
    });

    el('admClearOverrides').addEventListener('click', () => {
      if (!confirm('清空所有内容修改，恢复到程序内置的知识库？')) return;
      localStorage.removeItem(OV_KEY);
      location.reload();
    });

    el('admFactoryReset').addEventListener('click', () => {
      if (!confirm('⚠️ 将清空全部账号、学习进度和内容修改，恢复到初始状态。确定吗？')) return;
      if (!confirm('再确认一次：此操作不可恢复！')) return;
      Object.keys(localStorage).filter(k => k.startsWith('happyEnglish')).forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ============================================================
   * 6. 系统信息
   * ============================================================ */
  function renderSys(box) {
    const catCount = Object.keys(wordDatabase).length;
    const wordCount = Object.values(wordDatabase).reduce((n, c) => n + c.words.length, 0);
    const quizCount = Object.values(grammarQuiz).reduce((n, l) => n + l.length, 0);
    const userCount = Auth.listUsers().length;
    box.innerHTML = `
      <div class="adm-card">
        <h4>📊 内容规模</h4>
        <div class="adm-stats">
          <div class="adm-stat"><span class="v">${catCount}</span><span class="k">单词分类</span></div>
          <div class="adm-stat"><span class="v">${wordCount}</span><span class="k">单词总数</span></div>
          <div class="adm-stat"><span class="v">${grammarData.length}</span><span class="k">语法专题</span></div>
          <div class="adm-stat"><span class="v">${quizCount}</span><span class="k">练习题</span></div>
          <div class="adm-stat"><span class="v">${userCount}</span><span class="k">注册账号</span></div>
          <div class="adm-stat"><span class="v">${overrideCount()}</span><span class="k">内容修改项</span></div>
        </div>
      </div>
      <div class="adm-card">
        <h4>💽 存储占用</h4>
        <p class="adm-note">浏览器本地存储共占用 <strong>${fmtBytes(storageBytes())}</strong>（一般上限 5MB）。</p>
        <p class="adm-note">当前登录：<strong>${esc(Auth.currentUser().name)}</strong>（${Auth.currentUser().role === 'admin' ? '管理员' : '普通用户'}）</p>
        <div class="adm-row">
          <button class="adm-btn" id="admSysVoice">🔊 打开语音设置</button>
          <button class="adm-btn" id="admSysReload">🔄 重新加载页面</button>
        </div>
      </div>
    `;
    el('admSysVoice').addEventListener('click', () => { const b = el('voiceTestBtn'); if (b) b.click(); });
    el('admSysReload').addEventListener('click', () => location.reload());
  }

  return { init, applyOverrides, loadOV, overrideCount, isEnabled: () => !!(window.Auth && Auth.isAdmin()) };
})();

/* 同上：const 声明需显式挂到 window，供 app.js 的 bootApp 调用 */
window.Admin = Admin;

/* 初始化：等认证与应用就绪后挂载后台面板 */
window.addEventListener('DOMContentLoaded', () => {
  const boot = () => {
    if (!window.Auth || !Auth.isLoggedIn()) return;   // 未登录不挂载
    Admin.init();
  };
  if (window.Auth && Auth.isLoggedIn()) boot();
  else window.addEventListener('happyEnglish:loggedIn', boot);
});

/* ============================================================
 * 登录认证模块（auth.js）
 * - 登录 / 注册 / 登出（纯前端，localStorage 存储）
 * - 密码加盐哈希保存（优先 Web Crypto SHA-256，不可用时 FNV 兜底）
 * - 默认管理员账号：admin / admin（首次加载自动创建）
 * - 会话保持 7 天；学习进度按账号隔离（配合 app.js 的 dataKey）
 * ============================================================ */
"use strict";

const Auth = (() => {
  const USERS_KEY = 'happyEnglishUsers';       // { 用户名: {hash, salt, role, createdAt} }
  const SESSION_KEY = 'happyEnglishSession';   // { user, time }
  const DATA_PREFIX = 'happyEnglishDataV2';    // 学习进度键前缀（与 app.js 的 STORE_KEY 保持一致）
  const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天
  const USERNAME_RE = /^[\w\u4e00-\u9fa5]{2,20}$/; // 字母/数字/下划线/中文，2-20 位
  const PWD_MIN = 3;

  let overlay = null;   // 登录遮罩层
  let booted = false;   // bootApp 是否已由本模块触发

  /* ---------- 存储 ---------- */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (e) { /* 忽略 */ }
  }

  function randomSalt() {
    let s = '';
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (window.crypto && crypto.getRandomValues) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      arr.forEach(b => { s += pool[b % pool.length]; });
    } else {
      for (let i = 0; i < 16; i++) s += pool[Math.floor(Math.random() * pool.length)];
    }
    return s;
  }

  /* ---------- 哈希 ---------- */
  function fallbackHash(str) {
    // FNV-1a 四轮拼接成 32 位十六进制（非安全环境兜底，防止明文存密码）
    let out = '';
    for (let r = 0; r < 4; r++) {
      let h = (0x811c9dc5 ^ r) >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      out += h.toString(16).padStart(8, '0');
    }
    return out;
  }

  async function sha256(str) {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) { /* 降级 */ }
    }
    return fallbackHash(str);
  }

  function digestInput(pwd, salt) {
    return salt + '::' + pwd + '::' + salt;
  }

  /* 生成密码记录：同时保存强哈希（SHA-256）与兜底哈希（FNV）
   * 原因：crypto.subtle 仅在安全上下文（https / localhost）可用，
   * 通过局域网 IP（http://192.168.x.x）访问时会降级为 FNV，
   * 双哈希可保证同一账号在两种环境下都能登录成功 */
  async function makeRecord(pwd) {
    const salt = randomSalt();
    const fnv = fallbackHash(digestInput(pwd, salt));
    let hash = fnv, alg = 'fnv';
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        hash = await sha256(digestInput(pwd, salt));
        alg = 'sha256';
      } catch (e) { /* 保持 FNV 兜底 */ }
    }
    return { hash: hash, hash2: fnv, salt: salt, alg: alg };
  }

  /* 校验密码：任一已存储的哈希匹配即通过（跨环境兼容） */
  async function verifyPassword(pwd, u) {
    const fnv = fallbackHash(digestInput(pwd, u.salt));
    if (fnv === u.hash || (u.hash2 && fnv === u.hash2)) return true;
    if (u.alg === 'sha256' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        if (await sha256(digestInput(pwd, u.salt)) === u.hash) return true;
      } catch (e) { /* 忽略 */ }
    }
    return false;
  }

  /* ---------- 服务端同步（持久化到服务器磁盘） ---------- */
  /* 推送整个账号表（新增 / 修改） */
  function pushAll() {
    if (!window.Remote || !Remote.isAvailable()) return;
    Remote.putUsers(getUsers());
  }
  /* 删除账号：以 null 告知服务器 */
  function pushDelete(name) {
    if (!window.Remote || !Remote.isAvailable()) return;
    Remote.putUsers({ [name]: null });
  }
  /* 启动时把服务端账号合并到本地：
   * - 服务端有、本地没有 → 拉下来（换设备也能登录）
   * - 两边不一致       → 以服务端为准（改过的密码处处生效）
   * - 本地有、服务端没有 → 上传（老数据迁移上服务器） */
  async function syncFromServer() {
    if (!window.Remote || !(await Remote.detect())) return;
    const remote = await Remote.getUsers();
    if (!remote) return;

    const local = getUsers();
    let localChanged = false;
    Object.entries(remote).forEach(([name, rec]) => {
      if (!rec || !rec.hash) return;
      if (!local[name] || local[name].hash !== rec.hash) {
        local[name] = rec;
        localChanged = true;
      }
    });
    if (localChanged) saveUsers(local);

    const toUpload = {};
    Object.entries(local).forEach(([name, rec]) => { if (!remote[name]) toUpload[name] = rec; });
    if (Object.keys(toUpload).length) await Remote.putUsers(toUpload);
  }

  /* ---------- 默认管理员 ---------- */
  async function ensureAdmin() {
    const users = getUsers();
    if (!users['admin']) {
      const rec = await makeRecord('admin');
      users['admin'] = Object.assign({ role: 'admin', createdAt: Date.now() }, rec);
      saveUsers(users);
      // 立即存到服务器，保证重启服务后仍在
      if (window.Remote && Remote.isAvailable()) Remote.putUsers({ admin: users['admin'] });
    }
  }

  /* ---------- 会话 ---------- */
  function currentUser() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!s || !s.user) return null;
      if (Date.now() - s.time > SESSION_TTL) { localStorage.removeItem(SESSION_KEY); return null; }
      const users = getUsers();
      return users[s.user] ? { name: s.user, role: users[s.user].role || 'user' } : null;
    } catch (e) { return null; }
  }

  function isLoggedIn() { return !!currentUser(); }

  function setSession(name) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: name, time: Date.now() }));
  }

  /* ---------- 登录界面 ---------- */
  function buildUI() {
    overlay = document.createElement('div');
    overlay.id = 'loginScreen';
    overlay.innerHTML = `
      <div class="login-card">
        <div class="login-logo">🌈</div>
        <h2>快乐英语乐园</h2>
        <p class="login-sub">小学英语学习系统</p>
        <div class="login-tabs">
          <button type="button" class="login-tab active" data-mode="login">🔑 登录</button>
          <button type="button" class="login-tab" data-mode="register">✨ 注册新账号</button>
        </div>
        <form id="loginForm" autocomplete="off">
          <div class="login-field">
            <label for="loginUser">👤 账号名</label>
            <input type="text" id="loginUser" maxlength="20" placeholder="请输入账号名" autocomplete="username">
          </div>
          <div class="login-field">
            <label for="loginPwd">🔒 密码</label>
            <input type="password" id="loginPwd" maxlength="32" placeholder="请输入密码" autocomplete="current-password">
          </div>
          <div class="login-field" id="loginPwd2Field" style="display:none;">
            <label for="loginPwd2">🔁 再输一遍密码</label>
            <input type="password" id="loginPwd2" maxlength="32" placeholder="请重复密码" autocomplete="new-password">
          </div>
          <div class="login-error" id="loginError"></div>
          <button type="submit" class="login-submit" id="loginSubmit">🔑 登 录</button>
        </form>
        <p class="login-hint" id="loginHint">没有账号？点上方「✨ 注册新账号」自己注册一个</p>
      </div>
    `;
    document.body.appendChild(overlay);

    let mode = 'login';
    const errEl = () => overlay.querySelector('#loginError');
    const submitBtn = overlay.querySelector('#loginSubmit');

    overlay.querySelectorAll('.login-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        mode = tab.dataset.mode;
        overlay.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        overlay.querySelector('#loginPwd2Field').style.display = mode === 'register' ? 'block' : 'none';
        submitBtn.textContent = mode === 'register' ? '✨ 创建账号' : '🔑 登 录';
        errEl().textContent = '';
      });
    });

    overlay.querySelector('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = overlay.querySelector('#loginUser').value.trim();
      const pwd = overlay.querySelector('#loginPwd').value;
      const pwd2 = overlay.querySelector('#loginPwd2').value;
      errEl().textContent = '';
      submitBtn.disabled = true;
      try {
        if (mode === 'register') {
          await register(user, pwd, pwd2);
        } else {
          await login(user, pwd);
        }
      } catch (err) {
        errEl().textContent = err.message || '操作失败，请重试';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function showLogin() {
    if (!overlay) buildUI();
    overlay.style.display = 'flex';
  }

  function hideLogin() {
    if (overlay) overlay.style.display = 'none';
  }

  /* ---------- 登录 / 注册 / 登出 ---------- */
  async function login(name, pwd) {
    if (!name) throw new Error('请输入账号名');
    if (!pwd) throw new Error('请输入密码');
    // 用户名大小写不敏感
    const key = findKey(name);
    if (!key) throw new Error('账号不存在，请先注册');
    const u = getUsers()[key];
    if (!(await verifyPassword(pwd, u))) throw new Error('密码不正确，再想想？');
    setSession(key);
    enterApp(key, u.role);
    return true;
  }

  function findKey(name) {
    const users = getUsers();
    return Object.keys(users).find(k => k.toLowerCase() === name.toLowerCase());
  }

  /* 创建账号（不自动登录）—— 注册与后台新增账号共用 */
  async function createUser(name, pwd, role) {
    if (!USERNAME_RE.test(name)) throw new Error('账号名需 2-20 位，可用字母、数字、下划线或中文');
    if (!pwd || pwd.length < PWD_MIN) throw new Error('密码至少 ' + PWD_MIN + ' 位');
    if (findKey(name)) throw new Error('这个账号名已经被注册啦，换一个试试');
    const users = getUsers();
    const rec = await makeRecord(pwd);
    users[name] = Object.assign({ role: role === 'admin' ? 'admin' : 'user', createdAt: Date.now() }, rec);
    saveUsers(users);
    pushAll();                       // 同步到服务器（重启/换设备都在）
    return true;
  }

  async function register(name, pwd, pwd2) {
    if (pwd !== pwd2) throw new Error('两次输入的密码不一致');
    await createUser(name, pwd, 'user');
    setSession(name);
    enterApp(name, 'user');
    return true;
  }

  /* ---------- 后台管理接口 ---------- */
  function listUsers() {
    const users = getUsers();
    return Object.entries(users).map(([name, u]) => ({
      name: name,
      role: u.role || 'user',
      createdAt: u.createdAt || 0,
      stats: userStats(name)
    }));
  }

  /* 读取某账号的学习进度（供后台展示） */
  function userStats(name) {
    try {
      const raw = localStorage.getItem(DATA_PREFIX + ':' + name);
      if (!raw) return { stars: 0, words: 0, quizzes: 0, last: null };
      const d = JSON.parse(raw);
      return {
        stars: d.totalStars || 0,
        words: (d.learnedWords || []).length,
        quizzes: d.quizCompleted || 0,
        last: d.lastStudyDate || null
      };
    } catch (e) { return { stars: 0, words: 0, quizzes: 0, last: null }; }
  }

  function deleteUser(name) {
    if (name === 'admin') throw new Error('admin 是系统内置账号，不能删除');
    const users = getUsers();
    const key = findKey(name);
    if (!key) throw new Error('账号不存在');
    delete users[key];
    saveUsers(users);
    localStorage.removeItem(DATA_PREFIX + ':' + key); // 一并清理学习进度
    pushDelete(key);                 // 通知服务器删除，否则重启后会"复活"
    return true;
  }

  async function resetPassword(name, newPwd) {
    if (!newPwd || newPwd.length < PWD_MIN) throw new Error('新密码至少 ' + PWD_MIN + ' 位');
    const users = getUsers();
    const key = findKey(name);
    if (!key) throw new Error('账号不存在');
    const rec = await makeRecord(newPwd);
    users[key] = Object.assign({}, users[key], rec);
    saveUsers(users);
    pushAll();                       // 新密码立即写入服务器
    return true;
  }

  function setRole(name, role) {
    if (name === 'admin') throw new Error('admin 的管理员身份不可更改');
    const users = getUsers();
    const key = findKey(name);
    if (!key) throw new Error('账号不存在');
    users[key].role = role === 'admin' ? 'admin' : 'user';
    saveUsers(users);
    pushAll();
    return true;
  }

  function isAdmin() {
    const cur = currentUser();
    return !!(cur && cur.role === 'admin');
  }

  /* 登录成功：关遮罩、加登出按钮、启动应用 */
  function enterApp(name, role) {
    hideLogin();
    addLogoutBtn(name, role);
    // 广播登录事件（后台管理模块据此挂载面板）
    if (window.dispatchEvent) {
      try { window.dispatchEvent(new Event('happyEnglish:loggedIn')); } catch (e) { /* 忽略 */ }
    }
    if (typeof window.bootApp === 'function' && !booted) {
      booted = true;
      window.bootApp();
    }
    if (typeof window.toast === 'function') {
      window.toast(role === 'admin'
        ? `欢迎回来，${name}（管理员）👑`
        : `欢迎，${name}！好好学习，天天向上 🌟`, 3000);
    }
  }

  let logoutBtn = null;
  function addLogoutBtn(name, role) {
    if (logoutBtn) return;
    const actions = document.querySelector('.header-actions');
    if (!actions) return;
    logoutBtn = document.createElement('button');
    logoutBtn.className = 'voice-test-btn';
    logoutBtn.title = '退出当前账号';
    logoutBtn.innerHTML = (role === 'admin' ? '👑 ' : '') + name + ' · 退出';
    logoutBtn.addEventListener('click', logout);
    actions.insertBefore(logoutBtn, actions.firstChild);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  /* ---------- 初始化 ---------- */
  async function init() {
    // 优先从服务器拉取账号（持久化存储），失败则仅用本地
    try { await syncFromServer(); } catch (e) { /* 服务器不可用时忽略 */ }
    await ensureAdmin();
    const cur = currentUser();
    if (cur) {
      addLogoutBtn(cur.name, cur.role);
      // 已登录：bootApp 由 app.js 自行调用（Auth 存在且已登录）
      if (typeof window.bootApp === 'function' && !booted) {
        booted = true;
        window.bootApp();
      }
    } else {
      showLogin();
    }
  }

  return {
    init, login, register, logout,
    currentUser, isLoggedIn, isAdmin,
    /* 后台管理接口 */
    listUsers, createUser, deleteUser, resetPassword, setRole, userStats,
    /* 供 app.js 使用：按账号隔离学习数据 */
    dataSuffix() {
      const cur = currentUser();
      return cur ? ':' + cur.name : '';
    }
  };
})();

/* 关键：const 声明不会自动成为 window 的属性，
 * 而 app.js / admin.js 通过 window.Auth 访问，必须显式挂载 */
window.Auth = Auth;

/* 页面加载完成后初始化认证（app.js 已定义 bootApp 时由其触发/接管） */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
  Auth.init();
}

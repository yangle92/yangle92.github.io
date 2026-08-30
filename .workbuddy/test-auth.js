/* auth.js 模拟测试：假 DOM + 假 localStorage，验证登录认证全流程 */
"use strict";
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' | ' + detail : '')); }
}

/* ---------- 假环境 ---------- */
function makeStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _map: m
  };
}

function makeDocument() {
  const listeners = {};
  const doc = {
    readyState: 'complete',
    body: {
      appendChild(el) { doc._appended = el; },
      querySelector() { return null; }
    },
    addEventListener(t, fn) { listeners[t] = fn; },
    createElement(tag) {
      const el = {
        tag, style: {}, children: [], _listeners: {}, _q: {},
        dataset: {}, value: '', textContent: '', disabled: false,
        classList: { add() {}, remove() {}, contains() { return false; } },
        set innerHTML(v) { this._html = v; },
        get innerHTML() { return this._html || ''; },
        appendChild(c) { this.children.push(c); },
        addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
        insertBefore(c) { this.children.unshift(c); },
        querySelectorAll() { return el._all || []; },
        /* 极简选择器：按 '#id' / '.class' 返回持久节点，便于断言事件绑定 */
        querySelector(sel) {
          if (!el._q[sel]) {
            el._q[sel] = {
              style: {}, dataset: {}, value: '', textContent: '', disabled: false,
              classList: { add() {}, remove() {} },
              addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
              _listeners: {}, _q: {},
              querySelector(s2) { return null; },
              querySelectorAll() { return []; }
            };
          }
          return el._q[sel];
        }
      };
      return el;
    },
    querySelector(sel) {
      if (sel === '.header-actions') {
        return {
          children: [],
          insertBefore(el) { this.children.unshift(el); }
        };
      }
      return null;
    }
  };
  doc._listeners = listeners;
  return doc;
}

const storage = makeStorage();
const doc = makeDocument();
const sandbox = {
  console, localStorage: storage, document: doc,
  window: {}, location: { reload() { sandbox._reloaded = true; } },
  setTimeout, TextEncoder, crypto: undefined  // 强制走 FNV 兜底哈希
};
sandbox.window = sandbox; // window === global（经典脚本行为近似）
sandbox.globalThis = sandbox;

// 注意：const 声明不会自动挂到沙箱对象上，需显式导出
const src = fs.readFileSync('js/auth.js', 'utf8') + '\n;globalThis.__Auth = Auth;';
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const Auth = sandbox.__Auth;

(async () => {
  console.log('\n[T1] 初始化与默认管理员');
  await new Promise(r => setTimeout(r, 30)); // 等 ensureAdmin 完成
  const users = JSON.parse(storage.getItem('happyEnglishUsers') || '{}');
  check('admin 账号已自动创建', !!users.admin);
  check('admin 密码非明文存储', users.admin.hash !== 'admin' && users.admin.hash.length >= 16);
  check('admin 角色为管理员', users.admin.role === 'admin');
  check('未登录时显示登录界面（遮罩已插入）', !!doc._appended && doc._appended.id === 'loginScreen');
  check('未登录时 currentUser 为 null', Auth.currentUser() === null);
  check('dataSuffix 未登录为空', Auth.dataSuffix() === '');

  console.log('\n[T2] 登录：正确/错误密码');
  let err1 = null;
  try { await Auth.login('admin', 'wrongpwd'); } catch (e) { err1 = e; }
  check('错误密码被拒绝', !!err1 && /密码不正确/.test(err1.message), err1 && err1.message);
  check('错误密码不建立会话', storage.getItem('happyEnglishSession') === null);
  let err2 = null;
  try { await Auth.login('nobody', 'x'); } catch (e) { err2 = e; }
  check('不存在账号被拒绝', !!err2 && /不存在/.test(err2.message));
  let err3 = null;
  try { await Auth.login('', ''); } catch (e) { err3 = e; }
  check('空输入被拒绝', !!err3);
  await Auth.login('admin', 'admin');
  check('正确密码登录成功', !!Auth.currentUser());
  check('currentUser 名字是 admin', Auth.currentUser().name === 'admin');
  check('currentUser 角色是 admin', Auth.currentUser().role === 'admin');
  check('dataSuffix 返回 :admin', Auth.dataSuffix() === ':admin');
  check('会话已写入', !!storage.getItem('happyEnglishSession'));

  console.log('\n[T3] 用户名大小写不敏感登录');
  const ok = await Auth.login('ADMIN', 'admin');
  check('大写 ADMIN 也能登录', ok === true);

  console.log('\n[T4] 注册：校验与成功路径');
  let e1 = null; try { await Auth.register('a', '123', '123'); } catch (e) { e1 = e; }
  check('过短账号名被拒', !!e1 && /2-20/.test(e1.message));
  let e2 = null; try { await Auth.register('xiaoming!', '123', '123'); } catch (e) { e2 = e; }
  check('非法字符账号名被拒', !!e2 && /字母、数字/.test(e2.message));
  let e3 = null; try { await Auth.register('xiaoming', '12', '12'); } catch (e) { e3 = e; }
  check('过短密码被拒', !!e3 && /至少 3 位/.test(e3.message));
  let e4 = null; try { await Auth.register('xiaoming', '123', '124'); } catch (e) { e4 = e; }
  check('两次密码不一致被拒', !!e4 && /不一致/.test(e4.message));
  await Auth.register('xiaoming', 'abc123', 'abc123');
  const users2 = JSON.parse(storage.getItem('happyEnglishUsers') || '{}');
  check('新用户已写入存储', !!users2.xiaoming);
  check('新用户角色是普通用户', users2.xiaoming.role === 'user');
  check('注册后自动登录', Auth.currentUser().name === 'xiaoming');
  let e5 = null; try { await Auth.register('XIAOMING', 'abc123', 'abc123'); } catch (e) { e5 = e; }
  check('重复用户名（忽略大小写）被拒', !!e5 && /已经被注册/.test(e5.message));

  console.log('\n[T5] 同密码不同盐 → 哈希不同');
  check('admin 与 xiaoming 哈希不同', users2.admin.hash !== users2.xiaoming.hash);
  check('两个账号盐不同', users2.admin.salt !== users2.xiaoming.salt);

  console.log('\n[T6] 会话过期');
  storage.setItem('happyEnglishSession', JSON.stringify({ user: 'admin', time: Date.now() - 8 * 24 * 3600 * 1000 }));
  check('过期会话判定未登录', Auth.currentUser() === null);

  console.log('\n[T7] 进度数据按账号隔离（模拟 app.js dataKey 行为）');
  const STORE_KEY = 'happyEnglishDataV2';
  const dataKey = () => STORE_KEY + Auth.dataSuffix();
  // 模拟 admin 登录后存进度
  await Auth.login('admin', 'admin');
  storage.setItem(dataKey(), JSON.stringify({ totalStars: 10, learnedWords: ['animals:0'] }));
  check('admin 数据键含用户名', storage.getItem(STORE_KEY + ':admin') !== null);
  // 切到 xiaoming
  await Auth.login('xiaoming', 'abc123');
  check('xiaoming 读不到 admin 的进度', storage.getItem(dataKey()) === null);

  console.log('\n[T8] 登出');
  Auth.logout();
  check('登出后清除会话并刷新页面', storage.getItem('happyEnglishSession') === null && sandbox._reloaded === true);

  console.log('\n[T9] SHA-256 路径（有 crypto.subtle 时）');
  const crypto = require('crypto');
  const sb2 = {
    console, localStorage: makeStorage(), document: makeDocument(),
    location: { reload() {} }, setTimeout, TextEncoder,
    crypto: crypto.webcrypto
  };
  sb2.window = sb2; sb2.globalThis = sb2;
  vm.createContext(sb2);
  vm.runInContext(src, sb2);
  const Auth2 = sb2.__Auth;
  await new Promise(r => setTimeout(r, 30));
  const u2 = JSON.parse(sb2.localStorage.getItem('happyEnglishUsers') || '{}');
  check('SHA-256 环境下 admin 哈希为 64 位十六进制', /^[0-9a-f]{64}$/.test(u2.admin.hash), u2.admin.hash && u2.admin.hash.length);
  const ok2 = await Auth2.login('admin', 'admin');
  check('SHA-256 路径登录成功', ok2 === true);
  let e6 = null; try { await Auth2.login('admin', 'bad'); } catch (e) { e6 = e; }
  check('SHA-256 路径错误密码被拒', !!e6);
  check('两种哈希算法产物不同', u2.admin.hash !== users2.admin.hash);

  console.log('\n[T10] 跨环境兼容：localhost 建号 → 局域网 IP（无 crypto.subtle）登录');
  const sharedStorage = makeStorage();
  // 环境 A：localhost（有 crypto.subtle）注册账号
  const envA = {
    console, localStorage: sharedStorage, document: makeDocument(),
    location: { reload() {} }, setTimeout, TextEncoder, crypto: crypto.webcrypto
  };
  envA.window = envA; envA.globalThis = envA;
  vm.createContext(envA);
  vm.runInContext(src, envA);
  const AuthA = envA.__Auth;
  await new Promise(r => setTimeout(r, 30));
  await AuthA.register('mama', 'pwd123', 'pwd123');
  const recA = JSON.parse(sharedStorage.getItem('happyEnglishUsers')).mama;
  check('安全环境下使用 SHA-256', recA.alg === 'sha256');
  check('同时保存了 FNV 兜底哈希', !!recA.hash2 && recA.hash2 !== recA.hash);
  // 环境 B：局域网 IP 访问（crypto.subtle 不可用）登录同一账号
  const envB = {
    console, localStorage: sharedStorage, document: makeDocument(),
    location: { reload() {} }, setTimeout, TextEncoder, crypto: undefined
  };
  envB.window = envB; envB.globalThis = envB;
  vm.createContext(envB);
  vm.runInContext(src, envB);
  const AuthB = envB.__Auth;
  await new Promise(r => setTimeout(r, 30));
  const okB = await AuthB.login('mama', 'pwd123');
  check('无 SHA-256 环境仍能登录（走 FNV 兜底）', okB === true);
  let eB = null; try { await AuthB.login('mama', 'wrong'); } catch (e) { eB = e; }
  check('跨环境下错误密码仍被拒绝', !!eB);
  // 反向：局域网 IP 建号 → localhost 登录
  await AuthB.register('baby', 'baby123', 'baby123');
  const okA = await AuthA.login('baby', 'baby123');
  check('FNV 环境建号在安全环境也能登录', okA === true);

  console.log('\n========== 结果: ' + pass + ' 通过 / ' + fail + ' 失败 ==========');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试崩溃:', e); process.exit(1); });

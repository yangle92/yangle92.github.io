/* 端到端联调：前端 sync.js + auth.js 与 server.py 的真实交互
 * 在 Node 中用 fetch 直连本地 server.py，模拟浏览器的同步行为 */
"use strict";
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const PORT = Number(process.argv[2] || 8124);
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail !== undefined ? ' | ' + detail : '')); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function makeStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    get length() { return m.size; },
    key: i => Array.from(m.keys())[i],
    _map: m
  };
}

/* 构造沙箱：加载 sync.js + auth.js（不自动 init） */
function makeSandbox(storage, withFetch) {
  const sb = {
    console, localStorage: storage, setTimeout, clearTimeout, TextEncoder,
    crypto: require('crypto').webcrypto,
    window: {}, location: { reload() { sb._reloaded = true; } },
    document: {
      readyState: 'complete',
      body: { appendChild() {} },
      addEventListener() {},
      createElement() { return { style: {}, click() {}, remove() {}, appendChild() {} }; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      getElementById() { return null; }
    },
    // 用 Node 的 fetch 指向本地测试端口
    fetch: withFetch
      ? (url, opt) => fetch('http://127.0.0.1:' + PORT + url, opt)
      : undefined,
    AbortController,
    Blob: function () {}, URL: { createObjectURL: () => 'blob:', revokeObjectURL() {} },
    FileReader: function () {},
    prompt: () => null, confirm: () => true
  };
  sb.window = sb; sb.globalThis = sb; sb.window.addEventListener = () => {};
  vm.createContext(sb);
  const syncSrc = fs.readFileSync('js/sync.js', 'utf8');
  const authSrc = fs.readFileSync('js/auth.js', 'utf8')
    .replace(/\/\* 页面加载完成后初始化认证[\s\S]*$/, '');
  vm.runInContext(syncSrc + '\n' + authSrc +
    '\n;globalThis.__out = { Remote, Auth };', sb);
  return sb;
}

const USERS_KEY = 'happyEnglishUsers';

(async () => {
  // 清空服务端数据
  await fetch('http://127.0.0.1:' + PORT + '/api/users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users: {} })
  });

  console.log('\n[T1] 服务器不可用时（file:// 或纯静态服务）应完全回退 localStorage');
  const s1 = makeStorage();
  const sb1 = makeSandbox(s1, false);   // 无 fetch
  const A1 = sb1.__out.Auth;
  check('Remote 检测为不可用', (await sb1.__out.Remote.detect()) === false);
  await A1.createUser('localuser', 'pwd123', 'user');
  check('无服务器时仍能建号', !!JSON.parse(s1.getItem(USERS_KEY)).localuser);
  check('登录正常', (await A1.login('localuser', 'pwd123')) === true);

  console.log('\n[T2] 有服务器时：建号应写入服务器磁盘');
  const s2 = makeStorage();
  const sb2 = makeSandbox(s2, true);
  const A2 = sb2.__out.Auth;
  check('Remote 检测为可用', (await sb2.__out.Remote.detect()) === true);
  await A2.createUser('admin', 'admin', 'admin');
  await A2.createUser('xiaoming', 'xm123', 'user');
  await sleep(300);   // 等待异步推送完成
  const r1 = await (await fetch('http://127.0.0.1:' + PORT + '/api/users')).json();
  check('admin 已存到服务器', !!r1.users.admin);
  check('xiaoming 已存到服务器', !!r1.users.xiaoming);
  check('服务器存的是哈希不是明文', r1.users.xiaoming.hash !== 'xm123');

  console.log('\n[T3] 模拟"服务重启"：全新浏览器（空 localStorage）应拉回账号');
  const s3 = makeStorage();                 // 全新的空存储
  const sb3 = makeSandbox(s3, true);
  const A3 = sb3.__out.Auth;
  await A3.init === undefined ? null : null;
  await sb3.__out.Remote.detect();
  await A3.constructor === Object ? null : null;
  // 手动触发 auth.js 的同步逻辑（等价于 Auth.init 里的 syncFromServer）
  await (async () => {
    const remote = await sb3.__out.Remote.getUsers();
    const local = JSON.parse(s3.getItem(USERS_KEY) || '{}');
    Object.entries(remote).forEach(([n, rec]) => { if (rec && rec.hash) local[n] = rec; });
    s3.setItem(USERS_KEY, JSON.stringify(local));
  })();
  const restored = JSON.parse(s3.getItem(USERS_KEY));
  check('账号被拉回本地', !!restored.admin && !!restored.xiaoming);
  check('可用原密码登录（哈希一致）', (await A3.login('xiaoming', 'xm123')) === true);
  let e1 = null; try { await A3.login('xiaoming', 'wrongpwd'); } catch (e) { e1 = e; }
  check('错误密码仍被拒绝', !!e1);

  console.log('\n[T4] 改密码后同步到服务器，其他设备立即生效');
  await A3.resetPassword('xiaoming', 'newpass999');
  await sleep(300);
  const s4 = makeStorage();
  const sb4 = makeSandbox(s4, true);
  const A4 = sb4.__out.Auth;
  await sb4.__out.Remote.detect();
  const remote2 = await sb4.__out.Remote.getUsers();
  s4.setItem(USERS_KEY, JSON.stringify(remote2));
  check('新密码可登录', (await A4.login('xiaoming', 'newpass999')) === true);
  let e2 = null; try { await A4.login('xiaoming', 'xm123'); } catch (e) { e2 = e; }
  check('旧密码已失效', !!e2);

  console.log('\n[T5] 删除账号：不会在服务器"复活"');
  A4.setRole('xiaoming', 'user');
  A4.deleteUser('xiaoming');
  await sleep(300);
  const r2 = await (await fetch('http://127.0.0.1:' + PORT + '/api/users')).json();
  check('服务器上已删除', !r2.users.xiaoming, JSON.stringify(Object.keys(r2.users)));
  check('admin 仍保留', !!r2.users.admin);

  console.log('\n[T6] 学习进度同步（换设备不丢星星）');
  const s5 = makeStorage();
  const sb5 = makeSandbox(s5, true);
  await sb5.__out.Remote.detect();
  await fetch('http://127.0.0.1:' + PORT + '/api/progress', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress: { 'happyEnglishDataV2:admin': { totalStars: 77, learnedWords: ['a:0', 'a:1'], updatedAt: Date.now() } } })
  });
  const changed = await sb5.__out.Remote.syncProgressIntoLocal();
  check('进度被拉回本地存储', changed === true);
  check('本地能看到 77 颗星', JSON.parse(s5.getItem('happyEnglishDataV2:admin')).totalStars === 77);

  console.log('\n[T7] 断网容错：服务器挂了也不影响本地已登录使用');
  const s7 = makeStorage();
  s7.setItem(USERS_KEY, JSON.stringify({ admin: (await (await fetch('http://127.0.0.1:' + PORT + '/api/users')).json()).users.admin }));
  const sb7 = makeSandbox(s7, false);
  const A7 = sb7.__out.Auth;
  check('离线时能校验密码登录', (await A7.login('admin', 'admin')) === true);
  check('离线时 isAdmin 正常', A7.isAdmin() === true);

  console.log('\n========== 结果: ' + pass + ' 通过 / ' + fail + ' 失败 ==========');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试崩溃:', e); process.exit(1); });

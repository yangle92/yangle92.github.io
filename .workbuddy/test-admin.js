/* admin.js 模拟测试：内容覆盖机制 + 用户管理接口 */
"use strict";
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' | ' + detail : '')); }
}

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

/* ---------- 构造沙箱：加载真实数据 + auth.js + admin.js ---------- */
const storage = makeStorage();
const sandbox = {
  console, localStorage: storage, setTimeout, TextEncoder,
  crypto: require('crypto').webcrypto,
  window: {}, location: { reload() { sandbox._reloaded = true; } },
  document: {
    readyState: 'complete',
    body: { appendChild() {} },
    addEventListener() {},
    createElement() { return { style: {}, click() {}, remove() {}, appendChild() {} }; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; }
  },
  Blob: function () {}, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  FileReader: function () {},
  prompt: () => null, confirm: () => true, alert: () => {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.addEventListener = () => {};

vm.createContext(sandbox);

// 1) 真实数据（只取数据段，避免 DOM 依赖）
const dataSrc = ['data-words.js', 'data-grammar.js', 'data-quiz.js']
  .map(f => fs.readFileSync('js/' + f, 'utf8')).join('\n')
  + '\n;globalThis.__data = { wordDatabase, grammarData, grammarQuiz };';
vm.runInContext(dataSrc, sandbox);

// 2) auth.js（去掉尾部自动初始化，避免依赖 DOM）
const authSrc = fs.readFileSync('js/auth.js', 'utf8')
  .replace(/\/\* 页面加载完成后初始化认证[\s\S]*$/, '')
  + '\n;globalThis.__Auth = Auth;';
vm.runInContext(authSrc, sandbox);

// 3) admin.js（去掉尾部自动挂载，只测逻辑）
const adminSrc = fs.readFileSync('js/admin.js', 'utf8')
  .replace(/\/\* 初始化：等认证与应用就绪后挂载后台面板[\s\S]*$/, '')
  + '\n;globalThis.__Admin = Admin;';
vm.runInContext(adminSrc, sandbox);

const Auth = sandbox.__Auth;
const Admin = sandbox.__Admin;
const { wordDatabase, grammarData, grammarQuiz } = sandbox.__data;

/* ---------- 测试数据（构造一份覆盖数据） ---------- */
const OV = {
  words: {
    animals: { name: '动物（已改）', emoji: '🦁', color: '#5DB7FF', words: [{ emoji: '🦁', en: 'lion', ph: '/laɪən/', cn: '狮子', s: 'The lion is big.' }] }
  },
  grammar: { 'be': { intro: '改过的简介', tips: ['口诀A'], examples: [{ en: 'I am Tom.', cn: '我是汤姆。' }] } },
  quiz: { 'be': [{ q: 'She ___ happy.', o: ['am', 'is', 'are', 'be'], a: 1, explain: 'she 用 is' }] }
};

(async () => {
  console.log('\n[T1] 内容覆盖机制（Overrides）');
  const origWordCount = Object.values(wordDatabase).reduce((n, c) => n + c.words.length, 0);
  const origQuizCount = Object.values(grammarQuiz).reduce((n, l) => n + l.length, 0);
  check('初始单词数为 310', origWordCount === 310, String(origWordCount));

  storage.setItem('happyEnglishOverrides', JSON.stringify(OV));
  Admin.applyOverrides();
  check('单词分类被覆盖：数量变为 1', wordDatabase.animals.words.length === 1);
  check('单词分类名称被覆盖', wordDatabase.animals.name === '动物（已改）', wordDatabase.animals.name);
  check('单词内容正确', wordDatabase.animals.words[0].en === 'lion');
  const beTopic = grammarData.find(t => t.id === 'be');
  check('语法简介被覆盖', beTopic.intro === '改过的简介', beTopic.intro);
  check('语法口诀被覆盖', beTopic.tips.length === 1 && beTopic.tips[0] === '口诀A');
  check('语法例句被覆盖', beTopic.examples.length === 1 && beTopic.examples[0].en === 'I am Tom.');
  check('题库被覆盖', grammarQuiz['be'].length === 1 && grammarQuiz['be'][0].a === 1);
  check('overrideCount 统计正确', Admin.overrideCount() === 3, String(Admin.overrideCount()));

  console.log('\n[T2] 覆盖数据损坏时的容错');
  storage.setItem('happyEnglishOverrides', '{ 坏掉的JSON');
  let threw = false;
  try { Admin.applyOverrides(); } catch (e) { threw = true; }
  check('损坏的覆盖数据不会导致崩溃', !threw && Admin.overrideCount() === 0);
  storage.setItem('happyEnglishOverrides', JSON.stringify(OV));
  Admin.applyOverrides();

  console.log('\n[T3] 保存/清除覆盖的读写一致性');
  vm.runInContext(`Admin.loadOV()`, sandbox);
  const ov2 = Admin.loadOV();
  check('loadOV 能读回单词覆盖', !!ov2.words && !!ov2.words.animals);
  check('loadOV 能读回语法覆盖', !!ov2.grammar && !!ov2.grammar['be']);
  check('loadOV 能读回题库覆盖', !!ov2.quiz && !!ov2.quiz['be']);

  console.log('\n[T4] 用户管理接口');
  // 测试剥离了 Auth.init()，此处手动建号（等价于 ensureAdmin 的效果）
  await Auth.createUser('admin', 'admin', 'admin');
  let list = Auth.listUsers();
  check('默认只有 admin 一个账号', list.length === 1 && list[0].name === 'admin', JSON.stringify(list.map(u => u.name)));
  check('账号列表带学习统计字段', typeof list[0].stats.stars === 'number');

  await Auth.createUser('xiaohong', 'hong123', 'user');
  await Auth.createUser('laoshi', 'tea123', 'admin');
  list = Auth.listUsers();
  check('新增两个账号后共 3 个', list.length === 3, String(list.length));
  check('laoshi 被创建为管理员', list.find(u => u.name === 'laoshi').role === 'admin');
  check('xiaohong 为普通用户', list.find(u => u.name === 'xiaohong').role === 'user');

  let e1 = null; try { await Auth.createUser('xiaohong', 'good123', 'user'); } catch (e) { e1 = e; }
  check('重名账号被拒绝', !!e1 && /已经被注册/.test(e1.message), e1 && e1.message);
  let e2 = null; try { await Auth.createUser('a', 'good123', 'user'); } catch (e) { e2 = e; }
  check('账号名过短被拒绝（1 位）', !!e2 && /2-20/.test(e2.message), e2 && e2.message);
  let e2b = null; try { await Auth.createUser('ab', 'good123', 'user'); } catch (e) { e2b = e; }
  check('账号名 2 位合法（边界）', e2b === null);
  let e3 = null; try { await Auth.createUser('okname', '12', 'user'); } catch (e) { e3 = e; }
  check('密码过短被拒绝', !!e3 && /至少/.test(e3.message));
  let e4 = null; try { await Auth.createUser('bad name!', '123456', 'user'); } catch (e) { e4 = e; }
  check('非法字符账号名被拒绝', !!e4);

  console.log('\n[T5] 改密码 / 改角色 / 删账号');
  await Auth.login('xiaohong', 'hong123');
  check('新账号可以登录', Auth.currentUser().name === 'xiaohong');
  await Auth.resetPassword('xiaohong', 'newpass');
  const okNew = await Auth.login('xiaohong', 'newpass');
  check('改密码后用新密码可登录', okNew === true);
  let e5 = null; try { await Auth.login('xiaohong', 'hong123'); } catch (e) { e5 = e; }
  check('旧密码已失效', !!e5);

  Auth.setRole('xiaohong', 'admin');
  check('已提升为管理员', Auth.listUsers().find(u => u.name === 'xiaohong').role === 'admin');
  Auth.setRole('xiaohong', 'user');
  check('已取消管理员', Auth.listUsers().find(u => u.name === 'xiaohong').role === 'user');

  // 写一份学习进度，验证删号时一并清理
  storage.setItem('happyEnglishDataV2:xiaohong', JSON.stringify({ totalStars: 5, learnedWords: ['animals:0'] }));
  check('删除前进度存在', storage.getItem('happyEnglishDataV2:xiaohong') !== null);
  Auth.deleteUser('xiaohong');
  check('账号已删除', !Auth.listUsers().some(u => u.name === 'xiaohong'));
  check('学习进度被一并清除', storage.getItem('happyEnglishDataV2:xiaohong') === null);
  let e6 = null; try { Auth.deleteUser('admin'); } catch (e) { e6 = e; }
  check('admin 不可删除', !!e6 && /不能删除/.test(e6.message));
  let e7 = null; try { Auth.setRole('admin', 'user'); } catch (e) { e7 = e; }
  check('admin 角色不可更改', !!e7);

  console.log('\n[T6] 权限判定');
  await Auth.login('admin', 'admin');
  check('admin 的 isAdmin 为 true', Auth.isAdmin() === true);
  await Auth.login('laoshi', 'tea123');
  check('laoshi 也是管理员', Auth.isAdmin() === true);
  check('Admin.isEnabled 对管理员为 true', Admin.isEnabled() === true);
  Auth.logout();
  check('登出后 isAdmin 为 false', Auth.isAdmin() === false);

  console.log('\n[T7] 学习进度统计读取（后台展示用）');
  storage.setItem('happyEnglishDataV2:admin', JSON.stringify({ totalStars: 42, learnedWords: ['a:0', 'a:1', 'a:2'], quizCompleted: 7, lastStudyDate: new Date().toDateString() }));
  const st = Auth.userStats('admin');
  check('星星数读取正确', st.stars === 42, String(st.stars));
  check('已学单词数读取正确', st.words === 3);
  check('练习次数读取正确', st.quizzes === 7);
  const st2 = Auth.userStats('nosuchuser');
  check('不存在的账号返回零值', st2.stars === 0 && st2.words === 0);

  console.log('\n========== 结果: ' + pass + ' 通过 / ' + fail + ' 失败 ==========');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试崩溃:', e); process.exit(1); });

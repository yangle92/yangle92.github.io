/* server.py API 端到端测试：账号与进度的持久化读写 */
"use strict";
const http = require('http');

const PORT = Number(process.argv[2] || 8123);
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail !== undefined ? ' | ' + detail : '')); }
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const r = http.request({
      host: '127.0.0.1', port: PORT, path, method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {},
      timeout: 5000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ code: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ code: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  console.log('\n[T1] 健康检查与静态服务');
  const h = await req('GET', '/api/health');
  check('GET /api/health 返回 200', h.code === 200, h.code);
  check('标识为文件存储', h.body && h.body.storage === 'file');
  const page = await req('GET', '/');
  check('静态首页可访问', page.code === 200, page.code);
  const js = await req('GET', '/js/auth.js');
  check('静态 js 可访问', js.code === 200, js.code);

  console.log('\n[T2] 账号写入与读取');
  const rec = {
    admin: { hash: 'h1'.padEnd(64, 'a'), hash2: 'f1', salt: 's1', alg: 'sha256', role: 'admin', createdAt: 1 },
    kid: { hash: 'h2'.padEnd(64, 'b'), hash2: 'f2', salt: 's2', alg: 'fnv', role: 'user', createdAt: 2 }
  };
  const w = await req('POST', '/api/users', { users: rec });
  check('POST /api/users 成功', w.code === 200 && w.body.ok === true, JSON.stringify(w.body).slice(0, 80));
  const g = await req('GET', '/api/users');
  check('能读回 admin', !!(g.body.users && g.body.users.admin));
  check('能读回 kid', !!(g.body.users && g.body.users.kid));
  check('密码哈希完整保存', g.body.users.kid.hash === rec.kid.hash);
  check('角色字段保存', g.body.users.kid.role === 'user');

  console.log('\n[T3] 合并写入（不覆盖其他账号）');
  const w2 = await req('POST', '/api/users', {
    users: { mama: { hash: 'h3'.padEnd(64, 'c'), salt: 's3', alg: 'fnv', role: 'user', createdAt: 3 } }
  });
  check('合并写入成功', w2.code === 200);
  const g2 = await req('GET', '/api/users');
  check('新账号已加入', !!g2.body.users.mama);
  check('原有账号未被覆盖', !!g2.body.users.admin && !!g2.body.users.kid);

  console.log('\n[T4] 删除账号（null）与 admin 保护');
  const w3 = await req('POST', '/api/users', { users: { kid: null, admin: null } });
  check('删除请求被接受', w3.code === 200);
  const g3 = await req('GET', '/api/users');
  check('kid 已删除', !g3.body.users.kid);
  check('admin 受到保护未被删除', !!g3.body.users.admin);

  console.log('\n[T5] 脏数据过滤');
  const w4 = await req('POST', '/api/users', { users: { bad: { role: 'user' }, worse: 'not-an-object' } });
  check('非法记录请求不报错', w4.code === 200);
  const g4 = await req('GET', '/api/users');
  check('缺 hash/salt 的记录被过滤', !g4.body.users.bad);
  check('非对象记录被过滤', !g4.body.users.worse);
  const bad = await req('POST', '/api/users', { users: 'not-an-object' });
  check('参数类型错误返回 400', bad.code === 400, bad.code);

  console.log('\n[T6] 学习进度读写');
  const p1 = await req('POST', '/api/progress', {
    progress: { 'happyEnglishDataV2:admin': { totalStars: 10, learnedWords: ['a:0'], updatedAt: 1000 } }
  });
  check('写入进度成功', p1.code === 200 && p1.body.ok === true);
  const pg = await req('GET', '/api/progress');
  check('能读回进度', pg.body.progress['happyEnglishDataV2:admin'].totalStars === 10);

  console.log('\n[T7] 进度按时间戳保护（旧数据不覆盖新数据）');
  await req('POST', '/api/progress', {
    progress: { 'happyEnglishDataV2:admin': { totalStars: 99, learnedWords: [], updatedAt: 500 } }
  });
  const pg2 = await req('GET', '/api/progress');
  check('旧时间戳(500)不覆盖新数据(1000)', pg2.body.progress['happyEnglishDataV2:admin'].totalStars === 10,
    pg2.body.progress['happyEnglishDataV2:admin'].totalStars);
  await req('POST', '/api/progress', {
    progress: { 'happyEnglishDataV2:admin': { totalStars: 99, learnedWords: [], updatedAt: 2000 } }
  });
  const pg3 = await req('GET', '/api/progress');
  check('新时间戳(2000)成功覆盖', pg3.body.progress['happyEnglishDataV2:admin'].totalStars === 99);

  console.log('\n[T8] 容错');
  const nf = await req('GET', '/api/nonexistent');
  check('未知接口返回 404', nf.code === 404, nf.code);
  const badJson = await new Promise(resolve => {
    const r = http.request({ host: '127.0.0.1', port: PORT, path: '/api/users', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': 5 } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ code: res.statusCode, body: d }));
    });
    r.on('error', () => resolve({ code: 0 }));
    r.write('{{{{!'); r.end();
  });
  check('非法 JSON 不导致崩溃', badJson.code === 200 || badJson.code === 400, badJson.code);
  const after = await req('GET', '/api/users');
  check('服务仍然可用', after.code === 200 && !!after.body.users.admin);

  console.log('\n========== 结果: ' + pass + ' 通过 / ' + fail + ' 失败 ==========');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('测试崩溃:', e.message); process.exit(1); });

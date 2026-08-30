/* ============================================================
 * 服务端同步模块（sync.js）
 * 把账号与学习进度同步到服务器磁盘（server.py 的 /api/* 接口），
 * 实现「服务重启不丢、换浏览器/换设备都在」。
 *
 * 若访问不到接口（例如双击 file:// 打开、或用纯静态服务器托管），
 * 自动回退为仅用 localStorage，功能不受影响。
 * ============================================================ */
"use strict";

const Remote = (() => {
  let available = null;   // null=未检测，true=可用，false=不可用
  const TIMEOUT = 3000;

  function canUseFetch() {
    return typeof fetch === 'function';
  }

  /* 带超时的 JSON 请求；任何失败都返回 null，绝不抛异常打断业务流程 */
  async function request(path, options) {
    if (!canUseFetch()) return null;
    const ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT) : null;
    try {
      const res = await fetch(path, Object.assign({
        signal: ctrl ? ctrl.signal : undefined,
        headers: { 'Content-Type': 'application/json' }
      }, options || {}));
      if (!res || !res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /* 探测服务器是否提供持久化接口 */
  async function detect() {
    if (available !== null) return available;
    const r = await request('/api/health');
    available = !!(r && r.ok && r.storage === 'file');
    return available;
  }

  function isAvailable() { return available === true; }

  /* ---------------- 账号 ---------------- */
  async function getUsers() {
    const r = await request('/api/users');
    return (r && typeof r.users === 'object' && r.users) ? r.users : null;
  }

  /* 写入账号；map 中值为 null 表示删除该账号 */
  async function putUsers(map) {
    if (!isAvailable() && !(await detect())) return false;
    const r = await request('/api/users', { method: 'POST', body: JSON.stringify({ users: map }) });
    return !!(r && r.ok);
  }

  /* ---------------- 学习进度 ---------------- */
  async function getProgress() {
    const r = await request('/api/progress');
    return (r && typeof r.progress === 'object' && r.progress) ? r.progress : null;
  }

  async function putProgress(map) {
    if (!isAvailable() && !(await detect())) return false;
    const r = await request('/api/progress', { method: 'POST', body: JSON.stringify({ progress: map }) });
    return !!(r && r.ok);
  }

  /* 启动时把服务端进度合并进 localStorage（按 updatedAt 取新），返回是否有变化 */
  async function syncProgressIntoLocal() {
    if (!isAvailable() && !(await detect())) return false;
    const remote = await getProgress();
    if (!remote) return false;
    let changed = false;
    try {
      Object.entries(remote).forEach(([key, val]) => {
        if (!val || typeof val !== 'object') return;
        let local = null;
        try { local = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { local = null; }
        const localTs = (local && local.updatedAt) || 0;
        const remoteTs = val.updatedAt || 0;
        if (remoteTs >= localTs) {
          localStorage.setItem(key, JSON.stringify(val));
          changed = true;
        }
      });
    } catch (e) { /* 存储满时忽略 */ }
    return changed;
  }

  return {
    detect, isAvailable,
    getUsers, putUsers,
    getProgress, putProgress, syncProgressIntoLocal
  };
})();

window.Remote = Remote;

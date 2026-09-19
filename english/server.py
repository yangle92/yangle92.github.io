#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快乐英语乐园 —— 本地服务器（静态文件 + 账号/进度持久化 API）

与 `python -m http.server` 的区别：
  1. 账号（含密码哈希）和学习进度保存在服务器磁盘的 data/*.json 中，
     服务重启、换浏览器、换设备（手机/平板）都不会丢失；
  2. 提供 /api/users、/api/progress 两组接口供前端读写；
  3. 仅用 Python 标准库，无任何第三方依赖。

用法：
  python server.py            # 默认 8000 端口
  python server.py 8888       # 指定端口
"""

import json
import os
import sys
import threading
import http.server
import socketserver
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
PROGRESS_FILE = os.path.join(DATA_DIR, 'progress.json')

_lock = threading.Lock()


# ---------------------------------------------------------------- 数据读写
def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def read_json(path, default):
    """读取 JSON 文件，任何异常都回退为默认值（保证服务不崩）"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data if isinstance(data, dict) else default
    except (FileNotFoundError, json.JSONDecodeError, OSError, UnicodeDecodeError):
        return default


def write_json(path, data):
    """原子写入：先写临时文件再替换，避免写到一半断电导致数据损坏"""
    ensure_data_dir()
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def valid_user_record(rec):
    """基本校验：账号记录必须含哈希与盐，防止前端写入脏数据"""
    return (
        isinstance(rec, dict)
        and isinstance(rec.get('hash'), str)
        and isinstance(rec.get('salt'), str)
        and rec['hash'] and rec['salt']
    )


# ---------------------------------------------------------------- HTTP 处理
class Handler(http.server.SimpleHTTPRequestHandler):
    """静态文件服务 + /api/* 接口"""

    # 让 .js 用正确的 MIME，否则部分浏览器拒绝执行模块脚本
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
    }

    def log_message(self, fmt, *args):  # 精简日志，避免刷屏
        if '/api/' in (self.path or ''):
            sys.stderr.write("  [API] %s - %s\n" % (self.path, fmt % args))

    # ------------------------------------------------------------ GET
    def do_GET(self):
        path = urlparse(self.path).path

        if path == '/api/health':
            return self._json(200, {'ok': True, 'storage': 'file', 'service': 'happy-english'})

        if path == '/api/users':
            with _lock:
                users = read_json(USERS_FILE, {})
            return self._json(200, {'users': users})

        if path == '/api/progress':
            with _lock:
                progress = read_json(PROGRESS_FILE, {})
            return self._json(200, {'progress': progress})

        return super().do_GET()

    # ----------------------------------------------------------- POST
    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read_body()

        # ---- 保存账号（前端传来完整账号表做合并） ----
        if path == '/api/users':
            incoming = body.get('users')
            if not isinstance(incoming, dict):
                return self._json(400, {'ok': False, 'error': 'users 必须是对象'})

            with _lock:
                current = read_json(USERS_FILE, {})
                for name, rec in incoming.items():
                    key = str(name)
                    if rec is None:
                        # null 代表删除该账号；内置 admin 不可删除
                        if key != 'admin':
                            current.pop(key, None)
                    elif valid_user_record(rec):
                        # 只有含 hash + salt 的合法记录才写入，过滤脏数据
                        current[key] = rec
                write_json(USERS_FILE, current)
                saved = read_json(USERS_FILE, {})
            return self._json(200, {'ok': True, 'users': saved})

        # ---- 保存学习进度（按账号键合并，同名键以 updatedAt 较新者为准） ----
        if path == '/api/progress':
            incoming = body.get('progress')
            if not isinstance(incoming, dict):
                return self._json(400, {'ok': False, 'error': 'progress 必须是对象'})

            with _lock:
                current = read_json(PROGRESS_FILE, {})
                for key, val in incoming.items():
                    if not isinstance(val, dict):
                        continue
                    old = current.get(key)
                    if isinstance(old, dict):
                        # 时间戳较新的一方胜出，避免旧设备覆盖新进度
                        if (val.get('updatedAt') or 0) < (old.get('updatedAt') or 0):
                            continue
                    current[key] = val
                write_json(PROGRESS_FILE, current)
                saved = read_json(PROGRESS_FILE, {})
            return self._json(200, {'ok': True, 'progress': saved})

        return self._json(404, {'ok': False, 'error': '未知接口'})

    # ------------------------------------------------------------ 工具
    def _read_body(self):
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            length = 0
        if length <= 0:
            return {}
        try:
            raw = self.rfile.read(length).decode('utf-8')
            data = json.loads(raw)
            return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, UnicodeDecodeError, OSError):
            return {}

    def _json(self, code, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """多线程：浏览器会保持多个连接，单线程会互相阻塞"""
    daemon_threads = True
    allow_reuse_address = True


def main():
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print('端口必须是数字，已回退为 8000')
            port = 8000

    os.chdir(BASE_DIR)
    ensure_data_dir()

    # 首次运行生成空数据文件
    if not os.path.exists(USERS_FILE):
        write_json(USERS_FILE, {})
    if not os.path.exists(PROGRESS_FILE):
        write_json(PROGRESS_FILE, {})

    bind = '0.0.0.0'
    with ThreadedServer((bind, port), Handler) as httpd:
        print('=' * 52)
        print('  快乐英语乐园 已启动')
        print('  本机访问     : http://localhost:%d/' % port)
        print('  数据目录     : %s' % DATA_DIR)
        print('  账号与进度将保存在服务器磁盘，重启不丢失')
        print('  停止服务：在本窗口按 Ctrl + C')
        print('=' * 52)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n服务已停止。')


if __name__ == '__main__':
    main()

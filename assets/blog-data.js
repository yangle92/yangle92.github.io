/* ============================================================
   技术笔记索引数据
   —— 由原 index.md 的分类链接目录整理而成（共 64 条）
   如需增删，直接改这里即可。
   ============================================================ */
window.NOTE_DATA = [
  {
    group: '运维支持',
    cats: [
      {
        name: '操作系统', icon: '🐧',
        links: [
          { t: 'Linux 系统架构', u: 'https://blog.csdn.net/yolo2016/article/details/121985958' },
          { t: 'Linux 系统裁剪与定制', u: 'https://blog.csdn.net/yolo2016/article/details/123612204' },
          { t: 'Linux 系统 grub 损坏修复案例', u: 'https://blog.csdn.net/yolo2016/article/details/123609829' },
          { t: 'Linux 系统进程及作业管理', u: 'https://blog.csdn.net/yolo2016/article/details/123563804' },
          { t: 'Linux 内核以及伪文件系统', u: 'https://blog.csdn.net/weixin_44983653/article/details/94732559' },
          { t: 'CentOS7 新特性 systemd 及 systemctl 实践', u: 'https://blog.csdn.net/weixin_44983653/article/details/97780657' },
          { t: 'Linux 下 find、grep、sed、awk 命令解析', u: 'https://blog.csdn.net/yolo2016/article/details/121675150' },
          { t: '文件共享方式', u: 'https://blog.csdn.net/yolo2016/article/details/121604337' },
          { t: 'Linux 下文件共享 —— NFS 搭建', u: 'https://blog.csdn.net/yolo2016/article/details/121426323' },
          { t: 'Linux 命令大全', u: 'https://blog.csdn.net/yolo2016/article/details/114294998' },
          { t: 'Linux 命令 grep 实现精确匹配', u: 'https://blog.csdn.net/yolo2016/article/details/113851321' },
          { t: 'Linux 下服务的创建以及开机启动', u: 'https://blog.csdn.net/yolo2016/article/details/122283219' },
          { t: 'RAID 技术', u: 'https://blog.csdn.net/yolo2016/article/details/121986215' },
          { t: 'Windows 下的 hiberfil.sys 文件及其作用', u: 'https://blog.csdn.net/yolo2016/article/details/114916740' },
          { t: 'PXE + Kickstart 实现系统自动部署', u: 'https://blog.csdn.net/weixin_44983653/article/details/102539178' },
          { t: 'PXE 实现系统批量自动安装', u: 'https://blog.csdn.net/yolo2016/article/details/118059071' },
          { t: 'Linux 系统 shell 基础', u: 'https://blog.csdn.net/yolo2016/article/details/123807982' },
          { t: 'Shell 脚本完成 Linux 系统的初始化配置', u: 'https://blog.csdn.net/yolo2016/article/details/115793985' },
          { t: 'Linux 系统常见 FAQ', u: 'https://blog.csdn.net/yolo2016/article/details/115517353' }
        ]
      },
      {
        name: '云原生', icon: '☁️',
        links: [
          { t: '云计算基础', u: 'http://c.biancheng.net/view/3769.html' },
          { t: 'Kubernetes 实践', u: 'https://blog.csdn.net/yolo2016/article/details/121986135' },
          { t: 'Docker 入门与实践', u: 'https://blog.csdn.net/yolo2016/article/details/121985660' }
        ]
      },
      {
        name: '网络', icon: '🌐',
        links: [
          { t: 'Linux 系统网络管理', u: 'https://blog.csdn.net/yolo2016/article/details/123384376' },
          { t: 'IP 地址规划', u: 'https://blog.csdn.net/yolo2016/article/details/122971488' },
          { t: '图解网络 TCP/IP', u: 'https://blog.csdn.net/yolo2016/article/details/121986094' }
        ]
      },
      {
        name: '服务应用', icon: '⚙️',
        links: [
          { t: 'LDAP 服务', u: 'https://blog.csdn.net/yolo2016/article/details/121721723' },
          { t: 'DNS 服务', u: 'https://blog.csdn.net/yolo2016/article/details/121711220' },
          { t: 'HAProxy 技术实践', u: 'https://blog.csdn.net/yolo2016/article/details/123493033' },
          { t: '常用 Web Server 比较', u: 'https://blog.csdn.net/yolo2016/article/details/123538125' },
          { t: 'LVS 技术实践', u: 'https://blog.csdn.net/yolo2016/article/details/122903957' },
          { t: 'Keepalived 高可用集群的使用', u: 'https://blog.csdn.net/yolo2016/article/details/122790691' },
          { t: 'httpd 实践', u: 'https://blog.csdn.net/yolo2016/article/details/123878927' },
          { t: 'LNMP 环境搭建', u: 'https://blog.csdn.net/yolo2016/article/details/122759542' }
        ]
      },
      {
        name: '数据库', icon: '🗄️',
        links: [
          { t: 'MySQL 主从复制', u: 'https://blog.csdn.net/yolo2016/article/details/123038000' },
          { t: 'MySQL root 密码忘记处理方式', u: 'https://blog.csdn.net/yolo2016/article/details/123037354' },
          { t: 'MySQL 之权限操作', u: 'https://blog.csdn.net/yolo2016/article/details/122870595' },
          { t: 'MySQL 之索引', u: 'https://blog.csdn.net/yolo2016/article/details/122869901' },
          { t: 'MySQL 之存储过程及函数', u: 'https://blog.csdn.net/yolo2016/article/details/122869873' },
          { t: 'MySQL 之视图', u: 'https://blog.csdn.net/yolo2016/article/details/122869671' },
          { t: 'MySQL 之事务', u: 'https://blog.csdn.net/yolo2016/article/details/122831685' },
          { t: 'MySQL 备份 —— mysqldump', u: 'https://blog.csdn.net/yolo2016/article/details/122812747' },
          { t: 'MySQL 使用 FAQ', u: 'https://blog.csdn.net/yolo2016/article/details/115821769' },
          { t: 'Redis 基础实践', u: 'https://blog.csdn.net/yolo2016/article/details/123450333' },
          { t: 'Redis 高级实践', u: 'https://blog.csdn.net/yolo2016/article/details/123510463' },
          { t: '数据库中查询 Top 数据和去重的方法', u: 'https://blog.csdn.net/yolo2016/article/details/115334986' },
          { t: 'Oracle 数据库安装以及 SQL 命令的使用', u: 'https://blog.csdn.net/yolo2016/article/details/115196266' }
        ]
      },
      {
        name: '自动化', icon: '🤖',
        links: [
          { t: 'SaltStack 自动化运维', u: 'https://blog.csdn.net/yolo2016/article/details/121313710' },
          { t: 'Ansible 自动化运维', u: 'https://blog.csdn.net/yolo2016/article/details/121311139' }
        ]
      },
      {
        name: '监控', icon: '📈',
        links: [
          { t: '监控工具 —— Prometheus', u: 'https://blog.csdn.net/yolo2016/article/details/121313718' },
          { t: 'Zabbix 监控实践', u: 'https://blog.csdn.net/yolo2016/article/details/121313700' }
        ]
      },
      {
        name: 'Python 编程', icon: '🐍',
        links: [
          { t: 'Python 常见问题 FAQ 总结', u: 'https://blog.csdn.net/yolo2016/article/details/114117041' },
          { t: '爬虫实战：爬取我的博客文章并写入 MySQL', u: 'https://blog.csdn.net/yolo2016/article/details/114270877' },
          { t: 'Python 中如何生成项目帮助文档', u: 'https://blog.csdn.net/yolo2016/article/details/114124879' },
          { t: 'Python 中利用 *args / **kwargs 表示动态长度参数', u: 'https://blog.csdn.net/yolo2016/article/details/114116615' },
          { t: '分享一个好的 Python 爬虫学习材料', u: 'https://blog.csdn.net/yolo2016/article/details/113851091' },
          { t: 'Django 架构中 MVC 模式的解析', u: 'https://blog.csdn.net/yolo2016/article/details/113850717' }
        ]
      },
      {
        name: '代码库', icon: '📦',
        links: [
          { t: '常用代码参考模板', u: 'https://blog.csdn.net/yolo2016/article/details/118054873' },
          { t: 'GitHub 主页', u: 'https://github.com/yangle92' },
          { t: 'Gitee 主页', u: 'https://gitee.com/yangle92' }
        ]
      }
    ]
  },
  {
    group: '通用技能',
    cats: [
      {
        name: 'PMP 项目管理', icon: '📋',
        links: [
          { t: '项目管理资料包汇总', u: 'https://blog.csdn.net/yolo2016/article/details/116517512' }
        ]
      },
      {
        name: 'ITIL', icon: '🧭',
        links: [
          { t: 'ITIL 框架结构剖析', u: 'https://blog.csdn.net/yolo2016/article/details/113849521' }
        ]
      },
      {
        name: 'Others', icon: '💡',
        links: [
          { t: '高效能人士的七个习惯 · 简要定义与架构图', u: 'https://blog.csdn.net/yolo2016/article/details/113824372' },
          { t: '如何成为一名优秀的企业管理者', u: 'https://blog.csdn.net/yolo2016/article/details/88082008' },
          { t: '3+1 活动：结交一个朋友、参与一项运动、培养一个兴趣爱好、阅读一本好书', u: 'https://blog.csdn.net/yolo2016/article/details/114294240' }
        ]
      }
    ]
  }
];

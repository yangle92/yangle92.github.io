/* ============================================================
   静态数据（两个全局变量，均由 app.js 渲染）
     · NOTE_DATA —— 技术笔记索引：历史沉淀的分类链接目录
     · AI_DATA   —— AI 实践技术栈：能力方向 + 产出匹配规则
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
  },
  {
    group: 'AI 实践',
    cats: [
      {
        name: '模型与平台', icon: '🧠',
        links: [
          { t: 'DeepSeek 开放平台 · API 文档', u: 'https://api-docs.deepseek.com/zh-cn/' },
          { t: '阿里云百炼（通义千问）文档', u: 'https://help.aliyun.com/zh/model-studio/' },
          { t: '腾讯混元大模型文档', u: 'https://cloud.tencent.com/document/product/1729' },
          { t: '智谱 GLM 开放平台文档', u: 'https://docs.bigmodel.cn/' },
          { t: 'Qwen 官方文档', u: 'https://qwen.readthedocs.io/' }
        ]
      },
      {
        name: 'Prompt 工程', icon: '✍️',
        links: [
          { t: '提示工程指南（中文版）', u: 'https://www.promptingguide.ai/zh' },
          { t: 'Anthropic · 提示工程总览', u: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview' }
        ]
      },
      {
        name: 'RAG 与知识库', icon: '📚',
        links: [
          { t: 'LangChain 官方文档', u: 'https://python.langchain.com/docs/introduction/' },
          { t: 'LlamaIndex 官方文档', u: 'https://docs.llamaindex.ai/en/stable/' },
          { t: 'Chroma 向量数据库', u: 'https://docs.trychroma.com/' },
          { t: 'FastGPT 知识库问答', u: 'https://doc.tryfastgpt.ai/' },
          { t: '检索增强生成（RAG）综述论文', u: 'https://arxiv.org/abs/2312.10997' }
        ]
      },
      {
        name: 'Agent 与工具调用', icon: '🕹️',
        links: [
          { t: 'MCP · 模型上下文协议', u: 'https://modelcontextprotocol.io/introduction' },
          { t: 'LangGraph 智能体编排', u: 'https://langchain-ai.github.io/langgraph/' },
          { t: 'Dify 应用编排平台', u: 'https://docs.dify.ai/zh-hans' },
          { t: '扣子 Coze 开放文档', u: 'https://www.coze.cn/open/docs' }
        ]
      },
      {
        name: '部署与推理', icon: '🚀',
        links: [
          { t: 'Ollama 本地大模型运行', u: 'https://ollama.com/' },
          { t: 'Ollama 模型库', u: 'https://ollama.com/library' },
          { t: 'vLLM 高吞吐推理引擎', u: 'https://docs.vllm.ai/en/latest/' }
        ]
      },
      {
        name: '学习路线', icon: '🎯',
        links: [
          { t: '微软 · 生成式 AI 入门课程（中文）', u: 'https://microsoft.github.io/generative-ai-for-beginners/' }
        ]
      }
    ]
  }
];

/* ============================================================
   AI 实践 —— 技术栈里的 AI 主线
   tracks：能力方向（level 决定色带与能力刻度；levels 是等级 → 刻度映射）
   matchTags / matchRe：用来从博客清单里自动挑出「实践产出」，
       命中标签或标题即可，所以以后把新文章打上 AI 相关标签，这里会自动出现
   ============================================================ */
window.AI_DATA = {
  note: '技术栈方向 · 学习与工程实践并重，成果沉淀于本站',
  levels: { '已落地': 5, '实践中': 4, '学习中': 2, '规划中': 1 },
  matchTags: ['AI大模型', 'AI', '大模型', 'LLM', 'Agent', 'RAG'],
  matchRe: 'AI|大模型|LLM|智能体',
  tracks: [
    {
      icon: '🧠', name: '大模型基础与 API', level: '已落地',
      desc: '主流大模型的 API 接入、Token 与上下文成本、流式输出、结构化 JSON 返回，以及多轮会话的状态管理。',
      tools: ['DeepSeek', '通义千问', '混元', 'GLM']
    },
    {
      icon: '✍️', name: 'Prompt 与上下文工程', level: '已落地',
      desc: '角色与约束设定、少样本示例、思维链拆解、输出格式强约束、长文档分段摘要与要点抽取。',
      tools: ['Few-shot', 'CoT', '结构化输出']
    },
    {
      icon: '📚', name: 'RAG 知识库', level: '实践中',
      desc: '文档解析 → 分块 → 向量化 → 混合检索 → 重排 → 引用溯源，把私有资料变成能追问的知识库。',
      tools: ['LangChain', 'Chroma', 'FastGPT']
    },
    {
      icon: '🕹️', name: 'Agent 与工具调用', level: '实践中',
      desc: '函数调用与多步规划、用 MCP 协议把本地工具接给模型、流程编排，以及关键步骤的人工兜底。',
      tools: ['MCP', 'LangGraph', 'Dify']
    },
    {
      icon: '🚀', name: '本地部署与推理', level: '学习中',
      desc: '量化模型本地跑通、推理加速与显存占用、并发与吞吐调优，让中小模型在自己机器上也能用。',
      tools: ['Ollama', 'vLLM', 'Qwen']
    },
    {
      icon: '🛡️', name: 'AI 工程化落地', level: '规划中',
      desc: '评测集与回归、成本与限额控制、数据边界与权限审计，把 AI 稳定地嵌进日常运维流程。',
      tools: ['评测集', '灰度', '审计']
    }
  ]
};

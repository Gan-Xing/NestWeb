export const API_ROUTES_MAP = {
  // 用户相关
  'GET /api/users': '获取所有用户',
  'GET /api/users/page': '分页获取用户',
  'GET /api/users/current': '获取当前用户信息',
  'GET /api/users/:id': '获取指定用户信息',
  'POST /api/users': '创建用户',
  'PATCH /api/users/:id': '更新用户信息',
  'DELETE /api/users': '批量删除用户',
  'DELETE /api/users/:id': '删除指定用户',

  // 认证相关
  'GET /api/auth/wechat-miniprogram-qrcode': '获取微信小程序二维码',
  'POST /api/auth/exchange-code-for-user': '交换授权码获取用户',
  'POST /api/auth/miniprogram-login': '小程序登录',
  'GET /api/auth/test-redis': '测试Redis连接',
  'POST /api/auth/login': '用户登录',
  'POST /api/auth/logout': '用户登出',
  'POST /api/auth/validateCaptcha': '校验验证码',
  'POST /api/auth/validateEmail': '校验邮箱验证码',
  'POST /api/auth/validateSMS': '校验短信验证码',
  'POST /api/auth/testSMS': '测试短信服务',
  'POST /api/auth/register': '用户注册',
  'POST /api/auth/refresh': '刷新Token',
  'POST /api/auth/registerByEmail': '通过邮箱注册',

  // 验证码相关
  'GET /api/captcha': '生成验证码',
  'GET /api/captcha/validate': '校验验证码',

  // 文章相关
  'POST /articles': '创建文章',
  'GET /articles': '获取文章列表',
  'GET /articles/drafts': '获取草稿文章',
  'GET /articles/:id': '获取文章详情',
  'PATCH /articles/:id': '更新文章',
  'DELETE /articles/:id': '删除文章',

  // 角色相关
  'POST /api/roles': '创建角色',
  'GET /api/roles': '获取角色列表',
  'GET /api/roles/:id': '获取角色详情',
  'PATCH /api/roles/:id': '更新角色',
  'DELETE /api/roles': '批量删除角色',
  'DELETE /api/roles/:id': '删除角色',

  // 权限相关
  'POST /api/permissions': '创建权限',
  'GET /api/permissions': '获取权限列表',
  'GET /api/permissions/:id': '获取权限详情',
  'PATCH /api/permissions/:id': '更新权限',
  'DELETE /api/permissions': '批量删除权限',
  'DELETE /api/permissions/:id': '删除权限',

  // 权限组相关
  'POST /api/permissiongroups': '创建权限分组',
  'GET /api/permissiongroups': '获取权限分组',
  'GET /api/permissiongroups/:id': '获取权限分组详情',
  'PATCH /api/permissiongroups/:id': '更新权限分组',
  'DELETE /api/permissiongroups/:id': '删除权限分组',

  // 菜单相关
  'POST /api/menus': '创建菜单',
  'GET /api/menus': '获取菜单列表',
  'GET /api/menus/user': '获取当前用户菜单',
  'GET /api/menus/:id': '获取菜单详情',
  'PATCH /api/menus/:id': '更新菜单',
  'DELETE /api/menus': '批量删除菜单',
  'DELETE /api/menus/:id': '删除菜单',

  // 图片相关
  'POST /api/images/upload': '上传图片',
  'POST /api/images': '创建图片记录',
  'GET /api/images': '获取图片列表',
  'GET /api/images/:id': '获取图片详情',
  'PATCH /api/images/:id': '更新图片',
  'DELETE /api/images/:id': '删除图片',

  // 系统日志相关
  'GET /api/system-log/export': '导出系统日志',
  'DELETE /api/system-log/clear': '清空系统日志',
  'GET /api/system-log': '查询系统日志',
  'GET /api/system-log/:id': '获取指定日志详情',

  // 基础路由
  'GET /': '根路径',
  'GET /greet': '测试用的greet路由',
  'GET /metrics': '监控指标',
  'GET /api': 'API根路径',
  'GET /api/': 'API根路径',
  'GET /api-json': '获取API JSON文档',
  'GET /api-yaml': '获取API YAML文档'
} as const; 
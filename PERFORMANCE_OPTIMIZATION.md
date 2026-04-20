# 性能优化指南

## 页面加载速度优化

### 前端优化

#### 1. 代码分割和懒加载

**优化措施**：
- 使用Next.js的动态导入功能实现代码分割
- 对大型组件进行懒加载
- 按路由分割代码

**示例**：
```typescript
// 懒加载组件
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('../components/CodeEditor'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

#### 2. 图像优化

**优化措施**：
- 使用Next.js的Image组件
- 压缩图像文件
- 使用适当的图像格式（WebP、AVIF）
- 实现响应式图像

**示例**：
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  width={100}
  height={100}
  alt="Logo"
  priority
/>
```

#### 3. CSS优化

**优化措施**：
- 使用Tailwind CSS的JIT模式减少CSS体积
- 避免使用大型CSS框架
- 优化CSS选择器
- 移除未使用的CSS

#### 4. JavaScript优化

**优化措施**：
- 减少第三方库的使用
- 使用Tree Shaking移除未使用的代码
- 优化JavaScript执行时间
- 避免在渲染过程中执行复杂计算

#### 5. 缓存策略

**优化措施**：
- 使用浏览器缓存
- 实现Service Worker
- 缓存静态资源

**示例**：
```typescript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ]
};
```

#### 6. CDN使用

**优化措施**：
- 使用CDN分发静态资源
- 配置适当的CDN缓存策略
- 选择靠近用户的CDN节点

### 后端优化

#### 1. 数据库优化

**优化措施**：
- 创建适当的索引
- 优化SQL查询
- 使用数据库连接池
- 避免N+1查询问题

**示例**：
```typescript
// 优化前
const problems = await prisma.problem.findMany();
for (const problem of problems) {
  const submissions = await prisma.submission.findMany({
    where: { problemId: problem.id }
  });
}

// 优化后
const problems = await prisma.problem.findMany({
  include: {
    submissions: true
  }
});
```

#### 2. API响应优化

**优化措施**：
- 减少API响应数据大小
- 实现分页
- 使用缓存
- 优化数据序列化

**示例**：
```typescript
// 实现分页
const page = parseInt(req.query.page) || 1;
const pageSize = parseInt(req.query.pageSize) || 10;
const offset = (page - 1) * pageSize;

const submissions = await prisma.submission.findMany({
  skip: offset,
  take: pageSize
});
```

#### 3. 服务器配置优化

**优化措施**：
- 增加服务器内存和CPU
- 配置适当的Node.js内存限制
- 优化Nginx配置
- 使用负载均衡

**Nginx优化示例**：
```nginx
http {
  # 启用gzip压缩
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
  
  # 配置缓存
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:10m max_size=10g inactive=60m use_temp_path=off;
  
  # 调整worker进程数
  worker_processes auto;
  worker_connections 1024;
}
```

#### 4. 缓存策略

**优化措施**：
- 使用Redis缓存热点数据
- 实现API响应缓存
- 缓存计算结果

**示例**：
```typescript
// 使用Redis缓存
import Redis from 'ioredis';

const redis = new Redis();

async function getProblems() {
  const cachedProblems = await redis.get('problems');
  if (cachedProblems) {
    return JSON.parse(cachedProblems);
  }
  
  const problems = await prisma.problem.findMany();
  await redis.set('problems', JSON.stringify(problems), 'EX', 3600);
  return problems;
}
```

## 响应时间优化

### 1. 网络优化

**优化措施**：
- 使用HTTP/2或HTTP/3
- 减少HTTP请求数
- 合并CSS和JavaScript文件
- 使用预加载和预连接

**示例**：
```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预连接到重要域名 -->
<link rel="preconnect" href="https://api.example.com">
```

### 2. 渲染优化

**优化措施**：
- 使用服务端渲染(SSR)
- 实现静态生成(SSG)
- 优化客户端渲染
- 减少重排和重绘

**示例**：
```typescript
// 服务端渲染
export async function getServerSideProps() {
  const problems = await prisma.problem.findMany();
  return {
    props: { problems }
  };
}

// 静态生成
export async function getStaticProps() {
  const problems = await prisma.problem.findMany();
  return {
    props: { problems },
    revalidate: 60
  };
}
```

### 3. 代码执行优化

**优化措施**：
- 减少JavaScript执行时间
- 优化循环和递归
- 使用Web Workers处理复杂计算
- 避免阻塞主线程

**示例**：
```typescript
// 使用Web Worker处理复杂计算
const worker = new Worker('/worker.js');

worker.postMessage({ data: largeDataSet });
worker.onmessage = (event) => {
  const result = event.data;
  // 处理结果
};
```

### 4. 资源加载优化

**优化措施**：
- 优先级加载关键资源
- 延迟加载非关键资源
- 预加载可能需要的资源
- 使用资源提示

**示例**：
```html
<!-- 优先级加载关键CSS -->
<link rel="stylesheet" href="/critical.css" media="all">

<!-- 延迟加载非关键CSS -->
<link rel="stylesheet" href="/non-critical.css" media="print" onload="this.media='all'">

<!-- 预加载可能需要的资源 -->
<link rel="prefetch" href="/api/data">
```

## 性能监控

### 1. 前端性能监控

**工具**：
- Lighthouse
- WebPageTest
- Chrome DevTools Performance
- New Relic

**监控指标**：
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

### 2. 后端性能监控

**工具**：
- Prometheus
- Grafana
- New Relic
- Datadog

**监控指标**：
- API响应时间
- 数据库查询时间
- 服务器CPU和内存使用
- 网络延迟

## 性能测试

### 1. 加载性能测试

**工具**：
- Lighthouse
- WebPageTest
- GTmetrix

**测试步骤**：
1. 运行Lighthouse测试
2. 分析性能报告
3. 识别性能瓶颈
4. 实施优化措施
5. 重新测试验证

### 2. 负载测试

**工具**：
- k6
- JMeter
- LoadRunner

**测试步骤**：
1. 配置测试场景
2. 模拟用户负载
3. 监控系统性能
4. 分析测试结果
5. 优化系统配置

## 优化清单

### 前端优化清单
- [ ] 实现代码分割和懒加载
- [ ] 优化图像资源
- [ ] 压缩CSS和JavaScript文件
- [ ] 配置浏览器缓存
- [ ] 使用CDN分发静态资源
- [ ] 减少HTTP请求数
- [ ] 优化渲染性能
- [ ] 实现预加载和预连接

### 后端优化清单
- [ ] 优化数据库查询
- [ ] 实现API响应缓存
- [ ] 配置服务器缓存
- [ ] 使用Redis缓存热点数据
- [ ] 优化API响应时间
- [ ] 配置适当的服务器资源
- [ ] 实现负载均衡
- [ ] 监控系统性能

## 结论

性能优化是一个持续的过程，需要定期测试和调整。通过实施上述优化措施，可以显著提高页面加载速度和响应时间，提升用户体验。同时，需要根据实际情况选择合适的优化策略，避免过度优化导致的维护成本增加。

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

// 自定义错误率指标
const errorRate = new Rate('errors');

export const options = {
  stages: [
    // 逐步增加用户数到100
    {
      duration: '1m',
      target: 100
    },
    // 保持100用户负载10分钟
    {
      duration: '10m',
      target: 100
    },
    // 逐步减少用户数到0
    {
      duration: '1m',
      target: 0
    }
  ],
  thresholds: {
    // 错误率不超过1%
    'errors': ['rate<0.01'],
    // 95%的请求响应时间不超过500ms
    'http_req_duration': ['p95<500'],
    // 99%的请求响应时间不超过1000ms
    'http_req_duration': ['p99<1000']
  }
};

// 测试场景
export default function() {
  // 模拟用户访问首页
  let homeResponse = http.get('http://localhost:3000');
  check(homeResponse, {
    'home status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  // 模拟用户访问题目列表
  let problemsResponse = http.get('http://localhost:3000/problems');
  check(problemsResponse, {
    'problems status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  // 模拟用户访问题目详情
  let problemDetailResponse = http.get('http://localhost:3000/problems/1');
  check(problemDetailResponse, {
    'problem detail status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  // 模拟用户提交代码（随机语言）
  const languages = ['javascript', 'python3', 'cpp', 'java'];
  const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
  
  let submitResponse = http.post('http://localhost:3000/api/submissions', {
    code: 'console.log("Hello world")',
    language: randomLanguage,
    problemId: '1',
    timeLimit: 1000,
    memoryLimit: 256
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  check(submitResponse, {
    'submit status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  // 模拟用户查看提交历史
  let submissionsResponse = http.get('http://localhost:3000/submissions');
  check(submissionsResponse, {
    'submissions status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  // 模拟用户查看排行榜
  let leaderboardResponse = http.get('http://localhost:3000/leaderboard');
  check(leaderboardResponse, {
    'leaderboard status is 200': (r) => r.status === 200
  }) || errorRate.add(1);
  
  // 随机睡眠时间，模拟用户思考时间
  sleep(Math.random() * 3 + 1);
}

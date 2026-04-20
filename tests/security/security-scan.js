// 安全扫描脚本
// 检测常见的安全漏洞

const fs = require('fs');
const path = require('path');

// 常见的安全漏洞模式
const securityPatterns = [
  // SQL注入
  {
    name: 'SQL注入',
    pattern: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*\b(\$|\{).*\b(FROM|WHERE|VALUES|SET)\b/i,
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
  },
  // XSS攻击
  {
    name: 'XSS攻击',
    pattern: /(innerHTML|outerHTML|document\.write|eval|Function\()/i,
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
  },
  // 敏感信息泄露
  {
    name: '敏感信息泄露',
    pattern: /(API_KEY|SECRET_KEY|PASSWORD|TOKEN|CREDENTIALS)/i,
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/.env*']
  },
  // 不安全的HTTP请求
  {
    name: '不安全的HTTP请求',
    pattern: /http:\/\//i,
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
  },
  // 硬编码的凭证
  {
    name: '硬编码的凭证',
    pattern: /(username|password|user|pass)\s*[:=]\s*['"][^'"]*['"]/i,
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
  }
];

// 扫描函数
function scanDirectory(directory, pattern, fileExtensions) {
  const results = [];
  
  function scanRecursive(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules和.git目录
        if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
          scanRecursive(fullPath);
        }
      } else if (fileExtensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(pattern);
        
        if (matches) {
          results.push({
            file: fullPath,
            matches: matches
          });
        }
      }
    }
  }
  
  scanRecursive(directory);
  return results;
}

// 执行扫描
console.log('开始安全扫描...');
console.log('====================================');

let totalIssues = 0;

for (const pattern of securityPatterns) {
  console.log(`\n检测 ${pattern.name}...`);
  
  const results = scanDirectory('.', pattern.pattern, pattern.files);
  
  if (results.length > 0) {
    console.log(`发现 ${results.length} 个潜在问题:`);
    results.forEach(result => {
      console.log(`  - ${result.file}`);
    });
    totalIssues += results.length;
  } else {
    console.log('  未发现问题');
  }
}

console.log('\n====================================');
console.log(`安全扫描完成，共发现 ${totalIssues} 个潜在问题`);

if (totalIssues > 0) {
  console.log('请检查上述文件并修复安全问题');
} else {
  console.log('未发现安全问题，系统安全状态良好');
}

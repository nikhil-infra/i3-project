// architecture.js — Architecture page interactions

const SERVICE_INFO = {
  s3: {
    icon: '🪣',
    name: 'Amazon S3',
    color: '#ff9900',
    description: 'Amazon Simple Storage Service (S3) hosts all our frontend files. The HTML, CSS, and JavaScript files are uploaded to an S3 bucket configured for static website hosting.',
    role: 'Hosts MathBlast static files (HTML/CSS/JS)',
    why: 'S3 provides 99.999999999% durability, auto-scaling, and costs almost nothing for small apps.',
    config: 'Bucket policy: Public read. Static website hosting enabled. Versioning ON.'
  },
  cloudfront: {
    icon: '🌐',
    name: 'AWS CloudFront',
    color: '#00d4ff',
    description: 'CloudFront is AWS\'s Content Delivery Network (CDN). It caches our S3 files at 400+ edge locations worldwide, making MathBlast super fast for every player.',
    role: 'Delivers files globally with low latency',
    why: 'Without CloudFront, players far from our S3 region would experience high latency. CloudFront fixes this.',
    config: 'Origin: S3 bucket. HTTPS only. Cache TTL: 1 day for assets, 5 min for HTML.'
  },
  cognito: {
    icon: '🔐',
    name: 'AWS Cognito',
    color: '#8b5cf6',
    description: 'Cognito is our authentication service. It handles user sign-up, sign-in, and token management without us needing to build auth from scratch.',
    role: 'User registration, login, and JWT tokens',
    why: 'Building secure auth from scratch is complex. Cognito provides enterprise-grade security for free.',
    config: 'User Pool: Email/password. JWT Access Token: 1hr. Refresh Token: 30 days.'
  },
  apigateway: {
    icon: '🔗',
    name: 'API Gateway',
    color: '#ff3d9a',
    description: 'API Gateway creates RESTful endpoints that connect our frontend to Lambda functions. It handles throttling, CORS, and authentication.',
    role: 'REST API: /scores, /leaderboard, /user',
    why: 'Without API Gateway, Lambda functions can\'t receive HTTP requests from browsers.',
    config: 'Stage: prod. Auth: Cognito JWT. CORS: enabled. Throttle: 100 req/sec.'
  },
  lambda: {
    icon: 'λ',
    name: 'AWS Lambda',
    color: '#ff6b35',
    description: 'Lambda runs our backend code without any servers. When a player submits a score, Lambda writes it to DynamoDB. When leaderboard loads, Lambda queries top scores.',
    role: 'Serverless functions for score & leaderboard',
    why: 'No server management. Scales automatically. You only pay for execution time (free tier: 1M req/month).',
    config: 'Runtime: Node.js 18.x. Memory: 128MB. Timeout: 3s. Region: ap-south-1.'
  },
  dynamodb: {
    icon: '🗄️',
    name: 'Amazon DynamoDB',
    color: '#10d98b',
    description: 'DynamoDB is our NoSQL database. It stores all player scores and user profiles. The leaderboard is a Global Secondary Index (GSI) sorted by score.',
    role: 'Stores all game scores and user data',
    why: 'DynamoDB provides single-digit millisecond reads, infinite scalability, and 25GB free storage forever.',
    config: 'Table: MathBlastScores. PK: userId. SK: timestamp. GSI: by score (for leaderboard).'
  },
  eventbridge: {
    icon: '⏰',
    name: 'AWS EventBridge',
    color: '#10d98b',
    description: 'EventBridge triggers our Lambda function on a daily schedule to reset the Daily Challenge scores and generate a new set of questions.',
    role: 'Schedules daily challenge resets',
    why: 'EventBridge cron jobs replace traditional scheduled tasks. Zero cost for < 14M events/month.',
    config: 'Rule: cron(0 0 * * ? *) — midnight UTC daily. Target: ResetDailyChallenge Lambda.'
  },
  cloudwatch: {
    icon: '📊',
    name: 'CloudWatch',
    color: '#ffd700',
    description: 'CloudWatch automatically monitors all our Lambda functions and API Gateway calls. Error logs, execution times, and custom metrics are visible in the AWS console.',
    role: 'Monitoring, logging, alerting',
    why: 'CloudWatch is automatically integrated with Lambda — no setup needed. Helps debug issues instantly.',
    config: 'Lambda logs: 14-day retention. Metrics: invocations, errors, duration. Alarms: if errors > 5.'
  }
};

function showServiceInfo(service) {
  const info = SERVICE_INFO[service];
  if (!info) return;

  const panel = document.getElementById('serviceInfoPanel');
  const content = document.getElementById('serviceInfoContent');
  if (!panel || !content) return;

  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">
      <div style="font-size:2.5rem;">${info.icon}</div>
      <div>
        <div style="font-family:var(--font-game);font-size:1.2rem;font-weight:700;color:${info.color}">${info.name}</div>
        <div style="font-size:0.82rem;color:var(--text-muted)">${info.role}</div>
      </div>
    </div>
    <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.7;margin-bottom:1rem;">${info.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div style="background:rgba(255,255,255,0.04);padding:0.8rem;border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:0.4rem;">Why this service?</div>
        <div style="font-size:0.8rem;color:var(--text-secondary)">${info.why}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);padding:0.8rem;border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:0.4rem;">Configuration</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);font-family:monospace">${info.config}</div>
      </div>
    </div>
  `;

  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast(`Viewing: ${info.name}`, 'info', 2000);
}

// Animate nodes on load
document.addEventListener('DOMContentLoaded', () => {
  const nodes = document.querySelectorAll('.arch-node-box');
  nodes.forEach((node, i) => {
    node.style.opacity = '0';
    node.style.transform = 'scale(0.8)';
    setTimeout(() => {
      node.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      node.style.opacity = '1';
      node.style.transform = 'scale(1)';
    }, i * 100 + 300);
  });
});

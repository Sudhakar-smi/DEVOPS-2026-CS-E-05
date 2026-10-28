
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    complete_load_test: {
      executor: 'constant-vus',
      vus: 250,
      duration: '60s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get('http://localhost:5000/api/health', {
    timeout: '10s',
    tags: { endpoint: 'health' },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'health check successful': (r) => {
      try {
        return r.json('success') === true;
      } catch (_) {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  const report = {
    concurrent_users: 250,
    duration: '60 seconds',
    total_requests: data.metrics.http_reqs.values.count,
    failed_request_rate: data.metrics.http_req_failed.values.rate,
    average_response_time_ms: data.metrics.http_req_duration.values.avg,
    p95_response_time_ms: data.metrics.http_req_duration.values['p(95)'],
  };

  return {
    'load-tests/summary.json': JSON.stringify(report, null, 2),
    stdout: JSON.stringify(report, null, 2) + '\n',
  };
}

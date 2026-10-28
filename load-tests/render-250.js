
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    render_load_test: {
      executor: 'constant-vus',
      vus: 250,
      duration: '30s',
      gracefulStop: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get(
    'https://event-planner-backend-v2.onrender.com/api/health',
    { timeout: '15s' }
  );

  check(response, {
    'HTTP 200': (r) => r.status === 200,
    'health operational': (r) => {
      try {
        return r.json('success') === true;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}


import axios from 'axios';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  validateStatus: () => true
});

let passed = 0;
let failed = 0;
let skipped = 0;
let organizerToken = '';
let attendeeToken = '';
let eventId = '';
let generatedPlan = null;

const results = [];

async function test(name, fn, { requires = [] } = {}) {
  const missing = requires.filter(value => !value);

  if (missing.length) {
    skipped++;
    results.push({ name, status: 'SKIP' });
    console.log(`SKIP: ${name} (prerequisite unavailable)`);
    return;
  }

  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`PASS: ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL' });
    console.error(`FAIL: ${name}`);
    console.error(`      ${error.message}`);
  }
}

function auth(token = organizerToken) {
  return { Authorization: `Bearer ${token}` };
}

function expectStatus(res, status) {
  assert.equal(
    res.status,
    status,
    `Expected HTTP ${status}, received ${res.status}: ${
      JSON.stringify(res.data).slice(0, 400)
    }`
  );
}

function getId(data) {
  return data?.data?._id || data?.event?._id || data?._id || '';
}

function getToken(data) {
  return data?.token || data?.data?.token || data?.accessToken || '';
}

async function run() {
  console.log('\n=== Event Planner AI API Tests ===\n');

  await test('Health endpoint', async () => {
    const res = await api.get('/health');
    expectStatus(res, 200);
  });

  await test('Organizer demo login', async () => {
    const res = await api.post('/auth/demo-login', {
      role: 'organizer'
    });

    expectStatus(res, 200);
    organizerToken = getToken(res.data);
    assert.ok(organizerToken, 'Organizer token missing');
  });

  await test('Attendee demo login', async () => {
    const res = await api.post('/auth/demo-login', {
      role: 'attendee'
    });

    expectStatus(res, 200);
    attendeeToken = getToken(res.data);
    assert.ok(attendeeToken, 'Attendee token missing');
  });

  await test('Create event for AI tests', async () => {
    const res = await api.post('/events', {
      name: `AI Test Event ${Date.now()}`,
      type: 'Hackathon',
      categoryGroup: 'Educational',
      description: 'Event used for automated AI API testing',
      date: new Date(Date.now() + 30 * 86400000).toISOString(),
      duration: '1 day',
      location: 'Jaipur',
      budget: 200000,
      expectedAttendees: 100,
      preferences: {
        cateringType: 'Vegetarian',
        theme: 'Technology',
        indoorOutdoor: 'Indoor'
      },
      requirements: 'Registration and technical sessions'
    }, { headers: auth() });

    assert.ok(
      [200, 201].includes(res.status),
      `Expected HTTP 200/201, received ${res.status}: ${JSON.stringify(res.data)}`
    );

    eventId = getId(res.data);
    assert.ok(eventId, 'Event ID missing from create response');
  }, { requires: [organizerToken] });

  await test('Generate event plan', async () => {
    const res = await api.post('/ai/generate-plan', {
      eventId,
      name: 'AI Test Hackathon',
      type: 'Hackathon',
      categoryGroup: 'Educational',
      budget: 200000,
      expectedAttendees: 100,
      duration: '1 day',
      location: 'Jaipur',
      preferences: {
        cateringType: 'Vegetarian',
        theme: 'Technology',
        indoorOutdoor: 'Indoor'
      },
      requirements: 'Include registration and technical sessions'
    }, { headers: auth() });

    expectStatus(res, 200);
    generatedPlan = res.data.data;

    assert.ok(generatedPlan, 'Generated plan missing');
    assert.ok(
      typeof generatedPlan.summary === 'string' &&
      generatedPlan.summary.length > 0,
      'Plan summary missing'
    );

    for (const key of [
      'budgetPlan', 'schedule', 'resources',
      'checklist', 'risks', 'recommendations'
    ]) {
      assert.ok(Array.isArray(generatedPlan[key]), `${key} must be an array`);
    }
  }, { requires: [organizerToken, eventId] });

  await test('Generated budget stays within requested budget', async () => {
    assert.ok(generatedPlan, 'Generated plan unavailable');

    const total = generatedPlan.budgetPlan.reduce(
      (sum, item) => sum + Number(item.amount || 0), 0
    );

    assert.ok(total <= 200000, `Generated budget ${total} exceeds 200000`);
  }, { requires: [eventId] });

  await test('Save AI plan', async () => {
    const res = await api.post('/ai/save-plan', {
      eventId,
      plan: generatedPlan,
      applyToBudget: true,
      applyToSchedule: true,
      applyToChecklist: true
    }, { headers: auth() });

    expectStatus(res, 200);
  }, { requires: [organizerToken, eventId, generatedPlan] });

  await test('Retrieve saved AI plan', async () => {
    const res = await api.get(`/ai/plan/${eventId}`, {
      headers: auth()
    });

    expectStatus(res, 200);
    assert.ok(res.data.data, 'Saved plan missing');
    assert.equal(String(res.data.data.eventId), String(eventId));
  }, { requires: [organizerToken, eventId, generatedPlan] });

  await test('AI chat returns a response', async () => {
    const res = await api.post('/ai/chat', {
      eventId,
      message: 'How much food should I arrange?',
      history: []
    }, { headers: auth() });

    expectStatus(res, 200);
    assert.ok(
      typeof res.data.data?.response === 'string' &&
      res.data.data.response.trim().length > 0,
      'Chat response text missing'
    );
  }, { requires: [organizerToken, eventId] });

  await test('AI chat rejects an empty message', async () => {
    const res = await api.post('/ai/chat', {
      eventId,
      message: '   '
    }, { headers: auth() });

    expectStatus(res, 400);
  }, { requires: [organizerToken] });

  await test('What-if simulation responds', async () => {
    const res = await api.post('/ai/what-if', {
      eventId,
      currentValues: {
        guests: 100,
        budget: 200000,
        duration: '1 day',
        location: 'Jaipur'
      },
      simulatedValues: {
        guests: 150,
        budget: 250000,
        duration: '2 days',
        location: 'Jaipur'
      }
    }, { headers: auth() });

    expectStatus(res, 200);
    assert.ok(res.data.data, 'Simulation result missing');
  }, { requires: [organizerToken, eventId] });

  await test('What-if rejects missing simulated values', async () => {
    const res = await api.post('/ai/what-if', {
      eventId,
      currentValues: {}
    }, { headers: auth() });

    expectStatus(res, 400);
  }, { requires: [organizerToken] });

  await test('Apply what-if changes', async () => {
    const res = await api.post('/ai/apply-what-if', {
      eventId,
      simulatedValues: {
        guests: 150,
        budget: 250000,
        duration: '2 days',
        location: 'Jaipur'
      }
    }, { headers: auth() });

    expectStatus(res, 200);
    assert.ok(res.data.data, 'Updated event data missing');
  }, { requires: [organizerToken, eventId] });

  await test('Analyze event feedback', async () => {
    const res = await api.post('/ai/analyze-feedback', {
      eventId
    }, { headers: auth() });

    expectStatus(res, 200);
    assert.ok(res.data.data !== undefined, 'Feedback analysis missing');
  }, { requires: [organizerToken, eventId] });

  await test('Analyze attendees', async () => {
    const res = await api.post('/ai/analyze-attendees', {
      eventId
    }, { headers: auth() });

    expectStatus(res, 200);
    assert.ok(res.data.data !== undefined, 'Attendee analysis missing');
  }, { requires: [organizerToken, eventId] });

  await test('AI endpoint rejects missing authentication', async () => {
    const res = await api.post('/ai/generate-plan', {
      name: 'Unauthorized Test',
      type: 'Conference',
      budget: 50000,
      expectedAttendees: 50
    });

    assert.ok([401, 403].includes(res.status),
      `Expected 401/403, received ${res.status}`);
  });

  await test('Attendee cannot generate organizer plan', async () => {
    const res = await api.post('/ai/generate-plan', {
      name: 'Role Test',
      type: 'Conference',
      budget: 50000,
      expectedAttendees: 50
    }, { headers: auth(attendeeToken) });

    assert.ok([401, 403].includes(res.status),
      `Expected 401/403, received ${res.status}`);
  }, { requires: [attendeeToken] });

  console.log('\n=== AI API Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total:  ${passed + failed + skipped}`);

  if (failed > 0 || skipped > 0) {
    console.log('\nReview failures/skips before marking AI testing complete.');
    process.exitCode = 1;
  } else {
    console.log('\nAll AI API checks passed.');
  }

  console.log(
    '\nNote: API success does not prove an external AI provider generated ' +
    'the response; fallback responses may be used.'
  );
}

run().catch(error => {
  console.error('Test runner error:', error);
  process.exitCode = 1;
});

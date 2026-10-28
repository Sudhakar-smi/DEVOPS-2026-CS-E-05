
import axios from 'axios';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';
const results = [];
const state = {};

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`PASS: ${name}`);
  } catch (error) {
    results.push({ name, status: 'FAIL' });
    console.error(`FAIL: ${name}`);
    console.error(error.response?.data ?? error.message);
  }
}

async function createEvent(headers, suffix = 'Integration') {
  const response = await axios.post(
    `${BASE_URL}/events`,
    {
      name: `Backend ${suffix} ${Date.now()}`,
      type: 'Workshop',
      description: 'Created by current-project integration tests',
      date: '2026-12-15T10:00:00.000Z',
      location: 'Jaipur',
      budget: 50000,
      expectedAttendees: 30
    },
    { headers }
  );

  assert.equal(response.data.success, true);
  assert.ok(response.data.data?._id);
  return response.data.data;
}

async function run() {
  console.log('\n=== Current Backend Integration Tests (AI excluded) ===\n');

  await test('Health endpoint', async () => {
    const r = await axios.get(`${BASE_URL}/health`);
    assert.equal(r.status, 200);
    assert.equal(r.data.success, true);
  });

  await test('Organizer demo login', async () => {
    const r = await axios.post(`${BASE_URL}/auth/demo-login`, {
      role: 'organizer'
    });

    assert.ok(r.data.token);
    assert.equal(r.data.user.role, 'organizer');
    state.orgHeaders = {
      Authorization: `Bearer ${r.data.token}`
    };
  });

  await test('Attendee demo login', async () => {
    const r = await axios.post(`${BASE_URL}/auth/demo-login`, {
      role: 'attendee'
    });

    assert.ok(r.data.token);
    assert.equal(r.data.user.role, 'attendee');
    state.attHeaders = {
      Authorization: `Bearer ${r.data.token}`
    };
  });

  await test('Admin demo login', async () => {
    const r = await axios.post(`${BASE_URL}/auth/demo-login`, {
      role: 'admin'
    });

    assert.ok(r.data.token);
    assert.equal(r.data.user.role, 'admin');
    state.adminHeaders = {
      Authorization: `Bearer ${r.data.token}`
    };
  });

  await test('Invalid login is rejected', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: `missing-${Date.now()}@example.invalid`,
        password: 'WrongPassword123!'
      });

      assert.fail('Invalid login unexpectedly succeeded');
    } catch (e) {
      if (e instanceof assert.AssertionError) throw e;

      assert.ok(e.response, 'No HTTP response received');
      assert.ok([400, 401, 403].includes(e.response.status));
      assert.equal(e.response.data.success, false);
    }
  });

  await test('Public events list', async () => {
    const r = await axios.get(`${BASE_URL}/events`);

    assert.equal(r.status, 200);
    assert.equal(r.data.success, true);
    assert.ok(Array.isArray(r.data.data));
  });

  await test('Missing token is rejected for organizer events', async () => {
    try {
      await axios.get(`${BASE_URL}/events/organizer/my-events`);
      assert.fail('Protected route allowed request without token');
    } catch (e) {
      if (e instanceof assert.AssertionError) throw e;

      assert.ok(e.response, 'No HTTP response received');
      assert.ok([401, 403].includes(e.response.status));
    }
  });

  await test('Organizer events list', async () => {
    const r = await axios.get(
      `${BASE_URL}/events/organizer/my-events`,
      { headers: state.orgHeaders }
    );

    assert.equal(r.data.success, true);
  });

  await test('Event creation validation rejects empty payload', async () => {
    try {
      await axios.post(
        `${BASE_URL}/events`,
        {},
        { headers: state.orgHeaders }
      );

      assert.fail('Empty event payload unexpectedly succeeded');
    } catch (e) {
      if (e instanceof assert.AssertionError) throw e;

      assert.equal(e.response?.status, 400);
      assert.equal(e.response?.data?.success, false);
    }
  });

  await test('Create and retrieve event', async () => {
    state.event = await createEvent(state.orgHeaders);

    const r = await axios.get(
      `${BASE_URL}/events/${state.event._id}`
    );

    assert.equal(r.data.success, true);
    assert.equal(r.data.data._id, state.event._id);
  });

  await test('Create and update budget item', async () => {
    assert.ok(state.event?._id);

    const created = await axios.post(
      `${BASE_URL}/events/${state.event._id}/budget`,
      {
        category: 'Test Catering',
        plannedAmount: 10000,
        actualAmount: 5000,
        notes: 'Integration test'
      },
      { headers: state.orgHeaders }
    );

    assert.equal(created.status, 201);

    const updated = await axios.put(
      `${BASE_URL}/budget/${created.data.data._id}`,
      { actualAmount: 6000 },
      { headers: state.orgHeaders }
    );

    assert.equal(updated.data.success, true);
    assert.equal(updated.data.data.actualAmount, 6000);

    const list = await axios.get(
      `${BASE_URL}/events/${state.event._id}/budget`,
      { headers: state.orgHeaders }
    );

    assert.equal(list.data.success, true);
    assert.ok(Array.isArray(list.data.data));
  });

  await test('Create and update schedule session', async () => {
    const created = await axios.post(
      `${BASE_URL}/events/${state.event._id}/schedule`,
      {
        day: 1,
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        title: 'Integration Opening Session',
        location: 'Hall A'
      },
      { headers: state.orgHeaders }
    );

    assert.equal(created.status, 201);

    const updated = await axios.put(
      `${BASE_URL}/schedule/${created.data.data._id}`,
      { location: 'Main Auditorium' },
      { headers: state.orgHeaders }
    );

    assert.equal(updated.data.success, true);
    assert.equal(updated.data.data.location, 'Main Auditorium');
  });

  await test('Create and update task', async () => {
    const created = await axios.post(
      `${BASE_URL}/events/${state.event._id}/tasks`,
      {
        title: 'Prepare test registration desk',
        deadline: '2026-12-10T10:00:00.000Z',
        priority: 'high'
      },
      { headers: state.orgHeaders }
    );

    assert.equal(created.status, 201);

    const updated = await axios.put(
      `${BASE_URL}/tasks/${created.data.data._id}`,
      { status: 'completed' },
      { headers: state.orgHeaders }
    );

    assert.equal(updated.data.success, true);
    assert.equal(updated.data.data.status, 'completed');
  });

  await test('Attendee registration and duplicate prevention', async () => {
    const r = await axios.post(
      `${BASE_URL}/events/${state.event._id}/register`,
      { ticketType: 'Standard Test Pass' },
      { headers: state.attHeaders }
    );

    assert.equal(r.data.success, true);
    state.registration = r.data.data;
    assert.ok(state.registration?._id);

    try {
      await axios.post(
        `${BASE_URL}/events/${state.event._id}/register`,
        { ticketType: 'Duplicate Test Pass' },
        { headers: state.attHeaders }
      );

      assert.fail('Duplicate registration unexpectedly succeeded');
    } catch (e) {
      if (e instanceof assert.AssertionError) throw e;

      assert.ok(e.response, 'No HTTP response received');
      assert.ok([400, 409].includes(e.response.status));
    }
  });

  await test('Attendee check-in status update', async () => {
    assert.ok(state.registration?._id);

    const r = await axios.put(
      `${BASE_URL}/attendees/${state.registration._id}/status`,
      { status: 'checked-in' },
      { headers: state.orgHeaders }
    );

    assert.equal(r.data.success, true);
    assert.equal(r.data.data.status, 'checked-in');
  });

  await test('Attendee feedback submission', async () => {
    const r = await axios.post(
      `${BASE_URL}/events/${state.event._id}/feedback`,
      {
        rating: 5,
        comment: 'Integration test feedback',
        category: 'General'
      },
      { headers: state.attHeaders }
    );

    assert.equal(r.data.success, true);
  });

  await test('Organizer dashboard response', async () => {
    const r = await axios.get(
      `${BASE_URL}/dashboard/organizer`,
      { headers: state.orgHeaders }
    );

    assert.equal(r.data.success, true);
    assert.ok(r.data.stats);
  });

  await test('Notifications endpoint response', async () => {
    const r = await axios.get(
      `${BASE_URL}/notifications`,
      { headers: state.orgHeaders }
    );

    assert.equal(r.data.success, true);
  });

  await test('Attendee CSV export endpoint responds', async () => {
    const r = await axios.get(
      `${BASE_URL}/events/${state.event._id}/attendees/export-csv`,
      { headers: state.orgHeaders }
    );

    assert.equal(r.status, 200);
    assert.ok(r.data !== undefined);
  });

  console.log('\n=== Integration Test Summary ===');
  console.log(`Passed: ${results.filter(x => x.status === 'PASS').length}`);
  console.log(`Failed: ${results.filter(x => x.status === 'FAIL').length}`);
  console.log(`Total:  ${results.length}`);

  if (results.some(x => x.status === 'FAIL')) {
    process.exitCode = 1;
  }
}

run().catch(error => {
  console.error(
    'Unexpected test runner error:',
    error.response?.data ?? error.message
  );
  process.exitCode = 1;
});

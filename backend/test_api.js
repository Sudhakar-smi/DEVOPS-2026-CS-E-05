
import axios from 'axios';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';
const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`PASS: ${name}`);
  } catch (error) {
    results.push({ name, status: 'FAIL' });
    console.error(
      `FAIL: ${name}`,
      error.response?.data ?? error.message
    );
  }
}

async function runTests() {
  let organizerToken;
  let createdEventId;

  console.log('\n=== Current Backend API Tests ===\n');

  // 1. Health endpoint
  await test('Health endpoint returns success', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
    assert.ok(response.data.timestamp);
  });

  // 2. Invalid login should be rejected
  await test('Invalid login is rejected', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'invalid-user-test@example.com',
        password: 'WrongPassword123!'
      });
      assert.fail('Invalid login unexpectedly succeeded');
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
      assert.ok(error.response, 'No HTTP response received');
      assert.ok(
        [400, 401, 403].includes(error.response.status),
        `Unexpected status: ${error.response.status}`
      );
      assert.equal(error.response.data.success, false);
    }
  });

  // 3. Demo organizer authentication
  await test('Organizer demo login returns a token', async () => {
    const response = await axios.post(`${BASE_URL}/auth/demo-login`, {
      role: 'organizer'
    });

    assert.equal(response.status, 200);
    assert.ok(response.data.token, 'Token missing');
    assert.equal(response.data.user.role, 'organizer');

    organizerToken = response.data.token;
  });

  // 4. Events endpoint
  await test('Public events endpoint returns a valid response', async () => {
    const response = await axios.get(`${BASE_URL}/events`);

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
    assert.ok(Array.isArray(response.data.data));
  });

  // 5. Protected route without a token
  await test('Protected organizer route rejects missing token', async () => {
    try {
      await axios.get(`${BASE_URL}/events/organizer/my-events`);
      assert.fail('Protected route allowed an unauthenticated request');
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
      assert.ok(error.response, 'No HTTP response received');
      assert.ok(
        [401, 403].includes(error.response.status),
        `Unexpected status: ${error.response.status}`
      );
    }
  });

  // 6. Organizer can access their events
  await test('Organizer can retrieve their events', async () => {
    assert.ok(organizerToken, 'Organizer token unavailable');

    const response = await axios.get(
      `${BASE_URL}/events/organizer/my-events`,
      { headers: { Authorization: `Bearer ${organizerToken}` } }
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
  });

  // 7. Event validation rejects an empty payload
  await test('Event creation rejects missing required fields', async () => {
    assert.ok(organizerToken, 'Organizer token unavailable');

    try {
      await axios.post(
        `${BASE_URL}/events`,
        {},
        { headers: { Authorization: `Bearer ${organizerToken}` } }
      );
      assert.fail('Invalid event payload was accepted');
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
      assert.ok(error.response, 'No HTTP response received');
      assert.equal(error.response.status, 400);
      assert.equal(error.response.data.success, false);
    }
  });

  // 8. Create a normal event; do not invoke AI generation
  await test('Organizer can create a valid event', async () => {
    assert.ok(organizerToken, 'Organizer token unavailable');

    const payload = {
      name: `Backend Test Event ${Date.now()}`,
      type: 'Workshop',
      description: 'Created by backend API verification',
      date: '2026-12-15T10:00:00.000Z',
      location: 'Jaipur',
      budget: 25000,
      expectedAttendees: 50
    };

    const response = await axios.post(
      `${BASE_URL}/events`,
      payload,
      { headers: { Authorization: `Bearer ${organizerToken}` } }
    );

    assert.equal(response.status, 201);
    assert.equal(response.data.success, true);

    const event = response.data.data;
    assert.ok(event?._id, 'Created event ID missing');
    assert.equal(event.name, payload.name);

    createdEventId = event._id;
  });

  // 9. Retrieve the created event
  await test('Created event can be retrieved by ID', async () => {
    assert.ok(createdEventId, 'No event was created by the previous test');

    const response = await axios.get(
      `${BASE_URL}/events/${createdEventId}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);
    assert.equal(response.data.data._id, createdEventId);
  });

  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${results.filter(r => r.status === 'PASS').length}`);
  console.log(`Failed: ${results.filter(r => r.status === 'FAIL').length}`);
  console.log(`Total:  ${results.length}`);

  if (results.some(r => r.status === 'FAIL')) {
    process.exitCode = 1;
  }
}

runTests().catch(error => {
  console.error('Unexpected test runner error:', error);
  process.exitCode = 1;
});

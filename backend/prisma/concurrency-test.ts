const BASE_URL = 'http://localhost:3000/api';

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.accessToken;
}

async function assignCustomer(
  token: string,
  customerId: string,
  userId: string,
) {
  const res = await fetch(`${BASE_URL}/customers/${customerId}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  const adminToken = await login('admin@globex.com', 'password123');

  const targetUserId = 'c1ce6e92-822d-4589-abf2-05065c38ff29'; // Max
  const customerIds = [
    'bf949adf-e5b9-4813-9d05-e042754f6353', // test1
    '569424fb-6e13-458c-880c-14480226d139', // test2
    '9fef9209-2a9e-4b4c-8773-e591984981e6', // test3
    'ef3c43dd-a0db-4fa6-a433-17c1b8785d57', // test4
    'd298009a-d5f8-4e8b-b9fc-2a289748fea8', // test5
    '2dd7cf8f-90c5-448f-98f5-dbf125cfa097', // test6
  ];

  console.log('Firing 6 simultaneous assignment requests to Max...');

  const results = await Promise.all(
    customerIds.map((id) => assignCustomer(adminToken, id, targetUserId)),
  );

  const succeeded = results.filter((r) => r.status === 200);
  const failed = results.filter((r) => r.status !== 200);

  console.log(`\nSucceeded: ${succeeded.length}`);
  console.log(`Failed: ${failed.length}\n`);

  results.forEach((r, i) => {
    console.log(
      `  test${i + 1}: ${r.status} — ${r.data.message ?? JSON.stringify(r.data)}`,
    );
  });

  if (succeeded.length === 5 && failed.length === 1) {
    console.log(
      '\n✅ PASS: Exactly 5 succeeded, 1 correctly rejected. Race condition prevented.',
    );
  } else {
    console.log('\n❌ FAIL: Expected exactly 5 successes and 1 rejection.');
  }
}

main();

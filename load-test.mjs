
const url = "http://localhost:5000/api/health";
const concurrency = 5;
const durationMs = 20_000;
const end = Date.now() + durationMs;

let sent = 0;
let succeeded = 0;
let failed = 0;

async function worker() {
  while (Date.now() < end) {
    try {
      sent++;

      const response = await fetch(url);
      await response.arrayBuffer();

      if (response.ok) {
        succeeded++;
      } else {
        failed++;
        console.log("HTTP error:", response.status);
      }
    } catch (error) {
      failed++;
      console.log("Request error:", error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function main() {
  console.log("Starting LOCAL load test: 5 workers, 20 seconds");

  await Promise.all(
    Array.from({ length: concurrency }, () => worker())
  );

  console.log("\n--- Load Test Results ---");
  console.log("Total requests:", sent);
  console.log("Successful:", succeeded);
  console.log("Failed:", failed);
  console.log(
    "Success rate:",
    sent > 0 ? `${((succeeded / sent) * 100).toFixed(2)}%` : "N/A"
  );
}

main();

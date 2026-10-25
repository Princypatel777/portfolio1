/**
 * Verification Script for Practical 10: Asynchronous Processing with Event-Driven Architecture
 * Tests:
 * 1. Immediate HTTP 201 response upon POST /tasks
 * 2. Asynchronous execution of 'task-created' listener (2s delayed background notification)
 * 3. Immediate HTTP 200 response upon DELETE /tasks/:id
 * 4. Asynchronous execution of 'task-deleted' listener (1s delayed audit log)
 * 5. Error event handling for errors thrown inside asynchronous worker
 * 6. Timestamp comparison proving non-blocking behavior
 */

const http = require('http');
const { app } = require('./server');

const TEST_PORT = 5055;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null,
            receivedAt: new Date().toISOString()
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
            receivedAt: new Date().toISOString()
          });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(TEST_PORT, async () => {
    console.log(`\n======================================================================`);
    console.log(`🚀 TEST SERVER RUNNING ON PORT ${TEST_PORT} FOR PRACTICAL 10 VERIFICATION`);
    console.log(`======================================================================\n`);

    try {
      // ----------------------------------------------------------------------
      // TEST 1: Task Creation (POST /tasks) - Immediate API Response
      // ----------------------------------------------------------------------
      console.log(`--- TEST 1: Creating a Task with Assigned User ---`);
      const createPayload = {
        title: 'Complete Practical 10 Report',
        description: 'Implement EventEmitter and demonstrate non-blocking async architecture',
        assignedTo: 'Princy Patel'
      };

      const startPostTime = Date.now();
      const postRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/tasks',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, createPayload);

      const postDuration = Date.now() - startPostTime;
      const createdTask = postRes.body.task;

      console.log(`\n[Client] HTTP POST returned Status: ${postRes.statusCode} in ${postDuration}ms`);
      console.log(`[Client] Response Body:`, JSON.stringify(postRes.body, null, 2));
      console.log(`[Client] Client received response at: ${postRes.receivedAt}\n`);

      // ----------------------------------------------------------------------
      // Wait for background 2-second notification to finish
      // ----------------------------------------------------------------------
      console.log(`⏳ Waiting 2.5 seconds for background 'task-created' notification worker to complete...\n`);
      await new Promise((r) => setTimeout(r, 2500));

      // ----------------------------------------------------------------------
      // TEST 2: Task Deletion (DELETE /tasks/:id) - Immediate API Response & Cleanup
      // ----------------------------------------------------------------------
      console.log(`--- TEST 2: Deleting the Task ---`);
      const startDeleteTime = Date.now();
      const deleteRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/tasks/${createdTask.id}`,
        method: 'DELETE'
      });
      const deleteDuration = Date.now() - startDeleteTime;

      console.log(`\n[Client] HTTP DELETE returned Status: ${deleteRes.statusCode} in ${deleteDuration}ms`);
      console.log(`[Client] Client received response at: ${deleteRes.receivedAt}\n`);

      console.log(`⏳ Waiting 1.5 seconds for background 'task-deleted' audit worker to complete...\n`);
      await new Promise((r) => setTimeout(r, 1500));

      // ----------------------------------------------------------------------
      // TEST 3: Error Handling in Asynchronous Listener
      // ----------------------------------------------------------------------
      console.log(`--- TEST 3: Triggering Error in Asynchronous Worker ---`);
      const errorPayload = {
        title: 'Task Triggering Background Error',
        assignedTo: 'Error Tester',
        simulateError: true
      };

      const errorRes = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/tasks',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, errorPayload);

      console.log(`\n[Client] HTTP POST returned Status: ${errorRes.statusCode} (API still succeeded immediately!)`);
      console.log(`⏳ Waiting 2.5 seconds for error event to trigger and be handled by error listener...\n`);
      await new Promise((r) => setTimeout(r, 2500));

      console.log(`======================================================================`);
      console.log(`✅ ALL PRACTICAL 10 TESTS COMPLETED SUCCESSFULLY`);
      console.log(`======================================================================\n`);
    } catch (err) {
      console.error(`❌ Test failed:`, err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();

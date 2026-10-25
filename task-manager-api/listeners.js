const taskEvents = require('./events');

/**
 * Listener for 'task-created' event
 * Handles notification sending in the background asynchronously
 * Uses setTimeout (2 seconds) to simulate slow external service (e.g., email / push notification)
 */
taskEvents.on('task-created', (task) => {
  console.log(`[Notification Worker] Handling 'task-created' event for: "${task.title}" (ID: ${task.id || task._id})`);

  // Simulated asynchronous background processing (e.g. 2-second delay)
  setTimeout(() => {
    try {
      if (task.simulateError) {
        throw new Error(`Simulated notification delivery failure for task "${task.title}"`);
      }

      const timestamp = new Date().toISOString();
      const assignedUser = task.assignedTo || task.assignedUser || 'Unassigned';

      console.log(
        `[Notification] Background notification sent: Task "${task.title}" | Assigned to: ${assignedUser} | Completed at ${timestamp}`
      );
    } catch (err) {
      // Forward error to the EventEmitter error handler
      taskEvents.emit('error', err);
    }
  }, 2000);
});

/**
 * Supplementary Listener: 'task-deleted' event
 * Handles background cleanup or audit logging when a task is deleted
 */
taskEvents.on('task-deleted', (task) => {
  console.log(`[Notification Worker] Handling 'task-deleted' event for: "${task.title}" (ID: ${task.id || task._id})`);

  // Asynchronous cleanup with simulated 1-second delay
  setTimeout(() => {
    const timestamp = new Date().toISOString();
    console.log(
      `[Notification] Audit log: Task "${task.title}" (ID: ${task.id || task._id}) successfully purged from records at ${timestamp}`
    );
  }, 1000);
});

/**
 * Supplementary Listener: 'error' event
 * Ensures any asynchronous listener errors are caught and logged without crashing the process
 */
taskEvents.on('error', (err) => {
  console.error(`[Error Handler] Caught EventEmitter error: ${err.message}`);
});

console.log('[Events] Notification and audit listeners successfully registered.');

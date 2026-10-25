const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

// Export a singleton instance of TaskEvents
module.exports = new TaskEvents();

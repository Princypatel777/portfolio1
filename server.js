// ==================== Imports ====================
var express = require('express');
var app = express();
var PORT = 5000;

// In-memory storage. Tasks are lost whenever the server restarts.
var tasks = [];

// ==================== Middleware ====================

// Parse incoming JSON request bodies.
app.use(express.json());

// Log every request with its method, URL, and time of arrival.
app.use(function (req, res, next) {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.originalUrl);
  next();
});

// POST and PUT endpoints in this API only accept JSON bodies.
app.use(function (req, res, next) {
  var contentType = req.headers['content-type'] || '';

  if ((req.method === 'POST' || req.method === 'PUT') && !contentType.toLowerCase().startsWith('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }

  next();
});

// Route-specific middleware: find and validate an existing task ID.
function validateTaskId(req, res, next) {
  var task = tasks.find(function (item) {
    return String(item.id) === req.params.id;
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Make the task available to the route handler.
  req.task = task;
  next();
}

// ==================== Routes ====================

// Return all tasks, newest first.
app.get('/tasks', function (req, res, next) {
  try {
    var sortedTasks = tasks.slice().sort(function (firstTask, secondTask) {
      return new Date(secondTask.createdAt) - new Date(firstTask.createdAt);
    });

    res.status(200).json({ tasks: sortedTasks });
  } catch (error) {
    next(error);
  }
});

// Create a task from a non-empty title.
app.post('/tasks', function (req, res, next) {
  try {
    var title = req.body.title;

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }

    var newTask = {
      id: Date.now(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    res.status(201).json({ message: 'Task created', task: newTask });
  } catch (error) {
    next(error);
  }
});

// Update a task's title and/or completion status.
app.put('/tasks/:id', validateTaskId, function (req, res, next) {
  try {
    var title = req.body.title;
    var completed = req.body.completed;

    if (title === undefined && completed === undefined) {
      return res.status(400).json({ error: 'Provide title and/or completed to update a task' });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      req.task.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean' });
      }
      req.task.completed = completed;
    }

    res.status(200).json({ message: 'Task updated', task: req.task });
  } catch (error) {
    next(error);
  }
});

// Delete an existing task.
app.delete('/tasks/:id', validateTaskId, function (req, res, next) {
  try {
    var taskIndex = tasks.findIndex(function (item) {
      return String(item.id) === req.params.id;
    });

    var deletedTask = tasks.splice(taskIndex, 1)[0];
    res.status(200).json({ message: 'Task deleted', task: deletedTask });
  } catch (error) {
    next(error);
  }
});

// ==================== Error Handling ====================

// Handle requests that do not match any route.
app.use(function (req, res) {
  res.status(404).json({ error: 'Route not found' });
});

// This must be the last middleware so Express can pass all errors here.
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, function () {
  console.log('Task API is running at http://localhost:' + PORT);
});

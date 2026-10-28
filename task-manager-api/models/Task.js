const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required and must be a non-empty string'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    simulateError: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure both .id and ._id are available for frontend and API compatibility
taskSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    ret._id = ret._id.toString()
    return ret
  },
})

module.exports = mongoose.model('Task', taskSchema)

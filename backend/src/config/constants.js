module.exports = {
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
  },

  PROJECT_STATUS: {
    PLANNING: 'planning',
    IN_PROGRESS: 'in-progress',
    ON_HOLD: 'on-hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
  },

  PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  NOTIFICATION_TYPE: {
    TASK_ASSIGNED: 'task_assigned',
    TASK_COMPLETED: 'task_completed',
    DEADLINE_REMINDER: 'deadline_reminder',
    PROJECT_UPDATE: 'project_update',
  },

  REPORT_TYPE: {
    EMPLOYEE: 'employee',
    PROJECT: 'project',
    PRODUCTIVITY: 'productivity',
  },

  REPORT_FORMAT: {
    PDF: 'pdf',
    CSV: 'csv',
  },
};

-- Add new task execution notification types to the notification_type ENUM
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TASK_ACCEPTED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TASK_DECLINED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TASK_RETURNED';

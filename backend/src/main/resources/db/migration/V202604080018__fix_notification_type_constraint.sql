-- Fix Hibernate-generated CHECK constraint to allow new notification type values.
-- This is needed because Flyway already ran V14 before this constraint fix was known.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type::text = ANY (ARRAY[
        'INVITATION'::text,
        'PROJECT_UPDATE'::text,
        'FILE_UPLOAD'::text,
        'TASK_ASSIGNMENT'::text,
        'MENTION'::text,
        'STAGE_REACTIVATION'::text,
        'LICENSE_APPROVED'::text,
        'LICENSE_REJECTED'::text,
        'TASK_ACCEPTED'::text,
        'TASK_DECLINED'::text,
        'TASK_RETURNED'::text
    ]));

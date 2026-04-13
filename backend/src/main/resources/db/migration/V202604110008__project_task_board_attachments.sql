
ALTER TABLE public.chat_message_mentions
DROP CONSTRAINT chat_message_mentions_user_id_fkey;


ALTER TABLE public.chat_message_mentions
ADD CONSTRAINT chat_message_mentions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;
/*
  # Add participant tracking to chat rooms

  1. Changes
    - Add active_participants column to track number of users in a room
    - Add last_activity column to track room activity

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_rooms' AND column_name = 'active_participants'
  ) THEN
    ALTER TABLE chat_rooms ADD COLUMN active_participants integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_rooms' AND column_name = 'last_activity'
  ) THEN
    ALTER TABLE chat_rooms ADD COLUMN last_activity timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;
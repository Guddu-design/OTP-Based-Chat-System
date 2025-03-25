/*
  # Add username field to messages table

  1. Changes
    - Add username column to messages table
    - Make username required for new messages

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'username'
  ) THEN
    ALTER TABLE messages ADD COLUMN username text NOT NULL DEFAULT 'Anonymous';
  END IF;
END $$;
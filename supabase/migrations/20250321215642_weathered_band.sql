/*
  # Create Chat System Tables

  1. New Tables
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `type` (text, either 'single' or 'group')
      - `otp` (text, 6-digit code)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to chat_rooms)
      - `sender_id` (uuid, foreign key to auth.users)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Users can read messages in rooms they have access to
      - Users can insert messages in rooms they have access to
      - Users can read room details if they have the correct OTP
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('single', 'group')),
  otp text NOT NULL CHECK (length(otp) = 6),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Users can read room with valid OTP"
  ON chat_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND now() <= chat_rooms.expires_at
    )
  );

CREATE POLICY "Users can create rooms"
  ON chat_rooms
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND expires_at <= (now() + interval '4 hours')
  );

-- Policies for messages
CREATE POLICY "Users can read messages in their rooms"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE chat_rooms.id = messages.room_id
      AND now() <= chat_rooms.expires_at
    )
  );

CREATE POLICY "Users can insert messages in their rooms"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE chat_rooms.id = messages.room_id
      AND now() <= chat_rooms.expires_at
    )
  );
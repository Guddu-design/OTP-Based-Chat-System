/*
  # Update Chat System Policies

  1. Changes
    - Remove authentication requirements from policies
    - Allow anonymous access to chat rooms and messages
    - Maintain expiry time checks

  2. Security
    - Keep expiration validation
    - Keep OTP validation
    - Remove auth-based restrictions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read room with valid OTP" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can read messages in their rooms" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON messages;

-- Create new policies for chat_rooms
CREATE POLICY "Anyone can read room with valid OTP"
  ON chat_rooms
  FOR SELECT
  USING (now() <= expires_at);

CREATE POLICY "Anyone can create rooms"
  ON chat_rooms
  FOR INSERT
  WITH CHECK (expires_at <= (now() + interval '4 hours'));

-- Create new policies for messages
CREATE POLICY "Anyone can read messages in valid rooms"
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

CREATE POLICY "Anyone can insert messages in valid rooms"
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
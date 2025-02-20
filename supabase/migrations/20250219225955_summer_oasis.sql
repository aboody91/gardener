/*
  # Create plants and contact messages tables

  1. New Tables
    - `plants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `name` (text)
      - `quantity` (integer)
      - `image_url` (text)
      - `watering_days` (integer)
      - `watering_hours` (integer)
      - `last_watered` (timestamptz)
      - `created_at` (timestamptz)

    - `contact_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id, nullable)
      - `name` (text)
      - `email` (text)
      - `message` (text)
      - `created_at` (timestamptz)

    - `terms_conditions`
      - `id` (uuid, primary key)
      - `content` (text)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references users.id)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create plants table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  image_url text NOT NULL,
  watering_days integer NOT NULL,
  watering_hours integer NOT NULL,
  last_watered timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create terms and conditions table
CREATE TABLE IF NOT EXISTS terms_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_conditions ENABLE ROW LEVEL SECURITY;

-- Plants policies
CREATE POLICY "Users can read all plants"
  ON plants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own plants"
  ON plants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
  ON plants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
  ON plants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Contact messages policies
CREATE POLICY "Users can insert contact messages"
  ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR
    user_id IS NULL
  );

CREATE POLICY "Admins can read contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Terms and conditions policies
CREATE POLICY "Anyone can read terms"
  ON terms_conditions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update terms"
  ON terms_conditions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

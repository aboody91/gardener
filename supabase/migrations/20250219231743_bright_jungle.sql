/*
  # Add plant templates table

  1. New Tables
    - `plant_templates`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS on `plant_templates` table
    - Add policies for:
      - Anyone can read templates
      - Authenticated users can create templates
*/

-- Create plant templates table
CREATE TABLE IF NOT EXISTS plant_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE plant_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read plant templates"
  ON plant_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create plant templates"
  ON plant_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

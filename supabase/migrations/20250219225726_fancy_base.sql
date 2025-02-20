/*
  # Add insert policy for users table

  1. Changes
    - Add policy to allow authenticated users to insert their own data
    - This is necessary for the signup process to work correctly

  2. Security
    - Policy ensures users can only insert rows where their auth.uid matches the id
    - Maintains data integrity and security
*/

-- Add insert policy for users
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

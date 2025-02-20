/*
  # Add default terms and conditions

  1. Changes
    - Insert default terms and conditions entry
    - Add admin user to update the terms

  2. Security
    - Terms will be updated by admin user
*/

-- First, create an admin user if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = 'admin@gardenplanner.com'
  ) THEN
    INSERT INTO users (
      id,
      username,
      email,
      country,
      is_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'admin',
      'admin@gardenplanner.com',
      'System',
      true
    );
  END IF;
END $$;

-- Insert default terms if not exists
INSERT INTO terms_conditions (
  content,
  updated_by
)
SELECT 
  'Welcome to Garden Planner!

By using our service, you agree to these terms and conditions:

1. Account Registration
   - You must provide accurate information when creating an account
   - You are responsible for maintaining the security of your account
   - You must be at least 13 years old to use this service

2. User Content
   - You retain ownership of your content
   - You grant us license to display and share your content
   - You must not upload harmful or illegal content

3. Privacy
   - We collect and process your data as described in our Privacy Policy
   - We use cookies to improve your experience
   - We do not sell your personal information

4. Service Usage
   - You agree to use the service responsibly
   - We may terminate accounts that violate these terms
   - We may modify the service at any time

5. Limitations
   - The service is provided "as is"
   - We are not responsible for user-generated content
   - We do not guarantee continuous availability

For questions about these terms, please contact us.',
  '00000000-0000-0000-0000-000000000000'
WHERE NOT EXISTS (
  SELECT 1 FROM terms_conditions
);

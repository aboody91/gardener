/*
  # Add admin user and default terms

  1. Changes
    - Create admin user in auth.users table
    - Create admin user profile in users table
    - Add default terms and conditions

  2. Security
    - Admin user will be created with proper foreign key relationships
    - Terms will be properly linked to admin user
*/

-- Create admin user in auth.users if not exists
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'admin@gardenplanner.com',
  crypt('admin123', gen_salt('bf')), -- Note: Change this password in production!
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@gardenplanner.com'
);

-- Create admin user profile
INSERT INTO users (
  id,
  username,
  email,
  country,
  is_admin
)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'admin',
  'admin@gardenplanner.com',
  'System',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@gardenplanner.com'
);

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

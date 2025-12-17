# ICG Application Tracking System (ICG-ATS)

A modern, full-stack application tracking system built for Irvine Consulting Group (ICG) at UC Irvine. This system streamlines the recruitment process by managing applications, scheduling interviews, and facilitating communication with applicants.

## Features

### For Applicants
- **Responsive Application Form**: Multi-step form with validation
  - Basic information collection
  - Free-response questions
  - Resume upload
  - Interview time slot selection (minimum 3 slots)
- **Mobile-Optimized**: Fully responsive design for mobile and tablet devices
- **Real-time Validation**: Instant feedback on form inputs

### For Officers (Dashboard)
- **Selection View**: Review and filter applicants
  - Search by name or email
  - Filter by status (Applied, Needs Interview, Scheduled, Completed, Denied)
  - View detailed applicant profiles with FRQ responses and resumes
  - Add internal notes with author tracking
  - Update applicant status with confirmation dialogs

- **Interview Scheduler**: Manage interview assignments
  - Visual capacity tracking for each time slot
  - Drag-and-drop style assignment interface
  - Highlight available slots for selected applicants
  - Mark interviews as completed (individual or batch)
  - Toggle to show/hide completed interviews

- **Email Sendout**: Prepare bulk communications
  - Group recipients by interview slot, acceptance, or rejection
  - Dynamic email templates with variable replacement
  - One-click copy for emails and email bodies
  - Location input for interview notifications

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (Resume uploads)
- **Authentication**: Cookie-based sessions
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to Settings > API
4. Copy the Project URL and anon/public key

## Database Setup

### 1. Create Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Config table (application settings)
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name TEXT NOT NULL DEFAULT 'Current Cycle',
  applications_open BOOLEAN NOT NULL DEFAULT true,
  frq_questions JSONB NOT NULL DEFAULT '[]',
  interview_email_template TEXT,
  rejection_email_template TEXT,
  acceptance_email_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO config (cycle_name, applications_open, frq_questions)
VALUES ('Fall 2024', true, '[]');

-- Officers table (authentication)
CREATE TABLE officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default officer (username: admin, password: password123)
INSERT INTO officers (username, password_hash, display_name)
VALUES ('admin', 'password123', 'Admin User');

-- Time slots table
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  display_label TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample time slots
INSERT INTO time_slots (day_of_week, start_time, end_time, display_label, max_capacity) VALUES
('Monday', '14:00', '15:00', 'Monday 2-3pm', 4),
('Monday', '15:00', '16:00', 'Monday 3-4pm', 4),
('Tuesday', '14:00', '15:00', 'Tuesday 2-3pm', 4),
('Wednesday', '14:00', '15:00', 'Wednesday 2-3pm', 4);

-- Applicants table
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  major TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  resume_url TEXT,
  frq_responses JSONB NOT NULL DEFAULT '[]',
  available_slots TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_slot UUID REFERENCES time_slots(id),
  notes JSONB NOT NULL DEFAULT '[]',
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_assigned_slot ON applicants(assigned_slot);
```

### 2. Set Up Storage

1. Go to Supabase Dashboard > Storage
2. Create a new bucket called `resumes`
3. Set the bucket to **Public** (or configure RLS policies)

#### Storage Policies (if bucket is private):

```sql
-- Allow anyone to upload resumes
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to view resumes
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'resumes');
```

### 3. Row Level Security (RLS)

For production, you should enable RLS and create appropriate policies. For development, you can disable RLS on all tables.

## Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd icg-ats
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.local.example` to `.env.local` (or create the file)
   - Add your Supabase credentials

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Landing page: `http://localhost:3000`
   - Application form: `http://localhost:3000/apply`
   - Officer login: `http://localhost:3000/login`
   - Dashboard: `http://localhost:3000/dashboard` (requires login)

## Default Login Credentials

- **Username**: `admin`
- **Password**: `password123`

⚠️ **IMPORTANT**: Change these credentials in production!

## Project Structure

```
icg-ats/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── apply/
│   │   └── page.tsx            # Application form
│   ├── login/
│   │   └── page.tsx            # Officer login
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout with nav
│   │   ├── page.tsx            # Selection view
│   │   ├── schedule/
│   │   │   └── page.tsx        # Interview scheduler
│   │   └── emails/
│   │       └── page.tsx        # Email sendout
│   └── globals.css             # Global styles & ICG branding
├── lib/
│   ├── auth.ts                 # Authentication helpers
│   └── AUTH_README.md          # Auth system documentation
├── middleware.ts               # Route protection
├── types/
│   └── index.ts               # TypeScript type definitions
└── public/
    └── images/                 # ICG logo and assets
```

## Deployment to Vercel

1. **Push your code to GitHub**

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**:
   - In Vercel project settings > Environment Variables
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-project.vercel.app`

5. **Custom Domain** (Optional):
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## Configuration

### Customizing Email Templates

Email templates support variable replacement:

**Interview Email Variables**:
- `{{slot}}` - Replaced with time slot info (e.g., "Monday 2-3pm (Monday, 14:00-15:00)")
- `{{location}}` - Replaced with officer-provided location

**Example Interview Template**:
```
Dear Applicant,

You have been selected for an interview at {{slot}}.

Location: {{location}}

Please confirm your attendance by replying to this email.

Best regards,
Irvine Consulting Group
```

Update templates in Supabase:
```sql
UPDATE config SET
  interview_email_template = 'Your template here...',
  rejection_email_template = 'Your rejection template...',
  acceptance_email_template = 'Your acceptance template...'
WHERE id = (SELECT id FROM config LIMIT 1);
```

### Adding Free Response Questions

Questions are stored as JSONB in the config table:

```sql
UPDATE config SET frq_questions = '[
  {
    "id": "q1",
    "question": "Why do you want to join ICG?",
    "max_chars": 500
  },
  {
    "id": "q2",
    "question": "Describe a challenging project you worked on.",
    "max_chars": 750
  }
]'::jsonb
WHERE id = (SELECT id FROM config LIMIT 1);
```

### Managing Time Slots

Add new time slots:
```sql
INSERT INTO time_slots (day_of_week, start_time, end_time, display_label, max_capacity)
VALUES ('Thursday', '16:00', '17:00', 'Thursday 4-5pm', 4);
```

Deactivate a time slot:
```sql
UPDATE time_slots SET is_active = false WHERE id = 'slot-uuid';
```

## Application Status Flow

1. **pending** - Initial state after submission
2. **reviewed** - Ready for interview scheduling
3. **interview_scheduled** - Interview time assigned
4. **interview_completed** - Interview finished
5. **rejected** - Application denied

Officers can move applicants between statuses using the dashboard.

## Security Notes

### For Production Deployment:

1. **Use Real Password Hashing**:
   - Replace plain text password comparison with bcrypt/argon2
   - Update the login logic in `app/login/page.tsx`

2. **Implement Session Security**:
   - Use httpOnly cookies
   - Add CSRF protection
   - Implement session expiration/refresh
   - Store sessions in database

3. **Enable RLS on Supabase**:
   - Create policies for each table
   - Restrict officer access appropriately

4. **Add Rate Limiting**:
   - Protect login endpoint
   - Limit form submissions

5. **Environment Variables**:
   - Never commit `.env.local`
   - Use Vercel environment variables
   - Rotate API keys regularly

## Support & Documentation

- **Authentication System**: See `lib/AUTH_README.md`
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

Built for Irvine Consulting Group at UC Irvine with ❤️

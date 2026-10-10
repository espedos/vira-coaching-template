-- Enhanced schema for Coaching Dashboard
-- Run this migration in Supabase after 01_create_tables.sql

-- Update users table to support all roles (COACH, TEACHER, STUDENT)
-- Note: Existing CONSULTANT role can be mapped to COACH

-- Courses/Classes table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  level TEXT CHECK (level IN ('12', 'MEZUN', 'BOTH')),
  type TEXT NOT NULL CHECK (type IN ('GROUP', 'INDIVIDUAL')),
  max_students INTEGER,
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('LIVE', 'RECORDED', 'TEXT')),
  video_url TEXT,
  duration_minutes INTEGER,
  order_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, order_number);

-- Enrollments table (students in courses)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DROPPED')),
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Assignments/Tasks table (for lessons)
CREATE TABLE IF NOT EXISTS lesson_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('HOMEWORK', 'TEST', 'QUIZ', 'EXERCISE')),
  due_date TIMESTAMP WITH TIME ZONE,
  total_points INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON lesson_assignments(lesson_id);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES lesson_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);

-- Lesson Progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  watch_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Appointments/Sessions table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('SESSION', 'MEETING', 'REVIEW')),
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_coach ON appointments(coach_id);
CREATE INDEX IF NOT EXISTS idx_appointments_course ON appointments(course_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Appointment participants (for group sessions)
CREATE TABLE IF NOT EXISTS appointment_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance TEXT DEFAULT 'PENDING' CHECK (attendance IN ('PENDING', 'ATTENDED', 'ABSENT', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_appointment ON appointment_participants(appointment_id);
CREATE INDEX IF NOT EXISTS idx_participants_student ON appointment_participants(student_id);

-- Course Teachers (relationship between teachers and courses)
CREATE TABLE IF NOT EXISTS course_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_course_teachers_course ON course_teachers(course_id);
CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher ON course_teachers(teacher_id);

-- Enable RLS for new tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Courses: Coaches can manage their own courses, students can view enrolled courses
CREATE POLICY "Coaches can manage their courses" ON courses
  FOR ALL USING (auth.uid()::text = coach_id::text)
  WITH CHECK (auth.uid()::text = coach_id::text);

CREATE POLICY "Students can view enrolled courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = courses.id
      AND enrollments.student_id = auth.uid()::uuid
    )
  );

-- Lessons: Visible to enrolled students
CREATE POLICY "Students can view lessons of enrolled courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = lessons.course_id
      AND enrollments.student_id = auth.uid()::uuid
    ) OR
    (SELECT coach_id FROM courses WHERE courses.id = lessons.course_id) = auth.uid()::uuid
  );

-- Enrollments: Students can view their own
CREATE POLICY "Students can view their enrollments" ON enrollments
  FOR SELECT USING (student_id = auth.uid()::uuid);

-- Submissions: Students can view their own, coaches can view all in their courses
CREATE POLICY "Users can view relevant submissions" ON submissions
  FOR SELECT USING (
    student_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM lesson_assignments la
      JOIN lessons l ON l.id = la.lesson_id
      JOIN courses c ON c.id = l.course_id
      WHERE la.id = submissions.assignment_id
      AND c.coach_id = auth.uid()::uuid
    )
  );

-- Lesson Progress: Students can update their own
CREATE POLICY "Students can track their progress" ON lesson_progress
  FOR ALL USING (student_id = auth.uid()::uuid)
  WITH CHECK (student_id = auth.uid()::uuid);

-- Appointments: Visible to coach and participants
CREATE POLICY "Users can view relevant appointments" ON appointments
  FOR SELECT USING (
    coach_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM appointment_participants
      WHERE appointment_id = appointments.id
      AND student_id = auth.uid()::uuid
    )
  );

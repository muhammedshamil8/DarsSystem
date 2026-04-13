-- Dars Management System Schema

-- 1. Users (Auth handled by Supabase, but we can have a profile table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher')) DEFAULT 'teacher'
);

-- 2. Dars (Institution)
CREATE TABLE IF NOT EXISTS public.dars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  usthad_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  place TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Batches (Max 7 per Dars)
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dars_id UUID REFERENCES public.dars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subjects (Max 12 per Dars)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dars_id UUID REFERENCES public.dars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BatchSubject (Classes)
CREATE TABLE IF NOT EXISTS public.batch_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  UNIQUE(batch_id, subject_id)
);

-- 7. BatchStudents
CREATE TABLE IF NOT EXISTS public.batch_students (
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (batch_id, student_id)
);

-- 8. Sessions (Core Engine)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_subject_id UUID REFERENCES public.batch_subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hijri_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Sub-Modules

-- 9. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  UNIQUE(session_id, student_id)
);

-- 10. Homework (Assignment - Class persistent)
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_subject_id UUID REFERENCES public.batch_subjects(id) ON DELETE CASCADE,
  description TEXT,
  due_date DATE,
  UNIQUE(batch_subject_id)
);

-- 11. Homework Status (Completion check)
CREATE TABLE IF NOT EXISTS public.homework_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('completed', 'half', 'not_done')),
  UNIQUE(session_id, student_id)
);

-- 12. Evaluation
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  performance TEXT CHECK (performance IN ('perfect', 'tried', 'failed')),
  UNIQUE(session_id, student_id)
);

-- 13. Notes (Class persistent)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_subject_id UUID REFERENCES public.batch_subjects(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Exams
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_subject_id UUID REFERENCES public.batch_subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL
);

-- 15. Exam Results
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  marks NUMERIC,
  UNIQUE(exam_id, student_id)
);

-- CONSTRAINTS (Triggers for Max limits)

CREATE OR REPLACE FUNCTION check_batch_limit() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.batches WHERE dars_id = NEW.dars_id) >= 7 THEN
    RAISE EXCEPTION 'Maximum 7 batches allowed per Dars';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_batch_limit
BEFORE INSERT ON public.batches
FOR EACH ROW EXECUTE FUNCTION check_batch_limit();

CREATE OR REPLACE FUNCTION check_subject_limit() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.subjects WHERE dars_id = NEW.dars_id) >= 12 THEN
    RAISE EXCEPTION 'Maximum 12 subjects allowed per Dars';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_subject_limit
BEFORE INSERT ON public.subjects
FOR EACH ROW EXECUTE FUNCTION check_subject_limit();

-- 03: Roles (COACH / TEACHER / STUDENT), automatic profile creation, and RLS policies
-- Run after 01 and 02. Safe to re-run.

-- ---------- Roles ----------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role = 'COACH' WHERE role = 'CONSULTANT';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('COACH', 'TEACHER', 'STUDENT'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_score TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS field TEXT CHECK (field IN ('SAY', 'EA', 'SOZ', 'DIL'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- ---------- Helper functions (map auth.uid() -> users row) ----------
CREATE OR REPLACE FUNCTION public.app_uid() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.app_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role IN ('COACH', 'TEACHER') FROM public.users WHERE auth_id = auth.uid()), FALSE)
$$;

-- ---------- Auto-create profile when someone signs up ----------
-- Self sign-up can only create STUDENT or TEACHER. COACH is granted by an existing coach (or via SQL).
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta_role TEXT := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'));
  meta_grade TEXT := NEW.raw_user_meta_data->>'grade';
BEGIN
  IF meta_role NOT IN ('STUDENT', 'TEACHER') THEN meta_role := 'STUDENT'; END IF;
  IF meta_grade NOT IN ('12', 'MEZUN') THEN meta_grade := NULL; END IF;

  INSERT INTO public.users (auth_id, email, name, role, grade, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    meta_role,
    CASE WHEN meta_role = 'STUDENT' THEN meta_grade ELSE NULL END,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prevent users from promoting themselves (only a coach, or SQL editor, can change roles)
CREATE OR REPLACE FUNCTION public.guard_role_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL AND public.app_role() IS DISTINCT FROM 'COACH' THEN
    RAISE EXCEPTION 'Only a coach can change roles';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_guard_role ON users;
CREATE TRIGGER users_guard_role BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.guard_role_change();

-- ---------- Drop old (broken) policies ----------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

-- ---------- users ----------
CREATE POLICY users_select ON users FOR SELECT TO authenticated
  USING (auth_id = auth.uid() OR public.is_staff() OR role IN ('COACH', 'TEACHER'));
CREATE POLICY users_update_self ON users FOR UPDATE TO authenticated
  USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
CREATE POLICY users_update_coach ON users FOR UPDATE TO authenticated
  USING (public.app_role() = 'COACH') WITH CHECK (public.app_role() = 'COACH');

-- ---------- courses ----------
CREATE POLICY courses_select ON courses FOR SELECT TO authenticated
  USING (is_active OR public.is_staff());
CREATE POLICY courses_write ON courses FOR ALL TO authenticated
  USING (public.app_role() = 'COACH') WITH CHECK (public.app_role() = 'COACH');

-- ---------- course_teachers ----------
CREATE POLICY course_teachers_select ON course_teachers FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY course_teachers_write ON course_teachers FOR ALL TO authenticated
  USING (public.app_role() = 'COACH') WITH CHECK (public.app_role() = 'COACH');

-- ---------- lessons ----------
CREATE POLICY lessons_select ON lessons FOR SELECT TO authenticated
  USING (public.is_staff() OR EXISTS (
    SELECT 1 FROM enrollments e WHERE e.course_id = lessons.course_id AND e.student_id = public.app_uid()));
CREATE POLICY lessons_write ON lessons FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------- enrollments ----------
CREATE POLICY enrollments_select ON enrollments FOR SELECT TO authenticated
  USING (student_id = public.app_uid() OR public.is_staff());
CREATE POLICY enrollments_self_enroll ON enrollments FOR INSERT TO authenticated
  WITH CHECK (student_id = public.app_uid());
CREATE POLICY enrollments_staff ON enrollments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------- lesson_assignments ----------
CREATE POLICY assignments_select ON lesson_assignments FOR SELECT TO authenticated
  USING (public.is_staff() OR EXISTS (
    SELECT 1 FROM lessons l JOIN enrollments e ON e.course_id = l.course_id
    WHERE l.id = lesson_assignments.lesson_id AND e.student_id = public.app_uid()));
CREATE POLICY assignments_write ON lesson_assignments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------- submissions ----------
CREATE POLICY submissions_select ON submissions FOR SELECT TO authenticated
  USING (student_id = public.app_uid() OR public.is_staff());
CREATE POLICY submissions_student_insert ON submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = public.app_uid());
CREATE POLICY submissions_student_update ON submissions FOR UPDATE TO authenticated
  USING (student_id = public.app_uid() AND score IS NULL) WITH CHECK (student_id = public.app_uid());
CREATE POLICY submissions_staff ON submissions FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------- lesson_progress ----------
CREATE POLICY progress_own ON lesson_progress FOR ALL TO authenticated
  USING (student_id = public.app_uid()) WITH CHECK (student_id = public.app_uid());
CREATE POLICY progress_staff ON lesson_progress FOR SELECT TO authenticated USING (public.is_staff());

-- ---------- appointments ----------
CREATE POLICY appointments_select ON appointments FOR SELECT TO authenticated
  USING (public.is_staff() OR EXISTS (
    SELECT 1 FROM appointment_participants p WHERE p.appointment_id = appointments.id AND p.student_id = public.app_uid()));
CREATE POLICY appointments_write ON appointments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY participants_select ON appointment_participants FOR SELECT TO authenticated
  USING (student_id = public.app_uid() OR public.is_staff());
CREATE POLICY participants_write ON appointment_participants FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------- messages ----------
CREATE POLICY messages_select ON messages FOR SELECT TO authenticated
  USING (sender_id = public.app_uid() OR receiver_id = public.app_uid());
CREATE POLICY messages_insert ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = public.app_uid());
CREATE POLICY messages_mark_read ON messages FOR UPDATE TO authenticated
  USING (receiver_id = public.app_uid()) WITH CHECK (receiver_id = public.app_uid());

-- ---------- notifications ----------
CREATE POLICY notifications_own ON notifications FOR SELECT TO authenticated USING (user_id = public.app_uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE TO authenticated USING (user_id = public.app_uid());
CREATE POLICY notifications_staff_insert ON notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff());

-- ---------- tasks / deficiencies / schedule_blocks (student plan; staff can manage) ----------
CREATE POLICY tasks_own ON tasks FOR ALL TO authenticated
  USING (user_id = public.app_uid() OR public.is_staff()) WITH CHECK (user_id = public.app_uid() OR public.is_staff());
CREATE POLICY deficiencies_own ON deficiencies FOR ALL TO authenticated
  USING (user_id = public.app_uid() OR public.is_staff()) WITH CHECK (user_id = public.app_uid() OR public.is_staff());
CREATE POLICY schedule_blocks_own ON schedule_blocks FOR ALL TO authenticated
  USING (user_id = public.app_uid() OR public.is_staff()) WITH CHECK (user_id = public.app_uid() OR public.is_staff());

-- ---------- Realtime for chat ----------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Mail, MessageSquare, Phone, Target } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import ProgressReport from '@/components/ProgressReport';
import { Avatar, Badge, EmptyState, LoadingBlock } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { loadStudentOverview, type StudentOverview } from '@/lib/data';
import type { Profile } from '@/types';

export default function StudentDetail() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const [student, setStudent] = useState<Profile | null | undefined>(undefined);
  const [data, setData] = useState<StudentOverview | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setStudent((data as Profile) ?? null));
    loadStudentOverview(id).then(setData);
  }, [id]);

  return (
    <AppLayout title={student?.name ?? 'Öğrenci'} roles={['COACH', 'TEACHER']}>
      <Link href="/ogrenciler" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Öğrenciler
      </Link>
      {student === undefined ? (
        <LoadingBlock />
      ) : student === null ? (
        <div className="card">
          <EmptyState icon={Target} title="Öğrenci bulunamadı" />
        </div>
      ) : (
        <>
          <div className="card mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <Avatar name={student.name} size="lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                <Badge tone={student.grade === 'MEZUN' ? 'violet' : 'indigo'}>{student.grade === 'MEZUN' ? 'Mezun' : '12. sınıf'}</Badge>
                {student.field && <Badge tone="sky">{student.field}</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {student.phone}
                  </span>
                )}
                {student.target_score && (
                  <span className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" /> Hedef: {student.target_score}
                  </span>
                )}
              </div>
            </div>
            <Link href={`/mesajlar?kisi=${student.id}`} className="btn-primary">
              <MessageSquare className="h-4 w-4" /> Mesaj gönder
            </Link>
          </div>
          {data ? <ProgressReport data={data} /> : <LoadingBlock />}
        </>
      )}
    </AppLayout>
  );
}

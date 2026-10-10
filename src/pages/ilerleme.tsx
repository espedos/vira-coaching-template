import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ProgressReport from '@/components/ProgressReport';
import { LoadingBlock, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { loadStudentOverview, type StudentOverview } from '@/lib/data';

export default function Progress() {
  const { profile } = useAuth();
  const [data, setData] = useState<StudentOverview | null>(null);

  useEffect(() => {
    if (profile) loadStudentOverview(profile.id).then(setData);
  }, [profile]);

  return (
    <AppLayout title="İlerlemem" roles={['STUDENT']}>
      <PageHeader title="İlerleme raporum" description="Ders tamamlama, ödev teslimi ve puan gelişimin." />
      {data ? <ProgressReport data={data} /> : <LoadingBlock />}
    </AppLayout>
  );
}

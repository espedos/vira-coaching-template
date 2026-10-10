const SUBJECT_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-fuchsia-600',
];

export const courseGradient = (subject: string) =>
  SUBJECT_COLORS[subject.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % SUBJECT_COLORS.length];

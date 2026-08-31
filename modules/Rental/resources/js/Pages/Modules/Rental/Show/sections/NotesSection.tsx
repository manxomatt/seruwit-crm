import { useTrans } from '@/hooks/useTrans';
import { SectionCard } from '../../ShowUi';

interface Props {
    notes: string;
}

export default function NotesSection({ notes }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.notes', undefined, 'Catatan & Instruksi Khusus')} icon="📝">
            <p className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {notes}
            </p>
        </SectionCard>
    );
}

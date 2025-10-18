import PageLayout from '../../layouts/PageLayout';
import { FormsTable } from './components/FormsTable';
import { useMyFormsController } from './useMyFormsController';

export default function MyForms() {
  const {
    forms,
    isLoadingForms,
  } = useMyFormsController();

  return (
    <PageLayout
      title="Meus formulários"
      subtitle="Gerencie seus formulários"
    >
      <FormsTable
        isLoading={isLoadingForms}
        forms={forms}
      />
    </PageLayout>
  );
}

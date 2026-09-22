import { Button } from '@monorepo/ui';
import { CirclePlusIcon } from 'lucide-react';

import { useModal } from '@/app/hooks/useModal';
import { SaveFormDetailsModal } from '@/views/pages/FormBuilder/components/SaveFormDetailsModal';

import PageLayout from '../../layouts/PageLayout';
import { HomeEmptyState } from './components/HomeEmptyState';
import { HomeStats } from './components/HomeStats';
import { NoResponsesCallout } from './components/NoResponsesCallout';
import { RecentFormsList } from './components/RecentFormsList';
import { TopFormsList } from './components/TopFormsList';
import { useHomeController } from './useHomeController';

export default function Home() {
  const { open } = useModal();
  const {
    isLoadingForms,
    isEmpty,
    totalForms,
    totalResponses,
    publishedCount,
    draftCount,
    recentForms,
    topRespondedForms,
    topAccessedForms,
    noResponseForms,
  } = useHomeController();

  function handleCreateForm() {
    open(<SaveFormDetailsModal />);
  }

  return (
    <PageLayout
      title="Bem-vindo ao Collectshare"
      subtitle="Sua plataforma de formulários para compartilhar e colaborar"
    >
      {isLoadingForms && <p>Carregando...</p>}

      {!isLoadingForms && isEmpty && (
        <HomeEmptyState onCreateForm={handleCreateForm} />
      )}

      {!isLoadingForms && !isEmpty && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button type="button" onClick={handleCreateForm}>
              <CirclePlusIcon />
              Novo formulário
            </Button>
          </div>

          <HomeStats
            totalForms={totalForms}
            totalResponses={totalResponses}
            publishedCount={publishedCount}
            draftCount={draftCount}
          />

          {!!noResponseForms.length && <NoResponsesCallout forms={noResponseForms} />}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecentFormsList forms={recentForms} />

            {!!topRespondedForms.length && (
              <TopFormsList
                title="Mais respondidos"
                forms={topRespondedForms}
                metric="submissionCount"
                metricLabel="respostas"
              />
            )}

            {!!topAccessedForms.length && (
              <TopFormsList
                title="Mais acessados no portal"
                forms={topAccessedForms}
                metric="clickCount"
                metricLabel="acessos"
              />
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

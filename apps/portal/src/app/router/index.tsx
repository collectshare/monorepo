import { Route, Routes } from 'react-router-dom';

import { PortalLayout } from '@/views/layouts/PortalLayout';
import { ApiDocs } from '@/views/pages/ApiDocs';
import { Dataset } from '@/views/pages/Dataset';
import { Home } from '@/views/pages/Home';

export function Router() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dataset/:formId" element={<Dataset />} />
        <Route path="/api-docs" element={<ApiDocs />} />
      </Route>
    </Routes>
  );
}

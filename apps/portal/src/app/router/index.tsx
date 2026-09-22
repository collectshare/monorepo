import { Route, Routes } from 'react-router-dom';

import { PortalLayout } from '@/views/layouts/PortalLayout';
import { Dataset } from '@/views/pages/Dataset';
import { Home } from '@/views/pages/Home';

export function Router() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dataset/:formId" element={<Dataset />} />
      </Route>
    </Routes>
  );
}

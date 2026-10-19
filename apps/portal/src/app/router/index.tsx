import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { PortalLayout } from '@/views/layouts/PortalLayout';
import { About } from '@/views/pages/About';
import { Dataset } from '@/views/pages/Dataset';
import { Home } from '@/views/pages/Home';
import { McpGuide } from '@/views/pages/McpGuide';

// Scalar is heavy; keep it out of the main bundle.
const ApiDocs = lazy(() => import('@/views/pages/ApiDocs').then((m) => ({ default: m.ApiDocs })));

export function Router() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dataset/:formId" element={<Dataset />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/mcp" element={<McpGuide />} />
        <Route path="/api-docs" element={<Suspense><ApiDocs /></Suspense>} />
      </Route>
    </Routes>
  );
}

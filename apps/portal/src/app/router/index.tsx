import { Route, Routes } from 'react-router-dom';

import { Dataset } from '@/views/pages/Dataset';
import { Home } from '@/views/pages/Home';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dataset/:formId" element={<Dataset />} />
    </Routes>
  );
}

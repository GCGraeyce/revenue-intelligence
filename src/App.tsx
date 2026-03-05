import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from '@/contexts/RoleContext';
import { SalesTargetProvider } from '@/contexts/SalesTargetContext';
import { ProductFilterProvider } from '@/contexts/ProductFilterContext';
import { ScoringConfigProvider } from '@/contexts/ScoringConfigContext';
import { CRMProvider } from '@/contexts/CRMContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Route-level code splitting: each page loads only when navigated to
const Index = lazy(() => import('./pages/Index'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Deals = lazy(() => import('./pages/Deals'));
const DealDetail = lazy(() => import('./pages/DealDetail'));
const Coaching = lazy(() => import('./pages/Coaching'));
const Team = lazy(() => import('./pages/Team'));
const Risk = lazy(() => import('./pages/Risk'));
const ModelHealth = lazy(() => import('./pages/ModelHealth'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const ZohoAdmin = lazy(() => import('./pages/ZohoAdmin'));
const Trust = lazy(() => import('./pages/Trust'));
const Automations = lazy(() => import('./pages/Automations'));
const MeetingPrep = lazy(() => import('./pages/MeetingPrep'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <RoleProvider>
          <SalesTargetProvider>
            <ProductFilterProvider>
              <ScoringConfigProvider>
                <CRMProvider>
                  <Toaster />
                  <Sonner />
                  <ErrorBoundary>
                    <BrowserRouter>
                      <Layout>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/pipeline" element={<Pipeline />} />
                            <Route path="/deals" element={<Deals />} />
                            <Route path="/deals/:id" element={<DealDetail />} />
                            <Route path="/coaching" element={<Coaching />} />
                            <Route path="/team" element={<Team />} />
                            <Route path="/risk" element={<Risk />} />
                            <Route path="/model" element={<ModelHealth />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/admin/zoho" element={<ZohoAdmin />} />
                            <Route path="/trust" element={<Trust />} />
                            <Route path="/automations" element={<Automations />} />
                            <Route path="/meeting-prep" element={<MeetingPrep />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </Layout>
                    </BrowserRouter>
                  </ErrorBoundary>
                </CRMProvider>
              </ScoringConfigProvider>
            </ProductFilterProvider>
          </SalesTargetProvider>
        </RoleProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;

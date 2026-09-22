import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router';
import AuthLayout from './components/layout/AuthLayout.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import FullPageLoader from './components/ui/FullPageLoader.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import GuestRoute from './routes/GuestRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Explore from './pages/public/Explore.jsx';
import Landing from './pages/public/Landing.jsx';
import Login from './pages/public/Login.jsx';
import NotFound from './pages/public/NotFound.jsx';
import ProjectDetails from './pages/public/ProjectDetails.jsx';
import Register from './pages/public/Register.jsx';
import Dashboard from './pages/app/Dashboard.jsx';
import MyProjects from './pages/app/MyProjects.jsx';

// Larger, less-visited screens load on demand.
const EditProfile = lazy(() => import('./pages/app/EditProfile.jsx'));
const CreateProject = lazy(() => import('./pages/app/CreateProject.jsx'));
const EditProject = lazy(() => import('./pages/app/EditProject.jsx'));
const AdminSkills = lazy(() => import('./pages/admin/AdminSkills.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Landing />} />
            <Route path="explore" element={<Explore />} />
            <Route path="projects/:id" element={<ProjectDetails />} />

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="my-projects" element={<MyProjects />} />
              <Route path="projects/new" element={<CreateProject />} />
              <Route path="projects/:id/edit" element={<EditProject />} />
              <Route element={<AdminRoute />}>
                <Route path="admin/skills" element={<AdminSkills />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontSize: '0.875rem' } }} />
    </BrowserRouter>
  );
}

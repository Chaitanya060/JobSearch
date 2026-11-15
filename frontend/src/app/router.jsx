import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout, UserLayout, AdminLayout } from '../components/layout/Layouts.jsx'
import { ProtectedRoute, AdminRoute } from '../features/auth/ProtectedRoute.jsx'

import Landing from '../pages/public/Landing.jsx'
import PublicJobs from '../pages/public/PublicJobs.jsx'
import PublicJobDetail from '../pages/public/PublicJobDetail.jsx'
import Privacy from '../pages/public/Privacy.jsx'
import Terms from '../pages/public/Terms.jsx'
import Contact from '../pages/public/Contact.jsx'
import NotFound from '../pages/public/NotFound.jsx'

import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import ForgotPassword from '../pages/auth/ForgotPassword.jsx'
import Onboarding from '../pages/onboarding/Onboarding.jsx'

import Dashboard from '../pages/app/Dashboard.jsx'
import FindJobs from '../pages/app/FindJobs.jsx'
import JobDetail from '../pages/app/JobDetail.jsx'
import Recommendations from '../pages/app/Recommendations.jsx'
import SavedJobs from '../pages/app/SavedJobs.jsx'
import Applications from '../pages/app/Applications.jsx'
import ApplicationDetail from '../pages/app/ApplicationDetail.jsx'
import Resumes from '../pages/app/Resumes.jsx'
import Profile from '../pages/app/Profile.jsx'
import Preferences from '../pages/app/Preferences.jsx'
import Settings from '../pages/app/Settings.jsx'

import AdminOverview from '../pages/admin/AdminOverview.jsx'
import AdminSources from '../pages/admin/AdminSources.jsx'
import AdminBoardTargets from '../pages/admin/AdminBoardTargets.jsx'
import AdminCollectionRuns from '../pages/admin/AdminCollectionRuns.jsx'
import AdminJobs from '../pages/admin/AdminJobs.jsx'
import AdminUsers from '../pages/admin/AdminUsers.jsx'
import AdminSystemHealth from '../pages/admin/AdminSystemHealth.jsx'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/jobs', element: <PublicJobs /> },
      { path: '/jobs/:jobId', element: <PublicJobDetail /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/contact', element: <Contact /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/onboarding', element: <Onboarding /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: '/app', element: <Dashboard /> },
          { path: '/app/jobs', element: <FindJobs /> },
          { path: '/app/jobs/:jobId', element: <JobDetail /> },
          { path: '/app/recommendations', element: <Recommendations /> },
          { path: '/app/saved-jobs', element: <SavedJobs /> },
          { path: '/app/applications', element: <Applications /> },
          { path: '/app/applications/:applicationId', element: <ApplicationDetail /> },
          { path: '/app/resumes', element: <Resumes /> },
          { path: '/app/profile', element: <Profile /> },
          { path: '/app/preferences', element: <Preferences /> },
          { path: '/app/settings', element: <Settings /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminOverview /> },
          { path: '/admin/sources', element: <AdminSources /> },
          { path: '/admin/board-targets', element: <AdminBoardTargets /> },
          { path: '/admin/collection-runs', element: <AdminCollectionRuns /> },
          { path: '/admin/jobs', element: <AdminJobs /> },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/system-health', element: <AdminSystemHealth /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

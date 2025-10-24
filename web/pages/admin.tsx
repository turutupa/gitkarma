import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Admin from '@/modules/Admin/Admin';

const ProtectedAdmin = () => {
  return (
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  );
};

(ProtectedAdmin as any).meta = {
  title: 'Admin',
  description: 'Manage your GitKarma instance, view analytics, and configure repository settings.',
};

export default ProtectedAdmin;

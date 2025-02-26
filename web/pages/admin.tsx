import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Admin from '@/modules/Admin/Admin';

const ProtectedAdmin = () => {
  return (
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  );
};

export default ProtectedAdmin;

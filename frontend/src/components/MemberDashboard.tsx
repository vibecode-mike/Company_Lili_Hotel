import MemberManagementPage from '../features/members/MemberManagementPage';
import Layout from './Layout';

export default function MemberDashboard() {
  return (
    <Layout activeSection="members">
      <MemberManagementPage />
    </Layout>
  );
}

import MemberManagementPage from '../features/members/MemberManagementPage';
import Layout from './Layout';

interface MemberDashboardProps {
  onShowMessages: () => void;
  onShowMembers?: () => void;
  onShowAutoResponse?: () => void;
}

export default function MemberDashboard({
  onShowMessages,
  onShowMembers = () => {},
  onShowAutoResponse = () => {}
}: MemberDashboardProps) {
  return (
    <Layout
      activeSection="members"
      onShowMessages={onShowMessages}
      onShowAutoResponse={onShowAutoResponse}
      onShowMembers={onShowMembers}
    >
      <MemberManagementPage />
    </Layout>
  );
}

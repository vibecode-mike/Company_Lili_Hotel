import StaffUsersManagement from "../components/StaffUsersManagement";
import { useNavigation } from "../contexts/NavigationContext";

export default function StaffUsersPage() {
  const { navigate } = useNavigation();
  return (
    <StaffUsersManagement
      onNavigateToMessages={() => navigate("message-list")}
      onNavigateToAutoReply={() => navigate("auto-reply")}
      onNavigateToMembers={() => navigate("member-management")}
      onNavigateToSettings={() => navigate("line-api-settings")}
      onNavigateToInsights={() => navigate("insights")}
    />
  );
}

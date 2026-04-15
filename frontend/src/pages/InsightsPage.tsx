import InsightsPanel from "../components/InsightsPanel";
import { useNavigation } from "../contexts/NavigationContext";

/**
 * 數據洞察頁面
 */
export default function InsightsPage() {
  const { navigate } = useNavigation();

  return (
    <InsightsPanel
      onNavigateToMessages={() => navigate("message-list")}
      onNavigateToAutoReply={() => navigate("auto-reply")}
      onNavigateToMembers={() => navigate("member-management")}
      onNavigateToSettings={() => navigate("line-api-settings")}
    />
  );
}

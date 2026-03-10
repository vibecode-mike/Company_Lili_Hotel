import PMSIntegration from "../components/PMSIntegration";
import { useNavigation } from "../contexts/NavigationContext";

/**
 * PMS 串接頁面
 */
export default function PMSPage() {
  const { navigate } = useNavigation();

  return (
    <PMSIntegration
      onNavigateToMessages={() => navigate("message-list")}
      onNavigateToAutoReply={() => navigate("auto-reply")}
      onNavigateToMembers={() => navigate("member-management")}
      onNavigateToSettings={() => navigate("line-api-settings")}
      onNavigateToAIChatbot={() => navigate("ai-chatbot")}
    />
  );
}

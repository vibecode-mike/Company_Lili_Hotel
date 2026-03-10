import AIChatbotOverview from "../components/AIChatbotOverview";
import { useNavigation } from "../contexts/NavigationContext";

/**
 * AI Chatbot 總覽頁面
 */
export default function AIChatbotPage() {
  const { navigate } = useNavigation();

  return (
    <AIChatbotOverview
      onNavigateToMessages={() => navigate("message-list")}
      onNavigateToAutoReply={() => navigate("auto-reply")}
      onNavigateToMembers={() => navigate("member-management")}
      onNavigateToSettings={() => navigate("line-api-settings")}
      onNavigateToPMS={() => navigate("pms")}
      onNavigateToFacilities={() => navigate("facilities")}
    />
  );
}

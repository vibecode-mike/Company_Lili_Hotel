import FacilitiesContent from "../components/FacilitiesContent";
import { useNavigation } from "../contexts/NavigationContext";

/**
 * 設施內頁 — AI Chatbot > 設施
 */
export default function FacilitiesPage() {
  const { navigate } = useNavigation();

  return (
    <FacilitiesContent
      onNavigateToMessages={() => navigate("message-list")}
      onNavigateToAutoReply={() => navigate("auto-reply")}
      onNavigateToMembers={() => navigate("member-management")}
      onNavigateToSettings={() => navigate("line-api-settings")}
      onNavigateToAIChatbot={() => navigate("ai-chatbot")}
    />
  );
}

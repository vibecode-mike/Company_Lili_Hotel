import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// 切廚房：改用 live Tailwind 編譯（globals.css 內 @import "tailwindcss"），
// 不再載入預編譯的靜態 ./index.css。手寫規則（捲軸 / .row-divider 表格分隔線）已稽核搬入 globals.css。
import "./styles/globals.css";

// Patch removeChild to handle Radix UI Portal cleanup issues
// Suppresses "node is not a child" errors while ensuring proper cleanup
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function<T extends Node>(child: T): T {
  try {
    return originalRemoveChild.call(this, child) as T;
  } catch (error) {
    // Handle "node is not a child" error
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      // Try to remove from actual parent if exists
      if (child.parentNode && child.parentNode !== this) {
        try {
          return originalRemoveChild.call(child.parentNode, child) as T;
        } catch {
          // Silently ignore
        }
      }
      // Return child without throwing
      return child;
    }
    // Re-throw other errors
    throw error;
  }
};

createRoot(document.getElementById("root")!).render(<App />);

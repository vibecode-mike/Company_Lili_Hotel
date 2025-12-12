import { FlexBubble } from "./fb-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Upload, Info, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface FBConfigPanelProps {
  bubble: FlexBubble;
  onChange: (bubble: FlexBubble) => void;
  bubbleIndex: number;
  allBubbles: FlexBubble[];
  onUpdateAllBubbles: (bubbles: FlexBubble[]) => void;
  onDuplicateBubble: () => void;
  canDuplicate: boolean;
}

export function FBConfigPanel({ bubble, onChange, bubbleIndex, allBubbles, onUpdateAllBubbles, onDuplicateBubble, canDuplicate }: FBConfigPanelProps) {
  const isFirstBubble = bubbleIndex === 0;
  // Helper function to check if there's any content (text or buttons)
  const hasAnyContent = (bubbleData: FlexBubble) => {
    // Check if there's any text content (title or subtitle)
    const hasBodyContent = bubbleData.body?.contents?.some((c: any) =>
      c.type === "text" && c.text && c.text.trim() !== ""
    );

    // Check if there are any buttons
    const hasButtons = bubbleData.footer?.contents?.some((c: any) => c.type === "button");

    return hasBodyContent || hasButtons;
  };

  // Check visibility states
  const hasHero = !!bubble.hero;
  const hasHeroAction = !!bubble.hero?.action;

  // Get text elements (title and subtitle) - identify by their properties
  const allTextElements = bubble.body?.contents.filter((c: any) => c.type === "text") || [];
  const titleElement = allTextElements.find((c: any) => c.size === "xl" && c.weight === "bold");
  const subtitleElement = allTextElements.find((c: any) => c.size === "sm" && c.color === "#666666");

  const hasTitle = !!titleElement;
  const hasSubtitle = !!subtitleElement;
  const buttons = bubble.footer?.contents.filter((c: any) => c.type === "button") || [];

  // Get values - subtitle might contain price with newline
  const heroUrl = bubble.hero?.url || "";
  const heroActionUrl = bubble.hero?.action?.uri || "";
  const heroActionLabel = bubble._metadata?.heroActionLabel || "";
  const heroActionType = (bubble._metadata as any)?.heroActionType || "url";
  const heroActionPayload = (bubble._metadata as any)?.heroActionPayload || "";
  const titleText = titleElement?.text || "";
  const fullSubtitleText = subtitleElement?.text || "";

  // Parse subtitle and price from the combined text
  const subtitleParts = fullSubtitleText.split('\n');
  const subtitleText = subtitleParts[0] || "";
  const priceText = subtitleParts.length > 1 ? subtitleParts.slice(1).join('\n') : "";
  const hasPrice = priceText.trim() !== "";

  const updateHeroUrl = (url: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));

    // Set aspect ratio based on content: 1.91:1 with any content, 1:1 without
    const aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";

    if (!newBubble.hero) {
      newBubble.hero = {
        type: "image",
        url,
        size: "full",
        aspectRatio,
        aspectMode: "cover",
      };
    } else {
      newBubble.hero = {
        ...newBubble.hero,
        url,
        aspectRatio,
      };
    }
    onChange(newBubble);
  };

  const toggleHeroAction = (checked: boolean) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.hero) return;

    if (checked) {
      newBubble.hero.action = {
        type: "uri",
        uri: "https://example.com",
      };
    } else {
      delete newBubble.hero.action;
    }
    onChange(newBubble);
  };

  const updateHeroActionUrl = (url: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.hero || !newBubble.hero.action) return;

    newBubble.hero.action = {
      ...newBubble.hero.action,
      uri: url,
    };
    onChange(newBubble);
  };

  const updateHeroActionLabel = (label: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble._metadata) {
      newBubble._metadata = {};
    }
    newBubble._metadata.heroActionLabel = label;
    onChange(newBubble);
  };

  const updateHeroActionType = (type: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble._metadata) {
      newBubble._metadata = {};
    }
    (newBubble._metadata as any).heroActionType = type;
    onChange(newBubble);
  };

  const updateHeroActionPayload = (payload: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble._metadata) {
      newBubble._metadata = {};
    }
    (newBubble._metadata as any).heroActionPayload = payload;
    onChange(newBubble);
  };

  const toggleHero = (checked: boolean) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (checked && !newBubble.hero) {
      const aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";

      newBubble.hero = {
        type: "image",
        url: "figma:asset/dd1cae23a78d80f364028895e8ce0c1f6db63e64.png",
        size: "full",
        aspectRatio,
        aspectMode: "cover",
      };
    } else if (!checked) {
      delete newBubble.hero;
    }
    onChange(newBubble);
  };

  const updateTitle = (text: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.body) {
      newBubble.body = {
        type: "box",
        layout: "vertical",
        contents: [],
      };
    }

    // Find the title (identified by size: "xl" and weight: "bold")
    const titleIndex = newBubble.body.contents.findIndex((c: any) =>
      c.type === "text" && c.size === "xl" && c.weight === "bold"
    );

    if (titleIndex !== -1) {
      newBubble.body.contents[titleIndex] = {
        ...newBubble.body.contents[titleIndex],
        text,
      };
    } else {
      // Insert at the beginning
      newBubble.body.contents.unshift({
        type: "text",
        text,
        weight: "bold",
        size: "xl",
      });
    }

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    onChange(newBubble);
  };

  const updateSubtitle = (text: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.body) {
      newBubble.body = {
        type: "box",
        layout: "vertical",
        contents: [],
      };
    }

    // Find subtitle (identified by size: "sm" and color: "#666666")
    const subtitleIndex = newBubble.body.contents.findIndex((c: any) =>
      c.type === "text" && c.size === "sm" && c.color === "#666666"
    );

    if (subtitleIndex !== -1) {
      // Get current price text from existing subtitle
      const currentFullText = newBubble.body.contents[subtitleIndex].text || "";
      const currentParts = currentFullText.split('\n');
      const currentPrice = currentParts.length > 1 ? currentParts.slice(1).join('\n') : "";

      // Combine new subtitle with existing price (if any)
      const combinedText = currentPrice ? `${text}\n${currentPrice}` : text;

      newBubble.body.contents[subtitleIndex] = {
        ...newBubble.body.contents[subtitleIndex],
        text: combinedText,
      };
    } else {
      // Insert subtitle after title if exists, otherwise at beginning
      const titleIndex = newBubble.body.contents.findIndex((c: any) =>
        c.type === "text" && c.size === "xl" && c.weight === "bold"
      );
      const insertIndex = titleIndex !== -1 ? titleIndex + 1 : 0;

      newBubble.body.contents.splice(insertIndex, 0, {
        type: "text",
        text,
        wrap: true,
        color: "#666666",
        size: "sm",
        margin: "md",
      });
    }

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    onChange(newBubble);
  };

  const updatePrice = (text: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.body) return;

    // Find subtitle (identified by size: "sm" and color: "#666666")
    const subtitleIndex = newBubble.body.contents.findIndex((c: any) =>
      c.type === "text" && c.size === "sm" && c.color === "#666666"
    );

    if (subtitleIndex !== -1) {
      // Get current subtitle text
      const currentFullText = newBubble.body.contents[subtitleIndex].text || "";
      const currentParts = currentFullText.split('\n');
      const currentSubtitle = currentParts[0] || "";

      // Combine subtitle with new price
      const combinedText = text ? `${currentSubtitle}\n${text}` : currentSubtitle;

      newBubble.body.contents[subtitleIndex] = {
        ...newBubble.body.contents[subtitleIndex],
        text: combinedText,
      };

      onChange(newBubble);
    }
  };

  const togglePrice = (checked: boolean) => {
    if (!isFirstBubble) return; // Only allow toggling on first bubble

    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.body) {
      newBubble.body = {
        type: "box",
        layout: "vertical",
        contents: [],
      };
    }

    // Get current subtitle text
    const textIndices: number[] = [];
    newBubble.body.contents.forEach((c: any, idx: number) => {
      if (c.type === "text") {
        textIndices.push(idx);
      }
    });

    if (textIndices.length >= 2) {
      const descIndex = textIndices[1];
      const currentFullText = newBubble.body.contents[descIndex].text || "";
      const currentParts = currentFullText.split('\n');
      const currentSubtitle = currentParts[0] || "";

      if (checked) {
        // Add price to subtitle
        newBubble.body.contents[descIndex] = {
          ...newBubble.body.contents[descIndex],
          text: `${currentSubtitle}\nNT$ 0`,
        };
      } else {
        // Remove price from subtitle (keep only first line)
        newBubble.body.contents[descIndex] = {
          ...newBubble.body.contents[descIndex],
          text: currentSubtitle,
        };
      }
    }

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    // Sync structure to all other bubbles
    const updatedBubbles = allBubbles.map((b, idx) => {
      if (idx === 0) return newBubble;
      const updated = JSON.parse(JSON.stringify(b));

      if (!updated.body) {
        updated.body = {
          type: "box",
          layout: "vertical",
          contents: [],
        };
      }

      const textIdxs: number[] = [];
      updated.body.contents.forEach((c: any, i: number) => {
        if (c.type === "text") {
          textIdxs.push(i);
        }
      });

      if (textIdxs.length >= 2) {
        const descIdx = textIdxs[1];
        const currFullText = updated.body.contents[descIdx].text || "";
        const currParts = currFullText.split('\n');
        const currSubtitle = currParts[0] || "";

        if (checked) {
          // Add price to subtitle
          updated.body.contents[descIdx] = {
            ...updated.body.contents[descIdx],
            text: `${currSubtitle}\nNT$ 0`,
          };
        } else {
          // Remove price from subtitle
          updated.body.contents[descIdx] = {
            ...updated.body.contents[descIdx],
            text: currSubtitle,
          };
        }
      }

      // Update hero aspect ratio based on content
      if (updated.hero) {
        updated.hero.aspectRatio = hasAnyContent(updated) ? "1.91:1" : "1:1";
      }

      return updated;
    });

    onUpdateAllBubbles(updatedBubbles);
  };

  const toggleTitle = (checked: boolean) => {
    if (!isFirstBubble) return; // Only allow toggling on first bubble

    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.body) {
      newBubble.body = {
        type: "box",
        layout: "vertical",
        contents: [],
      };
    }

    if (checked) {
      // Check if title already exists
      const titleExists = newBubble.body.contents.some((c: any) =>
        c.type === "text" && c.size === "xl" && c.weight === "bold"
      );
      if (titleExists) return;

      // Add title at the beginning
      newBubble.body.contents.unshift({
        type: "text",
        text: "標題文字",
        weight: "bold",
        size: "xl",
      });
    } else {
      // Remove title (identified by size: "xl" and weight: "bold")
      const titleIndex = newBubble.body.contents.findIndex((c: any) =>
        c.type === "text" && c.size === "xl" && c.weight === "bold"
      );
      if (titleIndex !== -1) {
        newBubble.body.contents.splice(titleIndex, 1);
      }
    }

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    // Sync structure to all other bubbles
    const updatedBubbles = allBubbles.map((b, idx) => {
      if (idx === 0) return newBubble;
      const updated = JSON.parse(JSON.stringify(b));

      if (!updated.body) {
        updated.body = {
          type: "box",
          layout: "vertical",
          contents: [],
        };
      }

      if (checked) {
        // Check if title already exists
        const titleExists = updated.body.contents.some((c: any) =>
          c.type === "text" && c.size === "xl" && c.weight === "bold"
        );
        if (titleExists) return updated;

        // Add title to other bubbles at the beginning
        updated.body.contents.unshift({
          type: "text",
          text: "標題文字",
          weight: "bold",
          size: "xl",
        });
      } else {
        // Remove title from other bubbles (identified by size: "xl" and weight: "bold")
        const titleIdx = updated.body.contents.findIndex((c: any) =>
          c.type === "text" && c.size === "xl" && c.weight === "bold"
        );
        if (titleIdx !== -1) {
          updated.body.contents.splice(titleIdx, 1);
        }
      }

      // Update hero aspect ratio based on content
      if (updated.hero) {
        updated.hero.aspectRatio = hasAnyContent(updated) ? "1.91:1" : "1:1";
      }

      return updated;
    });

    onUpdateAllBubbles(updatedBubbles);
  };

  const toggleSubtitle = (checked: boolean) => {
    if (!isFirstBubble) return; // Only allow toggling on first bubble

    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.body) {
      newBubble.body = {
        type: "box",
        layout: "vertical",
        contents: [],
      };
    }

    if (checked) {
      // Check if subtitle already exists (identified by size: "sm" and color: "#666666")
      const subtitleExists = newBubble.body.contents.some((c: any) =>
        c.type === "text" && c.size === "sm" && c.color === "#666666"
      );
      if (subtitleExists) return;

      // Find where to insert (after title if exists, otherwise at beginning)
      const titleIndex = newBubble.body.contents.findIndex((c: any) =>
        c.type === "text" && c.size === "xl" && c.weight === "bold"
      );

      const insertIndex = titleIndex !== -1 ? titleIndex + 1 : 0;

      newBubble.body.contents.splice(insertIndex, 0, {
        type: "text",
        text: "內文文字說明",
        wrap: true,
        color: "#666666",
        size: "sm",
        margin: "md",
      });
    } else {
      // Remove subtitle (identified by size: "sm" and color: "#666666")
      const subtitleIndex = newBubble.body.contents.findIndex((c: any) =>
        c.type === "text" && c.size === "sm" && c.color === "#666666"
      );
      if (subtitleIndex !== -1) {
        newBubble.body.contents.splice(subtitleIndex, 1);
      }
    }

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    // Sync structure to all other bubbles
    const updatedBubbles = allBubbles.map((b, idx) => {
      if (idx === 0) return newBubble;
      const updated = JSON.parse(JSON.stringify(b));

      if (!updated.body) {
        updated.body = {
          type: "box",
          layout: "vertical",
          contents: [],
        };
      }

      if (checked) {
        // Check if subtitle already exists in other bubbles
        const subtitleExists = updated.body.contents.some((c: any) =>
          c.type === "text" && c.size === "sm" && c.color === "#666666"
        );
        if (subtitleExists) return updated;

        // Add subtitle to other bubbles (after title if exists, otherwise at beginning)
        const titleIdx = updated.body.contents.findIndex((c: any) =>
          c.type === "text" && c.size === "xl" && c.weight === "bold"
        );
        const insertIdx = titleIdx !== -1 ? titleIdx + 1 : 0;

        updated.body.contents.splice(insertIdx, 0, {
          type: "text",
          text: "內文文字說明",
          wrap: true,
          color: "#666666",
          size: "sm",
          margin: "md",
        });
      } else {
        // Remove subtitle from other bubbles (identified by size: "sm" and color: "#666666")
        const subtitleIdx = updated.body.contents.findIndex((c: any) =>
          c.type === "text" && c.size === "sm" && c.color === "#666666"
        );
        if (subtitleIdx !== -1) {
          updated.body.contents.splice(subtitleIdx, 1);
        }
      }

      // Update hero aspect ratio based on content
      if (updated.hero) {
        updated.hero.aspectRatio = hasAnyContent(updated) ? "1.91:1" : "1:1";
      }

      return updated;
    });

    onUpdateAllBubbles(updatedBubbles);
  };

  const updateButton = (index: number, field: string, value: string) => {
    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.footer) return;

    const button = newBubble.footer.contents[index];
    if (button && button.type === "button") {
      if (field === "label") {
        newBubble.footer.contents[index] = {
          ...button,
          action: {
            ...button.action,
            label: value,
          },
        };
      } else if (field === "uri") {
        newBubble.footer.contents[index] = {
          ...button,
          action: {
            ...button.action,
            uri: value,
          },
        };
      } else if (field === "style") {
        // Allow style change on all bubbles (not locked to first bubble)
        newBubble.footer.contents[index] = {
          ...button,
          style: value,
        };
      } else if (field === "interactionLabel") {
        if (!newBubble._metadata) {
          newBubble._metadata = {};
        }
        if (!newBubble._metadata.buttonLabels) {
          newBubble._metadata.buttonLabels = {};
        }
        newBubble._metadata.buttonLabels[index] = value;
      } else if (field === "buttonType") {
        if (!newBubble._metadata) {
          newBubble._metadata = {};
        }
        if (!(newBubble._metadata as any).buttonTypes) {
          (newBubble._metadata as any).buttonTypes = {};
        }
        (newBubble._metadata as any).buttonTypes[index] = value;
      } else if (field === "payload") {
        if (!newBubble._metadata) {
          newBubble._metadata = {};
        }
        if (!(newBubble._metadata as any).buttonPayloads) {
          (newBubble._metadata as any).buttonPayloads = {};
        }
        (newBubble._metadata as any).buttonPayloads[index] = value;
      }

      // For all fields, only update current bubble
      onChange(newBubble);
    }
  };

  const addButton = () => {
    if (!isFirstBubble) return; // Only allow adding buttons on first bubble

    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.footer) {
      newBubble.footer = {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [],
      };
    }

    const buttonCount = newBubble.footer.contents.filter((c: any) => c.type === "button").length;
    const buttonLabels = ["一", "二", "三", "四", "五"];

    const newButton: any = {
      type: "button",
      style: "link",
      height: "sm",
      action: {
        type: "uri",
        label: `動作按鈕${buttonLabels[buttonCount] || buttonCount + 1}`,
        uri: "https://example.com",
      },
    };

    // First button has md margin (16px spacing from image)
    if (buttonCount === 0) {
      newButton.margin = "md";
    }

    newBubble.footer.contents.push(newButton);

    // Initialize metadata for new button
    if (!newBubble._metadata) {
      newBubble._metadata = {};
    }
    if (!(newBubble._metadata as any).buttonTypes) {
      (newBubble._metadata as any).buttonTypes = {};
    }
    // Set default button type to "url" for the new button
    (newBubble._metadata as any).buttonTypes[buttonCount] = "url";

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    // Sync footer structure (button count and style) to all other bubbles
    const updatedBubbles = allBubbles.map((b, idx) => {
      if (idx === 0) return newBubble;
      const updated = JSON.parse(JSON.stringify(b));

      // Copy footer structure
      if (!updated.footer) {
        updated.footer = {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [],
        };
      }

      // Add new button with same structure but default content
      const newButtonCopy: any = {
        type: "button",
        style: newButton.style,
        height: "sm",
        action: {
          type: "uri",
          label: `動作按鈕${buttonLabels[buttonCount] || buttonCount + 1}`,
          uri: "https://example.com",
        },
      };

      if (newButton.margin) {
        newButtonCopy.margin = newButton.margin;
      }

      updated.footer.contents.push(newButtonCopy);

      // Update hero aspect ratio based on content
      if (updated.hero) {
        updated.hero.aspectRatio = hasAnyContent(updated) ? "1.91:1" : "1:1";
      }

      return updated;
    });

    onUpdateAllBubbles(updatedBubbles);
    toast.success("已新增按鈕（已同步結構至所有輪播）");
  };

  const removeButton = (index: number) => {
    if (!isFirstBubble) return; // Only allow removing buttons on first bubble

    const newBubble = JSON.parse(JSON.stringify(bubble));
    if (!newBubble.footer) return;

    newBubble.footer.contents.splice(index, 1);

    // Update hero aspect ratio based on content
    if (newBubble.hero) {
      newBubble.hero.aspectRatio = hasAnyContent(newBubble) ? "1.91:1" : "1:1";
    }

    // Sync footer structure to all other bubbles
    const updatedBubbles = allBubbles.map((b, idx) => {
      if (idx === 0) return newBubble;
      const updated = JSON.parse(JSON.stringify(b));

      // Remove button at same index
      if (updated.footer && updated.footer.contents[index]) {
        updated.footer.contents.splice(index, 1);
      }

      // Update hero aspect ratio based on content
      if (updated.hero) {
        updated.hero.aspectRatio = hasAnyContent(updated) ? "1.91:1" : "1:1";
      }

      return updated;
    });

    onUpdateAllBubbles(updatedBubbles);
    toast.success("已刪除按鈕（已同步結構至所有輪播）");
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error("僅支援 JPG、JPEG、PNG 格式的圖片");
        return;
      }

      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("檔案大小不可超過 5 MB");
        return;
      }

      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        if (imageUrl) {
          processAndUploadImage(imageUrl);
        }
      };
      reader.onerror = () => {
        toast.error("圖片讀取失敗，請重試");
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const processAndUploadImage = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;

      // Determine target ratio based on current content (text or buttons)
      const targetRatio = hasAnyContent(bubble) ? 1.91 : 1.0;
      const tolerance = 0.05; // 5% tolerance

      // Check if ratio matches target (within tolerance)
      const ratioMatches = Math.abs(ratio - targetRatio) <= tolerance;

      if (ratioMatches) {
        // Image ratio is acceptable, use as is
        updateHeroUrl(imageUrl);
        toast.success("圖片已上傳");
      } else {
        // Need to crop/fill the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast.error("圖片處理失敗");
          return;
        }

        // Set canvas size based on target ratio
        let canvasWidth: number;
        let canvasHeight: number;

        if (targetRatio === 1.91) {
          // Target 1.91:1
          canvasWidth = 1024;
          canvasHeight = Math.round(1024 / 1.91);
        } else {
          // Target 1:1
          canvasWidth = 1024;
          canvasHeight = 1024;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Calculate dimensions to cover the canvas (similar to CSS object-fit: cover)
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = width;
        let sourceHeight = height;

        const sourceRatio = width / height;
        const canvasRatio = canvasWidth / canvasHeight;

        if (sourceRatio > canvasRatio) {
          // Image is wider, crop left/right
          sourceWidth = height * canvasRatio;
          sourceX = (width - sourceWidth) / 2;
        } else {
          // Image is taller, crop top/bottom
          sourceHeight = width / canvasRatio;
          sourceY = (height - sourceHeight) / 2;
        }

        // Draw image with cover effect
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, canvasWidth, canvasHeight
        );

        // Convert to base64
        const processedImageUrl = canvas.toDataURL("image/jpeg", 0.9);
        updateHeroUrl(processedImageUrl);

        const ratioText = targetRatio === 1.91 ? "1.91:1" : "1:1";
        toast.success(`圖片已自動調整為 ${ratioText} 比例並上傳`);
      }
    };

    img.onerror = () => {
      toast.error("圖片處理失敗，請重試");
    };

    img.src = imageUrl;
  };

  return (
    <div className="flex flex-col gap-[12px]">
      {/* Info Message for First Bubble */}
      {isFirstBubble && allBubbles.length > 1 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[12px] leading-[16px] text-amber-800">
            ⓘ 您正在編輯第一個輪播。標題、副標題和按鈕數量/樣式的設定會同步到所有輪播
          </p>
        </div>
      )}

      {/* Hero Image Section */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <Checkbox
            id="show-hero"
            checked={hasHero}
            onCheckedChange={toggleHero}
            disabled={!isFirstBubble}
            className="size-[16px]"
          />
          <span className={`text-[14px] leading-[20px] ${isFirstBubble ? "text-neutral-950 cursor-pointer" : "text-neutral-400 cursor-not-allowed"}`}>選擇圖片</span>
        </div>

        {hasHero && (
          <div className="flex flex-col gap-[12px]">
            {/* Upload and Copy Buttons */}
            <div className="flex gap-[8px]">
              <button
                onClick={handleImageUpload}
                className="flex-1 bg-white h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center justify-center gap-[8px] hover:bg-gray-50 transition-colors"
              >
                <Upload className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">上傳圖片</span>
              </button>
              <button
                onClick={onDuplicateBubble}
                disabled={!canDuplicate}
                className="flex-1 bg-white h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.1)] flex items-center justify-center gap-[8px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="size-[16px]" strokeWidth={1.33} />
                <span className="text-[14px] leading-[20px] text-neutral-950">複製圖卡</span>
              </button>
            </div>

            {/* Image Guidelines */}
            <div className="flex flex-col gap-0">
              <p className="text-[12px] leading-[16px] text-[#6a7282]">• 圖片格式 JPG, JPEG, PNG</p>
              <p className="text-[12px] leading-[16px] text-[#6a7282]">• 檔案最大不可超過 5 MB</p>
              <p className="text-[12px] leading-[16px] text-[#6a7282]">• 圖片會自動調整為 1.91:1 或 1:1 比例</p>
            </div>

            {/* Click Image Trigger URL */}
            <div className="pt-[11px]">
              <div className="flex items-center gap-[8px]">
                <Checkbox
                  id="hero-action"
                  checked={hasHeroAction}
                  onCheckedChange={toggleHeroAction}
                  className="size-[16px]"
                />
                <span className="text-[14px] leading-[20px] text-neutral-950 cursor-pointer">點擊圖片觸發 URL</span>
              </div>

              {hasHeroAction && (
                <div className="flex flex-col gap-[12px] mt-[12px]">
                  <div className="flex flex-col gap-[8px]">
                    <label className="flex items-center gap-[8px] cursor-pointer">
                      <input
                        type="radio"
                        name={`hero-action-type-${bubbleIndex}`}
                        value="url"
                        checked={heroActionType === "url"}
                        onChange={(e) => updateHeroActionType(e.target.value)}
                        className="w-4 h-4 appearance-none rounded-full border-2 border-gray-300 bg-white cursor-pointer checked:border-blue-600 checked:shadow-[inset_0_0_0_3px_white,inset_0_0_0_8px_#2563eb]"
                      />
                      <span className="text-[14px] leading-[20px]">開啟連結網址</span>
                    </label>
                    <label className="flex items-center gap-[8px] cursor-pointer">
                      <input
                        type="radio"
                        name={`hero-action-type-${bubbleIndex}`}
                        value="postback"
                        checked={heroActionType === "postback"}
                        onChange={(e) => updateHeroActionType(e.target.value)}
                        className="w-4 h-4 appearance-none rounded-full border-2 border-gray-300 bg-white cursor-pointer checked:border-blue-600 checked:shadow-[inset_0_0_0_3px_white,inset_0_0_0_8px_#2563eb]"
                      />
                      <span className="text-[14px] leading-[20px]">貼上互動標籤</span>
                    </label>
                  </div>

                  {heroActionType === "url" ? (
                    <div className="flex flex-col gap-[4px]">
                      <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                      <input
                        type="text"
                        value={heroActionUrl}
                        onChange={(e) => updateHeroActionUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-[4px]">
                        <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">觸發訊息回覆</p>
                        <input
                          type="text"
                          value={heroActionPayload}
                          onChange={(e) => updateHeroActionPayload(e.target.value)}
                          placeholder="輸入觸發訊息"
                          className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                        />
                        <p className="text-[12px] leading-[16px] text-[#6a7282]">當使用者點擊圖片時會傳送此訊息</p>
                      </div>

                      <div className="flex flex-col gap-[4px]">
                        <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">連結網址</p>
                        <input
                          type="text"
                          value={heroActionUrl}
                          onChange={(e) => updateHeroActionUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-[4px]">
                        <p className="text-[12px] leading-[16px] text-[#4a5565] font-medium">互動標籤</p>
                        <input
                          type="text"
                          value={heroActionLabel}
                          onChange={(e) => updateHeroActionLabel(e.target.value)}
                          placeholder="輸入互動標籤（僅供後台紀錄）"
                          className="w-full h-[36px] px-[12px] rounded-[8px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
                        />
                        <p className="text-[12px] leading-[16px] text-[#6a7282]">此欄位不影響訊息輸出，僅供後台紀錄使用</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <Checkbox
            id="show-title"
            checked={hasTitle}
            onCheckedChange={toggleTitle}
            disabled={!isFirstBubble}
            className="size-[16px]"
          />
          <span className={`text-[14px] leading-[20px] ${isFirstBubble ? "text-neutral-950 cursor-pointer" : "text-neutral-400 cursor-not-allowed"}`}>標題文字</span>
        </div>

        {hasTitle && (
          <div className="flex flex-col gap-[2px]">
            <div className="relative">
              <input
                type="text"
                value={titleText}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="輸入標題文字"
                maxLength={80}
                className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-300 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
              />
              <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                {titleText.length}/80
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Section */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <Checkbox
            id="show-subtitle"
            checked={hasSubtitle}
            onCheckedChange={toggleSubtitle}
            disabled={!isFirstBubble}
            className="size-[16px]"
          />
          <span className={`text-[14px] leading-[20px] ${isFirstBubble ? "text-neutral-950 cursor-pointer" : "text-neutral-400 cursor-not-allowed"}`}>內文文字說明</span>
        </div>

        {hasSubtitle && (
          <div className="flex flex-col gap-[2px]">
            <div className="relative">
              <textarea
                value={subtitleText}
                onChange={(e) => updateSubtitle(e.target.value)}
                placeholder="輸入內文文字說明"
                maxLength={80}
                className="w-full h-[78px] px-[12px] py-[8px] rounded-[10px] border border-neutral-300 text-[14px] leading-[20px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all resize-none"
              />
              <span className="absolute right-[12px] bottom-[8px] text-[12px] leading-[16px] text-[#6a7282]">
                {subtitleText.length}/80
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <Checkbox
            id="show-price"
            checked={hasPrice}
            onCheckedChange={togglePrice}
            disabled={!isFirstBubble}
            className="size-[16px]"
          />
          <span className={`text-[14px] leading-[20px] ${isFirstBubble ? "text-neutral-950 cursor-pointer" : "text-neutral-400 cursor-not-allowed"}`}>金額</span>
        </div>

        {hasPrice && (
          <div className="flex flex-col gap-[2px]">
            <div className="relative">
              <input
                type="text"
                value={priceText}
                onChange={(e) => updatePrice(e.target.value)}
                placeholder="NT$ 00,000"
                maxLength={20}
                className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all"
              />
              <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                {priceText.length}/20
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <span className="text-[14px] leading-[20px] text-neutral-950 flex items-center gap-[4px]">
            動作按鈕
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-[12px] text-blue-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 text-white">
                Facebook Messenger 最多支援 3 個按鈕
              </TooltipContent>
            </Tooltip>
          </span>
          <button
            onClick={addButton}
            disabled={!isFirstBubble || buttons.length >= 3}
            className="h-[32px] px-[8px] flex items-center gap-[6px] hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-[16px] text-[#0f6beb]" strokeWidth={1.33} />
            <span className="text-[14px] leading-[20px] text-[#0f6beb]">新增按鈕</span>
          </button>
        </div>

        {!isFirstBubble && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[12px] leading-[16px] text-blue-800">
              ⓘ 按鈕數量和樣式已鎖定為第一個輪播的設定，但可以自訂每個按鈕的文字和網址
            </p>
          </div>
        )}

        {buttons.map((button: any, index: number) => (
          <div key={index} className="flex flex-col gap-[12px] p-[12px] bg-gray-50 rounded-[10px] border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[14px] leading-[20px] text-neutral-950">按鈕 {index + 1}</span>
              <button
                onClick={() => removeButton(index)}
                className="size-[24px] flex items-center justify-center hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                disabled={!isFirstBubble}
              >
                <Trash2 className="size-[14px] text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col gap-[4px]">
              <span className="text-[12px] leading-[16px] text-neutral-600">按鈕文字</span>
              <div className="relative">
                <input
                  type="text"
                  value={button.action?.label || ""}
                  onChange={(e) => updateButton(index, "label", e.target.value)}
                  placeholder="輸入按鈕文字"
                  maxLength={20}
                  className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all bg-white"
                />
                <span className="absolute right-[12px] top-[10px] text-[12px] leading-[16px] text-[#6a7282]">
                  {(button.action?.label || "").length}/20
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <span className="text-[12px] leading-[16px] text-neutral-600">按鈕行為</span>
              <div className="flex flex-col gap-[8px]">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name={`button-type-${bubbleIndex}-${index}`}
                    value="url"
                    checked={((bubble._metadata as any)?.buttonTypes?.[index] || "url") === "url"}
                    onChange={(e) => updateButton(index, "buttonType", e.target.value)}
                    className="size-[16px] appearance-none rounded-full border-2 border-gray-300 bg-white cursor-pointer checked:border-blue-600 checked:shadow-[inset_0_0_0_3px_white,inset_0_0_0_8px_#2563eb]"
                  />
                  <span className="text-[14px] leading-[20px] text-neutral-950">開啟連結網址</span>
                </label>
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name={`button-type-${bubbleIndex}-${index}`}
                    value="postback"
                    checked={(bubble._metadata as any)?.buttonTypes?.[index] === "postback"}
                    onChange={(e) => updateButton(index, "buttonType", e.target.value)}
                    className="size-[16px] appearance-none rounded-full border-2 border-gray-300 bg-white cursor-pointer checked:border-blue-600 checked:shadow-[inset_0_0_0_3px_white,inset_0_0_0_8px_#2563eb]"
                  />
                  <span className="text-[14px] leading-[20px] text-neutral-950">貼上互動標籤</span>
                </label>
              </div>
            </div>

            {((bubble._metadata as any)?.buttonTypes?.[index] || "url") === "url" ? (
              <div className="flex flex-col gap-[4px]">
                <span className="text-[12px] leading-[16px] text-neutral-600">連結網址</span>
                <input
                  type="text"
                  value={button.action?.uri || ""}
                  onChange={(e) => updateButton(index, "uri", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all bg-white"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[12px] leading-[16px] text-neutral-600">觸發訊息回覆</span>
                  <input
                    type="text"
                    value={(bubble._metadata as any)?.buttonPayloads?.[index] || ""}
                    onChange={(e) => updateButton(index, "payload", e.target.value)}
                    placeholder="輸入觸發訊息"
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all bg-white"
                  />
                  <p className="text-[12px] leading-[16px] text-[#6a7282]">當使用者點擊按鈕時會傳送此訊息</p>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <span className="text-[12px] leading-[16px] text-neutral-600">連結網址</span>
                  <input
                    type="text"
                    value={button.action?.uri || ""}
                    onChange={(e) => updateButton(index, "uri", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all bg-white"
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <span className="text-[12px] leading-[16px] text-neutral-600">互動標籤</span>
                  <input
                    type="text"
                    value={bubble._metadata?.buttonLabels?.[index] || ""}
                    onChange={(e) => updateButton(index, "interactionLabel", e.target.value)}
                    placeholder="輸入點擊後會貼上的互動標籤，例如 #促銷活動"
                    className="w-full h-[36px] px-[12px] rounded-[10px] border border-neutral-100 text-[14px] text-[#383838] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all bg-white"
                  />
                  <p className="text-[12px] leading-[16px] text-[#6a7282]">此欄位不影響訊息輸出,僅供後台紀錄使用</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

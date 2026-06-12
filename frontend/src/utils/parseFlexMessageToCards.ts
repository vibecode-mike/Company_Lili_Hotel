/**
 * 將群發的 flex_message_json 解析成 CarouselCard 陣列
 *
 * 從 MessageDetailDrawer 抽出的共用純函式，供「群發訊息詳情」與
 * 「1:1 聊天室群發泡泡」共用同一套還原邏輯。
 *
 * 專案的群發 Flex 都是 App 編輯器產生的固定結構
 * （hero 圖 + 標題/描述/價格 + 按鈕的 bubble/carousel），不處理任意巢狀 Flex。
 *
 * 解析失敗回傳 null，由呼叫端決定 fallback（詳情頁用佔位卡、聊天室退回純文字）。
 */
import imgImageHero from "figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png";
import type { CarouselCard } from "../components/CarouselMessageEditor";

export function parseFlexMessageToCards(
  flexMessageJson: string | Record<string, any> | null,
): CarouselCard[] | null {
  if (!flexMessageJson) {
    return null;
  }

  try {
    let flexMessage: Record<string, any> | null = null;

    if (typeof flexMessageJson === 'string') {
      try {
        flexMessage = JSON.parse(flexMessageJson);
      } catch {
        // 歷史資料可能是 Python dict repr（單引號 / True / False / None）
        const normalized = flexMessageJson
          .replace(/'/g, '"')
          .replace(/\bTrue\b/g, 'true')
          .replace(/\bFalse\b/g, 'false')
          .replace(/\bNone\b/g, 'null');
        flexMessage = JSON.parse(normalized);
      }
    } else {
      flexMessage = flexMessageJson;
    }

    // Flex wrapper可能是 { type: 'flex', altText, contents: {...} }
    const root = flexMessage?.type === 'flex'
      ? flexMessage.contents
      : flexMessage;

    if (!root) {
      return null;
    }

    // Handle carousel type
    if (root.type === 'carousel') {
      const slides = root.contents || [];
      return slides.map((bubble: any, index: number) => {
        const body = bubble.body?.contents || [];
        const hero = bubble.hero;

        // Extract title, content, and price from body
        let cardTitle = '';
        let content = '';
        let price = '';
        let foundTitle = false;  // 追蹤是否已找到標題（即使為空）

        body.forEach((item: any) => {
          if (item.type === 'text' && item.weight === 'bold' && !foundTitle) {
            cardTitle = item.text || '';
            foundTitle = true;
          } else if (item.type === 'text' && !content && foundTitle) {
            content = item.text || '';
          } else if (item.type === 'text' && item.text?.includes('NT$')) {
            price = item.text.replace('NT$', '').trim();
          }
        });

        // Extract buttons
        const footer = bubble.footer?.contents || [];
        const buttons = footer.filter((item: any) => item.type === 'button');

        return {
          id: index + 1,
          enableImage: !!hero?.url,
          enableTitle: foundTitle,  // 使用 flag，而非 cardTitle 的 truthy 值
          enableContent: !!content,
          enablePrice: !!price,
          enableButton1: buttons.length > 0,
          enableButton2: buttons.length > 1,
          enableButton3: buttons.length > 2,
          enableButton4: buttons.length > 3,
          image: hero?.url || imgImageHero,
          cardTitle,
          content,
          price,
          currency: 'ntd',
          button1: buttons[0]?.action?.label || '',
          button2: buttons[1]?.action?.label || '',
          button3: buttons[2]?.action?.label || '',
          button4: buttons[3]?.action?.label || '',
          button1Action: buttons[0]?.action?.type || '',
          button1Url: buttons[0]?.action?.uri || '',
          button1Tag: '',
          button1Text: '',
          button1TriggerImage: null,
          button1Mode: 'primary',
          button2Action: buttons[1]?.action?.type || '',
          button2Url: buttons[1]?.action?.uri || '',
          button2Tag: '',
          button2Text: '',
          button2TriggerImage: null,
          button2Mode: 'secondary',
          button3Action: buttons[2]?.action?.type || '',
          button3Url: buttons[2]?.action?.uri || '',
          button3Tag: '',
          button3Text: '',
          button3TriggerImage: null,
          button3Mode: 'secondary',
          button4Action: buttons[3]?.action?.type || '',
          button4Url: buttons[3]?.action?.uri || '',
          button4Tag: '',
          button4Text: '',
          button4TriggerImage: null,
          button4Mode: 'secondary',
          enableImageUrl: false,
          imageUrl: '',
          imageTag: '',
        };
      });
    }

    // Handle single bubble
    if (root.type === 'bubble') {
      const body = root.body?.contents || [];
      const hero = root.hero;

      let cardTitle = '';
      let content = '';
      let price = '';
      let foundTitle = false;  // 追蹤是否已找到標題（即使為空）

      body.forEach((item: any) => {
        if (item.type === 'text' && item.weight === 'bold' && !foundTitle) {
          cardTitle = item.text || '';
          foundTitle = true;
        } else if (item.type === 'text' && !content && foundTitle) {
          content = item.text || '';
        } else if (item.type === 'text' && item.text?.includes('NT$')) {
          price = item.text.replace('NT$', '').trim();
        }
      });

      const footer = root.footer?.contents || [];
      const buttons = footer.filter((item: any) => item.type === 'button');

      return [{
        id: 1,
        enableImage: !!hero?.url,
        enableTitle: foundTitle,  // 使用 flag，而非 cardTitle 的 truthy 值
        enableContent: !!content,
        enablePrice: !!price,
        enableButton1: buttons.length > 0,
        enableButton2: buttons.length > 1,
        enableButton3: buttons.length > 2,
        enableButton4: buttons.length > 3,
        image: hero?.url || hero?.contents?.url || imgImageHero,
        cardTitle,
        content,
        price,
        currency: 'ntd',
        button1: buttons[0]?.action?.label || '',
        button2: buttons[1]?.action?.label || '',
        button3: buttons[2]?.action?.label || '',
        button4: buttons[3]?.action?.label || '',
        button1Action: buttons[0]?.action?.type || '',
        button1Url: buttons[0]?.action?.uri || '',
        button1Tag: '',
        button1Text: '',
        button1TriggerImage: null,
        button1Mode: 'primary',
        button2Action: buttons[1]?.action?.type || '',
        button2Url: buttons[1]?.action?.uri || '',
        button2Tag: '',
        button2Text: '',
        button2TriggerImage: null,
        button2Mode: 'secondary',
        button3Action: buttons[2]?.action?.type || '',
        button3Url: buttons[2]?.action?.uri || '',
        button3Tag: '',
        button3Text: '',
        button3TriggerImage: null,
        button3Mode: 'secondary',
        button4Action: buttons[3]?.action?.type || '',
        button4Url: buttons[3]?.action?.uri || '',
        button4Tag: '',
        button4Text: '',
        button4TriggerImage: null,
        button4Mode: 'secondary',
        enableImageUrl: false,
        imageUrl: '',
        imageTag: '',
      }];
    }

    // Fallback if unable to parse
    return null;
  } catch (err) {
    console.error('Error parsing Flex Message JSON:', err);
    return null;
  }
}

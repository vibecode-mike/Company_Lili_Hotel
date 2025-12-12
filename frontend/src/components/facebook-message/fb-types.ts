// Facebook Messenger Generic Template types
export interface MessengerMessage {
  attachment: {
    type: "template";
    payload: MessengerPayload;
  };
}

export interface MessengerPayload {
  template_type: "generic";
  elements: MessengerElement[];
}

export interface MessengerElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: MessengerAction;
  buttons?: MessengerButton[];
}

export interface MessengerButton {
  type: "web_url" | "postback";
  url?: string;
  title: string;
  payload?: string;
}

export interface MessengerAction {
  type: "web_url";
  url: string;
  webview_height_ratio?: "compact" | "tall" | "full";
}

// For internal editor use (backward compatibility with UI)
export interface FlexMessage {
  type: "bubble" | "carousel";
  hero?: FlexComponent;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: any;
  contents?: FlexBubble[];
}

export interface FlexBubble {
  type: "bubble";
  hero?: FlexComponent;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: any;
  _metadata?: {
    heroActionLabel?: string;
    buttonLabels?: { [index: number]: string };
  };
}

export interface FlexComponent {
  type: "box" | "text" | "image" | "button" | "separator" | "spacer" | "icon";
  [key: string]: any;
}

export interface FlexBox extends FlexComponent {
  type: "box";
  layout: "horizontal" | "vertical" | "baseline";
  contents: FlexComponent[];
  spacing?: string;
  margin?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  cornerRadius?: string;
  paddingAll?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
}

export interface FlexText extends FlexComponent {
  type: "text";
  text: string;
  size?: string;
  weight?: string;
  color?: string;
  align?: string;
  wrap?: boolean;
  margin?: string;
  flex?: number;
}

export interface FlexImage extends FlexComponent {
  type: "image";
  url: string;
  size?: string;
  aspectRatio?: string;
  aspectMode?: string;
  backgroundColor?: string;
}

export interface FlexButton extends FlexComponent {
  type: "button";
  action: FlexAction;
  style?: "primary" | "secondary" | "link";
  color?: string;
  height?: string;
  margin?: string;
}

export interface FlexAction {
  type: "uri" | "message" | "postback";
  label?: string;
  uri?: string;
  text?: string;
  data?: string;
}

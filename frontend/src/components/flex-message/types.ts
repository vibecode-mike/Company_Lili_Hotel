// Flex Message Styles Types
export interface FlexBlockStyle {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
}

export interface FlexBubbleStyle {
  header?: FlexBlockStyle;
  hero?: FlexBlockStyle;
  body?: FlexBlockStyle;
  footer?: FlexBlockStyle;
}

export interface FlexMessage {
  type: "bubble" | "carousel";
  hero?: FlexComponent;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: FlexBubbleStyle;
  contents?: FlexBubble[];
}

export interface FlexBubble {
  type: "bubble";
  hero?: FlexComponent;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: FlexBubbleStyle;
  _metadata?: {
    heroActionLabel?: string;
    buttonLabels?: { [index: number]: string };
  };
}

// Base Flex Component Type - using Union Type instead of [key: string]: any
export type FlexComponent =
  | FlexBox
  | FlexText
  | FlexImage
  | FlexButton
  | FlexSeparator
  | FlexSpacer
  | FlexIcon;

export interface FlexBox {
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
  flex?: number;
  width?: string;
  height?: string;
}

export interface FlexText {
  type: "text";
  text: string;
  size?: string;
  weight?: "regular" | "bold";
  color?: string;
  align?: "start" | "end" | "center";
  wrap?: boolean;
  margin?: string;
  flex?: number;
  maxLines?: number;
}

export interface FlexImage {
  type: "image";
  url: string;
  size?: string | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "3xl" | "4xl" | "5xl" | "full";
  aspectRatio?: string;
  aspectMode?: "cover" | "fit";
  backgroundColor?: string;
  action?: FlexAction;
}

export interface FlexButton {
  type: "button";
  action: FlexAction;
  style?: "primary" | "secondary" | "link";
  color?: string;
  height?: "sm" | "md";
  margin?: string;
  flex?: number;
}

export interface FlexSeparator {
  type: "separator";
  margin?: string;
  color?: string;
}

export interface FlexSpacer {
  type: "spacer";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
}

export interface FlexIcon {
  type: "icon";
  url: string;
  size?: string;
  aspectRatio?: string;
  margin?: string;
}

export interface FlexAction {
  type: "uri" | "message" | "postback";
  label?: string;
  uri?: string;
  text?: string;
  data?: string;
}
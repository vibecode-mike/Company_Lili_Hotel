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

export interface FlexCarousel {
  type: "carousel";
  contents: FlexBubble[];
}

export interface BubbleConfig {
  showImage: boolean;
  imageUrl: string;
  imageAction: string;
  imageActionLabel: string;
  showTitle: boolean;
  titleText: string;
  showDescription: boolean;
  descriptionText: string;
  showPrice: boolean;
  priceValue: string;
  buttons: ButtonConfig[];
}

export interface ButtonConfig {
  style: "primary" | "secondary" | "link";
  label: string;
  url: string;
  actionLabel: string;
}

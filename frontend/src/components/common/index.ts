/**
 * 通用组件库 Barrel Exports
 * 统一导出所有通用组件，简化导入路径
 */

// ========== 面包屑导航 ==========
export { SimpleBreadcrumb } from './Breadcrumb';

// ========== 容器组件 ==========
export {
  TitleContainer,
  HeaderContainer,
  DescriptionContainer,
  ContentContainer,
} from './Containers';

// ========== 预览容器组件 ==========
export {
  OABadge,
  CardImage,
  MessageCard,
  TriggerImage,
  TriggerText,
  TriggerImagePreview,
  TriggerTextPreview,
  GradientPreviewContainer,
  SimplePreviewContainer,
} from './PreviewContainers';

export type {
  CardData,
  TriggerImagePreviewProps,
  TriggerTextPreviewProps,
} from './PreviewContainers';

// ========== 搜索容器组件 ==========
export {
  SearchContainer,
  SimpleSearchBar,
} from './SearchContainers';

export type {
  SearchContainerProps,
} from './SearchContainers';

// ========== 按钮组件 ==========
export {
  TextIconButton,
  SecondaryButton,
} from './buttons';

export type {
  TextIconButtonProps,
  SecondaryButtonProps,
} from './buttons';

// ========== 刪除組件 ==========
export { DeleteButton } from './DeleteButton';
export { DeleteConfirmationModal } from './DeleteConfirmationModal';

export type { DeleteButtonProps } from './DeleteButton';
export type { DeleteConfirmationModalProps } from './DeleteConfirmationModal';

// ========== 图标组件 ==========
export {
  ArrowIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from './icons';

export type {
  ArrowIconProps,
} from './icons';

// ========== 标签组件 ==========
export { default as Tag } from './Tag';
export type { TagProps } from './Tag';

// ========== 样式工具 ==========
export {
  COLORS,
  FONTS,
  tagStyles,
  buttonStyles,
  inputStyles,
  cardStyles,
  containerStyles,
  tableStyles,
  textStyles,
  spacingStyles,
  cn,
  getTagClassName,
  getButtonClassName,
  getInputClassName,
  getCardClassName,
  getTextClassName,
  getSpacingClassName,
} from './styles';
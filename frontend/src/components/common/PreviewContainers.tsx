/**
 * 预览容器组件库
 * 统一管理所有消息预览相关的容器组件
 */

import React from 'react';

// ========== 类型定义 ==========

export interface CardData {
  cardTitle?: string;
  content?: string;
  price?: string;
  currency?: 'ntd' | 'usd';
  button1?: string;
  button2?: string;
  imageUrl?: string;
}

interface OABadgeProps {
  className?: string;
}

interface CardImageProps {
  imageUrl?: string;
  placeholder?: string;
  className?: string;
}

interface ActionButtonProps {
  text?: string;
  className?: string;
}

interface MessageCardProps {
  cardData?: CardData;
  className?: string;
}

interface TriggerImageProps {
  imageUrl?: string;
  placeholder?: string;
}

interface TriggerTextProps {
  text?: string;
  placeholder?: string;
}

export interface TriggerImagePreviewProps {
  cardData?: CardData;
  triggerImageUrl?: string;
  className?: string;
}

export interface TriggerTextPreviewProps {
  cardData?: CardData;
  triggerText?: string;
  className?: string;
}

// ========== OA徽章组件 ==========

/**
 * OA徽章 - 显示在消息预览左侧
 */
export function OABadge({ className = '' }: OABadgeProps) {
  return (
    <div 
      className={`bg-white relative rounded-full shrink-0 size-[45px] flex items-center justify-center ${className}`}
      data-name="OA Badge"
    >
      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[18px] text-[#383838] text-[12px] text-nowrap whitespace-pre">
        OA
      </p>
    </div>
  );
}

// ========== 卡片内容组件 ==========

/**
 * 卡片标题
 */
function CardTitle({ title }: { title?: string }) {
  return (
    <div className="absolute h-[28.5px] left-[16px] overflow-clip top-[208px] w-[256px]">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[28.5px] left-0 not-italic text-[#383838] text-[19px] text-nowrap top-0 tracking-[-0.4453px] whitespace-pre">
        {title || '標題文字'}
      </p>
    </div>
  );
}

/**
 * 卡片内容文字
 */
function CardContent({ content }: { content?: string }) {
  return (
    <div className="absolute h-[18px] left-[16px] overflow-clip top-[252.5px] w-[256px]">
      <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[18px] left-0 not-italic text-[#383838] text-[12px] text-nowrap top-0 whitespace-pre">
        {content || '內文文字'}
      </p>
    </div>
  );
}

/**
 * 卡片价格
 */
function CardPrice({ price, currency }: { price?: string; currency?: 'ntd' | 'usd' }) {
  return (
    <div className="absolute h-[36px] left-[16px] top-[286.5px] w-[256px]">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[36px] left-[256.81px] not-italic text-[#383838] text-[24px] text-right top-0 tracking-[0.0703px] translate-x-[-100%] w-[78px]">
        {currency === 'ntd' ? 'NT $' : '$'} {price || '0'}
      </p>
    </div>
  );
}

/**
 * 动作按钮
 */
function ActionButton({ text, className = '' }: ActionButtonProps) {
  return (
    <div className={`bg-white h-[47px] relative rounded-[12px] shrink-0 w-[256px] ${className}`}>
      <div aria-hidden="true" className="absolute border border-gray-200 border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col h-[47px] items-start pb-px pt-[13px] px-[13px] relative w-[256px]">
        <div className="h-[21px] overflow-clip relative shrink-0 w-full">
          <p className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[21px] left-[115px] not-italic text-[#383838] text-[14px] text-center text-nowrap top-0 tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">
            {text || '動作按鈕'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 动作按钮组
 */
function ActionButtons({ button1, button2 }: { button1?: string; button2?: string }) {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[5px] h-[122px] items-start left-0 pb-0 pl-[16px] pr-0 pt-[7px] top-[338.5px] w-[288px]">
      <ActionButton text={button1 || '動作按鈕一'} />
      <ActionButton text={button2 || '動作按鈕二'} />
    </div>
  );
}

/**
 * 卡片图片
 */
export function CardImage({ imageUrl, placeholder = '選擇圖片', className = '' }: CardImageProps) {
  return (
    <div className={`bg-[#edf0f8] h-[192px] overflow-clip w-full relative ${className}`}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="卡片圖片" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal leading-[28.5px] text-[#383838] text-[19px] text-center text-nowrap tracking-[-0.4453px] whitespace-pre">
            {placeholder}
          </p>
        </div>
      )}
    </div>
  );
}

// ========== 消息卡片 ==========

/**
 * 消息卡片 - 显示完整的卡片内容（标题、内容、价格、按钮、图片）
 */
export function MessageCard({ cardData, className = '' }: MessageCardProps) {
  return (
    <div className={`bg-white h-[460.5px] relative rounded-[12px] shrink-0 w-full ${className}`}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[460.5px] overflow-clip relative rounded-[inherit] w-full">
        <CardTitle title={cardData?.cardTitle} />
        <CardContent content={cardData?.content} />
        <CardPrice price={cardData?.price} currency={cardData?.currency} />
        <ActionButtons button1={cardData?.button1} button2={cardData?.button2} />
        <div className="absolute left-0 top-0 w-[288px]">
          <CardImage imageUrl={cardData?.imageUrl} />
        </div>
      </div>
    </div>
  );
}

// ========== 触发元素 ==========

/**
 * 触发图片组件
 */
export function TriggerImage({ imageUrl, placeholder = '選擇圖片' }: TriggerImageProps) {
  return (
    <div className="bg-[#edf0f8] h-[240px] relative rounded-[15px] shrink-0 w-full overflow-hidden">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[240px] items-center justify-center relative w-full">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="觸發圖片" 
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="font-['Noto_Sans_TC:Regular',_sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#383838] text-[24px] text-center text-nowrap whitespace-pre">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 触发文字组件
 */
export function TriggerText({ text, placeholder = '文字訊息' }: TriggerTextProps) {
  return (
    <div className="bg-[#f6f9fd] relative rounded-[15px] shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-center overflow-clip relative rounded-[inherit] w-full">
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center p-[16px] relative w-full">
              <p className="basis-0 font-['Noto_Sans_TC:Regular',_sans-serif] font-normal grow leading-[1.5] min-h-px min-w-px relative shrink-0 text-[#383838] text-[16px]">
                {text || placeholder}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== 预览容器 ==========

/**
 * 触发图片预览容器
 * 用于预览带触发图片的消息卡片
 */
export function TriggerImagePreview({ cardData, triggerImageUrl, className = '' }: TriggerImagePreviewProps) {
  return (
    <div className={`bg-gradient-to-b from-[#a5d8ff] relative rounded-[20px] size-full to-[#d0ebff] ${className}`}>
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[20px] items-start overflow-clip pb-[24px] pl-[24px] pr-0 pt-[24px] relative size-full">
          <OABadge />
          <div className="relative shrink-0 w-[288px]">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip relative rounded-[inherit] w-[288px]">
              <MessageCard cardData={cardData} />
              <TriggerImage imageUrl={triggerImageUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 触发文字预览容器
 * 用于预览带触发文字的消息卡片
 */
export function TriggerTextPreview({ cardData, triggerText, className = '' }: TriggerTextPreviewProps) {
  return (
    <div className={`content-stretch flex flex-col gap-[24px] items-start relative size-full ${className}`}>
      <MessageCard cardData={cardData} />
      <TriggerText text={triggerText} />
    </div>
  );
}

// ========== 通用预览容器 ==========

/**
 * 渐变背景预览容器
 * 用于包裹需要渐变背景的预览内容
 */
export function GradientPreviewContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-to-b from-[#a5d8ff] relative rounded-[20px] to-[#d0ebff] ${className}`}>
      <div className="h-full min-h-[720px] flex items-center justify-center">
        <div className="box-border content-stretch flex gap-[20px] items-center pb-[24px] pl-[24px] pr-[24px] pt-[24px] relative">
          <OABadge />
          <div className="relative shrink-0 w-[288px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 简单预览容器
 * 用于不需要OA徽章的简单预览
 */
export function SimplePreviewContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`content-stretch flex flex-col gap-[24px] items-start relative size-full ${className}`}>
      {children}
    </div>
  );
}
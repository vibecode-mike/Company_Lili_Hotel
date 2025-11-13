# 容器组件重构示例

本文档展示如何使用共享容器组件重构现有代码，以 ChatRoom.tsx 为例。

## 重构前（原始代码）

```tsx
// ChatRoom.tsx - 重构前

function TitleContainer({ onBack }: { onBack: () => void }) {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Title Container">
      <div 
        onClick={onBack}
        className="content-stretch flex gap-[4px] items-center relative shrink-0 cursor-pointer hover:opacity-70 transition-opacity" 
        data-name="Button_Icon 24+Typo H6"
      >
        <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Arrow">
          <div className="absolute flex inset-[25.02%_36.3%_28.42%_36.27%] items-center justify-center">
            <div className="flex-none h-[6.585px] rotate-[90deg] w-[11.175px]">
              <div className="relative size-full" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                  <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" id="Vector" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <Frame8 />
      </div>
    </div>
  );
}

function HeaderContainer({ onBack }: { onBack: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Header Container">
      <TitleContainer onBack={onBack} />
    </div>
  );
}

function MainContent({ member, onBack }: { member: Member; onBack: () => void }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[32px] items-start p-[40px] relative w-full">
          <HeaderContainer onBack={onBack} />
          <ChatRoomFixed member={member} onBack={onBack} />
        </div>
      </div>
    </div>
  );
}
```

**问题分析**:
1. `TitleContainer` 和 `HeaderContainer` 在多个文件中重复定义
2. 每个文件都维护自己的容器组件版本
3. 修改样式需要在多个地方同步更新
4. 代码重复导致文件体积增大

## 重构后（使用共享组件）

```tsx
// ChatRoom.tsx - 重构后

import { 
  TitleContainer, 
  HeaderContainer,
  ContentContainer 
} from './common/Containers';

// 删除本地的 TitleContainer 和 HeaderContainer 定义

// 保留特殊的返回按钮组件
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="content-stretch flex gap-[4px] items-center relative shrink-0 cursor-pointer hover:opacity-70 transition-opacity" 
      data-name="Button_Icon 24+Typo H6"
    >
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Arrow">
        <div className="absolute flex inset-[25.02%_36.3%_28.42%_36.27%] items-center justify-center">
          <div className="flex-none h-[6.585px] rotate-[90deg] w-[11.175px]">
            <div className="relative size-full" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                <path d={svgPaths.pc951b80} fill="var(--fill-0, #6E6E6E)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Frame8 />
    </div>
  );
}

function MainContent({ member, onBack }: { member: Member; onBack: () => void }) {
  return (
    <ContentContainer padding="40px">
      <HeaderContainer>
        <TitleContainer onBack={onBack}>
          <Frame8 />
        </TitleContainer>
      </HeaderContainer>
      <ChatRoomFixed member={member} onBack={onBack} />
    </ContentContainer>
  );
}
```

**改进说明**:
1. ✅ 导入共享的 `TitleContainer`、`HeaderContainer` 和 `ContentContainer`
2. ✅ 删除本地的重复定义
3. ✅ 保留特殊的 `BackButton` 组件（因为它包含特定的 SVG 图标）
4. ✅ 使用共享组件重新组织代码结构
5. ✅ 代码更简洁，易于维护

## 更多重构示例

### 示例 1: 简单的头部区域

**重构前**:
```tsx
function HeaderContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Header Container">
      <TitleContainer />
      <DescriptionContainer />
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Title Container">
      <h1>活动与讯息推播</h1>
    </div>
  );
}

function DescriptionContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Description Container">
      <p>建立单一图文或多页轮播内容</p>
    </div>
  );
}
```

**重构后**:
```tsx
import { HeaderContainer, TitleContainer, DescriptionContainer } from './common/Containers';

<HeaderContainer>
  <TitleContainer>
    <h1>活动与讯息推播</h1>
  </TitleContainer>
  <DescriptionContainer>
    <p>建立单一图文或多页轮播内容</p>
  </DescriptionContainer>
</HeaderContainer>
```

**减少代码量**: 约 15 行 → 7 行

### 示例 2: 按钮组

**重构前**:
```tsx
function ButtonContainer() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name="Button Container">
      <button className="btn-cancel">取消</button>
      <button className="btn-confirm">确认</button>
    </div>
  );
}
```

**重构后**:
```tsx
import { ButtonContainer } from './common/Containers';

<ButtonContainer justify="end" gap={8}>
  <button className="btn-cancel">取消</button>
  <button className="btn-confirm">确认</button>
</ButtonContainer>
```

**减少代码量**: 约 8 行 → 4 行

### 示例 3: 标签列表

**重构前**:
```tsx
function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-[4px]">
      {tags.map((tag, index) => (
        <span key={index} className="tag">{tag}</span>
      ))}
    </div>
  );
}
```

**重构后**:
```tsx
import { TagContainer } from './common/Containers';

function TagList({ tags }: { tags: string[] }) {
  return (
    <TagContainer gap={4}>
      {tags.map((tag, index) => (
        <span key={index} className="tag">{tag}</span>
      ))}
    </TagContainer>
  );
}
```

**减少代码量**: 约 7 行 → 5 行

## 重构检查清单

在重构文件时，请按照以下步骤进行：

- [ ] 1. 识别文件中重复的容器组件
- [ ] 2. 检查共享组件库中是否有对应的组件
- [ ] 3. 导入所需的共享组件
- [ ] 4. 替换本地定义的容器组件
- [ ] 5. 删除不再使用的本地定义
- [ ] 6. 测试功能是否正常
- [ ] 7. 检查样式是否一致
- [ ] 8. 提交代码并注明重构内容

## 需要重构的文件清单

### 高优先级（重复最多的组件）

#### TitleContainer (8 个文件)
- [ ] `/components/ChatRoom.tsx`
- [ ] `/imports/MainContainer-6001-1415.tsx`
- [ ] `/imports/MainContainer-6001-3170.tsx`
- [ ] `/imports/MainContainer-6013-738.tsx`
- [ ] `/imports/MainContainer.tsx`
- [ ] `/imports/MainContent.tsx`
- [ ] `/imports/MemberManagementInboxNormalState-8046-2742.tsx`
- [ ] `/imports/MemberManagementInboxNormalState.tsx`

#### HeaderContainer (10 个文件)
- [ ] `/components/ChatRoom.tsx`
- [ ] `/imports/MainContainer-6001-1415.tsx`
- [ ] `/imports/MainContainer-6001-3170.tsx`
- [ ] `/imports/MainContainer-6013-738.tsx`
- [ ] `/imports/MainContainer.tsx`
- [ ] `/imports/MainContent.tsx`
- [ ] `/imports/MemberManagementInboxNormalState-8046-2742.tsx`
- [ ] `/imports/MemberManagementInboxNormalState.tsx`
- [ ] `/imports/PushMessage圖卡按鈕型-4-1916.tsx`
- [ ] `/imports/251103會員管理MemberManagementV01.tsx`

### 中优先级

#### ButtonContainer (3 个文件)
- [ ] `/imports/MemberTagModalFuzzySearchCreation.tsx`
- [ ] `/imports/MemberTagModalNormal.tsx`
- [ ] `/imports/PushMessage圖卡按鈕型-4-1916.tsx`

## 预期收益

通过完成以上重构，预计可以：

1. **减少代码量**: 每个文件平均减少 10-30 行重复代码
2. **提高可维护性**: 容器组件修改只需在一个地方进行
3. **统一样式**: 确保所有页面的容器组件样式一致
4. **提升开发效率**: 新页面可以直接使用共享组件，无需重新定义
5. **降低错误率**: 减少复制粘贴导致的错误

## 注意事项

1. **保留特殊组件**: 如果某个容器组件有特殊的样式或行为，可以保留本地定义
2. **逐步重构**: 不需要一次性重构所有文件，可以分批进行
3. **充分测试**: 重构后要确保功能和样式都没有问题
4. **文档更新**: 如果添加了新的共享组件，记得更新文档

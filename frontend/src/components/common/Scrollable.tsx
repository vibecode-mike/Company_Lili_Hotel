import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEventHandler,
} from 'react';
import { cn } from '../ui/utils';

type Orientation = 'vertical' | 'horizontal' | 'both';

interface ScrollableProps {
  children: ReactNode;
  /** 捲動方向，預設 vertical */
  orientation?: Orientation;
  /** 外層 wrapper 的 class（通常放版面尺寸：w-full / flex-1 / h-full） */
  className?: string;
  /** 內層 viewport（真正的捲動元素）的 class（max-h / padding / gap / bg…） */
  viewportClassName?: string;
  /** 直接掛到 viewport 的 onScroll（保留既有事件，如聊天室無限捲動 / SSE 自動捲動） */
  onScroll?: UIEventHandler<HTMLDivElement>;
  /** viewport 的 inline style（少用） */
  viewportStyle?: CSSProperties;
  /**
   * 固定在捲動區「上方」的表頭。會渲染在 viewport **之外**（不被捲動、不被 thumb 覆蓋）。
   * 取代「把 sticky 表頭塞進 children」的舊用法——舊用法會讓 sticky 表頭在原生捲動時
   * 抖動回彈（main-thread sticky 重算落後合成器一幀），且 thumb 會從表頭區就開始畫、蓋住表頭。
   */
  header?: ReactNode;
}

/**
 * 共用自繪捲軸容器（捲軸方案 C）。
 *
 * - 原生捲動仍發生在 viewport（保留外部 ref / onScroll / scrollTop 控制），
 *   只是用 .no-native-scrollbar 隱藏原生捲軸，改畫 4px thumb。
 * - hover「整個容器」才顯示 thumb（純 JS 控制，繞開 Chrome 對容器 :hover
 *   重繪 ::-webkit-scrollbar 不可靠的問題）；拖曳中持續顯示。
 * - 內容無溢出 → thumb 自動隱藏。縱向 / 橫向皆支援。
 * - forwardRef 對外暴露 viewport DOM（捲動元素），供呼叫端做 scrollTop / scrollIntoView。
 */
const Scrollable = forwardRef<HTMLDivElement, ScrollableProps>(function Scrollable(
  { children, orientation = 'vertical', className, viewportClassName, onScroll, viewportStyle, header },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const vThumbRef = useRef<HTMLDivElement>(null);
  const hThumbRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false); // hover 整個容器 或 拖曳中

  useImperativeHandle(ref, () => viewportRef.current as HTMLDivElement, []);

  const showV = orientation === 'vertical' || orientation === 'both';
  const showH = orientation === 'horizontal' || orientation === 'both';

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let rafId = 0;

    const apply = () => {
      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = el;

      if (showV && vThumbRef.current) {
        const thumb = vThumbRef.current;
        const maxScroll = Math.max(0, scrollHeight - clientHeight);
        if (maxScroll <= 0 || clientHeight === 0) {
          thumb.style.display = 'none';
        } else {
          thumb.style.display = '';
          const trackH = clientHeight;
          const thumbH = Math.max(24, (clientHeight / scrollHeight) * trackH);
          const thumbTop = (scrollTop / maxScroll) * (trackH - thumbH);
          thumb.style.transform = `translateY(${thumbTop}px)`;
          thumb.style.height = `${thumbH}px`;
        }
      }

      if (showH && hThumbRef.current) {
        const thumb = hThumbRef.current;
        const maxScroll = Math.max(0, scrollWidth - clientWidth);
        if (maxScroll <= 0 || clientWidth === 0) {
          thumb.style.display = 'none';
        } else {
          thumb.style.display = '';
          const trackW = clientWidth;
          const thumbW = Math.max(24, (clientWidth / scrollWidth) * trackW);
          const thumbLeft = (scrollLeft / maxScroll) * (trackW - thumbW);
          thumb.style.transform = `translateX(${thumbLeft}px)`;
          thumb.style.width = `${thumbW}px`;
        }
      }
    };

    const schedule = () => {
      if (rafId) return; // 同一幀多次 scroll 合併成一次寫
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        apply();
      });
    };

    apply();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const mo = new MutationObserver(apply);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      mo.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showV, showH]);

  const startDrag = (axis: 'v' | 'h') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = viewportRef.current;
    if (!el) return;
    setActive(true);

    const vertical = axis === 'v';
    const start = vertical ? e.clientY : e.clientX;
    const startScroll = vertical ? el.scrollTop : el.scrollLeft;
    const track = vertical ? el.clientHeight : el.clientWidth;
    const thumbSize = vertical
      ? vThumbRef.current?.offsetHeight ?? track / 3
      : hThumbRef.current?.offsetWidth ?? track / 3;
    const maxScroll = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const ratio = maxScroll / (track - thumbSize);

    const onMove = (ev: MouseEvent) => {
      const delta = (vertical ? ev.clientY : ev.clientX) - start;
      if (vertical) el.scrollTop = startScroll + delta * ratio;
      else el.scrollLeft = startScroll + delta * ratio;
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      setActive(false);
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const thumbBase =
    'pointer-events-auto absolute rounded-[4px] bg-black/30 hover:bg-black/45 active:bg-black/55 cursor-grab active:cursor-grabbing transition-opacity duration-150';
  const thumbStyle: CSSProperties = { opacity: active ? 1 : 0, willChange: 'transform' };

  // viewport（真正的捲動元素）+ 自繪 thumb。thumb 用 absolute 定位，
  // 以「最近的 relative 祖先」為基準框：無 header 時是最外層、有 header 時是包住 viewport 的內層，
  // 確保 thumb 的垂直範圍只涵蓋可捲動內容（表頭以下），不會蓋到 header。
  const scrollRegion = (
    <>
      <div
        ref={viewportRef}
        className={cn('no-native-scrollbar', viewportClassName)}
        style={{
          overflowX: showH ? 'auto' : 'hidden',
          overflowY: showV ? 'auto' : 'hidden',
          ...viewportStyle,
        }}
        onScroll={onScroll}
      >
        {children}
      </div>

      {showV && (
        <div className="pointer-events-none absolute top-0 right-0 bottom-0" style={{ width: 4, zIndex: 20 }}>
          <div
            ref={vThumbRef}
            onMouseDown={startDrag('v')}
            className={cn(thumbBase, 'right-0 top-0 w-[4px]')}
            style={thumbStyle}
          />
        </div>
      )}

      {showH && (
        <div className="pointer-events-none absolute left-0 right-0 bottom-0" style={{ height: 4, zIndex: 20 }}>
          <div
            ref={hThumbRef}
            onMouseDown={startDrag('h')}
            className={cn(thumbBase, 'bottom-0 left-0 h-[4px]')}
            style={thumbStyle}
          />
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {header == null ? (
        // 無 header：維持原行為，thumb 以最外層 relative 為基準（涵蓋整個 viewport）
        scrollRegion
      ) : (
        <>
          {/* header 渲染在 viewport 之外 → 不被捲動、不抖動 */}
          {header}
          {/* 內層 relative 只包住 viewport → thumb 範圍僅在表頭以下的捲動區 */}
          <div className="relative">{scrollRegion}</div>
        </>
      )}
    </div>
  );
});

export default Scrollable;

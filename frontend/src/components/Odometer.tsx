import React, { useEffect, useMemo, useRef } from "react";

interface OdometerProps {
  value: number | string;
  // 附加在數字後（如 % / 單 / 人），靜止不動畫
  unit?: string;
  // false 時直接顯示終值不動畫；true 時若是首播跑階梯式進場，否則跑補間
  active: boolean;
  reducedMotion: boolean;
  // 進場：第 i 位 duration = baseDuration + (n-i-1) * perDigitOffset（高位慢、個位快）
  baseDuration?: number;
  perDigitOffset?: number;
  // 進場 delay（ms），通常用於卡片之間的 stagger
  delay?: number;
  // 資料變化補間（active=true 已首播後）的 duration
  tweenDuration?: number;
  // 是否要跑首次進場階梯動畫；false 時即使是首次掛載也直接顯示終值
  // （用於父層批次進場結束後才 mount 的元件，避免帶到舊的 stagger delay）
  playEntry?: boolean;
  className?: string;
  charClassName?: string;
}

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

function OdometerImpl({
  value,
  unit = "",
  active,
  reducedMotion,
  baseDuration = 1000,
  perDigitOffset = 120,
  delay = 0,
  tweenDuration = 700,
  playEntry = true,
  className = "",
  charClassName = "",
}: OdometerProps) {
  const text = `${value}${unit}`;
  const columnsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const prevDigitsRef = useRef<number[]>([]);
  const hasPlayedRef = useRef<boolean>(false);
  // 每個 column 對應的當前 animation；快速連切時用來 cancel 舊動畫，避免堆疊
  const animsRef = useRef<Map<HTMLSpanElement, Animation>>(new Map());

  // render 階段拆出每位目標 digit；ref callback 與 useEffect 共用，避免重複拆字
  const targets = useMemo(() => {
    const arr: number[] = [];
    for (const ch of text) {
      if (/\d/.test(ch)) arr.push(parseInt(ch, 10));
    }
    return arr;
  }, [text]);

  // 是否要跳過進場動畫直接設終值（在 ref callback 與 effect 中重複判斷邏輯）
  const skipEntryAtMount = !active || reducedMotion || !playEntry;

  useEffect(() => {
    const n = targets.length;

    // 取消當前所有舊 animation，清掉 callback 避免 oncancel 競爭把 will-change 提早關掉
    const cancelExisting = (el: HTMLSpanElement) => {
      const old = animsRef.current.get(el);
      if (old) {
        old.onfinish = null;
        old.oncancel = null;
        old.cancel();
        animsRef.current.delete(el);
      }
    };

    // 尚未進場 / 使用者偏好減少動畫 / playEntry=false 且首次掛載：直接設終值
    // 用 em 為單位：column 內每個數字格高度 1.5em（對齊父層 line-height: 1.5），
    // translateY(-N * 1.5em) 剛好對齊第 N 位
    const skipEntry = !playEntry && !hasPlayedRef.current;
    if (!active || reducedMotion || skipEntry) {
      columnsRef.current.forEach((el, i) => {
        if (!el) return;
        cancelExisting(el);
        const t = targets[i] ?? 0;
        el.style.transform = `translateY(-${t * 1.5}em)`;
        el.style.willChange = "";
      });
      prevDigitsRef.current = targets;
      // 跳過進場後仍標記為「已跑過」，未來 value 變化才會走補間而非首次階梯
      if (skipEntry) hasPlayedRef.current = true;
      return;
    }

    const isFirstPlay = !hasPlayedRef.current;
    columnsRef.current.forEach((el, i) => {
      if (!el) return;
      const target = targets[i] ?? 0;
      const prev = isFirstPlay ? 0 : (prevDigitsRef.current[i] ?? 0);
      const fromTransform = `translateY(-${prev * 1.5}em)`;
      const toTransform = `translateY(-${target * 1.5}em)`;
      const dur = isFirstPlay
        ? baseDuration + (n - i - 1) * perDigitOffset
        : tweenDuration;
      const dly = isFirstPlay ? delay : 0;
      cancelExisting(el);
      // 同 digit 不需動畫；仍 set 終值避免初始 unset
      if (prev === target && !isFirstPlay) {
        el.style.transform = toTransform;
        el.style.willChange = "";
        return;
      }
      try {
        // 動畫期間才提升 GPU layer，結束後立刻釋放
        el.style.willChange = "transform";
        const anim = el.animate(
          [{ transform: fromTransform }, { transform: toTransform }],
          { duration: dur, delay: dly, easing: EASING, fill: "forwards" },
        );
        const cleanup = () => {
          el.style.willChange = "";
          if (animsRef.current.get(el) === anim) animsRef.current.delete(el);
        };
        anim.onfinish = cleanup;
        anim.oncancel = cleanup;
        animsRef.current.set(el, anim);
      } catch {
        // 環境不支援 Web Animations API：直接設終值
        el.style.transform = toTransform;
        el.style.willChange = "";
      }
    });
    prevDigitsRef.current = targets;
    hasPlayedRef.current = true;
  }, [targets, active, reducedMotion, baseDuration, perDigitOffset, delay, tweenDuration, playEntry]);

  // 元件卸下時清光所有殘留 animation，避免在 detached node 上保留 callback
  useEffect(() => {
    const animsMap = animsRef.current;
    return () => {
      animsMap.forEach((a) => {
        a.onfinish = null;
        a.oncancel = null;
        a.cancel();
      });
      animsMap.clear();
    };
  }, []);

  let digitIdx = 0;
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      {Array.from(text).map((ch, i) => {
        if (/\d/.test(ch)) {
          const idx = digitIdx++;
          return (
            <span
              key={`d-${i}`}
              aria-hidden="true"
              className={charClassName}
              style={{
                display: "inline-block",
                height: "1.5em",
                lineHeight: 1.5,
                overflow: "hidden",
                verticalAlign: "baseline",
              }}
            >
              <span
                ref={(el) => {
                  columnsRef.current[idx] = el;
                  // 首次 mount 且不跑進場：commit 階段就設好 transform，
                  // 不必等 useEffect 跑完才從 0 跳到終值，避免一次 mount 大量 row 時的視覺延遲
                  if (el && !hasPlayedRef.current && skipEntryAtMount) {
                    const t = targets[idx] ?? 0;
                    el.style.transform = `translateY(-${t * 1.5}em)`;
                  }
                }}
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  // willChange 由 useEffect 動態管理，動畫期間才掛、結束後釋放 GPU layer
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n} style={{ height: "1.5em", lineHeight: 1.5 }}>
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        }
        return (
          <span key={`s-${i}`} className={charClassName} aria-hidden="true">
            {ch}
          </span>
        );
      })}
      {/* 讓螢幕閱讀器讀完整文字（mask 內 0–9 因 aria-hidden 不會被讀） */}
      <span className="sr-only">{text}</span>
    </span>
  );
}

function propsAreEqual(prev: OdometerProps, next: OdometerProps) {
  return (
    prev.value === next.value &&
    prev.unit === next.unit &&
    prev.active === next.active &&
    prev.reducedMotion === next.reducedMotion &&
    prev.delay === next.delay &&
    prev.baseDuration === next.baseDuration &&
    prev.perDigitOffset === next.perDigitOffset &&
    prev.tweenDuration === next.tweenDuration &&
    prev.playEntry === next.playEntry &&
    prev.className === next.className &&
    prev.charClassName === next.charClassName
  );
}

export const Odometer = React.memo(OdometerImpl, propsAreEqual);

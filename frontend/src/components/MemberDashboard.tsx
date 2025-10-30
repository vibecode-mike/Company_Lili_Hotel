import { useState } from 'react';
import MemberManagementPage from '../features/members/MemberManagementPage';
import sidebarPaths from '../imports/svg-jb10q6lg6b';
import {
  imgGroup,
  imgGroup1,
  imgGroup2,
  imgGroup3,
  imgGroup4,
  imgGroup5,
  imgGroup6,
} from '../imports/svg-zrjx6';

interface MemberDashboardProps {
  onShowMessages: () => void;
  onShowMembers?: () => void;
}

function StarbitLogo() {
  return (
    <div className="h-[49.333px] overflow-visible relative shrink-0 w-[148px]">
      <div className="absolute inset-[24.73%_62.3%_43%_29.83%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={sidebarPaths.p7342f80} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div
        className="absolute inset-[19.24%_60.47%_37.55%_28.01%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.697px_2.706px] mask-size-[11.65px_15.923px]"
        style={{ maskImage: `url('${imgGroup}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 22">
          <path d={sidebarPaths.p361e8400} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_53.22%_43.6%_38.6%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
          <path clipRule="evenodd" d={sidebarPaths.p1f6b2880} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div
        className="absolute inset-[20.91%_51.39%_38.13%_36.77%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.701px] mask-size-[12.116px_14.805px]"
        style={{ maskImage: `url('${imgGroup1}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.pa9b4c00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_44.05%_43.6%_46.53%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 16">
          <path clipRule="evenodd" d={sidebarPaths.p26ade400} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div
        className="absolute inset-[19.82%_42.23%_38.13%_44.71%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.696px] mask-size-[13.937px_15.348px]"
        style={{ maskImage: `url('${imgGroup2}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 21">
          <path d={sidebarPaths.p3b240180} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.29%_34.51%_43.6%_57.22%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 16">
          <path clipRule="evenodd" d={sidebarPaths.p335ae980} fill="#189AEB" fillRule="evenodd" />
        </svg>
      </div>
      <div
        className="absolute inset-[19.82%_32.69%_38.13%_55.4%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.7px_2.696px] mask-size-[12.235px_15.348px]"
        style={{ maskImage: `url('${imgGroup3}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.p2baf8a00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[25.3%_24.44%_43.6%_67.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
          <path clipRule="evenodd" d={sidebarPaths.p5c7b800} fill="#6ED7FF" fillRule="evenodd" />
        </svg>
      </div>
      <div
        className="absolute inset-[19.82%_22.62%_38.13%_65.76%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.701px] mask-size-[11.801px_15.343px]"
        style={{ maskImage: `url('${imgGroup4}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.p20a15b00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[25.84%_20.11%_43.6%_77.65%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 16">
          <path d={sidebarPaths.p38d4b100} fill="#6ED7FF" />
        </svg>
      </div>
      <div
        className="absolute inset-[20.36%_18.29%_38.13%_75.83%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.703px_2.701px] mask-size-[3.31px_15.076px]"
        style={{ maskImage: `url('${imgGroup5}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 21">
          <path d={sidebarPaths.p31afde00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[26.39%_9.96%_43.6%_81.86%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 15">
          <path clipRule="evenodd" d={sidebarPaths.p18a2a000} fill="#6ED7FF" fillRule="evenodd" />
        </svg>
      </div>
      <div
        className="absolute inset-[20.91%_8.13%_38.13%_80.03%] mask-intersect mask-luminance mask-no-clip mask-no-repeat mask-position-[2.702px_2.701px] mask-size-[12.114px_14.805px]"
        style={{ maskImage: `url('${imgGroup6}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 21">
          <path d={sidebarPaths.p1df19600} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[23.55%_79.27%_61.17%_10.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
          <path d={sidebarPaths.peae5a00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[38.83%_76.47%_42.23%_10.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 10">
          <path d={sidebarPaths.p56e0200} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[23.57%_76.37%_58.34%_18.22%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 9">
          <path d={sidebarPaths.p3047d700} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[53.48%_84.18%_26.93%_9.37%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={sidebarPaths.p38a8ff00} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[57.77%_76.47%_26.91%_12.72%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 8">
          <path d={sidebarPaths.p29639800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[22.41%_72.4%_67.66%_24.12%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 5">
          <path d={sidebarPaths.p29088600} fill="#6ED7FF" />
        </svg>
      </div>
      <div className="absolute inset-[63.59%_64.96%_25.62%_31.17%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p1b016f00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63%_56.2%_25.28%_40.09%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p3d5c5b00} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63.13%_47.23%_25.2%_48.93%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p32938000} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.93%_38.59%_25.16%_57.81%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p2e055800} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.96%_29.55%_25.22%_66.71%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p1c98d3b0} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[62.9%_20.63%_25.25%_75.58%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p664e180} fill="#189AEB" />
        </svg>
      </div>
      <div className="absolute inset-[63.18%_11.74%_25.36%_84.49%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={sidebarPaths.p7d2500} fill="#189AEB" />
        </svg>
      </div>
    </div>
  );
}

export default function MemberDashboard({ onShowMessages, onShowMembers = () => {} }: MemberDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-slate-50 min-h-screen flex">
      <aside
        className={`bg-slate-100 content-stretch flex flex-col h-screen items-start fixed top-0 left-0 shrink-0 z-50 ${
          sidebarOpen ? 'w-[330px] lg:w-[280px] md:w-[250px]' : 'w-[72px]'
        } transition-all duration-300`}
      >
        <div className="box-border flex items-center justify-between p-4 w-full">
          {sidebarOpen && (
            <div className="content-stretch flex flex-col h-[56px] items-start justify-center overflow-clip relative shrink-0 w-[148px]">
              <StarbitLogo />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="overflow-clip relative shrink-0 size-[32px] hover:opacity-70 transition-opacity"
          >
            <svg className="block size-full" fill="none" viewBox="0 0 27 24">
              <rect height="22" rx="7" stroke="#B6C8F1" strokeWidth="2" width="24.6667" x="1" y="1" />
              <path d="M9.99992 0L9.99992 24" stroke="#B6C8F1" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="flex-1 w-full overflow-y-auto">
          {sidebarOpen && (
            <>
              <div className="box-border flex flex-col gap-1 px-4">
                <div className="box-border flex gap-1 h-[29px] items-center p-1">
                  <svg className="shrink-0 size-[18px]" fill="none" viewBox="0 0 14 13">
                    <path d={sidebarPaths.p25432100} fill="#6E6E6E" />
                  </svg>
                  <p className="text-[14px] text-[#6e6e6e]">群發訊息</p>
                </div>
                <button
                  type="button"
                  onClick={onShowMessages}
                  className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors"
                >
                  <p className="text-[16px] text-[#383838]">活動與訊息推播</p>
                </button>
                <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                  <p className="text-[16px] text-[#383838]">自動回應</p>
                </button>
              </div>

              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <div className="box-border flex gap-1 h-[29px] items-center p-1">
                  <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 14 14">
                    <path d={sidebarPaths.pa54d00} fill="#6E6E6E" />
                  </svg>
                  <p className="text-[14px] text-[#6e6e6e]">會員</p>
                </div>
                <button
                  type="button"
                  onClick={onShowMembers}
                  className="bg-[#e1ebf9] box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-[#d0e0f5] transition-colors"
                >
                  <p className="text-[16px] text-[#0f6beb]">會員管理</p>
                </button>
              </div>

              <div className="box-border flex flex-col gap-1 px-4 mt-5">
                <div className="box-border flex gap-1 h-[29px] items-center p-1">
                  <svg className="shrink-0 size-[20px]" fill="none" viewBox="0 0 20 20">
                    <path d={sidebarPaths.p16734900} fill="#6E6E6E" />
                  </svg>
                  <p className="text-[14px] text-[#6e6e6e]">設定</p>
                </div>
                <button className="box-border flex items-center px-[28px] py-[8px] rounded-[8px] w-full hover:bg-slate-200 transition-colors">
                  <p className="text-[16px] text-[#383838]">標籤管理</p>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-100 box-border border-t border-[#b6c8f1] flex flex-col items-start pb-[44px] pt-[12px] px-4 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="bg-white relative rounded-full shrink-0 size-[32px] flex items-center justify-center">
              <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                <path d={sidebarPaths.p1c72d580} fill="#7A9FFF" />
              </svg>
            </div>
            {sidebarOpen && (
              <>
                <p className="flex-1 text-[16px] text-[#383838]">Daisy Yang</p>
                <button type="button" className="text-[16px] text-[#0f6beb] hover:underline">
                  登出
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main
        className={`flex-1 bg-slate-50 transition-all duration-300 ${
          sidebarOpen ? 'ml-[330px] lg:ml-[280px] md:ml-[250px]' : 'ml-[72px]'
        }`}
      >
        <div className="h-screen overflow-y-auto">
          <MemberManagementPage />
        </div>
      </main>
    </div>
  );
}


import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import StarbitLogo from '../StarbitLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithGoogle, loginWithLine } = useAuth();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('請輸入電子信箱');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('請輸入有效的電子信箱格式');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('請輸入密碼');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('密碼至少需要 6 個字符');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  const handleLineLogin = async () => {
    setIsLoading(true);
    await loginWithLine();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-[24px]">
      <div className="bg-white rounded-[20px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] w-full max-w-[440px] p-[40px]">
        <div className="flex justify-center mb-[32px]">
          <StarbitLogo className="h-[48px]" />
        </div>
        <h1 className="text-center text-[16px] leading-[24px] text-[#9ca3af] mb-[32px]">
          登入您的帳號以繼續
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] leading-[20px] text-[#000000]">電子信箱</label>
            <div className="relative">
              <Mail className="absolute left-[12px] top-[10px] size-[16px] text-[#9ca3af]" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="your@email.com"
                disabled={isLoading}
                className={`w-full h-[36px] pl-[40px] pr-[12px] rounded-[8px] bg-[#f3f3f5] text-[14px] text-[#000000] placeholder:text-[#9ca3af] border ${emailError ? 'border-red-500' : 'border-transparent'} focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>
            {emailError && <p className="text-[12px] leading-[16px] text-red-500">{emailError}</p>}
          </div>
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] leading-[20px] text-[#000000]">密碼</label>
            <div className="relative">
              <Lock className="absolute left-[12px] top-[10px] size-[16px] text-[#9ca3af]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full h-[36px] pl-[40px] pr-[40px] rounded-[8px] bg-[#f3f3f5] text-[14px] text-[#000000] placeholder:text-[#9ca3af] border ${passwordError ? 'border-red-500' : 'border-transparent'} focus:outline-none focus:ring-2 focus:ring-[#0f6beb] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} className="absolute right-[12px] top-[10px] text-[#9ca3af] hover:text-[#6b7280] transition-colors disabled:opacity-50">
                {showPassword ? <EyeOff className="size-[16px]" /> : <Eye className="size-[16px]" />}
              </button>
            </div>
            {passwordError && <p className="text-[12px] leading-[16px] text-red-500">{passwordError}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full h-[40px] rounded-[8px] bg-[#0a0a0a] text-white text-[14px] leading-[20px] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? <div className="size-[16px] border-2 border-white border-t-transparent rounded-full animate-spin" /> : '登入'}
          </button>
        </form>
        <div className="flex items-center gap-[12px] my-[24px]">
          <div className="flex-1 h-[1px] bg-[#e5e7eb]" />
          <span className="text-[14px] leading-[20px] text-[#9ca3af]">或使用</span>
          <div className="flex-1 h-[1px] bg-[#e5e7eb]" />
        </div>
        <div className="flex flex-col gap-[12px]">
          <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-[40px] rounded-[8px] bg-white border border-[#e5e7eb] text-[#000000] text-[14px] leading-[20px] hover:bg-[#f9fafb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-[8px]">
            {isLoading ? (
              <div className="size-[16px] border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="size-[20px]" viewBox="0 0 20 20" fill="none">
                  <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.8789 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4" />
                  <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853" />
                  <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0 8.36008 0 9.96565C0 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05" />
                  <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335" />
                </svg>
                <span>使用 Google 登入</span>
              </>
            )}
          </button>
          <button onClick={handleLineLogin} disabled={isLoading} className="w-full h-[40px] rounded-[8px] bg-white border border-[#e5e7eb] text-[#000000] text-[14px] leading-[20px] hover:bg-[#f9fafb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-[8px]">
            {isLoading ? (
              <div className="size-[16px] border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="size-[20px]" viewBox="0 0 20 20" fill="none">
                  <rect width="20" height="20" rx="4" fill="#06C755" />
                  <path d="M16.5 8.5C16.5 5.73858 13.8137 3.5 10.5 3.5C7.18629 3.5 4.5 5.73858 4.5 8.5C4.5 11.0163 6.74943 13.0877 9.74114 13.4429C9.89943 13.4742 10.1217 13.5406 10.1783 13.6774C10.2297 13.8032 10.2086 13.9977 10.1886 14.1248L10.11 14.5929C10.0891 14.7252 10.0086 15.1003 10.5 14.9097C10.9914 14.719 13.3674 13.2494 14.4957 11.9177C15.8457 10.8129 16.5 9.73858 16.5 8.5Z" fill="white" />
                  <path d="M8.5 9.5V7.5C8.5 7.36739 8.44732 7.24021 8.35355 7.14645C8.25979 7.05268 8.13261 7 8 7C7.86739 7 7.74021 7.05268 7.64645 7.14645C7.55268 7.24021 7.5 7.36739 7.5 7.5V10C7.5 10.1326 7.55268 10.2598 7.64645 10.3536C7.74021 10.4473 7.86739 10.5 8 10.5H9.5C9.63261 10.5 9.75979 10.4473 9.85355 10.3536C9.94732 10.2598 10 10.1326 10 10C10 9.86739 9.94732 9.74021 9.85355 9.64645C9.75979 9.55268 9.63261 9.5 9.5 9.5H8.5Z" fill="#06C755" />
                  <path d="M11 7.5C11 7.36739 11.0527 7.24021 11.1464 7.14645C11.2402 7.05268 11.3674 7 11.5 7C11.6326 7 11.7598 7.05268 11.8536 7.14645C11.9473 7.24021 12 7.36739 12 7.5V10C12 10.1326 11.9473 10.2598 11.8536 10.3536C11.7598 10.4473 11.6326 10.5 11.5 10.5C11.3674 10.5 11.2402 10.4473 11.1464 10.3536C11.0527 10.2598 11 10.1326 11 10V7.5Z" fill="#06C755" />
                  <path d="M14.5 7.5C14.5 7.36739 14.4473 7.24021 14.3536 7.14645C14.2598 7.05268 14.1326 7 14 7C13.8674 7 13.7402 7.05268 13.6464 7.14645C13.5527 7.24021 13.5 7.36739 13.5 7.5V9.5H12.5C12.3674 9.5 12.2402 9.55268 12.1464 9.64645C12.0527 9.74021 12 9.86739 12 10C12 10.1326 12.0527 10.2598 12.1464 10.3536C12.2402 10.4473 12.3674 10.5 12.5 10.5H14C14.1326 10.5 14.2598 10.4473 14.3536 10.3536C14.4473 10.2598 14.5 10.1326 14.5 10V7.5Z" fill="#06C755" />
                  <path d="M10.5 7.5C10.5 7.36739 10.4473 7.24021 10.3536 7.14645C10.2598 7.05268 10.1326 7 10 7C9.86739 7 9.74021 7.05268 9.64645 7.14645C9.55268 7.24021 9.5 7.36739 9.5 7.5V10.5C9.5 10.6326 9.55268 10.7598 9.64645 10.8536C9.74021 10.9473 9.86739 11 10 11C10.1326 11 10.2598 10.9473 10.3536 10.8536C10.4473 10.7598 10.5 10.6326 10.5 10.5V7.5Z" fill="#06C755" />
                </svg>
                <span>使用 LINE 登入</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-[24px] p-[12px] bg-[#f3f4f6] rounded-[8px]">
          <p className="text-[12px] leading-[16px] text-[#6b7280] text-center">測試帳號：admin@starbit.com</p>
          <p className="text-[12px] leading-[16px] text-[#6b7280] text-center">密碼：admin123</p>
        </div>
      </div>
    </div>
  );
}
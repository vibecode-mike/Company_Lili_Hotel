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

  const { login } = useAuth();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('請輸入電子信箱');
      return true; // 顯示錯誤但不阻擋
    }
    if (!emailRegex.test(value)) {
      setEmailError('請輸入有效的電子信箱格式');
      return true; // 顯示錯誤但不阻擋
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
    // Email 顯示提示但不阻擋
    validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) return;
    setIsLoading(true);
    await login(email, password);
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
        <form onSubmit={handleLogin} noValidate className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[8px]">
            <label className="text-[14px] leading-[20px] text-[#000000]">電子信箱</label>
            <div className="relative">
              <Mail className="absolute left-[12px] top-[10px] size-[16px] text-[#9ca3af]" />
              <input
                type="text" // 避免瀏覽器原生 email 檢查阻擋送出
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
      </div>
    </div>
  );
}

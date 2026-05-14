import { useState, useEffect, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { PageWithSidebar } from "./Sidebar";
import { PageHeaderWithBreadcrumb } from "./common/Breadcrumb";
import { Tag } from "./common";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/apiClient";
import { useToast } from "./ToastProvider";
import { useAuth } from "./auth/AuthContext";
import { useChannel } from "../contexts/ChannelContext";
import { useLineChannels, LineChannelInfo } from "../hooks/useLineChannels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

type Role = "admin" | "marketing" | "customer_service";

interface ChannelBrief {
  channel_id: string;
  channel_name: string | null;
  basic_id: string | null;
}

interface StaffUser {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
  channels: ChannelBrief[];
}

interface FormState {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "customer_service"; // 表單只給兩種
  is_active: boolean;
  channel_ids: string[];
}

function roleLabel(role: Role): string {
  return role === "admin" ? "系統管理員" : "使用者";
}

interface Props {
  onNavigateToMessages?: () => void;
  onNavigateToAutoReply?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToInsights?: () => void;
}

export default function StaffUsersManagement({
  onNavigateToMessages,
  onNavigateToAutoReply,
  onNavigateToMembers,
  onNavigateToSettings,
  onNavigateToInsights,
}: Props) {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const { refetch: refetchMyChannels } = useChannel();
  const { channels: allChannels } = useLineChannels();

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StaffUser | null>(null);

  function emptyForm(): FormState {
    return {
      username: "",
      email: "",
      password: "",
      full_name: "",
      role: "customer_service",
      is_active: true,
      channel_ids: [],
    };
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet("/api/v1/staff/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setModalMode("create");
  };

  const openEdit = (u: StaffUser) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      full_name: u.full_name || "",
      role: u.role === "admin" ? "admin" : "customer_service",
      is_active: u.is_active,
      channel_ids: u.channels.map((c) => c.channel_id),
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
    setForm(emptyForm());
  };

  const activeAdminCount = useMemo(
    () => users.filter((u) => u.role === "admin" && u.is_active).length,
    [users]
  );

  const handleSubmit = async () => {
    if (saving) return;
    if (modalMode === "create") {
      if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
        showToast("帳號、Email、密碼皆為必填", "error");
        return;
      }
      if (form.password.length < 6) {
        showToast("密碼至少 6 個字元", "error");
        return;
      }
    } else if (modalMode === "edit") {
      if (!form.email.trim()) {
        showToast("Email 為必填", "error");
        return;
      }
      if (form.password && form.password.length < 6) {
        showToast("密碼至少 6 個字元", "error");
        return;
      }
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        const res = await apiPost("/api/v1/staff/users", {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim() || null,
          role: form.role,
          is_active: form.is_active,
          channel_ids: form.channel_ids,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        showToast("帳號已建立", "success");
      } else if (modalMode === "edit" && editingUser) {
        // 一般使用者：只能改自己的 email / full_name / password
        const patchBody: Record<string, unknown> = {
          email: form.email.trim(),
          full_name: form.full_name.trim() || null,
        };
        if (isAdmin) {
          patchBody.role = form.role;
          patchBody.is_active = form.is_active;
        }
        if (form.password) patchBody.password = form.password;
        const r1 = await apiPatch(`/api/v1/staff/users/${editingUser.id}`, patchBody);
        if (!r1.ok) {
          const err = await r1.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${r1.status}`);
        }
        // 館別只有 admin 能改
        if (isAdmin) {
          const r2 = await apiPatch(`/api/v1/staff/users/${editingUser.id}/channels`, {
            channel_ids: form.channel_ids,
          });
          if (!r2.ok) {
            const err = await r2.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${r2.status}`);
          }
        }
        showToast("帳號已更新", "success");
        if (currentUser && editingUser.email === currentUser.email) {
          await refetchMyChannels();
        }
      }
      closeModal();
      await fetchUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "儲存失敗";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await apiDelete(`/api/v1/staff/users/${deleteConfirm.id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      showToast("已刪除", "success");
      setDeleteConfirm(null);
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "刪除失敗", "error");
      setDeleteConfirm(null);
    }
  };

  const toggleChannel = (channelId: string) => {
    setForm((prev: FormState) =>
      prev.channel_ids.includes(channelId)
        ? { ...prev, channel_ids: prev.channel_ids.filter((c: string) => c !== channelId) }
        : { ...prev, channel_ids: [...prev.channel_ids, channelId] }
    );
  };

  const isSelf = (u: StaffUser) =>
    Boolean(
      currentUser &&
        ((currentUser.email && currentUser.email === u.email) ||
          (currentUser.email && currentUser.email === u.username) ||
          (currentUser.name && currentUser.name === u.username))
    );
  const isLastAdmin = (u: StaffUser) =>
    u.role === "admin" && u.is_active && activeAdminCount <= 1;

  const isAdmin = currentUser?.role === "admin";
  const canEditUser = (u: StaffUser) => isAdmin || isSelf(u);
  const canDeleteUser = (u: StaffUser) =>
    isAdmin && !isSelf(u) && !isLastAdmin(u);

  return (
    <PageWithSidebar
      currentPage="staff-users"
      onNavigateToMessages={onNavigateToMessages}
      onNavigateToAutoReply={onNavigateToAutoReply}
      onNavigateToMembers={onNavigateToMembers}
      onNavigateToSettings={onNavigateToSettings}
      onNavigateToInsights={onNavigateToInsights}
    >
      <div className="bg-slate-50 content-stretch flex flex-col items-start relative w-full">
        <PageHeaderWithBreadcrumb
          breadcrumbItems={[
            { label: "設定" },
            { label: "帳號管理", active: true },
          ]}
          title="帳號管理"
          description="新增、編輯員工帳號，並指派每個帳號可看到的 LINE 館別"
        />


        {/* Top bar */}
        <div className="px-[40px] pb-[16px] w-full">
          <div className="flex gap-[12px] items-center w-full">
            <p className="text-[#6e6e6e] text-[14px]">
              共 {users.length} 個帳號
              {activeAdminCount > 0 && `（其中 ${activeAdminCount} 位系統管理員）`}
            </p>
            <div className="flex-1" />
            {isAdmin && (
              <button
                onClick={openCreate}
                className="bg-[#242424] hover:bg-[#383838] text-white rounded-[16px] h-[48px] px-[20px] transition-colors flex items-center justify-center text-[16px]"
              >
                + 新增帳號
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="px-[40px] pb-[40px] w-full">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-[16px] bg-red-50 text-red-700 text-[14px]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-[#dddddd] bg-white text-[#6e6e6e]">
              <div className="flex flex-col items-center gap-2 text-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f6beb] border-r-transparent" />
                <span>資料載入中...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center rounded-[16px] border border-dashed border-[#dddddd] bg-white text-[#6e6e6e]">
              尚無帳號
            </div>
          ) : (
            <div className="bg-white rounded-[16px] w-full overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#dddddd]">
                    <th className="text-left px-[24px] py-[16px] text-[14px] text-[#6e6e6e] font-normal w-[180px]">
                      帳號
                    </th>
                    <th className="text-left px-[24px] py-[16px] text-[14px] text-[#6e6e6e] font-normal">
                      Email
                    </th>
                    <th className="text-left px-[24px] py-[16px] text-[14px] text-[#6e6e6e] font-normal w-[140px]">
                      角色
                    </th>
                    <th className="text-left px-[24px] py-[16px] text-[14px] text-[#6e6e6e] font-normal">
                      可用 LINE 館別
                    </th>
                    <th className="text-center px-[24px] py-[16px] text-[14px] text-[#6e6e6e] font-normal w-[80px]">
                      啟用
                    </th>
                    <th className="text-right px-[24px] py-[16px] text-[14px] text-[#6e6e6e] font-normal w-[140px]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        idx < users.length - 1 ? "border-b border-[#dddddd]" : ""
                      }`}
                    >
                      <td className="px-[24px] py-[20px]">
                        <span
                          className={`text-[15px] ${
                            isSelf(u) ? "text-red-500" : "text-[#383838]"
                          }`}
                        >
                          {u.username}
                        </span>
                      </td>
                      <td className="px-[24px] py-[20px] text-[14px] text-[#6e6e6e]">
                        {u.email}
                      </td>
                      <td className="px-[24px] py-[20px]">
                        <div className="inline-flex">
                          <Tag variant="blue">{roleLabel(u.role)}</Tag>
                        </div>
                      </td>
                      <td className="px-[24px] py-[20px]">
                        {u.channels.length === 0 ? (
                          <span className="text-[14px] text-gray-500">未指派</span>
                        ) : (
                          <div className="flex flex-wrap gap-[6px]">
                            {u.channels.map((c) => (
                              <Tag key={c.channel_id} variant="blue">
                                {c.channel_name || c.channel_id}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-[24px] py-[20px]">
                        <div className="flex justify-center">
                          {u.is_active ? (
                            <span className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-[6px] bg-[#0f6beb]">
                              <Check className="w-[16px] h-[16px] text-white" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-[6px] border border-[#dddddd] bg-white" />
                          )}
                        </div>
                      </td>
                      <td className="px-[24px] py-[20px]">
                        <div className="flex items-center justify-end gap-[28px]">
                          <button
                            onClick={() => openEdit(u)}
                            disabled={!canEditUser(u)}
                            title={
                              !canEditUser(u) ? "僅能編輯自己的帳號" : undefined
                            }
                            className="text-[#0f6beb] hover:underline text-[14px] disabled:text-[#dddddd] disabled:no-underline disabled:cursor-not-allowed"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            disabled={!canDeleteUser(u)}
                            title={
                              !isAdmin
                                ? "僅系統管理員可刪除帳號"
                                : isSelf(u)
                                  ? "不能刪除自己"
                                  : isLastAdmin(u)
                                    ? "至少保留 1 位系統管理員"
                                    : undefined
                            }
                            className="text-red-500 hover:underline text-[14px] disabled:text-[#dddddd] disabled:no-underline disabled:cursor-not-allowed"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalMode !== null} onOpenChange={(o: boolean) => !o && closeModal()}>
        <DialogContent className="sm:max-w-[560px]" style={{ width: "560px", maxWidth: "560px" }}>
          <DialogHeader>
            <DialogTitle className="font-medium" style={{ fontSize: "22px", color: "#383838" }}>
              {modalMode === "create" ? "新增帳號" : `編輯帳號`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-[20px] py-[8px]">
            {modalMode === "create" && (
              <Field label="帳號" required>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full h-[44px] px-[16px] border border-[#dddddd] rounded-[12px] text-[14px] text-[#383838] focus:outline-none focus:border-[#0f6beb] transition-colors"
                  placeholder="用於登入的帳號名稱"
                />
              </Field>
            )}

            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-[44px] px-[16px] border border-[#dddddd] rounded-[12px] text-[14px] text-[#383838] focus:outline-none focus:border-[#0f6beb] transition-colors"
                placeholder="example@company.com"
              />
            </Field>

            <Field label="姓名">
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full h-[44px] px-[16px] border border-[#dddddd] rounded-[12px] text-[14px] text-[#383838] focus:outline-none focus:border-[#0f6beb] transition-colors"
                placeholder="選填"
              />
            </Field>

            <Field
              label={modalMode === "create" ? "密碼" : "新密碼"}
              required={modalMode === "create"}
              hint={modalMode === "edit" ? "留空則不變更密碼" : undefined}
            >
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-[44px] px-[16px] border border-[#dddddd] rounded-[12px] text-[14px] text-[#383838] focus:outline-none focus:border-[#0f6beb] transition-colors"
                placeholder="至少 6 個字元"
              />
            </Field>

            {isAdmin ? (
              <>
                <Field label="角色">
                  <div className="flex gap-[12px]">
                    <RoleRadio
                      value="admin"
                      current={form.role}
                      label="系統管理員"
                      desc="可管理所有帳號與所有館別"
                      onChange={() => setForm({ ...form, role: "admin" })}
                    />
                    <RoleRadio
                      value="customer_service"
                      current={form.role}
                      label="使用者"
                      desc="僅能使用被指派的館別"
                      onChange={() => setForm({ ...form, role: "customer_service" })}
                    />
                  </div>
                </Field>

                <Field label="狀態">
                  <label className="flex items-center gap-[8px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-[18px] h-[18px] accent-[#0f6beb]"
                    />
                    <span className="text-[14px] text-[#383838]">啟用此帳號</span>
                  </label>
                </Field>

                <Field
                  label="可用 LINE 館別"
                  hint={
                    form.role === "admin"
                      ? "系統管理員預設可看所有館別，仍可在此調整"
                      : undefined
                  }
                >
                  {allChannels.length === 0 ? (
                    <p className="text-[13px] text-gray-500">尚未建立任何 LINE OA</p>
                  ) : (
                    <div className="space-y-[8px] max-h-[180px] overflow-y-auto border border-[#dddddd] rounded-[12px] p-[12px]">
                      {allChannels.map((c: LineChannelInfo) => (
                        <label
                          key={c.channel_id}
                          className="flex items-center gap-[10px] cursor-pointer hover:bg-[#F8FAFC] px-[8px] py-[6px] rounded-[8px] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={form.channel_ids.includes(c.channel_id)}
                            onChange={() => toggleChannel(c.channel_id)}
                            className="w-[18px] h-[18px] accent-[#0f6beb]"
                          />
                          <span className="text-[14px] text-[#383838]">
                            {c.channel_name || c.channel_id}
                          </span>
                          {c.basic_id && (
                            <span className="text-[12px] text-gray-500">{c.basic_id}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </Field>
              </>
            ) : (
              <>
                <Field label="角色" hint="如需調整請聯絡系統管理員">
                  <div className="px-[16px] py-[10px] rounded-[12px] bg-[#f5f5f5] text-[14px] text-[#6e6e6e]">
                    {form.role === "admin" ? "系統管理員" : "使用者"}
                  </div>
                </Field>

                <Field label="可用 LINE 館別" hint="如需調整請聯絡系統管理員">
                  {editingUser && editingUser.channels.length === 0 ? (
                    <div className="px-[16px] py-[10px] rounded-[12px] bg-[#f5f5f5] text-[14px] text-gray-500">
                      未指派
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-[6px] px-[16px] py-[10px] rounded-[12px] bg-[#f5f5f5]">
                      {editingUser?.channels.map((c) => (
                        <Tag key={c.channel_id} variant="blue">
                          {c.channel_name || c.channel_id}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Field>
              </>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={closeModal}
              disabled={saving}
              className="h-[44px] px-[20px] rounded-[12px] border border-[#dddddd] text-[14px] text-[#383838] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="h-[44px] px-[20px] rounded-[12px] bg-[#242424] hover:bg-[#383838] text-white text-[14px] transition-colors disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(o: boolean) => !o && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[440px]" style={{ width: "440px", maxWidth: "440px" }}>
          <DialogHeader>
            <DialogTitle className="font-medium" style={{ fontSize: "22px", color: "#383838" }}>
              確認刪除帳號？
            </DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[#6e6e6e] py-[8px]">
            將永久刪除帳號「<span className="text-[#383838] font-medium">{deleteConfirm?.username}</span>」，
            此操作無法復原。
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="h-[44px] px-[20px] rounded-[12px] border border-[#dddddd] text-[14px] text-[#383838] hover:bg-[#F8FAFC] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="h-[44px] px-[20px] rounded-[12px] bg-[#e7000b] hover:bg-[#c70009] text-white text-[14px] transition-colors"
            >
              確認刪除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWithSidebar>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-[6px] mb-[8px]">
        <label className="text-[14px] text-[#383838]">{label}</label>
        {required && <span className="text-red-500 text-[14px]">*</span>}
        {hint && <span className="text-[12px] text-gray-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function RoleRadio({
  value,
  current,
  label,
  desc,
  onChange,
}: {
  value: "admin" | "customer_service";
  current: "admin" | "customer_service";
  label: string;
  desc: string;
  onChange: () => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex-1 px-[16px] py-[12px] rounded-[12px] border text-left transition-colors ${
        active
          ? "border-[#0f6beb] bg-[#f0f6ff]"
          : "border-[#dddddd] bg-white hover:bg-[#F8FAFC]"
      }`}
    >
      <div className="flex items-center gap-[8px]">
        <span
          className={`w-[16px] h-[16px] rounded-full border-[2px] flex items-center justify-center ${
            active ? "border-[#0f6beb]" : "border-[#dddddd]"
          }`}
        >
          {active && <span className="w-[8px] h-[8px] rounded-full bg-[#0f6beb]" />}
        </span>
        <span className="text-[14px] text-[#383838]">{label}</span>
      </div>
      <p className="text-[12px] text-[#6e6e6e] mt-[4px] ml-[24px]">{desc}</p>
    </button>
  );
}

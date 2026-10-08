import { useEffect, useState, type FormEvent } from 'react';
import { businessService, type Profile } from '../../services/business.service';
import { usePermission } from '../../hooks/usePermission';

const ProfilePage = () => {
  const { can } = usePermission();
  const canEditProfile = can('edit', 'profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = () => {
    businessService.getProfile()
      .then((result) => {
        setProfile(result);
        setFullName(result.fullName);
        setPhone(result.phone ?? '');
        setDisplayTitle(result.displayTitle ?? '');
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await businessService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        displayTitle: displayTitle.trim() || null,
      });
      setProfile(result);
      setFullName(result.fullName);
      setPhone(result.phone ?? '');
      setDisplayTitle(result.displayTitle ?? '');
      setMessage('Đã cập nhật hồ sơ.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div role="status" className="rounded-xl bg-white p-6">Đang tải hồ sơ…</div>;
  if (!profile) {
    return <section className="rounded-xl bg-white p-6"><h1 className="text-xl font-bold">Hồ sơ cá nhân</h1><ErrorMessage error={error} onRetry={() => { setLoading(true); setError(''); loadProfile(); }} /></section>;
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
      <p className="mt-1 text-sm text-slate-500">Thông tin được tải và cập nhật trực tiếp từ Backend.</p>
      {error && <ErrorMessage error={error} />}
      {message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</p>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <ReadOnlyField label="Email" value={profile.email} />
        <ReadOnlyField label="Vai trò" value={profile.roles.join(', ')} />
        <ReadOnlyField label="Phòng ban" value={profile.departmentName ?? 'Chưa phân phòng ban'} />
        <label className="block text-sm font-medium text-slate-700">
          Họ và tên
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" maxLength={255} required value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Số điện thoại
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" maxLength={20} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Chức danh
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" maxLength={120} value={displayTitle} onChange={(event) => setDisplayTitle(event.target.value)} />
        </label>
        {canEditProfile && (
          <button className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">
            {saving ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
        )}
      </form>
    </section>
  );
};

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="text-sm">
    <span className="font-medium text-slate-500">{label}</span>
    <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">{value}</p>
  </div>
);

const ErrorMessage = ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
    {error}
    {onRetry && <button className="ml-3 underline" onClick={onRetry} type="button">Thử lại</button>}
  </div>
);

export default ProfilePage;

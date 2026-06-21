import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Profilim</h2>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-sm text-gray-500">Ad Soyad</p>
          <p className="text-lg font-semibold text-gray-900">{profile.user.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Kullanıcı adı</p>
          <p className="font-mono text-gray-900">@{profile.user.username}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Rol</p>
          <p className="text-gray-900">{profile.user.role}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Telefon</p>
          <p className="text-gray-900">{profile.phone}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Ehliyet No</p>
          <p className="font-mono text-gray-900">{profile.licenseNo}</p>
        </div>
        {profile.address && (
          <div>
            <p className="text-sm text-gray-500">Adres</p>
            <p className="text-gray-900">{profile.address}</p>
          </div>
        )}
      </section>
    </div>
  );
}

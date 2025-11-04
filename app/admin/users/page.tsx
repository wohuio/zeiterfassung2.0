'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { GlowIcon } from '@/components/ui/glow-icon';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Button } from '@/components/ui/button';
import { xanoClient } from '@/lib/xano-client';
import type { User } from '@/lib/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
    } else if (!authLoading && currentUser && currentUser.role !== 'admin') {
      router.push('/dashboard');
    } else if (currentUser && currentUser.role === 'admin') {
      loadUsers();
    }
  }, [currentUser, authLoading, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await xanoClient.getUsers({});
      setUsers(response.items || response as any);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      // Show helpful error for missing Xano endpoints
      if (err.message.includes('Unable to locate request')) {
        setError('⚠️ Admin-Endpunkte fehlen in Xano\n\nBitte erstellen Sie folgende Endpunkte in Xano:\n\n' +
                 '📌 GET  ${XANO_BASE_URL}/api:uMXZ3Fde/admin/users\n' +
                 '   → Gibt alle Benutzer zurück (Array von User-Objekten)\n\n' +
                 '📌 PATCH ${XANO_BASE_URL}/api:uMXZ3Fde/admin/users/{id}\n' +
                 '   → Body: { role?: string, is_active?: boolean }\n\n' +
                 'Hinweis: Diese Endpunkte benötigen Admin-Rechte (role = "admin")');
      } else {
        setError(err.message || 'Fehler beim Laden der Benutzer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await xanoClient.updateUser(userId, { is_active: !currentStatus });
      // Reload users
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      alert('Fehler beim Aktualisieren des Benutzers: ' + err.message);
    }
  };

  const handleChangeRole = async (userId: number, newRole: 'user' | 'office' | 'admin') => {
    if (!confirm(`Möchten Sie die Rolle wirklich ändern?`)) return;

    try {
      await xanoClient.updateUser(userId, { role: newRole });
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      alert('Fehler beim Ändern der Rolle: ' + err.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'office':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'office':
        return 'Büro';
      default:
        return 'Benutzer';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (authLoading || !currentUser || currentUser.role !== 'admin') {
    return (
      <DashboardLayout activeTab="admin">
        <div className="flex items-center justify-center py-16">
          <div className="text-xl gradient-text">Lädt...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-title-1 gradient-text mb-2">Benutzerverwaltung</h1>
              <p className="text-body text-text-secondary">
                {filteredUsers.length} von {users.length} Benutzern
              </p>
            </div>
            <Button onClick={() => router.push('/admin')}>
              ← Zurück zur Admin-Übersicht
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-bento p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Suche nach Name, E-Mail, Mitarbeiter-ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
            >
              <option value="all">Alle Rollen</option>
              <option value="admin">Administrator</option>
              <option value="office">Büro</option>
              <option value="user">Benutzer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-xl gradient-text">Lädt Benutzer...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-bento card-glow relative overflow-hidden"
          >
            <ParticleBackground />
            <div className="relative z-10 text-center py-16">
              <GlowIcon icon="users" size={80} variant="pulse" color="gradient" />
              <h2 className="text-title-2 gradient-text mt-6 mb-4">
                Keine Benutzer gefunden
              </h2>
              <p className="text-text-secondary">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Versuchen Sie andere Suchkriterien'
                  : 'Keine Benutzer vorhanden'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="card-bento overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary/50">
                  <tr className="border-b border-border-primary">
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      E-Mail
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Mitarbeiter-ID
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Rolle
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-body-sm font-semibold text-text-secondary">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border-primary/50 hover:bg-bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">{user.name}</div>
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-tertiary">
                        {user.employee_id || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value as any)}
                          disabled={user.id === currentUser.id}
                          className={`px-3 py-1 rounded-full text-body-sm border ${getRoleBadgeColor(user.role)} bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="user">Benutzer</option>
                          <option value="office">Büro</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          disabled={user.id === currentUser.id}
                          className={`px-3 py-1 rounded-full text-body-sm border ${
                            user.is_active
                              ? 'bg-green-500/20 text-green-400 border-green-500/20'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/20'
                          } disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity`}
                        >
                          {user.is_active ? 'Aktiv' : 'Inaktiv'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="text-accent-purple hover:text-accent-purple/80 transition-colors text-body-sm font-medium"
                        >
                          Details →
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

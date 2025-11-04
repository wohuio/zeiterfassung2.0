'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { xanoClient } from '@/lib/xano-client';
import type { Organization } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';
import Link from 'next/link';

type ViewMode = 'grid' | 'table';

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'organization_number'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await xanoClient.getOrganizations();
      setOrganizations(data);
    } catch (err: any) {
      console.error('Error loading organizations:', err);
      setError(err.message || 'Fehler beim Laden der Organisationen');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered & Sorted Organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = [...organizations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organization_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.legal_form?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'name' || sortBy === 'organization_number') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [organizations, searchTerm, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'created_at' | 'organization_number') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-title-1 gradient-text animate-fade-in">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Effects */}
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-title-1 gradient-text">Organisationen</h1>
              <p className="text-body-md text-text-secondary mt-2">
                {filteredOrganizations.length} von {organizations.length} Organisationen
              </p>
            </div>
            <Button
              onClick={() => router.push('/crm/organizations/new')}
              className="bg-accent-purple hover:bg-accent-purple/80"
            >
              + Neue Organisation
            </Button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Suche nach Name, Nummer, Rechtsform..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="all">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                Tabelle
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                Karten
              </button>
            </div>
          </div>
        </motion.div>

        {/* Organizations Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-title-2 gradient-text animate-pulse">
              Lädt Organisationen...
            </div>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <p className="text-title-2 text-text-secondary mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Keine Organisationen gefunden'
                : 'Keine Organisationen vorhanden'}
            </p>
            <p className="text-body-md text-text-tertiary mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Versuchen Sie andere Suchkriterien'
                : 'Erstellen Sie Ihre erste Organisation, um zu beginnen'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => router.push('/crm/organizations/new')}
                className="bg-accent-purple hover:bg-accent-purple/80"
              >
                Erste Organisation erstellen
              </Button>
            )}
          </motion.div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary/50">
                  <tr className="border-b border-border-primary">
                    <th
                      className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary cursor-pointer hover:text-accent-purple transition-colors"
                      onClick={() => toggleSort('organization_number')}
                    >
                      <div className="flex items-center gap-2">
                        Nummer
                        {sortBy === 'organization_number' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary cursor-pointer hover:text-accent-purple transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        {sortBy === 'name' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden md:table-cell">
                      Rechtsform
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden lg:table-cell">
                      Branche
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden lg:table-cell">
                      Zahlungsziel
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
                  {filteredOrganizations.map((org, index) => (
                    <motion.tr
                      key={org.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border-primary/50 hover:bg-bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/crm/organizations/${org.id}`)}
                    >
                      <td className="px-4 py-4 text-body-sm text-text-tertiary">
                        #{org.organization_number}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-body font-medium text-text-primary">
                          {org.name}
                        </div>
                        {org.vat_id && (
                          <div className="text-body-sm text-text-tertiary mt-1">
                            {org.vat_id}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary hidden md:table-cell">
                        {org.legal_form || '-'}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary hidden lg:table-cell">
                        {org.industry || '-'}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary hidden lg:table-cell">
                        {org.payment_terms} Tage
                        {org.discount_percentage > 0 && (
                          <span className="text-green-400 ml-2">
                            -{org.discount_percentage}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-body-sm ${
                          org.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/20'
                        }`}>
                          {org.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/crm/organizations/${org.id}/edit`);
                          }}
                          className="text-accent-purple hover:text-accent-purple/80 transition-colors text-body-sm font-medium"
                        >
                          Bearbeiten
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:border-accent-purple/50 transition-all cursor-pointer"
                onClick={() => router.push(`/crm/organizations/${org.id}`)}
              >
                {/* Organization Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-title-3 text-text-primary mb-1">
                      {org.name}
                    </h3>
                    <p className="text-body-sm text-text-tertiary">
                      #{org.organization_number}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-body-sm ${
                      org.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {org.status}
                  </div>
                </div>

                {/* Organization Details */}
                <div className="space-y-2">
                  {org.legal_form && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">Rechtsform:</span>
                      <span className="text-text-secondary">{org.legal_form}</span>
                    </div>
                  )}
                  {org.industry && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">Branche:</span>
                      <span className="text-text-secondary">{org.industry}</span>
                    </div>
                  )}
                  {org.vat_id && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">USt-IdNr.:</span>
                      <span className="text-text-secondary">{org.vat_id}</span>
                    </div>
                  )}
                </div>

                {/* Organization Footer */}
                <div className="mt-4 pt-4 border-t border-border-primary">
                  <div className="flex items-center justify-between text-body-sm text-text-tertiary">
                    <span>Zahlungsziel: {org.payment_terms} Tage</span>
                    {org.discount_percentage > 0 && (
                      <span className="text-green-400">
                        -{org.discount_percentage}% Skonto
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Back to CRM */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-4 justify-center"
        >
          <Button
            onClick={() => router.push('/crm')}
            variant="secondary"
            className="border-border-primary hover:border-accent-purple/50"
          >
            Zurück zum CRM
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="secondary"
            className="border-border-primary hover:border-accent-purple/50"
          >
            Zum Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

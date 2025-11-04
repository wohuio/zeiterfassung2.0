'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { xanoClient } from '@/lib/xano-client';
import type { Person } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';

type ViewMode = 'grid' | 'table';

function PersonsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'first_name' | 'last_name' | 'created_at'>('last_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const organizationId = searchParams.get('organization_id');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadPersons();
    }
  }, [user, organizationId]);

  const loadPersons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = organizationId ? { organization_id: Number(organizationId) } : undefined;
      const data = await xanoClient.getPersons(params);
      setPersons(data);
    } catch (err: any) {
      console.error('Error loading persons:', err);
      setError(err.message || 'Fehler beim Laden der Kontakte');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered & Sorted Persons
  const filteredPersons = useMemo(() => {
    let filtered = [...persons];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(person =>
        person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(p => p.is_active);
      } else {
        filtered = filtered.filter(p => !p.is_active);
      }
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'primary') {
        filtered = filtered.filter(p => p.is_primary_contact);
      } else if (roleFilter === 'billing') {
        filtered = filtered.filter(p => p.is_billing_contact);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'first_name' || sortBy === 'last_name') {
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
  }, [persons, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'first_name' | 'last_name' | 'created_at') => {
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
              <h1 className="text-title-1 gradient-text">Kontaktpersonen</h1>
              <p className="text-body-md text-text-secondary mt-2">
                {filteredPersons.length} von {persons.length} Kontakten
                {organizationId && ' (gefiltert nach Organisation)'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/crm/persons/new')}
              className="bg-accent-purple hover:bg-accent-purple/80"
            >
              + Neue Person
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Suche nach Name, E-Mail, Position..."
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

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="all">Alle Rollen</option>
                <option value="primary">Primärkontakt</option>
                <option value="billing">Rechnungsempfänger</option>
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

        {/* Persons Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-title-2 gradient-text animate-pulse">
              Lädt Kontakte...
            </div>
          </div>
        ) : filteredPersons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <p className="text-title-2 text-text-secondary mb-4">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Keine Kontakte gefunden'
                : 'Keine Kontakte vorhanden'}
            </p>
            <p className="text-body-md text-text-tertiary mb-6">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Versuchen Sie andere Suchkriterien'
                : 'Erstellen Sie Ihren ersten Kontakt, um zu beginnen'}
            </p>
            {!searchTerm && statusFilter === 'all' && roleFilter === 'all' && (
              <Button
                onClick={() => router.push('/crm/persons/new')}
                className="bg-accent-purple hover:bg-accent-purple/80"
              >
                Ersten Kontakt erstellen
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
                      onClick={() => toggleSort('first_name')}
                    >
                      <div className="flex items-center gap-2">
                        Vorname
                        {sortBy === 'first_name' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary cursor-pointer hover:text-accent-purple transition-colors"
                      onClick={() => toggleSort('last_name')}
                    >
                      <div className="flex items-center gap-2">
                        Nachname
                        {sortBy === 'last_name' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden md:table-cell">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden lg:table-cell">
                      Kontakt
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Rollen
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
                  {filteredPersons.map((person, index) => (
                    <motion.tr
                      key={person.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border-primary/50 hover:bg-bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/crm/persons/${person.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="text-body font-medium text-text-primary">
                          {person.salutation && `${person.salutation} `}
                          {person.title && `${person.title} `}
                          {person.first_name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-body font-medium text-text-primary">
                          {person.last_name}
                        </div>
                        {person.department && (
                          <div className="text-body-sm text-text-tertiary mt-1">
                            {person.department}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary hidden md:table-cell">
                        {person.position || '-'}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {person.email && (
                          <div className="text-body-sm text-text-secondary mb-1">
                            📧 {person.email}
                          </div>
                        )}
                        {person.phone && (
                          <div className="text-body-sm text-text-secondary">
                            📞 {person.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {person.is_primary_contact && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20">
                              Primär
                            </span>
                          )}
                          {person.is_billing_contact && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/20">
                              Rechnung
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-body-sm ${
                          person.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/20'
                        }`}>
                          {person.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/crm/persons/${person.id}/edit`);
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
            {filteredPersons.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:border-accent-purple/50 transition-all cursor-pointer"
                onClick={() => router.push(`/crm/persons/${person.id}`)}
              >
                {/* Person Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {person.salutation && (
                        <span className="text-body-sm text-text-tertiary">{person.salutation}</span>
                      )}
                      {person.title && (
                        <span className="text-body-sm text-text-tertiary">{person.title}</span>
                      )}
                    </div>
                    <h3 className="text-title-3 text-text-primary mb-1">
                      {person.first_name} {person.last_name}
                    </h3>
                    {person.position && (
                      <p className="text-body-sm text-text-tertiary">{person.position}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {person.is_primary_contact && (
                      <div className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20">
                        Primär
                      </div>
                    )}
                    {person.is_billing_contact && (
                      <div className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/20">
                        Rechnung
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2">
                  {person.email && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">📧</span>
                      <span className="text-text-secondary truncate">{person.email}</span>
                    </div>
                  )}
                  {person.phone && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">📞</span>
                      <span className="text-text-secondary">{person.phone}</span>
                    </div>
                  )}
                  {person.mobile && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">📱</span>
                      <span className="text-text-secondary">{person.mobile}</span>
                    </div>
                  )}
                  {person.department && (
                    <div className="flex items-center text-body-sm">
                      <span className="text-text-tertiary mr-2">🏢</span>
                      <span className="text-text-secondary">{person.department}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-border-primary">
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-body-sm ${
                      person.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {person.is_active ? 'Aktiv' : 'Inaktiv'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Navigation */}
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

export default function PersonsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-title-1 gradient-text animate-fade-in">Lädt...</div>
      </div>
    }>
      <PersonsPageContent />
    </Suspense>
  );
}

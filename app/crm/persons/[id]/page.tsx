'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { xanoClient } from '@/lib/xano-client';
import type { Person } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';
import AddressManager from '@/components/AddressManager';

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personId = params.id ? Number(params.id) : null;

  useEffect(() => {
    if (personId && user) {
      loadPerson();
    }
  }, [personId, user]);

  const loadPerson = async () => {
    if (!personId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await xanoClient.getPerson(personId);
      setPerson(data);
    } catch (err: any) {
      console.error('Error loading person:', err);
      setError(err.message || 'Fehler beim Laden der Person');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!personId) return;

    try {
      setIsDeleting(true);
      await xanoClient.deletePerson(personId);
      router.push('/crm/persons');
    } catch (err: any) {
      console.error('Error deleting person:', err);
      setError(err.message || 'Fehler beim Löschen der Person');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-title-1 gradient-text animate-fade-in">Lädt...</div>
      </div>
    );
  }

  if (error && !person) {
    return (
      <div className="min-h-screen bg-bg-primary relative overflow-hidden">
        <FloatingOrbs />
        <GridBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-title-2 text-red-400 mb-4">Fehler</h2>
            <p className="text-body-md text-text-secondary mb-6">{error}</p>
            <Button onClick={() => router.push('/crm/persons')}>
              Zurück zur Liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {person.salutation && (
                  <span className="text-body text-text-tertiary">{person.salutation}</span>
                )}
                {person.title && (
                  <span className="text-body text-text-tertiary">{person.title}</span>
                )}
              </div>
              <h1 className="text-title-1 gradient-text">
                {person.first_name} {person.last_name}
              </h1>
              {person.position && (
                <p className="text-body-md text-text-secondary mt-2">
                  {person.position}
                  {person.department && ` • ${person.department}`}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push(`/crm/persons/${person.id}/edit`)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Bearbeiten
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="secondary"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Löschen
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {person.is_primary_contact && (
              <div className="px-3 py-1 rounded-full text-body-sm bg-blue-500/20 text-blue-400 border border-blue-500/20">
                Primärer Ansprechpartner
              </div>
            )}
            {person.is_billing_contact && (
              <div className="px-3 py-1 rounded-full text-body-sm bg-green-500/20 text-green-400 border border-green-500/20">
                Rechnungsempfänger
              </div>
            )}
            <div className={`px-3 py-1 rounded-full text-body-sm ${
              person.is_active
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {person.is_active ? 'Aktiv' : 'Inaktiv'}
            </div>
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

        {/* Person Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <h3 className="text-title-3 text-text-primary mb-6">Kontaktdaten</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailField label="E-Mail" value={person.email} />
              <DetailField label="Telefon" value={person.phone} />
              <DetailField label="Mobiltelefon" value={person.mobile} />
              <DetailField label="Geburtstag" value={person.birthday} />
            </div>

            {person.notes && (
              <div className="mt-6 pt-6 border-t border-border-primary">
                <h4 className="text-body font-semibold text-text-secondary mb-2">Notizen</h4>
                <p className="text-body-md text-text-tertiary whitespace-pre-wrap">
                  {person.notes}
                </p>
              </div>
            )}
          </motion.div>

          {/* Work Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-title-3 text-text-primary mb-6">Berufsinformationen</h3>

            <div className="space-y-4">
              <DetailField label="Position" value={person.position} />
              <DetailField label="Abteilung" value={person.department} />
              {person.organization_id && (
                <DetailField
                  label="Organisation"
                  value={
                    <button
                      onClick={() => router.push(`/crm/organizations/${person.organization_id}`)}
                      className="text-accent-purple hover:underline"
                    >
                      Zur Organisation →
                    </button>
                  }
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Addresses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glass-card p-6"
        >
          <AddressManager addressableType="person" addressableId={person.id} />
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Button
            onClick={() => router.push('/crm/persons')}
            variant="secondary"
            className="border-border-primary hover:border-accent-purple/50"
          >
            Zurück zur Liste
          </Button>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 max-w-md w-full"
          >
            <h3 className="text-title-3 text-text-primary mb-4">Person löschen?</h3>
            <p className="text-body-md text-text-secondary mb-6">
              Möchten Sie <strong>{person.first_name} {person.last_name}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 flex-1"
              >
                {isDeleting ? 'Wird gelöscht...' : 'Ja, löschen'}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="secondary"
                className="flex-1"
                disabled={isDeleting}
              >
                Abbrechen
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;

  return (
    <div>
      <div className="text-body-sm text-text-tertiary mb-1">{label}</div>
      <div className="text-body text-text-primary">
        {typeof value === 'string' ? value : value}
      </div>
    </div>
  );
}

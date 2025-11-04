'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { xanoClient } from '@/lib/xano-client';
import type { Organization } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const personId = params.id ? Number(params.id) : null;

  const [formData, setFormData] = useState({
    organization_id: '',
    salutation: '',
    title: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    department: '',
    is_primary_contact: false,
    is_billing_contact: false,
    is_active: true,
    birthday: '',
    notes: '',
  });

  useEffect(() => {
    if (personId && user) {
      loadPerson();
      loadOrganizations();
    }
  }, [personId, user]);

  const loadOrganizations = async () => {
    try {
      const data = await xanoClient.getOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };

  const loadPerson = async () => {
    if (!personId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await xanoClient.getPerson(personId);

      setFormData({
        organization_id: data.organization_id ? String(data.organization_id) : '',
        salutation: data.salutation || '',
        title: data.title || '',
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        position: data.position || '',
        department: data.department || '',
        is_primary_contact: data.is_primary_contact,
        is_billing_contact: data.is_billing_contact,
        is_active: data.is_active,
        birthday: data.birthday || '',
        notes: data.notes || '',
      });
    } catch (err: any) {
      console.error('Error loading person:', err);
      setError(err.message || 'Fehler beim Laden der Person');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await xanoClient.updatePerson(personId, {
        organization_id: formData.organization_id ? Number(formData.organization_id) : undefined,
        salutation: formData.salutation || undefined,
        title: formData.title || undefined,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        position: formData.position || undefined,
        department: formData.department || undefined,
        is_primary_contact: formData.is_primary_contact,
        is_billing_contact: formData.is_billing_contact,
        is_active: formData.is_active,
        birthday: formData.birthday || undefined,
        notes: formData.notes || undefined,
      });

      router.push(`/crm/persons/${personId}`);
    } catch (err: any) {
      console.error('Error updating person:', err);
      setError(err.message || 'Fehler beim Aktualisieren der Person');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      <FloatingOrbs />
      <GridBackground />
      <div className="bg-glow-purple" />
      <div className="bg-glow-blue" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-title-1 gradient-text mb-2">Person bearbeiten</h1>
          <p className="text-body-md text-text-secondary">
            Aktualisieren Sie die Informationen der Person
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card p-6 max-w-3xl"
        >
          <div className="space-y-6">
            {/* Organization Selection */}
            <div>
              <h3 className="text-title-3 text-text-primary mb-4">Organisation</h3>
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">
                  Organisation (optional)
                </label>
                <select
                  name="organization_id"
                  value={formData.organization_id}
                  onChange={handleChange}
                  className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                >
                  <option value="">Keine Organisation</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-title-3 text-text-primary">Persönliche Informationen</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Anrede
                  </label>
                  <select
                    name="salutation"
                    value={formData.salutation}
                    onChange={handleChange}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Titel
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="z.B. Dr., Prof."
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Geburtstag
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-title-3 text-text-primary">Kontaktdaten</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="beispiel@firma.de"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+49 123 456789"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Mobiltelefon
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+49 170 1234567"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>
              </div>
            </div>

            {/* Work Info */}
            <div className="space-y-4">
              <h3 className="text-title-3 text-text-primary">Berufliche Informationen</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="z.B. Geschäftsführer"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Abteilung
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="z.B. Vertrieb, Einkauf"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-4">
              <h3 className="text-title-3 text-text-primary">Eigenschaften</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_primary_contact"
                    checked={formData.is_primary_contact}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-border-primary bg-bg-secondary checked:bg-accent-purple focus:ring-2 focus:ring-accent-purple"
                  />
                  <span className="text-body text-text-secondary">
                    Primärer Ansprechpartner
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_billing_contact"
                    checked={formData.is_billing_contact}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-border-primary bg-bg-secondary checked:bg-accent-purple focus:ring-2 focus:ring-accent-purple"
                  />
                  <span className="text-body text-text-secondary">
                    Rechnungsempfänger
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-border-primary bg-bg-secondary checked:bg-accent-purple focus:ring-2 focus:ring-accent-purple"
                  />
                  <span className="text-body text-text-secondary">
                    Aktiv
                  </span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                Notizen
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent-purple hover:bg-accent-purple/80 flex-1"
              >
                {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
              </Button>
              <Button
                type="button"
                onClick={() => router.push(`/crm/persons/${personId}`)}
                variant="secondary"
                className="border-border-primary hover:border-accent-purple/50"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

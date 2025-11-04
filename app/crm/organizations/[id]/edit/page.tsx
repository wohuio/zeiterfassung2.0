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

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizationId = params.id ? Number(params.id) : null;

  const [formData, setFormData] = useState({
    organization_number: '',
    name: '',
    legal_form: '',
    payment_terms: 30,
    discount_percentage: 0,
    credit_limit: '',
    industry: '',
    customer_type: '',
    status: 'active',
    vat_id: '',
    tax_number: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    if (organizationId && user) {
      loadOrganization();
    }
  }, [organizationId, user]);

  const loadOrganization = async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await xanoClient.getOrganization(organizationId);

      // Pre-fill form with existing data
      setFormData({
        organization_number: data.organization_number,
        name: data.name,
        legal_form: data.legal_form || '',
        payment_terms: data.payment_terms,
        discount_percentage: data.discount_percentage,
        credit_limit: data.credit_limit ? String(data.credit_limit) : '',
        industry: data.industry || '',
        customer_type: data.customer_type || '',
        status: data.status,
        vat_id: data.vat_id || '',
        tax_number: data.tax_number || '',
        website: data.website || '',
        notes: data.notes || '',
      });
    } catch (err: any) {
      console.error('Error loading organization:', err);
      setError(err.message || 'Fehler beim Laden der Organisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await xanoClient.updateOrganization(organizationId, {
        organization_number: formData.organization_number,
        name: formData.name,
        legal_form: formData.legal_form || undefined,
        payment_terms: formData.payment_terms,
        discount_percentage: formData.discount_percentage,
        credit_limit: formData.credit_limit ? Number(formData.credit_limit) : undefined,
        industry: formData.industry || undefined,
        customer_type: formData.customer_type || undefined,
        status: formData.status,
        vat_id: formData.vat_id || undefined,
        tax_number: formData.tax_number || undefined,
        website: formData.website || undefined,
        notes: formData.notes || undefined,
      });

      router.push(`/crm/organizations/${organizationId}`);
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setError(err.message || 'Fehler beim Aktualisieren der Organisation');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <h1 className="text-title-1 gradient-text mb-2">Organisation bearbeiten</h1>
          <p className="text-body-md text-text-secondary">
            Aktualisieren Sie die Informationen der Organisation
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
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-title-3 text-text-primary">Grundinformationen</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Organisationsnummer *
                  </label>
                  <input
                    type="text"
                    name="organization_number"
                    value={formData.organization_number}
                    onChange={handleChange}
                    required
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Firmenname *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Rechtsform
                  </label>
                  <input
                    type="text"
                    name="legal_form"
                    value={formData.legal_form}
                    onChange={handleChange}
                    placeholder="z.B. GmbH, AG, UG"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Branche
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="z.B. IT, Handel, Dienstleistung"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Kundentyp
                  </label>
                  <input
                    type="text"
                    name="customer_type"
                    value={formData.customer_type}
                    onChange={handleChange}
                    placeholder="z.B. Neukunde, Stammkunde"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-4">
              <h3 className="text-title-3 text-text-primary">Finanzdaten</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Zahlungsziel (Tage)
                  </label>
                  <input
                    type="number"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    min="0"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Skonto (%)
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Kreditlimit (€)
                  </label>
                  <input
                    type="number"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    USt-IdNr.
                  </label>
                  <input
                    type="text"
                    name="vat_id"
                    value={formData.vat_id}
                    onChange={handleChange}
                    placeholder="DE123456789"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Steuernummer
                  </label>
                  <input
                    type="text"
                    name="tax_number"
                    value={formData.tax_number}
                    onChange={handleChange}
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                  />
                </div>
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
                onClick={() => router.push(`/crm/organizations/${organizationId}`)}
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

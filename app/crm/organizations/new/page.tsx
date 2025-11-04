'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { xanoClient } from '@/lib/xano-client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await xanoClient.createOrganization({
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

      router.push('/crm/organizations');
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Fehler beim Erstellen der Organisation');
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
          <h1 className="text-title-1 gradient-text mb-2">Neue Organisation</h1>
          <p className="text-body-md text-text-secondary">
            Erstellen Sie einen neuen Kunden oder Partner
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
                {isSubmitting ? 'Wird erstellt...' : 'Organisation erstellen'}
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/crm/organizations')}
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

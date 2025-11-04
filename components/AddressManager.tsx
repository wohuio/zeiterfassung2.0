'use client';

import { useState, useEffect } from 'react';
import { xanoClient } from '@/lib/xano-client';
import type { Address, AddressCreateRequest } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AddressManagerProps {
  addressableType: 'organization' | 'person';
  addressableId: number;
}

export default function AddressManager({ addressableType, addressableId }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, [addressableType, addressableId]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await xanoClient.getAddresses({ addressable_type: addressableType });
      // Filter by addressable_id client-side
      const filtered = data.filter(addr => addr.addressable_id === addressableId);
      setAddresses(filtered);
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      setError(err.message || 'Fehler beim Laden der Adressen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm('Möchten Sie diese Adresse wirklich löschen?')) return;

    try {
      await xanoClient.deleteAddress(addressId);
      setAddresses(addresses.filter(a => a.id !== addressId));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen der Adresse');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-title-3 text-text-primary">Adressen</h3>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setShowAddForm(true);
          }}
          className="bg-accent-purple hover:bg-accent-purple/80 text-sm"
        >
          + Adresse hinzufügen
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-body-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-text-tertiary">Lädt Adressen...</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 text-text-tertiary">
          Keine Adressen vorhanden
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => {
                setEditingAddress(address);
                setShowAddForm(true);
              }}
              onDelete={() => handleDelete(address.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddressFormModal
            addressableType={addressableType}
            addressableId={addressableId}
            address={editingAddress}
            onClose={() => {
              setShowAddForm(false);
              setEditingAddress(null);
            }}
            onSave={() => {
              setShowAddForm(false);
              setEditingAddress(null);
              loadAddresses();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Address Card Component
function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'billing':
        return 'Rechnungsadresse';
      case 'shipping':
        return 'Lieferadresse';
      default:
        return 'Sonstige';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 border border-border-primary"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs bg-accent-purple/20 text-accent-purple border border-accent-purple/20">
            {getAddressTypeLabel(address.address_type)}
          </span>
          {address.is_primary && (
            <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20">
              Primär
            </span>
          )}
          {!address.is_active && (
            <span className="px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/20">
              Inaktiv
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-accent-purple hover:text-accent-purple/80 text-body-sm font-medium"
          >
            Bearbeiten
          </button>
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 text-body-sm font-medium"
          >
            Löschen
          </button>
        </div>
      </div>

      <div className="text-body-sm text-text-secondary space-y-1">
        <div>{address.street}</div>
        {address.street2 && <div>{address.street2}</div>}
        <div>
          {address.postal_code} {address.city}
        </div>
        {address.state && <div>{address.state}</div>}
        <div>{address.country}</div>
      </div>
    </motion.div>
  );
}

// Address Form Modal with Existing Address Selection
function AddressFormModal({
  addressableType,
  addressableId,
  address,
  onClose,
  onSave,
}: {
  addressableType: 'organization' | 'person';
  addressableId: number;
  address: Address | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExistingAddress, setSelectedExistingAddress] = useState<Address | null>(null);

  const [formData, setFormData] = useState({
    address_type: address?.address_type || 'billing',
    street: address?.street || '',
    street2: address?.street2 || '',
    postal_code: address?.postal_code || '',
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || 'Deutschland',
    is_primary: address?.is_primary || false,
    is_active: address?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'existing') {
      loadAllAddresses();
    }
  }, [mode]);

  const loadAllAddresses = async () => {
    try {
      const data = await xanoClient.getAddresses();

      // Filter out addresses already linked to this entity
      let filtered = data.filter(
        addr => !(addr.addressable_type === addressableType && addr.addressable_id === addressableId)
      );

      // If this is a person, also include addresses from their organization
      if (addressableType === 'person') {
        try {
          const person = await xanoClient.getPerson(addressableId);
          if (person.organization_id) {
            // Add organization addresses that aren't already included
            const orgAddresses = data.filter(
              addr => addr.addressable_type === 'organization' && addr.addressable_id === person.organization_id
            );
            // Combine and remove duplicates
            filtered = [...filtered, ...orgAddresses].filter((addr, index, self) =>
              index === self.findIndex(a => a.id === addr.id)
            );
          }
        } catch (err) {
          console.error('Error loading person organization:', err);
        }
      }

      setAllAddresses(filtered);
    } catch (err) {
      console.error('Error loading addresses:', err);
    }
  };

  const filteredExistingAddresses = allAddresses.filter(addr =>
    addr.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addr.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addr.postal_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkExistingAddress = async () => {
    if (!selectedExistingAddress) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a copy of the existing address for this entity
      await xanoClient.createAddress({
        addressable_type: addressableType,
        addressable_id: addressableId,
        address_type: selectedExistingAddress.address_type as 'billing' | 'shipping' | 'other',
        street: selectedExistingAddress.street,
        street2: selectedExistingAddress.street2 || undefined,
        postal_code: selectedExistingAddress.postal_code,
        city: selectedExistingAddress.city,
        state: selectedExistingAddress.state || undefined,
        country: selectedExistingAddress.country,
        is_primary: false,
        is_active: true,
      });
      onSave();
    } catch (err: any) {
      console.error('Error linking address:', err);
      setError(err.message || 'Fehler beim Verknüpfen der Adresse');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (address) {
        // Update existing address
        await xanoClient.updateAddress(address.id, {
          address_type: formData.address_type as 'billing' | 'shipping' | 'other',
          street: formData.street,
          street2: formData.street2 || undefined,
          postal_code: formData.postal_code,
          city: formData.city,
          state: formData.state || undefined,
          country: formData.country,
          is_primary: formData.is_primary,
          is_active: formData.is_active,
        });
      } else {
        // Create new address
        await xanoClient.createAddress({
          addressable_type: addressableType,
          addressable_id: addressableId,
          address_type: formData.address_type as 'billing' | 'shipping' | 'other',
          street: formData.street,
          street2: formData.street2 || undefined,
          postal_code: formData.postal_code,
          city: formData.city,
          state: formData.state || undefined,
          country: formData.country,
          is_primary: formData.is_primary,
          is_active: formData.is_active,
        });
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving address:', err);
      setError(err.message || 'Fehler beim Speichern der Adresse');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'billing': return 'Rechnung';
      case 'shipping': return 'Lieferung';
      default: return 'Sonstige';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-title-2 text-text-primary mb-6">
          {address ? 'Adresse bearbeiten' : 'Adresse hinzufügen'}
        </h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-body-sm">{error}</p>
          </div>
        )}

        {/* Mode Toggle (only when adding new) */}
        {!address && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                mode === 'new'
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              Neue Adresse
            </button>
            <button
              onClick={() => setMode('existing')}
              className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                mode === 'existing'
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              Bestehende auswählen
            </button>
          </div>
        )}

        {mode === 'existing' && !address ? (
          /* Existing Address Selection */
          <div className="space-y-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Suche nach Straße, Stadt, PLZ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple"
            />

            {/* Address List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExistingAddresses.length === 0 ? (
                <p className="text-center py-8 text-text-tertiary">
                  Keine Adressen gefunden
                </p>
              ) : (
                filteredExistingAddresses.map((addr) => {
                  const isFromOrganization = addr.addressable_type === 'organization';
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedExistingAddress(addr)}
                      className={`glass-card p-4 cursor-pointer transition-all ${
                        selectedExistingAddress?.id === addr.id
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-border-primary hover:border-accent-purple/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 rounded-full text-xs bg-accent-purple/20 text-accent-purple">
                            {getAddressTypeLabel(addr.address_type)}
                          </span>
                          {addr.is_primary && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                              Primär
                            </span>
                          )}
                          {isFromOrganization && addressableType === 'person' && (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                              Firmenadresse
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-tertiary">
                          {addr.addressable_type === 'organization' ? 'Organisation' : 'Person'}
                        </span>
                      </div>
                      <div className="text-body-sm text-text-secondary space-y-1">
                        <div>{addr.street}</div>
                        <div>{addr.postal_code} {addr.city}</div>
                        <div>{addr.country}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleLinkExistingAddress}
                disabled={!selectedExistingAddress || isSubmitting}
                className="bg-accent-purple hover:bg-accent-purple/80 flex-1"
              >
                {isSubmitting ? 'Wird verknüpft...' : 'Adresse verknüpfen'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="border-border-primary hover:border-accent-purple/50"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          /* New/Edit Address Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Type */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                Adresstyp *
              </label>
              <select
                name="address_type"
                value={formData.address_type}
                onChange={handleChange}
                required
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="billing">Rechnungsadresse</option>
                <option value="shipping">Lieferadresse</option>
                <option value="other">Sonstige</option>
              </select>
            </div>

            {/* Street */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                Straße *
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
                placeholder="z.B. Hauptstraße 123"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Street 2 */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                Adresszusatz
              </label>
              <input
                type="text"
                name="street2"
                value={formData.street2}
                onChange={handleChange}
                placeholder="z.B. 2. OG, c/o Müller"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Postal Code & City */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">
                  PLZ *
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                  placeholder="12345"
                  className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-body-sm text-text-secondary mb-2">
                  Stadt *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="z.B. Berlin"
                  className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                />
              </div>
            </div>

            {/* State & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">
                  Bundesland
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="z.B. Bayern"
                  className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">
                  Land *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  placeholder="Deutschland"
                  className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_primary"
                  checked={formData.is_primary}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-border-primary bg-bg-secondary checked:bg-accent-purple focus:ring-2 focus:ring-accent-purple"
                />
                <span className="text-body text-text-secondary">
                  Primäradresse
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

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent-purple hover:bg-accent-purple/80 flex-1"
              >
                {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="border-border-primary hover:border-accent-purple/50"
              >
                Abbrechen
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { xanoClient } from '@/lib/xano-client';
import type { Address, AddressCreateRequest, Organization, Person } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FloatingOrbs } from '@/components/ui/floating-orbs';
import { GridBackground } from '@/components/ui/grid-background';

type ViewMode = 'grid' | 'table';

interface AddressValidationResult {
  isValid: boolean;
  formatted?: string;
  message?: string;
  details?: {
    street?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  multipleResults?: Array<{
    display_name: string;
    address: any;
  }>;
}

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [addressTypeFilter, setAddressTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Address Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadOrganizationsAndPersons();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await xanoClient.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      setError(err.message || 'Fehler beim Laden der Adressen');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizationsAndPersons = async () => {
    try {
      const [orgsData, personsData] = await Promise.all([
        xanoClient.getOrganizations(),
        xanoClient.getPersons()
      ]);
      setOrganizations(orgsData);
      setPersons(personsData);
    } catch (err) {
      console.error('Error loading organizations/persons:', err);
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

  // Filtered Addresses
  const filteredAddresses = useMemo(() => {
    let filtered = [...addresses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(addr =>
        addr.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.postal_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Addressable type filter (organization/person)
    if (typeFilter !== 'all') {
      filtered = filtered.filter(addr => addr.addressable_type === typeFilter);
    }

    // Address type filter (billing/shipping/other)
    if (addressTypeFilter !== 'all') {
      filtered = filtered.filter(addr => addr.address_type === addressTypeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(a => a.is_active);
      } else {
        filtered = filtered.filter(a => !a.is_active);
      }
    }

    return filtered;
  }, [addresses, searchTerm, typeFilter, addressTypeFilter, statusFilter]);

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'billing': return 'Rechnungsadresse';
      case 'shipping': return 'Lieferadresse';
      default: return 'Sonstige';
    }
  };

  const getAddressableTypeLabel = (type: string) => {
    return type === 'organization' ? 'Organisation' : 'Person';
  };

  // Generate Google Maps URL
  const getGoogleMapsUrl = (address: Address) => {
    const parts = [
      address.street,
      address.street2,
      address.postal_code,
      address.city,
      address.state,
      address.country
    ].filter(Boolean);

    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // Validate address using Nominatim (OpenStreetMap)
  const validateAddress = async (street: string, postalCode: string, city: string, country: string) => {
    setIsValidatingAddress(true);
    setValidationResult(null);

    try {
      const query = encodeURIComponent(`${street}, ${postalCode} ${city}, ${country}`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Zeiterfassung-CRM-App'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        if (data.length === 1) {
          // Exact match - auto-fill
          const result = data[0];
          const address = result.address || {};

          const details = {
            street: address.road || address.street || street,
            postalCode: address.postcode || postalCode,
            city: address.city || address.town || address.village || city,
            state: address.state || '',
            country: address.country || country,
          };

          setValidationResult({
            isValid: true,
            formatted: result.display_name,
            message: 'Adresse gefunden und validiert! Die Felder wurden automatisch korrigiert.',
            details
          });
        } else {
          // Multiple results - let user choose
          setValidationResult({
            isValid: false,
            message: `${data.length} mögliche Adressen gefunden. Bitte wählen Sie die richtige aus:`,
            multipleResults: data
          });
        }
      } else {
        setValidationResult({
          isValid: false,
          message: 'Adresse konnte nicht gefunden werden. Bitte überprüfen Sie die Eingabe.'
        });
      }
    } catch (err) {
      console.error('Address validation error:', err);
      setValidationResult({
        isValid: false,
        message: 'Fehler bei der Validierung. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setIsValidatingAddress(false);
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
              <h1 className="text-title-1 gradient-text">Adressen</h1>
              <p className="text-body-md text-text-secondary mt-2">
                {filteredAddresses.length} von {addresses.length} Adressen
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-accent-purple hover:bg-accent-purple/80"
            >
              + Adresse hinzufügen
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
                placeholder="Suche nach Straße, Stadt, PLZ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Type Filter (Organization/Person) */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="all">Alle Typen</option>
                <option value="organization">Organisationen</option>
                <option value="person">Personen</option>
              </select>
            </div>

            {/* Address Type Filter */}
            <div>
              <select
                value={addressTypeFilter}
                onChange={(e) => setAddressTypeFilter(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="all">Alle Adresstypen</option>
                <option value="billing">Rechnungsadresse</option>
                <option value="shipping">Lieferadresse</option>
                <option value="other">Sonstige</option>
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

        {/* Addresses Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-title-2 gradient-text animate-pulse">
              Lädt Adressen...
            </div>
          </div>
        ) : filteredAddresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <p className="text-title-2 text-text-secondary mb-4">
              {searchTerm || typeFilter !== 'all' || addressTypeFilter !== 'all'
                ? 'Keine Adressen gefunden'
                : 'Keine Adressen vorhanden'}
            </p>
            <p className="text-body-md text-text-tertiary mb-6">
              {searchTerm || typeFilter !== 'all' || addressTypeFilter !== 'all'
                ? 'Versuchen Sie andere Suchkriterien'
                : 'Adressen können bei Organisationen oder Personen angelegt werden'}
            </p>
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
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Typ
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Adresse
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden md:table-cell">
                      Stadt
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary hidden lg:table-cell">
                      Land
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-text-secondary">
                      Zugeordnet zu
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
                  {filteredAddresses.map((address, index) => (
                    <motion.tr
                      key={address.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border-primary/50 hover:bg-bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs bg-accent-purple/20 text-accent-purple border border-accent-purple/20 w-fit">
                            {getAddressTypeLabel(address.address_type)}
                          </span>
                          {address.is_primary && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20 w-fit">
                              Primär
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-body font-medium text-text-primary">
                          {address.street}
                        </div>
                        {address.street2 && (
                          <div className="text-body-sm text-text-tertiary mt-1">
                            {address.street2}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary hidden md:table-cell">
                        {address.postal_code} {address.city}
                      </td>
                      <td className="px-4 py-4 text-body-sm text-text-secondary hidden lg:table-cell">
                        {address.country}
                        {address.state && ` (${address.state})`}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            if (address.addressable_type === 'organization') {
                              router.push(`/crm/organizations/${address.addressable_id}`);
                            } else {
                              router.push(`/crm/persons/${address.addressable_id}`);
                            }
                          }}
                          className="text-accent-purple hover:text-accent-purple/80 text-body-sm"
                        >
                          {getAddressableTypeLabel(address.addressable_type)} →
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-body-sm ${
                          address.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/20'
                        }`}>
                          {address.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={getGoogleMapsUrl(address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors text-body-sm font-medium"
                            title="In Google Maps öffnen"
                          >
                            Karte
                          </a>
                          <button
                            onClick={() => handleDelete(address.id)}
                            className="text-red-400 hover:text-red-300 transition-colors text-body-sm font-medium"
                          >
                            Löschen
                          </button>
                        </div>
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
            {filteredAddresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 hover:border-accent-purple/50 transition-all"
              >
                {/* Address Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs bg-accent-purple/20 text-accent-purple border border-accent-purple/20">
                      {getAddressTypeLabel(address.address_type)}
                    </span>
                    {address.is_primary && (
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20">
                        Primär
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    address.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {address.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                {/* Address Details */}
                <div className="space-y-2 mb-4">
                  <div className="text-body text-text-primary">{address.street}</div>
                  {address.street2 && (
                    <div className="text-body-sm text-text-secondary">{address.street2}</div>
                  )}
                  <div className="text-body text-text-primary">
                    {address.postal_code} {address.city}
                  </div>
                  {address.state && (
                    <div className="text-body-sm text-text-secondary">{address.state}</div>
                  )}
                  <div className="text-body text-text-primary">{address.country}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (address.addressable_type === 'organization') {
                          router.push(`/crm/organizations/${address.addressable_id}`);
                        } else {
                          router.push(`/crm/persons/${address.addressable_id}`);
                        }
                      }}
                      className="text-accent-purple hover:text-accent-purple/80 text-body-sm font-medium"
                    >
                      Zu {getAddressableTypeLabel(address.addressable_type)} →
                    </button>
                    <a
                      href={getGoogleMapsUrl(address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-body-sm font-medium"
                      title="In Google Maps öffnen"
                    >
                      Karte
                    </a>
                  </div>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-400 hover:text-red-300 text-body-sm font-medium"
                  >
                    Löschen
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Address Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateAddressModal
              organizations={organizations}
              persons={persons}
              onClose={() => {
                setShowCreateModal(false);
                setValidationResult(null);
              }}
              onSave={() => {
                setShowCreateModal(false);
                setValidationResult(null);
                loadAddresses();
              }}
              validateAddress={validateAddress}
              isValidatingAddress={isValidatingAddress}
              validationResult={validationResult}
              resetValidation={() => setValidationResult(null)}
              setValidationResult={setValidationResult}
            />
          )}
        </AnimatePresence>

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

// Create Address Modal Component
function CreateAddressModal({
  organizations,
  persons,
  onClose,
  onSave,
  validateAddress,
  isValidatingAddress,
  validationResult,
  resetValidation,
  setValidationResult,
}: {
  organizations: Organization[];
  persons: Person[];
  onClose: () => void;
  onSave: () => void;
  validateAddress: (street: string, postalCode: string, city: string, country: string) => Promise<void>;
  isValidatingAddress: boolean;
  validationResult: AddressValidationResult | null;
  resetValidation: () => void;
  setValidationResult: (result: AddressValidationResult | null) => void;
}) {
  const [formData, setFormData] = useState({
    addressable_type: 'organization' as 'organization' | 'person',
    addressable_id: '',
    address_type: 'billing' as 'billing' | 'shipping' | 'other',
    street: '',
    house_number: '',
    street2: '',
    postal_code: '',
    city: '',
    state: '',
    country: 'Deutschland',
    is_primary: false,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions state
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [suggestions, setSuggestions] = useState<{
    streets: string[];
    cities: string[];
    postalCodes: string[];
    countries: string[];
  }>({
    streets: [],
    cities: [],
    postalCodes: [],
    countries: []
  });
  const [showSuggestions, setShowSuggestions] = useState<{
    street: boolean;
    city: boolean;
    postal_code: boolean;
    country: boolean;
  }>({
    street: false,
    city: false,
    postal_code: false,
    country: false
  });

  // Load all addresses for suggestions
  React.useEffect(() => {
    const loadAllAddresses = async () => {
      try {
        const addresses = await xanoClient.getAddresses();
        setAllAddresses(addresses);
      } catch (err) {
        console.error('Error loading addresses for suggestions:', err);
      }
    };
    loadAllAddresses();
  }, []);

  // Generate suggestions based on input
  const updateSuggestions = (fieldName: string, value: string) => {
    if (!value || value.length < 2) {
      setSuggestions({ streets: [], cities: [], postalCodes: [], countries: [] });
      return;
    }

    const lowerValue = value.toLowerCase();

    // Extract unique values from existing addresses
    const uniqueStreets = [...new Set(allAddresses.map(a => {
      // Try to extract street name without house number
      const match = a.street.match(/^(.+?)\s+\d+/);
      return match ? match[1] : a.street;
    }))].filter(s => s.toLowerCase().includes(lowerValue));

    const uniqueCities = [...new Set(allAddresses.map(a => a.city))]
      .filter(c => c.toLowerCase().includes(lowerValue));

    const uniquePostalCodes = [...new Set(allAddresses.map(a => a.postal_code))]
      .filter(p => p.toLowerCase().includes(lowerValue));

    const uniqueCountries = [...new Set(allAddresses.map(a => a.country))]
      .filter(c => c.toLowerCase().includes(lowerValue));

    setSuggestions({
      streets: uniqueStreets.slice(0, 5),
      cities: uniqueCities.slice(0, 5),
      postalCodes: uniquePostalCodes.slice(0, 5),
      countries: uniqueCountries.slice(0, 5)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Reset validation when address fields change
    const addressFields = ['street', 'house_number', 'street2', 'postal_code', 'city', 'state', 'country'];
    if (addressFields.includes(name)) {
      resetValidation();
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Update suggestions for relevant fields
      if (['street', 'city', 'postal_code', 'country'].includes(name)) {
        updateSuggestions(name, value);
        setShowSuggestions(prev => ({ ...prev, [name]: true }));
      }
    }
  };

  const handleSuggestionClick = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setShowSuggestions(prev => ({ ...prev, [fieldName]: false }));
    resetValidation();

    // Auto-fill related fields if selecting from a complete address
    if (fieldName === 'postal_code') {
      const matchingAddress = allAddresses.find(a => a.postal_code === value);
      if (matchingAddress && !formData.city) {
        setFormData(prev => ({ ...prev, city: matchingAddress.city }));
      }
    }
  };

  // Handle selecting an address from multiple validation results
  const handleSelectValidationResult = (result: any) => {
    const address = result.address || {};

    // Try to split street and house number
    let streetName = address.road || address.street || formData.street;
    let houseNum = address.house_number || formData.house_number;

    if (address.road || address.street) {
      const match = (address.road || address.street).match(/^(.+?)\s+(\d+[a-zA-Z]*)$/);
      if (match) {
        streetName = match[1];
        houseNum = match[2];
      }
    }

    const details = {
      street: streetName,
      postalCode: address.postcode || formData.postal_code,
      city: address.city || address.town || address.village || formData.city,
      state: address.state || '',
      country: address.country || formData.country,
    };

    setFormData(prev => ({
      ...prev,
      street: streetName,
      house_number: houseNum,
      postal_code: details.postalCode,
      city: details.city,
      state: details.state,
      country: details.country,
    }));

    setValidationResult({
      isValid: true,
      formatted: result.display_name,
      message: 'Adresse ausgewählt und validiert! Die Felder wurden automatisch korrigiert.',
      details
    });
  };

  const handleValidate = async () => {
    if (!formData.street || !formData.house_number || !formData.postal_code || !formData.city || !formData.country) {
      setError('Bitte füllen Sie Straße, Hausnummer, PLZ, Stadt und Land aus');
      return;
    }
    setError(null);
    const fullStreet = `${formData.street} ${formData.house_number}`;
    await validateAddress(fullStreet, formData.postal_code, formData.city, formData.country);
  };

  // Update form fields when validation succeeds
  React.useEffect(() => {
    if (validationResult?.isValid && validationResult.details) {
      const details = validationResult.details;

      // Try to split street and house number if returned as one string
      let streetName = details.street || formData.street;
      let houseNum = formData.house_number;

      if (details.street) {
        // Try to extract house number from the end of the street
        const match = details.street.match(/^(.+?)\s+(\d+[a-zA-Z]*)$/);
        if (match) {
          streetName = match[1];
          houseNum = match[2];
        }
      }

      setFormData(prev => ({
        ...prev,
        street: streetName,
        house_number: houseNum,
        postal_code: details.postalCode || prev.postal_code,
        city: details.city || prev.city,
        state: details.state || prev.state,
        country: details.country || prev.country,
      }));
    }
  }, [validationResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if address has been validated
    if (!validationResult?.isValid) {
      setError('Bitte validieren Sie die Adresse, bevor Sie fortfahren.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!formData.addressable_id) {
        throw new Error('Bitte wählen Sie eine Organisation oder Person aus');
      }

      // Combine street and house number for storage
      const fullStreet = `${formData.street} ${formData.house_number}`.trim();

      await xanoClient.createAddress({
        addressable_type: formData.addressable_type,
        addressable_id: Number(formData.addressable_id),
        address_type: formData.address_type,
        street: fullStreet,
        street2: formData.street2 || undefined,
        postal_code: formData.postal_code,
        city: formData.city,
        state: formData.state || undefined,
        country: formData.country,
        is_primary: formData.is_primary,
        is_active: formData.is_active,
      });
      onSave();
    } catch (err: any) {
      console.error('Error creating address:', err);
      setError(err.message || 'Fehler beim Erstellen der Adresse');
      setIsSubmitting(false);
    }
  };

  const availableEntities = formData.addressable_type === 'organization' ? organizations : persons;

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
        className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-title-2 text-text-primary mb-6">
          Neue Adresse hinzufügen
        </h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-body-sm">{error}</p>
          </div>
        )}

        {validationResult && (
          <div className={`border rounded-lg p-4 mb-4 ${
            validationResult.isValid
              ? 'bg-green-500/10 border-green-500/20'
              : validationResult.multipleResults
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">
                {validationResult.isValid ? '✓' : validationResult.multipleResults ? '?' : '✗'}
              </span>
              <div className="flex-1">
                <p className={`text-body-sm font-semibold mb-2 ${
                  validationResult.isValid ? 'text-green-400' : validationResult.multipleResults ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {validationResult.message}
                </p>
                {validationResult.formatted && (
                  <p className="text-body-sm text-text-tertiary">
                    Gefundene Adresse: {validationResult.formatted}
                  </p>
                )}
                {validationResult.isValid && (
                  <p className="text-body-sm text-green-400 mt-2">
                    ✓ Sie können die Adresse jetzt speichern
                  </p>
                )}
                {validationResult.multipleResults && (
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {validationResult.multipleResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectValidationResult(result)}
                        className="p-3 bg-bg-secondary border border-border-primary rounded-lg hover:border-accent-purple cursor-pointer transition-all"
                      >
                        <p className="text-body-sm text-text-primary font-medium mb-1">
                          {result.display_name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Klicken zum Auswählen
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {!validationResult.isValid && !validationResult.multipleResults && (
                  <p className="text-body-sm text-red-400 mt-2">
                    Bitte korrigieren Sie die Adresse und validieren Sie erneut.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entity Type & Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                Zuordnung zu *
              </label>
              <select
                name="addressable_type"
                value={formData.addressable_type}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, addressable_id: '' }));
                }}
                required
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="organization">Organisation</option>
                <option value="person">Person</option>
              </select>
            </div>

            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                {formData.addressable_type === 'organization' ? 'Organisation' : 'Person'} *
              </label>
              <select
                name="addressable_id"
                value={formData.addressable_id}
                onChange={handleChange}
                required
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                <option value="">Bitte auswählen...</option>
                {availableEntities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {'name' in entity ? entity.name : `${entity.first_name} ${entity.last_name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          {/* Street & House Number */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <label className="block text-body-sm text-text-secondary mb-2">
                Straße *
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, street: false })), 200)}
                required
                placeholder="z.B. Hauptstraße"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
              {showSuggestions.street && suggestions.streets.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.streets.map((street, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionClick('street', street)}
                      className="px-4 py-2 hover:bg-accent-purple/20 cursor-pointer text-text-primary text-body-sm"
                    >
                      {street}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-body-sm text-text-secondary mb-2">
                Hausnummer *
              </label>
              <input
                type="text"
                name="house_number"
                value={formData.house_number}
                onChange={handleChange}
                required
                placeholder="z.B. 123"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
            </div>
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
            <div className="relative">
              <label className="block text-body-sm text-text-secondary mb-2">
                PLZ *
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, postal_code: false })), 200)}
                required
                placeholder="12345"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
              {showSuggestions.postal_code && suggestions.postalCodes.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.postalCodes.map((code, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionClick('postal_code', code)}
                      className="px-4 py-2 hover:bg-accent-purple/20 cursor-pointer text-text-primary text-body-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 relative">
              <label className="block text-body-sm text-text-secondary mb-2">
                Stadt *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, city: false })), 200)}
                required
                placeholder="z.B. Berlin"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
              {showSuggestions.city && suggestions.cities.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.cities.map((city, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionClick('city', city)}
                      className="px-4 py-2 hover:bg-accent-purple/20 cursor-pointer text-text-primary text-body-sm"
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
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
            <div className="relative">
              <label className="block text-body-sm text-text-secondary mb-2">
                Land *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, country: false })), 200)}
                required
                placeholder="Deutschland"
                className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
              {showSuggestions.country && suggestions.countries.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.countries.map((country, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionClick('country', country)}
                      className="px-4 py-2 hover:bg-accent-purple/20 cursor-pointer text-text-primary text-body-sm"
                    >
                      {country}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Validate Address Button */}
          <div>
            <Button
              type="button"
              onClick={handleValidate}
              disabled={isValidatingAddress}
              variant="secondary"
              className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              {isValidatingAddress ? 'Validiere Adresse...' : '✓ Adresse validieren'}
            </Button>
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
              disabled={isSubmitting || !validationResult?.isValid}
              className={`flex-1 ${
                validationResult?.isValid
                  ? 'bg-accent-purple hover:bg-accent-purple/80'
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
              title={!validationResult?.isValid ? 'Bitte validieren Sie die Adresse zuerst' : ''}
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Adresse hinzufügen'}
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
      </motion.div>
    </motion.div>
  );
}

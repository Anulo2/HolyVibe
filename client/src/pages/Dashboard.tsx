import React, { useState, useEffect } from 'react'
import { authClient } from '../lib/auth-client'
import { toast } from 'sonner'
import { useFamilies, useChildren, useAuthorizedPersons } from '../hooks/useFamily'
import { 
  Users, 
  Calendar, 
  UserPlus, 
  Settings, 
  LogOut,
  Baby,
  Plus,
  Loader2,
  Building
} from 'lucide-react'
import { api } from '../lib/api-client'
import type { User } from 'better-auth/client'

// Simple Modal Component
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="rounded-lg bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// User Profile Update Form
const ProfileForm = ({ user, onUpdate, onClose }) => {
  const [name, setName] = useState(user?.name || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await api.user.profile.patch({
        name,
        birthDate,
      });

      if (error) {
        throw new Error(error.value.message);
      }
      
      toast.success('Profilo aggiornato con successo!');
      onUpdate(data.data); // Update user state in parent
      onClose();
    } catch (err) {
      toast.error(err.message || "Errore durante l'aggiornamento del profilo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Completa il tuo profilo</h2>
      <p className="text-sm text-muted-foreground">
        Per favore, inserisci i tuoi dati per continuare.
      </p>
      <div>
        <label className="block text-sm font-medium">Nome e Cognome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-600 bg-background p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Data di Nascita</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-600 bg-background p-2"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Salva
        </button>
      </div>
    </form>
  );
};

interface DashboardProps {
  session: { user: User }
  onSignOut: () => void
}

export default function Dashboard({ session, onSignOut }: DashboardProps) {
  const [currentUser, setCurrentUser] = useState(session?.user);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Check if user profile is incomplete on mount
  useEffect(() => {
    if (currentUser && !currentUser.name) {
      setShowProfileModal(true);
    }
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')
  
  const { families, loading: familiesLoading, createFamily } = useFamilies()
  const { children, loading: childrenLoading, addChild } = useChildren(selectedFamilyId)
  const { persons, loading: personsLoading, addPerson } = useAuthorizedPersons(selectedFamilyId)

  useEffect(() => {
    if (families.length > 0 && !selectedFamilyId) {
      setSelectedFamilyId(families[0].id)
    }
  }, [families, selectedFamilyId])

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      onSignOut()
      toast.success('Disconnesso con successo')
    } catch (error) {
      toast.error('Errore durante la disconnessione')
    }
  }
  
  const handleCreateOrganization = async () => {
    const orgName = prompt("Inserisci il nome della parrocchia:");
    if (!orgName) return;

    try {
      const { data, error } = await api.organizations.post({ name: orgName });
      if (error) throw new Error(error.value.message);
      toast.success(`Parrocchia "${data.data.name}" creata con successo!`);
      // Optionally, refetch organizations list here
    } catch (err) {
      toast.error(err.message || "Errore nella creazione della parrocchia");
    }
  };

  const handleCreateFamily = async () => {
    try {
      const familyName = prompt('Nome della famiglia:')
      if (!familyName) return
      
      await createFamily({ name: familyName })
      toast.success('Famiglia creata con successo!')
    } catch (error) {
      toast.error('Errore durante la creazione della famiglia')
    }
  }

  const handleAddChild = async () => {
    if (!selectedFamilyId) {
      toast.error('Seleziona prima una famiglia')
      return
    }

    try {
      const firstName = prompt('Nome del bambino:')
      const lastName = prompt('Cognome del bambino:')
      const birthDate = prompt('Data di nascita (YYYY-MM-DD):')
      
      if (!firstName || !lastName || !birthDate) return
      
      await addChild({
        firstName,
        lastName,
        birthDate
      })
      toast.success('Bambino aggiunto con successo!')
    } catch (error) {
      toast.error('Errore durante l\'aggiunta del bambino')
    }
  }

  const handleAddPerson = async () => {
    if (!selectedFamilyId) {
      toast.error('Seleziona prima una famiglia')
      return
    }

    try {
      const fullName = prompt('Nome completo:')
      const relationship = prompt('Relazione (es. Nonno, Nonna, Zio):')
      
      if (!fullName || !relationship) return
      
      await addPerson({
        fullName,
        relationship
      })
      toast.success('Persona autorizzata aggiunta con successo!')
    } catch (error) {
      toast.error('Errore durante l\'aggiunta della persona autorizzata')
    }
  }

  // Calculate totals for overview
  const totalChildren = children.length
  const totalPersons = persons.length
  const totalFamilies = families.length

  return (
    <>
      {showProfileModal && (
        <Modal onClose={() => setShowProfileModal(false)}>
          <ProfileForm 
            user={currentUser} 
            onUpdate={setCurrentUser}
            onClose={() => setShowProfileModal(false)} 
          />
        </Modal>
      )}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Family Management</h1>
              {familiesLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Ciao, {currentUser?.name || currentUser?.phoneNumber}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <LogOut size={16} />
                <span>Esci</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto flex">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-card p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                <Users size={16} />
                <span>Panoramica</span>
              </button>
              
              <button
                onClick={() => setActiveTab('family')}
                className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === 'family' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                <Baby size={16} />
                <span>Famiglia</span>
              </button>
              
              <button
                onClick={() => setActiveTab('events')}
                className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === 'events' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                <Calendar size={16} />
                <span>Eventi</span>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                <Settings size={16} />
                <span>Profilo</span>
              </button>

              <button
                onClick={() => setActiveTab('parishes')}
                className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === 'parishes' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                <Building size={16} />
                <span>Parrocchie</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Panoramica</h2>
                  <button 
                    onClick={handleCreateFamily}
                    className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus size={16} />
                    <span>Crea Famiglia</span>
                  </button>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Famiglie</p>
                        <p className="text-2xl font-bold">{totalFamilies}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center space-x-2">
                      <Baby className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Bambini</p>
                        <p className="text-2xl font-bold">{totalChildren}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Eventi Attivi</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Persone Autorizzate</p>
                        <p className="text-2xl font-bold">{totalPersons}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold">Le Tue Famiglie</h3>
                  {familiesLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : families.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {families.map((family) => (
                        <div 
                          key={family.id} 
                          className={`cursor-pointer rounded-md border p-4 transition-colors hover:bg-accent ${
                            selectedFamilyId === family.id ? 'border-primary bg-accent' : ''
                          }`}
                          onClick={() => setSelectedFamilyId(family.id)}
                        >
                          <h4 className="font-medium">{family.name}</h4>
                          {family.description && (
                            <p className="text-sm text-muted-foreground">{family.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Nessuna famiglia trovata. Crea la tua prima famiglia per iniziare!
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'family' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Famiglia</h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleAddChild}
                      disabled={!selectedFamilyId}
                      className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Plus size={16} />
                      <span>Aggiungi Bambino</span>
                    </button>
                    <button 
                      onClick={handleAddPerson}
                      disabled={!selectedFamilyId}
                      className="flex items-center space-x-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                    >
                      <Plus size={16} />
                      <span>Aggiungi Persona</span>
                    </button>
                  </div>
                </div>

                {selectedFamilyId ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Children Section */}
                    <div className="rounded-lg border bg-card p-6">
                      <h3 className="mb-4 text-lg font-semibold">Bambini</h3>
                      {childrenLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : children.length > 0 ? (
                        <div className="space-y-3">
                          {children.map((child) => (
                            <div key={child.id} className="rounded-md border p-3">
                              <p className="font-medium">{child.firstName} {child.lastName}</p>
                              <p className="text-sm text-muted-foreground">
                                Nato: {new Date(child.birthDate).toLocaleDateString()}
                              </p>
                              {child.allergies && (
                                <p className="text-xs text-orange-600">Allergie: {child.allergies}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          Nessun bambino registrato
                        </p>
                      )}
                    </div>

                    {/* Authorized Persons Section */}
                    <div className="rounded-lg border bg-card p-6">
                      <h3 className="mb-4 text-lg font-semibold">Persone Autorizzate</h3>
                      {personsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : persons.length > 0 ? (
                        <div className="space-y-3">
                          {persons.map((person) => (
                            <div key={person.id} className="rounded-md border p-3">
                              <p className="font-medium">{person.fullName}</p>
                              <p className="text-sm text-muted-foreground">{person.relationship}</p>
                              {person.phone && (
                                <p className="text-xs text-muted-foreground">Tel: {person.phone}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          Nessuna persona autorizzata
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-6">
                    <p className="text-center text-muted-foreground">
                      Seleziona una famiglia dalla panoramica per gestire bambini e persone autorizzate.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Eventi</h2>
                  <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Cerca Eventi
                  </button>
                </div>
                
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-center text-muted-foreground">
                    Funzionalità eventi in arrivo...
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Profilo</h2>
                
                <div className="rounded-lg border bg-card p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <p className="text-lg">{currentUser?.name || 'Non specificato'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-lg">{currentUser?.email || 'Non specificato'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Numero di telefono</label>
                      <p className="text-lg">{currentUser?.phoneNumber || 'Non specificato'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Verificato</label>
                      <p className="text-lg">
                        {currentUser?.phoneNumberVerified ? 'Sì' : 'No'}
                      </p>
                    </div>
                    
                    <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      Modifica Profilo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parishes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Gestione Parrocchie</h2>
                  <button 
                    onClick={handleCreateOrganization}
                    className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus size={16} />
                    <span>Crea Parrocchia</span>
                  </button>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-center text-muted-foreground">
                    Elenco delle parrocchie (da implementare).
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
} 
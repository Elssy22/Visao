'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  User,
  Building2,
  Bell,
  Palette,
  Shield,
  Loader2,
  Upload,
  Trash2,
  Twitter,
  AlertTriangle,
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gérez votre compte et votre organisation
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organisation</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Twitter className="h-4 w-4" />
            <span className="hidden sm:inline">Intégrations</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Zone danger</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        {/* Organization tab */}
        <TabsContent value="organization">
          <OrganizationSettings />
        </TabsContent>

        {/* Notifications tab */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Integrations tab */}
        <TabsContent value="integrations">
          <IntegrationSettings />
        </TabsContent>

        {/* Danger zone tab */}
        <TabsContent value="danger">
          <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('John Doe')
  const [email] = useState('john@example.com')

  const handleSave = async () => {
    setIsLoading(true)
    // TODO: Appeler l'API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations du profil</CardTitle>
        <CardDescription>
          Mettez à jour vos informations personnelles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" alt={name} />
            <AvatarFallback className="bg-blue-600 text-white text-2xl">
              {name.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Changer l&apos;avatar
            </Button>
            <p className="text-xs text-slate-500">
              JPG, PNG ou GIF. Max 2MB.
            </p>
          </div>
        </div>

        <Separator />

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-slate-500">
              L&apos;email ne peut pas être modifié pour le moment
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrganizationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [orgName, setOrgName] = useState('Mon Organisation')
  const [orgSlug, setOrgSlug] = useState('mon-organisation')

  const handleSave = async () => {
    setIsLoading(true)
    // TODO: Appeler l'API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;organisation</CardTitle>
          <CardDescription>
            Personnalisez votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">V</span>
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Changer le logo
              </Button>
              <p className="text-xs text-slate-500">
                JPG ou PNG. Recommandé: 512x512px
              </p>
            </div>
          </div>

          <Separator />

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Identifiant unique (slug)</Label>
              <Input
                id="org-slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <p className="text-xs text-slate-500">
                Utilisé dans les URLs. Uniquement lettres minuscules, chiffres et tirets.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan info */}
      <Card>
        <CardHeader>
          <CardTitle>Plan actuel</CardTitle>
          <CardDescription>
            Votre abonnement et ses limites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Plan Free</p>
              <p className="text-sm text-slate-500">3 sources, 1 utilisateur</p>
            </div>
            <Button variant="outline">Upgrade</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">0/3</p>
              <p className="text-sm text-slate-500">Sources</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">1/1</p>
              <p className="text-sm text-slate-500">Utilisateurs</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
              <p className="text-sm text-slate-500">Alertes ce mois</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [newAlertNotif, setNewAlertNotif] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(false)

  const handleEnablePush = async () => {
    // TODO: Demander les permissions et enregistrer le service worker
    setPushEnabled(!pushEnabled)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configurez comment vous souhaitez être notifié
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications push</Label>
              <p className="text-sm text-slate-500">
                Recevez des notifications en temps réel sur cet appareil
              </p>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={handleEnablePush} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications par email</Label>
              <p className="text-sm text-slate-500">
                Recevez des alertes par email
              </p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
        </div>

        <Separator />

        {/* Notification types */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900 dark:text-white">
            Types de notifications
          </h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Nouvelles alertes</Label>
              <p className="text-sm text-slate-500">
                Notifier pour chaque nouvelle alerte détectée
              </p>
            </div>
            <Switch checked={newAlertNotif} onCheckedChange={setNewAlertNotif} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Résumé quotidien</Label>
              <p className="text-sm text-slate-500">
                Recevoir un résumé des alertes chaque jour à 9h
              </p>
            </div>
            <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IntegrationSettings() {
  const [twitterConnected, setTwitterConnected] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Twitter / X</CardTitle>
          <CardDescription>
            Connectez votre compte X pour publier directement depuis Visao
          </CardDescription>
        </CardHeader>
        <CardContent>
          {twitterConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    @moncompte
                  </p>
                  <p className="text-sm text-slate-500">Connecté</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setTwitterConnected(false)}
              >
                Déconnecter
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Twitter className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-500 mb-4">
                Aucun compte X connecté
              </p>
              <Button onClick={() => setTwitterConnected(true)}>
                <Twitter className="h-4 w-4 mr-2" />
                Connecter X
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autres intégrations</CardTitle>
          <CardDescription>
            Bientôt disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            D&apos;autres intégrations (Slack, Discord, Webhooks) seront bientôt disponibles.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function DangerZone() {
  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="text-red-600">Zone de danger</CardTitle>
        <CardDescription>
          Actions irréversibles. Procédez avec précaution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Supprimer mon compte
            </p>
            <p className="text-sm text-slate-500">
              Supprime définitivement votre compte et toutes vos données
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données, sources et alertes
                  seront définitivement supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                  Oui, supprimer mon compte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Supprimer l&apos;organisation
            </p>
            <p className="text-sm text-slate-500">
              Supprime l&apos;organisation et retire tous les membres
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement l&apos;organisation, tous les membres,
                  toutes les sources et toutes les données associées. Cette action ne peut
                  pas être annulée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                  Oui, supprimer l&apos;organisation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

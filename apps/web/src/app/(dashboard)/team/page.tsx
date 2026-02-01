'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Trash2,
  Crown,
  Loader2,
  Users,
  Clock,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string | null
  isActive: boolean
  lastLoginAt: Date | null
  joinedAt: Date
}

interface Invitation {
  id: string
  email: string
  role: UserRole
  expiresAt: Date
  createdAt: Date
}

// Données mockées
const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'OWNER',
    avatar: null,
    isActive: true,
    lastLoginAt: new Date(),
    joinedAt: new Date('2024-01-01'),
  },
]

const mockInvitations: Invitation[] = []

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string; description: string }> = {
  OWNER: {
    label: 'Propriétaire',
    icon: Crown,
    color: 'text-yellow-500',
    description: 'Accès complet + suppression de l\'organisation',
  },
  ADMIN: {
    label: 'Administrateur',
    icon: ShieldAlert,
    color: 'text-red-500',
    description: 'Accès complet sauf suppression de l\'organisation',
  },
  EDITOR: {
    label: 'Éditeur',
    icon: ShieldCheck,
    color: 'text-blue-500',
    description: 'Peut ajouter des sources et publier',
  },
  VIEWER: {
    label: 'Lecteur',
    icon: Eye,
    color: 'text-slate-500',
    description: 'Peut uniquement consulter le feed',
  },
}

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(mockMembers)
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const handleCancelInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id))
    // TODO: Appeler l'API
  }

  // Limites du plan (mocké)
  const planLimits = {
    maxUsers: 3,
    currentUsers: members.length + invitations.length,
    plan: 'STARTER',
  }

  const canInvite = planLimits.currentUsers < planLimits.maxUsers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Équipe</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez les membres de votre organisation
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canInvite}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un membre
            </Button>
          </DialogTrigger>
          <InviteDialog
            onClose={() => setIsInviteOpen(false)}
            onInvite={(invitation) => {
              setInvitations((prev) => [...prev, invitation])
              setIsInviteOpen(false)
            }}
          />
        </Dialog>
      </div>

      {/* Plan limits */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {planLimits.currentUsers} / {planLimits.maxUsers} membres
                </p>
                <p className="text-sm text-slate-500">
                  Plan {planLimits.plan}
                </p>
              </div>
            </div>
            {!canInvite && (
              <Button variant="outline" size="sm">
                Augmenter la limite
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Membres ({members.length})</CardTitle>
          <CardDescription>
            Les membres actifs de votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations en attente ({invitations.length})</CardTitle>
            <CardDescription>
              Ces personnes n&apos;ont pas encore accepté leur invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {invitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={() => handleCancelInvitation(invitation.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Rôles et permissions</CardTitle>
          <CardDescription>
            Comprendre les différents niveaux d&apos;accès
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(roleConfig).map(([role, config]) => {
              const Icon = config.icon
              return (
                <div
                  key={role}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {config.label}
                    </p>
                    <p className="text-sm text-slate-500">{config.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MemberRow({ member }: { member: TeamMember }) {
  const config = roleConfig[member.role]
  const RoleIcon = config.icon

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const formatDate = (date: Date | null) => {
    if (!date) return 'Jamais'
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={member.avatar || undefined} alt={member.name} />
          <AvatarFallback className="bg-blue-600 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900 dark:text-white">
              {member.name}
            </p>
            <Badge variant="outline" className="gap-1">
              <RoleIcon className={`h-3 w-3 ${config.color}`} />
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm text-slate-500">Dernière connexion</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatDate(member.lastLoginAt)}
          </p>
        </div>

        {member.role !== 'OWNER' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Shield className="h-4 w-4 mr-2" />
                Changer le rôle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Retirer de l&apos;équipe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function InvitationRow({
  invitation,
  onCancel,
}: {
  invitation: Invitation
  onCancel: () => void
}) {
  const config = roleConfig[invitation.role]
  const RoleIcon = config.icon

  const isExpired = new Date(invitation.expiresAt) < new Date()

  const formatExpiry = (date: Date) => {
    const now = new Date()
    const diff = new Date(date).getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (diff < 0) return 'Expirée'
    if (hours < 24) return `Expire dans ${hours}h`
    return `Expire dans ${days}j`
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Mail className="h-5 w-5 text-slate-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900 dark:text-white">
              {invitation.email}
            </p>
            <Badge variant="outline" className="gap-1">
              <RoleIcon className={`h-3 w-3 ${config.color}`} />
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatExpiry(invitation.expiresAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isExpired ? (
          <Badge variant="destructive">Expirée</Badge>
        ) : (
          <Badge variant="secondary">En attente</Badge>
        )}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  )
}

function InviteDialog({
  onClose,
  onInvite,
}: {
  onClose: () => void
  onInvite: (invitation: Invitation) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('EDITOR')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Appeler l'API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newInvitation: Invitation = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        createdAt: new Date(),
      }

      onInvite(newInvitation)
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Inviter un membre</DialogTitle>
        <DialogDescription>
          Un email d&apos;invitation sera envoyé à cette adresse
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            placeholder="collegue@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleConfig)
                .filter(([r]) => r !== 'OWNER') // On ne peut pas inviter un OWNER
                .map(([r, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            {roleConfig[role].description}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer l&apos;invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

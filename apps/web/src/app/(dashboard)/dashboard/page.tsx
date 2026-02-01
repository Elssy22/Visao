import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rss, Bell, Bookmark, TrendingUp, Twitter, Instagram, Linkedin, Facebook, Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import Link from 'next/link'

// Fonction pour obtenir les statistiques
async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Sources actives
  const { count: sourcesCount } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Alertes aujourd'hui
  const { count: alertsToday } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .gte('detected_at', today.toISOString())

  // Alertes hier
  const { count: alertsYesterday } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .gte('detected_at', yesterday.toISOString())
    .lt('detected_at', today.toISOString())

  // Contenus sauvegardés
  const { count: savedCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'SAVED')

  // Publications ce mois (alertes avec status PUBLISHED)
  const { count: publishedThisMonth } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')
    .gte('detected_at', thisMonth.toISOString())

  // Publications mois dernier
  const { count: publishedLastMonth } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')
    .gte('detected_at', lastMonth.toISOString())
    .lt('detected_at', thisMonth.toISOString())

  // Alertes des 7 derniers jours par jour
  const { data: alertsLast7Days } = await supabase
    .from('alerts')
    .select('detected_at')
    .gte('detected_at', sevenDaysAgo.toISOString())
    .order('detected_at', { ascending: true })

  // Grouper par jour
  const alertsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    alertsByDay[key] = 0
  }
  alertsLast7Days?.forEach(alert => {
    const key = alert.detected_at.split('T')[0]
    if (alertsByDay[key] !== undefined) {
      alertsByDay[key]++
    }
  })

  // Alertes récentes (5 dernières)
  const { data: recentAlerts } = await supabase
    .from('alerts')
    .select('id, content, author_name, detected_at, status, source_id')
    .order('detected_at', { ascending: false })
    .limit(5)

  // Calculer les changements
  const alertsChange = alertsYesterday ? Math.round(((alertsToday || 0) - alertsYesterday) / alertsYesterday * 100) : 0
  const publishedChange = publishedLastMonth ? Math.round(((publishedThisMonth || 0) - publishedLastMonth) / publishedLastMonth * 100) : 0

  return {
    sources: sourcesCount || 0,
    alertsToday: alertsToday || 0,
    alertsYesterday: alertsYesterday || 0,
    alertsChange,
    saved: savedCount || 0,
    publishedThisMonth: publishedThisMonth || 0,
    publishedChange,
    alertsByDay,
    recentAlerts: recentAlerts || [],
  }
}

// Fonction pour obtenir les stats par réseau social
async function getNetworkStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Pour l'instant on simule les publications par réseau
  // En production, il faudrait une table 'publications' qui track où chaque alerte a été publiée
  const networks = [
    { name: 'Twitter', icon: Twitter, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bgColor: 'bg-blue-700/10' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
  ]

  // Récupérer les alertes publiées des 7 derniers jours
  const { data: publishedAlerts } = await supabase
    .from('alerts')
    .select('detected_at')
    .eq('status', 'PUBLISHED')
    .gte('detected_at', sevenDaysAgo.toISOString())

  const totalPublished = publishedAlerts?.length || 0

  // Simuler une distribution par réseau (en production, venir d'une vraie table)
  // Pour l'instant on répartit équitablement avec un peu de variance
  return networks.map((network, i) => {
    const baseCount = Math.floor(totalPublished / 4)
    const variance = i % 2 === 0 ? Math.floor(totalPublished * 0.1) : -Math.floor(totalPublished * 0.05)
    const count = Math.max(0, baseCount + variance)

    // Publications par jour (7 derniers jours)
    const dailyData: number[] = []
    for (let d = 6; d >= 0; d--) {
      dailyData.push(Math.floor(count / 7) + (d % 2))
    }

    return {
      ...network,
      count,
      dailyData,
      trend: i % 2 === 0 ? 12 : -5, // Simulé
    }
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stats = await getStats(supabase)
  const networkStats = await getNetworkStats(supabase)

  const statCards = [
    {
      name: 'Sources actives',
      value: stats.sources.toString(),
      icon: Rss,
      change: '+0%',
      changeType: 'neutral' as const,
    },
    {
      name: "Alertes aujourd'hui",
      value: stats.alertsToday.toString(),
      icon: Bell,
      change: stats.alertsChange > 0 ? `+${stats.alertsChange}%` : `${stats.alertsChange}%`,
      changeType: stats.alertsChange > 0 ? 'positive' as const : stats.alertsChange < 0 ? 'negative' as const : 'neutral' as const,
    },
    {
      name: 'Contenus sauvegardés',
      value: stats.saved.toString(),
      icon: Bookmark,
      change: '+0%',
      changeType: 'neutral' as const,
    },
    {
      name: 'Publications ce mois',
      value: stats.publishedThisMonth.toString(),
      icon: TrendingUp,
      change: stats.publishedChange > 0 ? `+${stats.publishedChange}%` : `${stats.publishedChange}%`,
      changeType: stats.publishedChange > 0 ? 'positive' as const : stats.publishedChange < 0 ? 'negative' as const : 'neutral' as const,
    },
  ]

  // Préparer les données du graphique (7 derniers jours)
  const chartData = Object.entries(stats.alertsByDay).map(([date, count]) => {
    const d = new Date(date)
    return {
      date,
      day: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      count,
    }
  })

  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Bonjour, {user?.user_metadata?.name || 'utilisateur'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Voici un aperçu de votre veille aujourd&apos;hui
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.changeType === 'positive'
                      ? 'text-green-500'
                      : stat.changeType === 'negative'
                      ? 'text-red-500'
                      : 'text-slate-400'
                  }
                >
                  {stat.change}
                </span>{' '}
                vs période précédente
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes par jour + Stats par réseau */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Graphique des alertes par jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Alertes des 7 derniers jours
            </CardTitle>
            <CardDescription>
              Nombre d&apos;alertes détectées par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {chartData.map((item) => (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-28">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {item.count}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all"
                      style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats par réseau social */}
        <Card>
          <CardHeader>
            <CardTitle>Publications par réseau</CardTitle>
            <CardDescription>
              Performance de vos publications par plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {networkStats.map((network) => {
              const Icon = network.icon
              const trend = network.trend
              return (
                <div key={network.name} className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${network.bgColor}`}>
                    <Icon className={`h-5 w-5 ${network.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{network.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{network.count}</span>
                        {trend > 0 ? (
                          <span className="text-green-500 text-xs flex items-center">
                            <ArrowUp className="h-3 w-3" />
                            {trend}%
                          </span>
                        ) : trend < 0 ? (
                          <span className="text-red-500 text-xs flex items-center">
                            <ArrowDown className="h-3 w-3" />
                            {Math.abs(trend)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs flex items-center">
                            <Minus className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Mini graphique des 7 derniers jours */}
                    <div className="flex items-end gap-0.5 h-6">
                      {network.dailyData.map((val, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${network.bgColor}`}
                          style={{
                            height: `${Math.max(20, (val / Math.max(...network.dailyData, 1)) * 100)}%`,
                            opacity: 0.5 + (i / 14)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Alertes récentes + Actions rapides */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Alertes récentes */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Alertes récentes</CardTitle>
            <CardDescription>
              Les dernières alertes de vos sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href="/feed"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <Rss className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {alert.author_name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {alert.content.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(alert.detected_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant={alert.status === 'SAVED' ? 'default' : 'secondary'} className="flex-shrink-0">
                      {alert.status === 'SAVED' ? 'Sauvegardé' : alert.status === 'PUBLISHED' ? 'Publié' : 'Nouveau'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Aucune alerte pour le moment
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Commencez par ajouter des sources pour recevoir des alertes en temps réel
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Commencez votre veille
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickAction
              title="Voir le feed"
              description="Consultez toutes vos alertes"
              href="/feed"
              badge="Nouveau"
            />
            <QuickAction
              title="Ajouter une source RSS"
              description="Surveillez un blog ou site d'actualités"
              href="/sources/new?type=rss"
            />
            <QuickAction
              title="Contenus sauvegardés"
              description="Retrouvez vos articles favoris"
              href="/saved"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  href,
  badge,
}: {
  title: string
  description: string
  href: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-slate-900 dark:text-white">{title}</h4>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <svg
        className="h-5 w-5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGoals } from '../store/goalsStore'
import { exportGoalsToFile, readImportFile } from '../lib/io'
import { THEME_OPTIONS, useTheme } from '../hooks/useTheme'
import useInstallPrompt from '../hooks/useInstallPrompt'
import {
  clearPushConfig,
  disablePush,
  enablePush,
  isInstalledPwa,
  loadPushConfig,
  pushCapable,
  pushOnIos,
  savePushConfig,
} from '../lib/push'
import {
  notificationPermission,
  requestNotificationPermission,
} from '../lib/notify'
import Button from '../components/ui/Button'
import ConfirmSheet from '../components/ui/ConfirmSheet'
import Icon from '../components/ui/Icon'
import SegmentedControl from '../components/ui/SegmentedControl'
import Sheet from '../components/ui/Sheet'

function Section({ title, children }) {
  return (
    <section className="px-5">
      <h2 className="mb-2 text-[12.5px] font-semibold tracking-wide text-subtle uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-elevated text-subtle">
          <Icon name={icon} className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">{title}</p>
          {subtitle && <p className="text-[12px] text-subtle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function OnlineStatus() {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        navigator.onLine ? 'bg-ok-soft text-ok' : 'bg-accent-soft text-accent'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          navigator.onLine ? 'bg-ok' : 'bg-accent'
        }`}
      />
      {navigator.onLine ? 'En ligne' : 'Hors-ligne'}
    </span>
  )
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const goals = useGoals((s) => s.goals)
  const importGoals = useGoals((s) => s.importGoals)
  const resetAll = useGoals((s) => s.resetAll)
  const { installed, isIOS, canInstall, promptInstall } = useInstallPrompt()

  const fileRef = useRef(null)

  const [confirmReset, setConfirmReset] = useState(false)
  const [resetHappened, setResetHappened] = useState(false)
  const [showIosInstall, setShowIosInstall] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)
  const [importMessage, setImportMessage] = useState(null)
  const [importError, setImportError] = useState(null)

  const [perm, setPerm] = useState(notificationPermission())
  const [permMsg, setPermMsg] = useState(null)
  const [permError, setPermError] = useState(null)

  const initialConfig = loadPushConfig()
  const [configUrl, setConfigUrl] = useState(initialConfig?.url ?? '')
  const [configKey, setConfigKey] = useState(initialConfig?.anonKey ?? '')
  const [configVapid, setConfigVapid] = useState(initialConfig?.vapidPublicKey ?? '')
  const [editingConfig, setEditingConfig] = useState(!initialConfig)
  const [configSaved, setConfigSaved] = useState(Boolean(initialConfig))
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushMsg, setPushMsg] = useState(null)
  const [pushError, setPushError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const reg = await navigator.serviceWorker?.ready
        const sub = await reg?.pushManager?.getSubscription()
        if (!cancelled) setPushEnabled(Boolean(sub))
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const storageKb = useMemo(() => {
    try {
      const bytes = new Blob([JSON.stringify(goals)]).size
      return bytes < 1024 ? `${bytes} o` : `${(bytes / 1024).toFixed(1)} Ko`
    } catch {
      return '—'
    }
  }, [goals])

  const handleFile = async (file) => {
    setImportError(null)
    setImportMessage(null)
    try {
      const parsed = await readImportFile(file)
      setPendingImport(parsed)
    } catch (err) {
      setImportError(err?.message ?? 'Fichier invalide.')
    }
  }

  const onImport = async (replace) => {
    importGoals(pendingImport, { replace })
    setPendingImport(null)
    setImportMessage(
      replace
        ? 'Données remplacées par celles du fichier.'
        : 'Objectifs importés, sans doublons.',
    )
  }

  const requestPerm = async () => {
    setPermMsg(null)
    setPermError(null)
    const result = await requestNotificationPermission()
    setPerm(result)
    if (result === 'granted') setPermMsg('Notifications autorisées.')
    else if (result === 'denied') setPermError('Autorisation refusée. Réactivez-la dans les réglages du navigateur.')
  }

  const saveConfig = () => {
    setPushError(null)
    if (!configUrl.trim() || !configKey.trim() || !configVapid.trim()) {
      setPushError('Les trois champs sont requis pour activer le push.')
      return
    }
    savePushConfig({
      url: configUrl.trim(),
      anonKey: configKey.trim(),
      vapidPublicKey: configVapid.trim(),
    })
    setConfigSaved(true)
    setEditingConfig(false)
    setPushMsg('Configuration enregistrée. La prochaine sync des rappels utilisera Supabase.')
  }

  const removeConfig = () => {
    disablePush()
    clearPushConfig()
    setConfigUrl('')
    setConfigKey('')
    setConfigVapid('')
    setEditingConfig(true)
    setConfigSaved(false)
    setPushEnabled(false)
    setPushMsg(null)
  }

  const activatePush = async () => {
    setPushError(null)
    setPushMsg(null)
    const res = await enablePush()
    setPerm(notificationPermission())
    if (res.ok) {
      setPushEnabled(true)
      setPushMsg('Notifications push activées sur cet appareil.')
    } else if (res.reason === 'permission') {
      setPushError('Autorisation de notification refusée.')
    } else {
      setPushError('Impossible de s’abonner. Vérifiez clés et URL, puis que l’app est installée (iPhone).')
    }
  }

  const deactivatePush = async () => {
    await disablePush()
    setPushEnabled(false)
    setPushMsg('Notifications push désactivées.')
  }

  const pushCapableHere = pushCapable()
  const needIosInstall = pushOnIos() && !isInstalledPwa()

  return (
    <div className="anim-view flex flex-col gap-6 pb-8">
      <header className="safe-top px-5">
        <p className="text-[13px] text-subtle">Apparence & données</p>
        <h1 className="text-[24px] font-bold tracking-tight">Réglages</h1>
      </header>

      <Section title="Apparence">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium">Thème</p>
              <p className="text-[12px] text-subtle">Suit votre appareil par défaut.</p>
            </div>
          </div>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={theme}
            onChange={setTheme}
            className="mt-3"
          />
        </div>
      </Section>

      <Section title="Notifications">
        <div className="flex flex-col gap-2.5">
          <Row
            icon="bell"
            title="Notifications système"
            subtitle={
              perm === 'granted'
                ? 'Les rappels s’affichent hors de l’app.'
                : perm === 'denied'
                  ? 'Bloquées par le navigateur.'
                  : perm === 'unsupported'
                    ? 'Non prises en charge par ce navigateur.'
                    : 'À autoriser pour recevoir des rappels.'
            }
          >
            {perm === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-medium text-ok">
                <Icon name="check" className="size-3.5" />
                Autorisées
              </span>
            ) : perm === 'denied' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-medium text-danger">
                Refusées
              </span>
            ) : perm === 'unsupported' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-subtle">
                Non supporté
              </span>
            ) : (
              <Button size="sm" onClick={requestPerm}>
                Autoriser
              </Button>
            )}
          </Row>
          {permMsg && (
            <p className="anim-fade-in flex items-center gap-1.5 px-1 text-[12.5px] text-ok">
              <Icon name="check" className="size-4" />
              {permMsg}
            </p>
          )}
          {permError && (
            <p className="anim-fade-in flex items-center gap-1.5 px-1 text-[12.5px] text-danger">
              <Icon name="alert" className="size-4" />
              {permError}
            </p>
          )}

          <Row
            icon="send"
            title="Notifications push (Supabase)"
            subtitle={
              configSaved && pushEnabled
                ? 'Actives — rappels livrés même app fermée (iPhone si installée).'
                : configSaved
                  ? 'Configurées — bouton pour s’abonner sur cet appareil.'
                  : 'Optionnel. Envoie les rappels via un projet Supabase.'
            }
          >
            {pushEnabled ? (
              <Button size="sm" variant="subtle" onClick={deactivatePush}>
                Désactiver
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-subtle">
                {configSaved ? 'Prête' : 'Hors-ligne'}
              </span>
            )}
          </Row>

          {!editingConfig && configSaved && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                {!pushCapableHere ? (
                  <p className="w-full text-[12.5px] text-subtle">
                    {needIosInstall
                      ? 'Sur iPhone, ajoutez d’abord l’app à l’écran d’accueil puis relancez-la depuis son icône : les notifications deviennent possibles.'
                      : 'Ce navigateur ne prend pas en charge le Web Push.'}
                  </p>
                ) : pushEnabled ? null : (
                  <Button size="sm" onClick={activatePush}>
                    Activer les notifications
                  </Button>
                )}
                <Button size="sm" variant="subtle" onClick={() => setEditingConfig(true)}>
                  Modifier
                </Button>
                {!pushEnabled && (
                  <Button size="sm" variant="ghost" onClick={removeConfig}>
                    Effacer
                  </Button>
                )}
              </div>
              {pushMsg && (
                <p className="anim-fade-in mt-2.5 flex items-center gap-1.5 text-[12.5px] text-ok">
                  <Icon name="check" className="size-4" />
                  {pushMsg}
                </p>
              )}
              {pushError && (
                <p className="anim-fade-in mt-2.5 flex items-center gap-1.5 text-[12.5px] text-danger">
                  <Icon name="alert" className="size-4" />
                  {pushError}
                </p>
              )}
            </div>
          )}

          {(editingConfig || !configSaved) && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-[12.5px] leading-relaxed text-subtle">
                Créez un projet sur{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent"
                >
                  supabase.com
                </a>{' '}
                et appliquez la migration + fonctions du dossier{' '}
                <code className="rounded bg-elevated px-1.5 py-0.5 text-[11.5px]">supabase/</code> du
                projet. Renseignez l’URL du projet, la clé anon et la clé publique VAPID.
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-subtle">
                    URL du projet Supabase
                  </label>
                  <input
                    value={configUrl}
                    onChange={(e) => setConfigUrl(e.target.value)}
                    placeholder="https://xxxx.supabase.co"
                    spellCheck="false"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-[14px] outline-none placeholder:text-faint focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-subtle">
                    Clé anon (publishable)
                  </label>
                  <input
                    value={configKey}
                    onChange={(e) => setConfigKey(e.target.value)}
                    placeholder="eyJhbGciOi…"
                    spellCheck="false"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-[13px] outline-none placeholder:text-faint focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-subtle">
                    Clé publique VAPID
                  </label>
                  <input
                    value={configVapid}
                    onChange={(e) => setConfigVapid(e.target.value)}
                    placeholder="BG7x…"
                    spellCheck="false"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-[13px] outline-none placeholder:text-faint focus:border-accent"
                  />
                </div>
                {pushError && editingConfig && (
                  <p className="anim-fade-in flex items-center gap-1.5 text-[12.5px] text-danger">
                    <Icon name="alert" className="size-4" />
                    {pushError}
                  </p>
                )}
                <Button onClick={saveConfig}>Enregistrer la configuration</Button>
              </div>
            </div>
          )}

          <p className="px-1 text-[11.5px] leading-relaxed text-faint">
            Le push transmet le titre de vos objectifs et les horaires de rappels vers Supabase.
            Actif uniquement si configuré. Les données restent hors-ligne sans cette option.
          </p>
        </div>
      </Section>

      <Section title="Données">
        <div className="flex flex-col gap-2.5">
          <Row icon="lock" title="Stockage local" subtitle={`${goals.length} objectif${goals.length > 1 ? 's' : ''} · ${storageKb}`}>
            <OnlineStatus />
          </Row>

          <Row
            icon="upload"
            title="Exporter"
            subtitle="Télécharge un fichier JSON de vos objectifs."
          >
            <Button
              size="sm"
              variant="subtle"
              disabled={goals.length === 0}
              onClick={() => exportGoalsToFile(goals)}
            >
              Exporter
            </Button>
          </Row>

          <Row
            icon="download"
            title="Importer"
            subtitle="Restaure des objectifs depuis un fichier JSON."
          >
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              Importer
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </Row>

          {importError && (
            <p className="anim-fade-in flex items-center gap-1.5 px-1 text-[12.5px] text-danger">
              <Icon name="alert" className="size-4" />
              {importError}
            </p>
          )}
          {importMessage && (
            <p className="anim-fade-in flex items-center gap-1.5 px-1 text-[12.5px] text-ok">
              <Icon name="check" className="size-4" />
              {importMessage}
            </p>
          )}

          <button
            onClick={() => setConfirmReset(true)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-danger/40 bg-danger-soft p-4 transition-colors hover:bg-danger/15"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-danger/15 text-danger">
              <Icon name="trash" className="size-4.5" />
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[14px] font-medium text-danger">
                Effacer toutes les données
              </span>
              <span className="block text-[12px] text-subtle">
                Supprime définitivement tous vos objectifs.
              </span>
            </span>
            <Icon name="chevron" className="size-4 -rotate-90 text-danger" />
          </button>

          {resetHappened && (
            <p className="anim-fade-in flex items-center gap-1.5 px-1 text-[12.5px] text-ok">
              <Icon name="check" className="size-4" />
              Toutes les données ont été effacées.
            </p>
          )}
        </div>
      </Section>

      <Section title="Application">
        <div className="flex flex-col gap-2.5">
          <Row icon="download" title="Installer l’application" subtitle="Ajoutez Horizons à votre écran d’accueil.">
            {installed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-medium text-ok">
                <Icon name="check" className="size-3.5" />
                Installée
              </span>
            ) : isIOS ? (
              <Button size="sm" onClick={() => setShowIosInstall(true)}>
                Installer
              </Button>
            ) : (
              <Button
                size="sm"
                variant="subtle"
                disabled={!canInstall}
                onClick={promptInstall}
              >
                Installer
              </Button>
            )}
          </Row>
          <Row icon="sparkles" title="Horizons" subtitle="PWA 100% hors-ligne · v1.0.0" />
        </div>
      </Section>

      <p className="px-5 text-center text-[11.5px] leading-relaxed text-faint">
        Vos objectifs restent sur cet appareil.
        <br />
        Aucune donnée n’est envoyée sur Internet.
      </p>

      <Sheet open={showIosInstall} onClose={() => setShowIosInstall(false)} title="Installer sur iPhone" icon="download">
        <div className="flex flex-col gap-5">
          <p className="text-[13.5px] leading-relaxed text-subtle">
            Sur iPhone, l’installation passe par Safari (impossible de l’automatiser).
          </p>
          <ol className="flex flex-col gap-3 text-[14px]">
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">1</span>
              <span>
                Ouvrez Horizons dans <strong>Safari</strong> (copiez son adresse si vous êtes
                dans un autre navigateur).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">2</span>
              <span>
                Appuyez sur le bouton <strong>Partager</strong>{' '}
                <Icon name="upload" className="inline size-4 align-[-2px] text-subtle" /> en
                bas de l’écran.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">3</span>
              <span>Choisissez <strong>Ajouter à l’écran d’accueil</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">4</span>
              <span>Touchez <strong>Ajouter</strong> en haut à droite.</span>
            </li>
          </ol>
          <p className="rounded-xl bg-ok-soft px-3 py-2.5 text-[12.5px] font-medium text-ok">
            Horizons apparaît ensuite sur votre écran d’accueil, avec ses propres données.
          </p>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        title="Importer des objectifs"
        icon="download"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[14px] leading-relaxed text-subtle">
            <span className="font-semibold text-ink">{pendingImport?.length ?? 0}</span>{' '}
            objectif{pendingImport?.length && pendingImport.length > 1 ? 's' : ''} trouvé
            {pendingImport?.length && pendingImport.length > 1 ? 's' : ''} dans le
            fichier. Comment souhaitez-vous les ajouter ?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full justify-between"
              onClick={() => onImport(true)}
            >
              Remplacer toutes les données
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => onImport(false)}
            >
              Fusionner sans doublons
            </Button>
          </div>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          setResetHappened(true)
        }}
        title="Tout effacer ?"
        message="Cette action supprime définitivement tous vos objectifs et leurs sous-tâches. Elle est irréversible."
        confirmLabel="Tout effacer"
      />
    </div>
  )
}
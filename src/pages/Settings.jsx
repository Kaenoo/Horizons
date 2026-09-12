import { useMemo, useRef, useState } from 'react'
import { useGoals } from '../store/goalsStore'
import { exportGoalsToFile, readImportFile } from '../lib/io'
import { THEME_OPTIONS, useTheme } from '../hooks/useTheme'
import useInstallPrompt from '../hooks/useInstallPrompt'
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
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  const fileRef = useRef(null)

  const [confirmReset, setConfirmReset] = useState(false)
  const [resetHappened, setResetHappened] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)
  const [importMessage, setImportMessage] = useState(null)
  const [importError, setImportError] = useState(null)

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
            <Button
              variant="subtle"
              size="sm"
              disabled={!canInstall || installed}
              onClick={promptInstall}
            >
              {installed ? 'Installée' : 'Installer'}
            </Button>
          </Row>
          <Row icon="sparkles" title="Horizons" subtitle="PWA 100% hors-ligne · v1.0.0" />
        </div>
      </Section>

      <p className="px-5 text-center text-[11.5px] leading-relaxed text-faint">
        Vos objectifs restent sur cet appareil.
        <br />
        Aucune donnée n’est envoyée sur Internet.
      </p>

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
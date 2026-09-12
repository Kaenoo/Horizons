import { useEffect, useState } from 'react'

function detectEnvironment() {
  if (typeof window === 'undefined') {
    return { isIOS: false, standalone: false, supportsInstallPrompt: false }
  }
  const ua = window.navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  const supportsInstallPrompt = 'onbeforeinstallprompt' in window
  return { isIOS, standalone, supportsInstallPrompt }
}

export default function useInstallPrompt() {
  const env = detectEnvironment()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(env.standalone)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    const prompt = installPrompt
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    setInstalled(true)
    setInstallPrompt(null)
  }

  return {
    installed,
    isIOS: env.isIOS,
    canInstall: Boolean(installPrompt) && !env.standalone,
    promptInstall,
  }
}
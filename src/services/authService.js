const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
let scriptPromise
let initializedClientId = null
let activeCredentialRegistration = null

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GOOGLE_SCRIPT; script.async = true; script.defer = true
      script.onload = resolve
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Google sign-in could not load. Check your connection and try again.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export const googleAuthService = {
  getClientId() { return import.meta.env.VITE_GOOGLE_CLIENT_ID || '' },
  async mountButton(element, onResult, { signal, registrationToken = Symbol('google-button-mount') } = {}) {
    const clientId = this.getClientId()
    if (!clientId || !element || signal?.aborted) return false

    activeCredentialRegistration = { token: registrationToken, handler: onResult, signal }
    try {
      await loadGoogleIdentityScript()
      // React StrictMode can clean up an effect while the shared script is loading.
      // Do not initialize or render into a host owned by an already-unmounted effect.
      if (signal?.aborted) {
        this.clearButtonCallback(registrationToken)
        return false
      }

      if (initializedClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            const registration = activeCredentialRegistration
            if (registration && !registration.signal?.aborted) registration.handler(credential)
          },
        })
        initializedClientId = clientId
      }
      window.google.accounts.id.renderButton(element, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: Math.max(240, Math.min(360, element.clientWidth || 320)), logo_alignment: 'left' })
      return true
    } catch (error) {
      this.clearButtonCallback(registrationToken)
      throw error
    }
  },
  clearButtonCallback(registrationToken) {
    if (activeCredentialRegistration?.token === registrationToken) activeCredentialRegistration = null
  },
}

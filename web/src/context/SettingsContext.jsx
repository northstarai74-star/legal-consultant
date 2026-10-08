import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchConfig } from '../lib/api.js';
import { readJSON, writeJSON, SETTINGS_KEY } from '../lib/storage.js';

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

const DEFAULTS = {
  name: '',
  organization: '',
  address: '',
  jurisdiction: '',
  model: '',
  apiKey: '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...readJSON(SETTINGS_KEY, {}) }));
  const [config, setConfig] = useState({
    loading: true,
    error: false,
    serverKey: false,
    models: [],
    defaultModel: '',
    defaultLocalModel: '',
    ollama: { reachable: false, count: 0 },
  });

  useEffect(() => {
    writeJSON(SETTINGS_KEY, settings);
  }, [settings]);

  // Also used to re-check Ollama after the user starts it, so no page reload is needed.
  const refreshConfig = useCallback(
    () =>
      fetchConfig()
        .then((c) => setConfig({ ...c, loading: false, error: false }))
        .catch(() => setConfig((c) => ({ ...c, loading: false, error: true }))),
    [],
  );

  useEffect(() => {
    refreshConfig();
    window.addEventListener('focus', refreshConfig);
    return () => window.removeEventListener('focus', refreshConfig);
  }, [refreshConfig]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);

  const value = useMemo(() => {
    const apiKey = settings.apiKey.trim();
    // Claude models need a key; local (Ollama) models run on this computer and never do.
    const cloudReady = Boolean(apiKey) || config.serverKey;
    const models = config.models.filter((m) => m.local || cloudReady);
    const live = models.length > 0;
    // A local model is the default when one is running; Claude models stay one click away in the picker.
    const fallback = config.defaultLocalModel || (cloudReady ? config.defaultModel : '');
    const preferred = models.find((m) => m.id === settings.model)?.id ?? models.find((m) => m.id === fallback)?.id ?? models[0]?.id ?? '';
    const currentModel = models.find((m) => m.id === preferred) ?? null;
    return {
      settings,
      update,
      config,
      refreshConfig,
      apiKey,
      cloudReady,
      live,
      // The model id sent with requests: 'demo' until a local model or Claude is available.
      model: live ? preferred : 'demo',
      preferredModel: preferred,
      currentModel,
      models,
      profile: {
        name: settings.name,
        organization: settings.organization,
        address: settings.address,
        jurisdiction: settings.jurisdiction,
      },
    };
  }, [settings, config, update, refreshConfig]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

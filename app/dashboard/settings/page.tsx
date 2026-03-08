'use client'
import React, { useState, useEffect } from 'react'
import { Save, Lock, Bell, User, Globe, Key, Shield, Phone, Linkedin, Twitter, Instagram } from 'lucide-react'
import { useAgentStore } from '@/stores/useAgentStore'
import { useDashboardStore, type CompanySettings, type NotificationSettings } from '@/lib/store'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'

const defaultProfile: CompanySettings = {
  name: '',
  email: '',
  language: '',
  website: '',
  industry: '',
  size: '',
  pitch: '',
  phone: '',
  linkedin: '',
  twitter: '',
  instagram: '',
  targetAudience: '',
  tone: '',
  budgetAlertThreshold: 5000,
}

export default function SettingsPage() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const { userSettings, updateSettings, addLog } = useAgentStore()
  const settings = useDashboardStore((s) => s.settings)
  const updateDashboardSettings = useDashboardStore((s) => s.updateSettings)
  const toggleNotification = useDashboardStore((s) => s.toggleNotification)
  const resetSystem = useDashboardStore((s) => s.resetSystem)

  const notif: NotificationSettings = {
    emailUpdates: true,
    pushNotifications: false,
    dailyReports: false,
    missionCompleted: true,
    lowCreditsWarning: true,
    ...settings?.notifications,
  }

  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState<CompanySettings>({ ...defaultProfile, ...settings })

  const [apiFormData, setApiFormData] = useState({
    companyName: userSettings?.companyName || '',
    apiKey: userSettings?.apiKey || '',
    language: userSettings?.language || '',
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    daily: false,
  })

  useEffect(() => {
    if (!settings) return
    setFormData({
      name: settings.name ?? '',
      email: settings.email ?? '',
      language: settings.language ?? '',
      website: settings.website ?? '',
      industry: settings.industry ?? '',
      size: settings.size ?? '',
      pitch: settings.pitch ?? '',
      phone: settings.phone ?? '',
      linkedin: settings.linkedin ?? '',
      twitter: settings.twitter ?? '',
      instagram: settings.instagram ?? '',
      targetAudience: settings.targetAudience ?? '',
      tone: settings.tone ?? '',
      budgetAlertThreshold: settings.budgetAlertThreshold ?? 5000,
    })
  }, [settings])

  useEffect(() => {
    if (userSettings) {
      setApiFormData({
        companyName: userSettings?.companyName || '',
        apiKey: userSettings?.apiKey || '',
        language: userSettings?.language || '',
      })
    }
  }, [userSettings])

  const handleSaveProfile = () => {
    updateDashboardSettings(formData)
    toast.success(t.dashboard.toast.profileSaved)
  }

  const handlePushToggle = () => {
    if (!notif.pushNotifications) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('SANTARAI Systems', { body: t.dashboard.settings.pushChannelActivated })
            toggleNotification('pushNotifications')
          }
        })
      } else {
        toggleNotification('pushNotifications')
      }
    } else {
      toggleNotification('pushNotifications')
    }
  }

  const handleTestPush = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && notif.pushNotifications) {
      new Notification('SANTARAI Systems', { body: t.dashboard.settings.testNotificationSuccess })
    }
  }

  const triggerTestEvent = (type: 'MISSION' | 'CREDITS') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (!notif.pushNotifications) {
      alert('Test échoué : Les notifications Push sont désactivées globalement (Navigateur).')
      return
    }
    if (Notification.permission !== 'granted') {
      alert(t.dashboard.settings.alertPermissionMissing)
      return
    }
    if (type === 'MISSION') {
      if (notif.missionCompleted) {
        new Notification('SANTARAI OPS', {
          body: "Succès : L'agent GHOST a terminé la mission 'Audit SEO'.",
        })
      } else {
        alert(t.dashboard.settings.alertMissionFilterOff)
      }
    }
    if (type === 'CREDITS') {
      if (notif.lowCreditsWarning) {
        new Notification('SANTARAI FINANCE', {
          body: 'Alerte : Solde critique (moins de 1000 TK). Rechargez immédiatement.',
        })
      } else {
        alert("Blocage réussi : Le filtre 'Trésorerie' est OFF. Aucune notif reçue.")
      }
    }
  }

  const handleSaveApi = () => {
    if (updateSettings) {
      updateSettings({
        companyName: apiFormData.companyName || '',
        apiKey: apiFormData.apiKey || '',
        language: apiFormData.language || '',
      })
    }
    if (addLog) addLog(t.dashboard.toast.settingsSaved)
    toast.success(t.dashboard.toast.settingsSaved)
  }

  const inputClass = 'w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-100 focus:border-blue-500 outline-none transition-colors'
  const labelClass = 'text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block'

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#020617] text-white pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{t.dashboard.settings.title}</h1>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar onglets */}
          <div className="w-full md:w-64 space-y-2 flex-shrink-0">
            {[
              { id: 'general', label: t.dashboard.settings.general, icon: User },
              { id: 'notifications', label: t.dashboard.settings.notifications, icon: Bell },
              { id: 'security', label: t.dashboard.settings.security, icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              )
            })}
          </div>

          {/* Carte contenu principal */}
          <div className="flex-1 space-y-8">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <User size={20} className="text-blue-500" />
                    {t.dashboard.settings.companyProfile}
                  </h2>

                  {/* SECTION 1 : IDENTITÉ */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-4">📍 {t.dashboard.settings.identity}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.companyName}</label>
                        <input
                          type="text"
                          value={formData.name ?? ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={inputClass}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.website}</label>
                        <div className="relative">
                          <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="url"
                            value={formData.website ?? ''}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className={`${inputClass} pl-10`}
                            placeholder={t.dashboard.settings.placeholders.website}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.industry}</label>
                        <input
                          type="text"
                          value={formData.industry ?? ''}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          className={inputClass}
                          placeholder={t.dashboard.settings.placeholders.industry}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.companySize}</label>
                        <input
                          type="text"
                          value={formData.size ?? ''}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className={inputClass}
                          placeholder={t.dashboard.settings.placeholders.size}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className={labelClass}>{t.dashboard.settings.pitch}</label>
                      <textarea
                        value={formData.pitch ?? ''}
                        onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                        className={`${inputClass} min-h-[100px] resize-y`}
                        placeholder={t.dashboard.settings.placeholders.pitch}
                      />
                    </div>
                  </div>

                  {/* SECTION 2 : CONTACT & RÉSEAUX */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-4">📞 {t.dashboard.settings.contactNetworks}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.adminEmail}</label>
                        <input
                          type="email"
                          value={formData.email ?? ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={inputClass}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.phone}</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="tel"
                            value={formData.phone ?? ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={`${inputClass} pl-10`}
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.socialLinkedin}</label>
                        <div className="relative">
                          <Linkedin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="url"
                            value={formData.linkedin ?? ''}
                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                            className={`${inputClass} pl-10`}
                            placeholder={t.dashboard.settings.placeholders.linkedin}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.socialTwitter}</label>
                        <div className="relative">
                          <Twitter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="url"
                            value={formData.twitter ?? ''}
                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                            className={`${inputClass} pl-10`}
                            placeholder={t.dashboard.settings.placeholders.twitter}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.socialInstagram}</label>
                        <div className="relative">
                          <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="url"
                            value={formData.instagram ?? ''}
                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                            className={`${inputClass} pl-10`}
                            placeholder={t.dashboard.settings.placeholders.instagram}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3 : CALIBRAGE IA */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-4">🧠 {t.dashboard.settings.aiCalibration}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.target}</label>
                        <select
                          value={formData.targetAudience ?? ''}
                          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">—</option>
                          <option value="B2B">B2B</option>
                          <option value="B2C">B2C</option>
                          <option value="B2B2C">B2B & B2C</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.tone}</label>
                        <select
                          value={formData.tone ?? ''}
                          onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">—</option>
                          <option value="Professional">{t.dashboard.settings.toneOptions.pro}</option>
                          <option value="Friendly">{t.dashboard.settings.toneOptions.friendly}</option>
                          <option value="Luxury">{t.dashboard.settings.toneOptions.luxury}</option>
                          <option value="Aggressive">{t.dashboard.settings.toneOptions.aggressive}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className={labelClass}>{t.dashboard.settings.language}</label>
                        <select
                          value={formData.language ?? ''}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">—</option>
                          <option value="fr">{t.dashboard.settings.languageOptions.fr}</option>
                          <option value="en">{t.dashboard.settings.languageOptions.en}</option>
                          <option value="es">{t.dashboard.settings.languageOptions.es}</option>
                          <option value="de">{t.dashboard.settings.languageOptions.de}</option>
                          <option value="ar">{t.dashboard.settings.languageOptions.ar}</option>
                        </select>
                      </div>
                      <div />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99]"
                  >
                    <Save size={18} /> {t.dashboard.settings.saveProfile}
                  </button>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Key size={20} className="text-indigo-500" />
                    {t.dashboard.settings.apiConfig}
                  </h2>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                    <p className="text-sm text-blue-200">{t.dashboard.settings.apiKeyNote}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>{t.dashboard.settings.openaiKey}</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiFormData.apiKey || ''}
                          onChange={(e) => setApiFormData({ ...apiFormData, apiKey: e.target.value })}
                          placeholder="sk-..."
                          className={`${inputClass} flex-1`}
                        />
                        <button
                          onClick={() => setApiFormData({ ...apiFormData, apiKey: '' })}
                          className="px-4 py-3 bg-slate-800 rounded-xl text-xs font-bold border border-white/10 hover:bg-slate-700 transition-colors"
                        >
                          {t.dashboard.settings.reset}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t.dashboard.settings.defaultModel}</label>
                        <select className={inputClass}>
                        <option>{t.dashboard.settings.modelGpt4}</option>
                        <option>{t.dashboard.settings.modelGpt35}</option>
                        <option>{t.dashboard.settings.modelClaude}</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                    <button
                      onClick={handleSaveApi}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all"
                    >
                      <Save size={18} /> {t.dashboard.settings.save}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Bell size={20} className="text-yellow-500" />
                    {t.dashboard.settings.notificationPrefs}
                  </h2>

                  <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-3">{t.dashboard.settings.channels}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <div>
                          <div className="font-bold text-sm mb-1">{t.dashboard.settings.email}</div>
                          <div className="text-xs text-slate-400">{t.dashboard.settings.emailDesc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleNotification('emailUpdates')}
                          className={`w-14 h-7 rounded-full relative transition-all flex-shrink-0 ${notif.emailUpdates ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${notif.emailUpdates ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <div>
                          <div className="font-bold text-sm mb-1">{t.dashboard.settings.pushBrowser}</div>
                          <div className="text-xs text-slate-400">{t.dashboard.settings.pushDesc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={handlePushToggle}
                          className={`w-14 h-7 rounded-full relative transition-all flex-shrink-0 ${notif.pushNotifications ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${notif.pushNotifications ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {notif.pushNotifications && (
                        <div className="pl-4">
                          <button
                            type="button"
                            onClick={handleTestPush}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {t.dashboard.settings.testNotification}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-3">{t.dashboard.settings.criticalEvents}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <div>
                          <div className="font-bold text-sm mb-1">{t.dashboard.settings.missionComplete}</div>
                          <div className="text-xs text-slate-400">{t.dashboard.settings.missionCompleteDesc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleNotification('missionCompleted')}
                          className={`w-14 h-7 rounded-full relative transition-all flex-shrink-0 ${notif.missionCompleted ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${notif.missionCompleted ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <div>
                          <div className="font-bold text-sm mb-1">{t.dashboard.settings.treasuryCritical}</div>
                          <div className="text-xs text-slate-400">{t.dashboard.settings.treasuryCriticalDesc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleNotification('lowCreditsWarning')}
                          className={`w-14 h-7 rounded-full relative transition-all flex-shrink-0 ${notif.lowCreditsWarning ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${notif.lowCreditsWarning ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <div>
                          <div className="font-bold text-sm mb-1">{t.dashboard.settings.dailyReport}</div>
                          <div className="text-xs text-slate-400">{t.dashboard.settings.dailyReportDesc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleNotification('dailyReports')}
                          className={`w-14 h-7 rounded-full relative transition-all flex-shrink-0 ${notif.dailyReports ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${notif.dailyReports ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-800">
                    <h3 className="text-slate-500 font-bold text-xs uppercase mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      {t.dashboard.settings.diagnosticZone}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => triggerTestEvent('MISSION')}
                        className="p-4 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-left transition-all group"
                      >
                        <div className="text-sm font-bold text-white mb-1 group-hover:text-blue-400">{t.dashboard.settings.simulateMission}</div>
                        <div className="text-xs text-slate-500">{t.dashboard.settings.simulateMissionDesc}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerTestEvent('CREDITS')}
                        className="p-4 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-left transition-all group"
                      >
                        <div className="text-sm font-bold text-white mb-1 group-hover:text-purple-400">{t.dashboard.settings.simulateTreasury}</div>
                        <div className="text-xs text-slate-500">{t.dashboard.settings.simulateTreasuryDesc}</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-emerald-500" />
                    {t.dashboard.settings.securityAccess}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>{t.dashboard.settings.currentPassword}</label>
                      <input type="password" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{t.dashboard.settings.newPassword}</label>
                      <input type="password" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{t.dashboard.settings.confirmPassword}</label>
                      <input type="password" className={inputClass} />
                    </div>
                  </div>

                  {/* ZONE DE DANGER — visible uniquement dans l'onglet Sécurité */}
                  <div className="mt-8 border border-red-900/30 bg-red-900/5 rounded-xl p-6">
                    <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">{t.dashboard.settings.dangerZone}</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      {t.dashboard.settings.dangerDesc}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t.dashboard.settings.formatConfirm)) {
                          resetSystem()
                          window.location.reload()
                        }
                      }}
                      className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded text-sm font-bold transition-colors"
                    >
                      {t.dashboard.settings.formatInstance}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

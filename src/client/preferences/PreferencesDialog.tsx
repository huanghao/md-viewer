import { useSyncExternalStore } from 'react';
import { AgentTab } from './AgentTab';
import { AppearanceTab } from './AppearanceTab';
import { CommentsTab } from './CommentsTab';
import { KeybindingsTab } from './KeybindingsTab';
import {
  cancelPreferences,
  closePreferences,
  prefsStore,
  savePreferences,
  setPrefTab,
  type PrefTab,
} from './controller';

const TABS: Array<{ id: PrefTab; icon: string }> = [
  { id: '外观', icon: '🎨' },
  { id: '快捷键', icon: '⌨️' },
  { id: '评论', icon: '💬' },
  { id: 'Agent', icon: '🤖' },
];

/** 偏好设置对话框：外壳与导航在这里，各标签页自管自己的草稿 */
export function PreferencesDialog() {
  const { open, tab } = useSyncExternalStore(prefsStore.subscribe, prefsStore.getState);
  if (!open) return null;

  return (
    <div
      id="preferencesOverlay"
      className="preferences-overlay show"
      onClick={(e) => { if (e.target === e.currentTarget) closePreferences(); }}
    >
      <div className="preferences-dialog">
        <div className="preferences-header">
          偏好设置
          <button className="preferences-close" id="prefClose" onClick={closePreferences}>×</button>
        </div>
        <div className="preferences-body">
          <nav className="preferences-nav" id="prefNav">
            {TABS.map((t) => (
              <div
                key={t.id}
                className={`preferences-nav-item${tab === t.id ? ' active' : ''}`}
                onClick={() => setPrefTab(t.id)}
              >
                <span className="preferences-nav-icon">{t.icon}</span>
                {t.id}
              </div>
            ))}
          </nav>
          <div className="preferences-content" id="prefContent">
            {tab === '外观' && <AppearanceTab />}
            {tab === '快捷键' && <KeybindingsTab />}
            {tab === '评论' && <CommentsTab />}
            {tab === 'Agent' && <AgentTab />}
          </div>
        </div>
        <div className="preferences-footer">
          <button className="preferences-btn" id="prefCancel" onClick={cancelPreferences}>取消</button>
          <button className="preferences-btn primary" id="prefSave" onClick={() => void savePreferences()}>保存</button>
        </div>
      </div>
    </div>
  );
}

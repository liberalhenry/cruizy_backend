/** Emoji-Auswahl (Issue #21) — eingebaut, ohne fremde Bibliothek und ohne Bilder von Dritten. */
import { useState } from 'react';
import { t } from '../lib/texts';

const GROUPS: { id: string; list: string }[] = [
  { id: 'UI-EMOJI-GRUPPE-1', list: '😀 😃 😄 😁 😆 😅 😂 🤣 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😚 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😌 😔 😪 🤤 😴 😷 🤒 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👻 🤖 🙈 🙉 🙊' },
  { id: 'UI-EMOJI-GRUPPE-2', list: '👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 💪 🦵 👀 👅 👄 💋 🫶 🫡 🫠 🤷 🙋 💁 🙆 🙅 🤦 🧑‍🤝‍🧑 👬' },
  { id: 'UI-EMOJI-GRUPPE-3', list: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 🏳️‍🌈 🏳️‍⚧️ 🔥 ✨ 💫 ⭐ 🌟 💯 💥' },
  { id: 'UI-EMOJI-GRUPPE-4', list: '🏠 🏙️ 🌆 🌃 🏖️ ⛰️ 🏕️ 🚶 🏃 🚴 🚗 🚕 🚆 🚇 ✈️ 🧳 🗺️ 📍 🎉 🎊 🎈 🎶 🎵 🎤 🎧 🎮 🎬 📚 🏋️ 🧘 🏊 ⚽ 🎾 🌈 ☀️ 🌙 ⛅ 🌧️ ❄️ 🌊' },
  { id: 'UI-EMOJI-GRUPPE-5', list: '☕ 🍵 🍺 🍻 🥂 🍷 🍸 🍹 🥤 🧃 🍕 🍔 🌭 🍟 🌮 🥗 🍝 🍣 🍜 🥐 🍰 🍩 🍪 🍫 🍦 🍓 🍉 🍑 🍒 🍌 🥑 🌶️' },
  { id: 'UI-EMOJI-GRUPPE-6', list: '✅ ☑️ ❌ ❓ ❗ ‼️ ⁉️ 💬 💭 🕐 ⏰ ⏳ 📅 📞 📱 💻 📷 🔒 🔑 💡 🎁 🍀 🌹 🌻 🌸 🐶 🐱 🐻 🦊 🐺 🦦 🐼' },
];

export function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  const [g, setG] = useState(0);
  return (
    <div className="card p-2">
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
        {GROUPS.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={g === i} className={`chip shrink-0 text-xs ${g === i ? 'border-akzent text-akzent' : ''}`} onClick={() => setG(i)}>
            {x.list.split(' ')[0]} {t(x.id)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5 max-h-44 overflow-y-auto mt-1" role="tabpanel">
        {GROUPS[g].list.split(' ').map((e) => (
          <button key={e} className="text-2xl h-10 rounded-lg hover:bg-flaeche2" onClick={() => onPick(e)} aria-label={e}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Fügt Text an der Schreibmarke eines Eingabefelds ein. */
export function insertAtCursor(el: HTMLTextAreaElement | null, value: string, current: string): { text: string; caret: number } {
  if (!el) return { text: current + value, caret: (current + value).length };
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const text = current.slice(0, start) + value + current.slice(end);
  return { text, caret: start + value.length };
}

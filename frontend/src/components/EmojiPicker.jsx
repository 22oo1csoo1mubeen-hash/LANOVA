import { useState, useRef, useEffect } from 'react';
import { Smile, ThumbsUp, Heart, Sparkles, Zap, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹','😊','😇','🙂','🙃','😉',
      '😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓',
      '😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺',
      '😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓',
      '🤔','🤫','🤭','🫡','🥱','😴','🤤','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕',
      '🤑','🤠','😈','👿','👻','💀','☠️','👽','🤖','💩'
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳',
      '💪','🦾','👂','👃','🧠','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉',
      '👆','👇','☝️','🫵','👋','🤚','🖐️','✋','🖖','🫡','🙋','🙋‍♂️','🙋‍♀️'
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞',
      '💓','💗','💖','💘','💝','💟','🔥','💥','✨','🌟','⭐','💫','⚡','☄️','🎉',
      '🎊','🎈','🎁','🏆','🥇','👑','💎','💯','💢','💬'
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Fun',
    icon: Sparkles,
    emojis: [
      '💻','📱','⌨️','🖥️','🎧','🎮','🕹️','📷','📸','📹','🔋','🔌','💡','📡','🚀',
      '🛸','🎯','🎲','🎳','🎸','🎺','🥁','🔑','🗝️','🔒','🔓','🛡️','⚙️','🔧','🔨',
      '🛠️','🧭','⏰','⏱️','⌛','⏳'
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: Zap,
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵',
      '🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋',
      '🪴','🌲','🌳','🌴','🌵','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🌸','🌺','🌻',
      '🌹','🌷','🌼','🌞','🌝','🌙','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','❄️'
    ],
  },
];

export default function EmojiPicker({ onSelectEmoji, onClose, triggerRef }) {
  const [activeTab, setActiveTab] = useState('smileys');
  const pickerRef = useRef(null);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target))
      ) {
        onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, triggerRef]);

  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div className="lanova-emoji-picker" ref={pickerRef} role="dialog" aria-label="Emoji picker">
      {/* Category Tabs & Close Button */}
      <div className="emoji-picker-header">
        <div className="emoji-category-tabs">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`emoji-tab-btn${isActive ? ' active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
                title={cat.name}
                aria-label={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="emoji-close-btn"
          onClick={onClose}
          aria-label="Close emoji picker"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Name Subtitle */}
      <div className="emoji-cat-title">
        <span>{activeCategory.name}</span>
      </div>

      {/* Emoji Grid */}
      <div className="emoji-grid-scroll">
        <div className="emoji-grid">
          {activeCategory.emojis.map((emoji, idx) => (
            <button
              key={`${emoji}_${idx}`}
              type="button"
              className="emoji-item-btn"
              onClick={() => onSelectEmoji(emoji)}
              aria-label={`Insert emoji ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

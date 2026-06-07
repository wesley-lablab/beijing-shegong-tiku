/**
 * TTS 语音播报封装类
 * 自动检测浏览器能力，按优先级选择最佳语音方案
 * 支持多种降级方案：在线API → 浏览器speechSynthesis → Audio元素
 */
class TTS {
  constructor() {
    this._audio = null;          // 当前Audio对象
    this._btnId = null;          // 当前播放的按钮ID
    this._playing = false;       // 是否正在播放
    this._engines = [];          // 可用的语音引擎列表
    this._voicesReady = false;   // 语音列表是否已加载
    this._initEngines();
    this._preloadVoices();
  }

  // 初始化语音引擎（按优先级排序）
  _initEngines() {
    this._engines = [];

    // 引擎1：浏览器内置 speechSynthesis
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      try {
        const u = new SpeechSynthesisUtterance('');
        if (typeof window.speechSynthesis.speak === 'function') {
          this._engines.push({
            name: 'browser',
            play: (text) => this._playBrowser(text),
            stop: () => this._stopBrowser()
          });
        }
      } catch (e) { /* 不支持 */ }
    }

    // 引擎2：在线TTS API（通过Audio播放）
    if (typeof Audio !== 'undefined') {
      this._engines.push({
        name: 'online',
        play: (text) => this._playOnline(text),
        stop: () => this._stopOnline()
      });
    }
  }

  // 预加载语音列表
  _preloadVoices() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this._voicesReady = true;
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        this._voicesReady = true;
        window.speechSynthesis.onvoiceschanged = null;
      };
      // 超时2秒
      setTimeout(() => { this._voicesReady = true; }, 2000);
    }
  }

  // 获取最佳中文语音
  _getZhVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang && (v.lang.includes('zh') || v.lang.includes('cmn'))) || null;
  }

  // ============ 播放接口 ============

  // 主播放方法
  async play(text, btnId) {
    // 如果正在播放同一个按钮，停止
    if (this._playing && this._btnId === btnId) {
      this.stop();
      return;
    }

    // 停止之前的播放
    this.stop();

    if (!text || !text.trim()) return;

    // 截取文本
    text = text.length > 900 ? text.substring(0, 900) + '...' : text;

    this._btnId = btnId;
    this._playing = true;
    this._updateBtn(true);

    // 按优先级尝试每个引擎
    for (let i = 0; i < this._engines.length; i++) {
      const engine = this._engines[i];
      try {
        await engine.play(text);
        return; // 成功播放
      } catch (e) {
        console.warn(`TTS引擎[${engine.name}]失败:`, e.message);
        continue; // 尝试下一个引擎
      }
    }

    // 所有引擎都失败
    this._playing = false;
    this._updateBtn(false);
    this._showToast('语音播放失败，请检查浏览器设置或更换浏览器');
  }

  // 停止播放
  stop() {
    this._engines.forEach(engine => {
      try { engine.stop(); } catch (e) { /* 忽略 */ }
    });
    this._playing = false;
    this._updateBtn(false);
    this._btnId = null;
  }

  // 是否正在播放
  isPlaying() {
    return this._playing;
  }

  // 是否支持语音
  isSupported() {
    return this._engines.length > 0;
  }

  // ============ 浏览器 speechSynthesis 引擎 ============

  _playBrowser(text) {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) { reject(new Error('不支持')); return; }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.05;
      utterance.pitch = 1;

      const zhVoice = this._getZhVoice();
      if (zhVoice) utterance.voice = zhVoice;

      utterance.onend = () => {
        this._playing = false;
        this._updateBtn(false);
        this._btnId = null;
        resolve();
      };
      utterance.onerror = (e) => {
        // 某些浏览器在正常结束时也会触发 onerror（interrupted）
        if (e.error === 'interrupted' || e.error === 'canceled') {
          resolve(); // 不是真正的错误
        } else {
          this._playing = false;
          this._updateBtn(false);
          this._btnId = null;
          reject(new Error('SpeechSynthesis错误: ' + e.error));
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  _stopBrowser() {
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    }
  }

  // ============ 在线TTS API引擎 ============

  async _playOnline(text) {
    try {
      const res = await fetch('https://freetts.org/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: 'zh-CN-XiaoxiaoNeural',
          rate: '+10%',
          pitch: '+0Hz'
        })
      });

      if (!res.ok) throw new Error('API请求失败: ' + res.status);

      const data = await res.json();
      if (!data.file_id) throw new Error('无file_id');

      const audioRes = await fetch('https://freetts.org/api/audio/' + data.file_id);
      if (!audioRes.ok) throw new Error('音频下载失败');

      const blob = await audioRes.blob();
      const url = URL.createObjectURL(blob);

      // 释放旧资源
      this._stopOnline();

      this._audio = new Audio(url);

      return new Promise((resolve, reject) => {
        this._audio.onended = () => {
          this._playing = false;
          this._updateBtn(false);
          this._btnId = null;
          URL.revokeObjectURL(url);
          resolve();
        };
        this._audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('音频播放失败'));
        };

        this._audio.play().catch(e => {
          URL.revokeObjectURL(url);
          reject(e);
        });
      });

    } catch (e) {
      throw e; // 向上抛出，让 play() 方法尝试下一个引擎
    }
  }

  _stopOnline() {
    if (this._audio) {
      try {
        this._audio.pause();
        this._audio.currentTime = 0;
        if (this._audio.src) URL.revokeObjectURL(this._audio.src);
        this._audio.onended = null;
        this._audio.onerror = null;
      } catch (e) { /* 忽略 */ }
      this._audio = null;
    }
  }

  // ============ UI辅助 ============

  _updateBtn(isPlaying) {
    if (!this._btnId) return;
    const btn = document.getElementById(this._btnId);
    if (!btn) return;

    const icon = btn.querySelector('.tts-icon');
    const text = btn.querySelector('.tts-text');

    if (isPlaying) {
      btn.classList.add('playing');
      if (icon) icon.textContent = '⏹';
      if (text) text.textContent = '停止';
    } else {
      btn.classList.remove('playing');
      if (icon) icon.textContent = '🔊';
      if (text) {
        const type = btn.dataset.type;
        text.textContent = type === 'sample' ? '朗读范文' :
                           type === 'outline' ? '朗读提纲' : '朗读解析';
      }
    }
  }

  _showToast(message) {
    if (typeof showToast === 'function') {
      showToast(message);
    } else {
      let toast = document.getElementById('app-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:8px;font-size:0.85em;z-index:9999;transition:opacity 0.3s;opacity:0;pointer-events:none;';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    }
  }
}

// 创建全局单例
const tts = new TTS();

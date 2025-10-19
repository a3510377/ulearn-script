import { requestHook } from '../request';
import { useToast } from '../toast';

import { waitForElement } from '#/dom';
import { videoSettingsStore } from '~/videoSettings';

export const withDownload = () => {
  const toast = useToast();

  return requestHook.registerHook(
    (url) => url.startsWith('/api/activities'),
    (responseText) => {
      let changeAllowDownload = false;
      let changeAllowForwardSeeking = false;
      const data = JSON.parse(responseText, (key, value) => {
        if (key === 'allow_download' && value === false) {
          changeAllowDownload = true;
          return true;
        }
        if (key === 'allow_forward_seeking' && value === false) {
          changeAllowForwardSeeking = true;
          return true;
        }
        return value;
      });

      if (changeAllowDownload) toast.show('以強制允許下載');
      if (changeAllowForwardSeeking) toast.show('以強制允許快轉');

      return JSON.stringify(data);
    }
  );
};

export const tryPlayVideo = async () => {
  const toast = useToast();

  const goToNext = async () => {
    const btn = await waitForElement(
      'button[ng-click="changeActivity(nextActivity)"]'
    ).catch(() => null);

    if (!btn) {
      toast.show('未找到下一個活動按鈕', { type: 'warn' });
    } else {
      toast.show('正在跳轉下一個活動', { type: 'info' });
      (btn as HTMLButtonElement).click();
    }
  };

  const video = await waitForElement<HTMLVideoElement>('video').catch(
    () => null
  );

  if (!video) {
    toast.show('未找到影片元素', { type: 'error' });
    return;
  }

  video.scrollIntoView({ behavior: 'smooth' });

  let playButton: HTMLElement | null = null;
  waitForElement('.mvp-toggle-play').then((btn) => (playButton = btn));

  const changeRate = async (playbackRate: number) => {
    const el = await waitForElement('div[data-name=PLAY_RATE]>span');
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    toast.show('正在更改倍速...', { type: 'info' });
    setTimeout(() => {
      const options = [
        ...document.querySelectorAll('.mvp-control-collapse-menu>div'),
      ]
        .map((el) => ({ el, text: el.textContent?.trim() || '' }))
        .filter(({ text }) => /^(\d+(\.\d+)?)x$/.test(text));

      if (options.length === 0) {
        toast.show('未找到倍速選項，改為直接設置', { type: 'warn' });
        video.playbackRate = playbackRate;
        return;
      }

      const target = options.find(({ text }) => text === `${playbackRate}x`);
      if (target) {
        toast.show(`設置倍速為 ${playbackRate}x`, { type: 'success' });
        (target.el as HTMLElement).click();
      } else {
        toast.show(`倍速以強制設為 ${playbackRate}x`, { type: 'success' });
        video.playbackRate = playbackRate;
      }

      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, 400);
  };

  const unsubscribePlaybackRate = videoSettingsStore.subscribe(
    'playbackRate',
    ({ value }) => changeRate(value),
    false
  );

  const tryingToPlayToast = toast.show('正在嘗試撥放影片...', {
    type: 'info',
    duration: -1,
  });
  const loop = setInterval(() => {
    if (!playButton) return;

    if (video.paused || video.ended || video.readyState <= 2) {
      playButton.click();
    } else {
      tryingToPlayToast.close();
      toast.show('影片播放中...', { type: 'success' });
      clearInterval(loop);
      changeRate(videoSettingsStore.get('playbackRate'));
    }
  }, 1000);

  const handleProgress = () => {
    if (!videoSettingsStore.get('autoNext')) return;

    if (video.duration > 0) {
      const ratio = video.currentTime / video.duration;
      if (ratio >= videoSettingsStore.get('customAutoNextThreshold')) {
        handleFinish();
      }
    }
  };

  const watchVideoChange = (() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.removedNodes) {
          if (n === video) {
            console.log('[watchRemove] Video removed, re-init');
            close();
            tryPlayVideo();
            return;
          }
        }

        for (const n of m.addedNodes) {
          if ((n as HTMLElement).tagName === 'VIDEO' && n !== video) {
            console.log('[watchRemove] New video appeared');
            close();
            tryPlayVideo();
            return;
          }
        }
      }
    });

    const close = () => observer.disconnect();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    return close;
  })();

  let isFinished = false;
  const handleFinish = () => {
    if (isFinished) return;
    isFinished = true;

    clearInterval(loop);
    video.removeEventListener('timeupdate', handleProgress);
    unsubscribePlaybackRate();

    tryingToPlayToast.close();
    goToNext();
  };

  handleProgress();
  video.addEventListener('timeupdate', handleProgress);
  video.addEventListener('ended', handleFinish, { once: true });

  return () => {
    watchVideoChange();
  };
};

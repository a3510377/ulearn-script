import { hook, type OriginXMLHttpRequest } from 'ajax-hook';

import { waitForElement, watchRemove } from '#/dom';
import { videoSettingsStore } from '~/videoSettings';
import { useToast } from '../toast';

export const withVideoDownload = () => {
  const toast = useToast();

  const hookGet: <T>(value: T, xhr: OriginXMLHttpRequest) => T = (
    value,
    xhr
  ) => {
    const { host, hostname } = new URL(xhr.responseURL);
    if (host === location.host && hostname.startsWith('/api/activities')) {
      try {
        let changeAllowDownload = false;
        let changeAllowForwardSeeking = false;
        const data = JSON.parse(xhr.responseText, (key, value) => {
          if (key === 'allow_download' && !value) {
            changeAllowDownload = true;
            return true;
          }
          if (key === 'allow_forward_seeking' && !value) {
            changeAllowForwardSeeking = true;
            return true;
          }

          return value;
        });

        if (changeAllowDownload) toast.show('以強制允許下載');
        if (changeAllowForwardSeeking) toast.show('以強制允許快轉');

        return data;
      } catch {
        toast.show('解析 JSON 失敗', { type: 'error' });
        console.error('Failed to parse JSON:', xhr.responseText);
      }
    }

    return value;
  };

  hook({ response: { getter: hookGet }, responseText: { getter: hookGet } });
};

export const tryPlayVideo = async () => {
  const toast = useToast();

  const goToNext = () => {
    waitForElement('button[ng-click=changeActivity(nextActivity)]').then(
      (btn) => btn.click()
    );
  };

  const video = await waitForElement<HTMLVideoElement>('video');

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

  const unsubPlaybackRate = videoSettingsStore.subscribe(
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
    if (
      video.currentTime / video.duration >=
      videoSettingsStore.get('customAutoNextThreshold')
    ) {
      handleFinish();
    }
  };

  const removeWatchRemove = watchRemove(video, () => {
    toast.show('正在跳轉下一個影片', { type: 'success' });
    handleFinish();
    tryPlayVideo();
  });

  const handleFinish = () => {
    clearInterval(loop);
    video.removeEventListener('timeupdate', handleProgress);
    unsubPlaybackRate();
    removeWatchRemove?.();

    goToNext();
    tryPlayVideo();
    tryingToPlayToast.close();
    toast.show('正在跳轉下一個影片', { type: 'success' });
  };

  // force check
  handleProgress();
  video.addEventListener('timeupdate', handleProgress);
  video.addEventListener('ended', handleFinish, { once: true });
};

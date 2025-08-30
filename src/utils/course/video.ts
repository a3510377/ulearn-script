import { waitForElement } from '#/dom';
import { videoSettingsStore } from '~/videoSettings';

export const tryPlayVideo = async (callback?: () => void) => {
  const goToNext = () => {
    waitForElement('button[ng-click="changeActivity(nextActivity)"]').then(
      (btn) => btn.click()
    );
  };

  const video = await waitForElement<HTMLVideoElement>('video');

  let playButton: HTMLElement | null = null;
  waitForElement('.mvp-toggle-play').then((btn) => (playButton = btn));

  const changeRate = async (playbackRate: number) => {
    const el = await waitForElement('div[data-name=PLAY_RATE]>span');
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    setTimeout(() => {
      const options = [
        ...document.querySelectorAll('.mvp-control-collapse-menu>div'),
      ]
        .map((el) => ({ el, text: el.textContent?.trim() || '' }))
        .filter(({ text }) => /^(\d+(\.\d+)?)x$/.test(text));

      if (options.length === 0) {
        // TODO: add alert
        console.warn('Playback rate options not found, fallback to direct set');
        video.playbackRate = playbackRate;
        return;
      }

      const target = options.find(({ text }) => text === `${playbackRate}x`);
      if (target) {
        (target.el as HTMLElement).click();
      } else {
        // TODO: add alert
        video.playbackRate = playbackRate;
      }

      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, 400);
  };

  const unsubPlaybackRate = videoSettingsStore.subscribe(
    'playbackRate',
    ({ value }) => changeRate(value)
  );

  const loop = setInterval(() => {
    if (!playButton) return;

    if (video.paused || video.ended || video.readyState <= 2) {
      playButton.click();
    } else {
      clearInterval(loop);
      changeRate(videoSettingsStore.get('playbackRate'));
    }
  }, 1000);

  const handleProgress = () => {
    if (
      video.currentTime / video.duration >=
      videoSettingsStore.get('autoNextThreshold')
    ) {
      handleFinish();
    }
  };

  const handleFinish = () => {
    clearInterval(loop);
    video.removeEventListener('timeupdate', handleProgress);
    goToNext();
    unsubPlaybackRate();
    callback?.();
  };

  video.addEventListener('timeupdate', handleProgress);
  video.addEventListener('ended', handleFinish, { once: true });
};

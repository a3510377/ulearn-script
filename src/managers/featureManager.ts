class FeatureManager {
  private features = new Map<string, Feature>();

  register(
    name: string,
    enableFn: () => FeatureCleanup | void,
    disableFn?: () => void
  ) {
    if (!this.features.has(name)) {
      this.features.set(name, { enabled: false });
    }

    const feature = this.features.get(name)!;

    return {
      enable: () => {
        if (feature.enabled) return;
        const cleanup = enableFn() ?? undefined;

        feature.cleanup = cleanup;
        feature.enabled = true;
        console.log(`[Feature] "${name}" 已啟用`);
      },
      disable: () => {
        if (!feature.enabled) return;

        if (disableFn) {
          disableFn();
        } else {
          feature.cleanup?.();
        }

        feature.enabled = false;
        feature.cleanup = undefined;
        console.log(`[Feature] "${name}" 已停用`);
      },
      isEnabled: () => feature.enabled,
    };
  }

  isEnabled(name: string): boolean {
    return this.features.get(name)?.enabled ?? false;
  }

  cleanupAll() {
    this.features.forEach((feature, name) => {
      if (feature.cleanup) {
        feature.cleanup();
        console.log(`[Feature] "${name}" 已清理`);
      }
    });
    this.features.clear();
  }
}

export const featureManager = new FeatureManager();
export default featureManager;

export type FeatureCleanup = () => void;

export interface Feature {
  enabled: boolean;
  cleanup?: FeatureCleanup;
}

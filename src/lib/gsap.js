// src/lib/gsap.ts
import { gsap } from "gsap";

import CustomEase from "gsap/CustomEase";
import Observer from "gsap/dist/Observer";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";
// Plugins
gsap.registerPlugin(
  CustomEase,
  ScrollTrigger,
  SplitText,
  ScrollToPlugin,
  Observer,
);

// Constants
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
export const RECIPROCAL_GR = 1 / GOLDEN_RATIO;
export const DURATION = RECIPROCAL_GR;

// Easing
CustomEase.create(
  "snappy",
  "M0,0 C0.094,0.026 0.124,0.127 0.157,0.29 0.197,0.486 0.254,0.8 0.348,0.884 0.42,0.949 0.374,1 1,1",
);
CustomEase.create(
  "expo-hard",
  "M0,0 C0.084,0.61 0.156,0.822 0.218,0.883 0.287,0.951 0.374,1 1,1",
);
CustomEase.create("unmask", "M0,0 C0.16,1 0.3,1 1,1");
CustomEase.create("ease", "0.175, 0.885, 0.32, 1");
CustomEase.create(
  "lightningStrike",
  "M0,0 C0.15,0 0.2,0.85 0.3,0.95 0.5,1 0.8,1 1,1",
);
// Global Config
gsap.config({
  autoSleep: 60,
  nullTargetWarn: false,
});

// Default tween settings
gsap.defaults({
  duration: DURATION,
  ease: "ease",
});

// Ticker config
gsap.ticker.lagSmoothing(1000, 16);
gsap.ticker.fps(-1);

export { gsap, CustomEase, ScrollTrigger, SplitText, ScrollToPlugin, Observer };

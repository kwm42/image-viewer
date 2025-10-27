import { Variants } from 'framer-motion';

/**
 * 幻灯片转换类型
 */
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'flip' | 'dissolve';

/**
 * 转换动画配置
 */
export const transitions: Record<TransitionType, Variants> = {
  // 无动画
  none: {
    enter: { opacity: 1 },
    center: { opacity: 1 },
    exit: { opacity: 1 },
  },

  // 淡入淡出
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // 左右滑动
  slide: {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  },

  // 缩放
  zoom: {
    enter: {
      scale: 0.8,
      opacity: 0,
    },
    center: {
      scale: 1,
      opacity: 1,
    },
    exit: {
      scale: 1.2,
      opacity: 0,
    },
  },

  // 翻转
  flip: {
    enter: {
      rotateY: 90,
      opacity: 0,
    },
    center: {
      rotateY: 0,
      opacity: 1,
    },
    exit: {
      rotateY: -90,
      opacity: 0,
    },
  },

  // 溶解（结合淡入淡出和缩放）
  dissolve: {
    enter: {
      scale: 0.95,
      opacity: 0,
    },
    center: {
      scale: 1,
      opacity: 1,
    },
    exit: {
      scale: 1.05,
      opacity: 0,
    },
  },
};

/**
 * 获取转换动画配置
 */
export function getTransition(type: TransitionType, duration: number) {
  return {
    duration: duration / 1000,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  };
}

/**
 * 转换类型显示名称
 */
export const transitionNames: Record<TransitionType, string> = {
  none: '无动画',
  fade: '淡入淡出',
  slide: '滑动',
  zoom: '缩放',
  flip: '翻转',
  dissolve: '溶解',
};

'use client';

import React from 'react';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import type { SlideshowSettings } from '@/types';
import { transitionNames, type TransitionType } from './transitions';

interface SlideshowSettingsProps {
  settings: SlideshowSettings;
  onSettingsChange: (settings: Partial<SlideshowSettings>) => void;
  onClose: () => void;
}

export function SlideshowSettingsPanel({
  settings,
  onSettingsChange,
  onClose,
}: SlideshowSettingsProps) {
  const fitModeOptions: { value: SlideshowSettings['fitMode']; label: string }[] = [
    { value: 'default', label: '默认样式' },
    { value: 'contain', label: '自适应填充' },
    { value: 'actual', label: '原始大小' },
  ];

  return (
    <div className="absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-6 shadow-2xl z-[60] min-w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">幻灯片设置</h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">
        {/* 播放间隔 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm">播放间隔</label>
            <span className="text-white/70 text-sm">{settings.interval / 1000}秒</span>
          </div>
          <Slider.Root
            value={[settings.interval]}
            onValueChange={([value]) => onSettingsChange({ interval: value })}
            min={1000}
            max={100000}
            step={500}
            className="relative flex items-center select-none touch-none w-full h-5"
          >
            <Slider.Track className="bg-white/20 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Slider.Root>
        </div>

        {/* 转换效果 */}
        <div>
          <label className="text-white text-sm block mb-2">转换效果</label>
          <Select.Root
            value={settings.transition}
            onValueChange={(value) =>
              onSettingsChange({ transition: value as TransitionType })
            }
          >
            <Select.Trigger className="inline-flex items-center justify-between w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content 
                className="overflow-hidden bg-gray-900 rounded-lg shadow-2xl border border-white/10 z-[9999]"
                position="popper"
                sideOffset={5}
              >
                <Select.Viewport className="p-1">
                  {(Object.keys(transitionNames) as TransitionType[]).map((type) => (
                    <Select.Item
                      key={type}
                      value={type}
                      className="relative flex items-center px-8 py-2 text-sm text-white rounded hover:bg-white/10 focus:bg-white/10 outline-none cursor-pointer select-none data-[highlighted]:bg-white/10"
                    >
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText>{transitionNames[type]}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* 转换时长 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-sm">转换时长</label>
            <span className="text-white/70 text-sm">{settings.transitionDuration}ms</span>
          </div>
          <Slider.Root
            value={[settings.transitionDuration]}
            onValueChange={([value]) => onSettingsChange({ transitionDuration: value })}
            min={200}
            max={2000}
            step={100}
            className="relative flex items-center select-none touch-none w-full h-5"
          >
            <Slider.Track className="bg-white/20 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Slider.Root>
        </div>

        {/* 循环播放 */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white text-sm">循环播放</span>
          <Switch.Root
            checked={settings.loop}
            onCheckedChange={(checked) => onSettingsChange({ loop: checked })}
            className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors cursor-pointer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-md" />
          </Switch.Root>
        </label>

        {/* 随机播放 */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white text-sm">随机播放</span>
          <Switch.Root
            checked={settings.random}
            onCheckedChange={(checked) => onSettingsChange({ random: checked })}
            className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors cursor-pointer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-md" />
          </Switch.Root>
        </label>

        {/* 显示信息 */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white text-sm">显示图片信息</span>
          <Switch.Root
            checked={settings.showInfo}
            onCheckedChange={(checked) => onSettingsChange({ showInfo: checked })}
            className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors cursor-pointer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-md" />
          </Switch.Root>
        </label>

        {/* 显示进度 */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white text-sm">显示进度条</span>
          <Switch.Root
            checked={settings.showProgress}
            onCheckedChange={(checked) => onSettingsChange({ showProgress: checked })}
            className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors cursor-pointer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-md" />
          </Switch.Root>
        </label>

        {/* 图片适应方式 */}
        <div>
          <label className="text-white text-sm block mb-2">图片适应方式</label>
          <Select.Root
            value={settings.fitMode}
            onValueChange={(value) =>
              onSettingsChange({ fitMode: value as SlideshowSettings['fitMode'] })
            }
          >
            <Select.Trigger className="inline-flex items-center justify-between w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                className="overflow-hidden bg-gray-900 rounded-lg shadow-2xl border border-white/10 z-[9999]"
                position="popper"
                sideOffset={5}
              >
                <Select.Viewport className="p-1">
                  {fitModeOptions.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="relative flex items-center px-8 py-2 text-sm text-white rounded hover:bg-white/10 focus:bg-white/10 outline-none cursor-pointer select-none data-[highlighted]:bg-white/10"
                    >
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
    </div>
  );
}

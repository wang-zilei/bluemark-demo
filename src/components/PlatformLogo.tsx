import type { Platform } from "../domain";

const assets: Record<Platform, string> = {
  小红书: "xiaohongshu.svg",
  抖音: "tiktok.svg",
  微信公众号: "wechat.svg",
  视频号: "wechat.svg",
  微博: "sinaweibo.svg",
};

const labels: Record<Platform, string> = {
  小红书: "小红书 Logo",
  抖音: "抖音 Logo",
  微信公众号: "微信公众号 Logo",
  视频号: "视频号 Logo",
  微博: "微博 Logo",
};

export function PlatformLogo({
  platform,
  size = "small",
  className = "",
}: {
  platform: Platform;
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  return (
    <span
      className={`platform-logo platform-logo-${platform} platform-logo-${size} ${className}`.trim()}
      title={platform}
      aria-label={platform}
    >
      <img src={`${import.meta.env.BASE_URL}assets/platforms/${assets[platform]}`} alt={labels[platform]} />
    </span>
  );
}

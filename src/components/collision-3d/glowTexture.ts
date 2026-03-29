import * as THREE from "three";

let _glowTexture: THREE.Texture | null = null;

export function getGlowTexture(): THREE.Texture {
  if (_glowTexture) return _glowTexture;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.15, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.7)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.2)");
  grad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  _glowTexture = new THREE.CanvasTexture(canvas);
  _glowTexture.needsUpdate = true;
  return _glowTexture;
}

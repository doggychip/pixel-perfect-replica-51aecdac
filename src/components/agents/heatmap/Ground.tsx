import * as THREE from "three";

export default function Ground() {
  return (
    <group>
      <gridHelper args={[16, 24, "#1a3040", "#0d1a24"]} position={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#060d14" roughness={1} />
      </mesh>
    </group>
  );
}

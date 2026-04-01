import { Text } from "@react-three/drei";

const labels = [
  { text: "🔬 Research", pos: [-3, 0.05, -2.8] as [number, number, number], color: "#a78bfa" },
  { text: "⚡ Execution", pos: [3, 0.05, -2.8] as [number, number, number], color: "#fbbf24" },
  { text: "🏛 Central", pos: [0, 0.05, 5] as [number, number, number], color: "#22d3ee" },
];

export default function RealmLabels() {
  return (
    <>
      {labels.map((l) => (
        <Text
          key={l.text}
          position={l.pos}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.35}
          color={l.color}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {l.text}
        </Text>
      ))}
    </>
  );
}

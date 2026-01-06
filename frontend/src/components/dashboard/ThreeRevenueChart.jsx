import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const Bar3D = ({ position, height, color, label, value }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.25}
        color="#4f46e5"
        anchorX="center"
        anchorY="middle"
      >
        ${value}
      </Text>
    </group>
  );
};

const ThreeRevenueChart = ({ data = [] }) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  const bars = useMemo(() => {
    return data.map((item, index) => {
      const height = (item.value / maxValue) * 5;
      const xPos = (index - data.length / 2) * 1.5;
      const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
      const color = colors[index % colors.length];

      return (
        <Bar3D
          key={index}
          position={[xPos, 0, 0]}
          height={height}
          color={color}
          label={item.label}
          value={item.value}
        />
      );
    });
  }, [data, maxValue]);

  return (
    <div style={{ width: '100%', height: '400px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4f46e5" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#06b6d4" />
        
        {bars}
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1a1a2e" opacity={0.8} transparent />
        </mesh>
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};

export default ThreeRevenueChart;

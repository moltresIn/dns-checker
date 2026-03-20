"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { useMemo, useRef } from "react";
import countriesAtlas from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import {
  CanvasTexture,
  Color,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Group
} from "three";
import type { ResolverMapNode, ResolverStatus } from "@/lib/types";

type ResolverGlobeSceneProps = {
  resolvers: ResolverMapNode[];
  selectedId: string | null;
  onHoverChange: (id: string | null) => void;
  onSelect: (id: string) => void;
};

type ResolverPinProps = {
  resolver: ResolverMapNode;
  selected: boolean;
  onHoverChange: (id: string | null) => void;
  onSelect: (id: string) => void;
};

const GLOBE_RADIUS = 2.28;
const baseVector = new Vector3(0, 1, 0);

const countriesTopology = countriesAtlas as unknown as {
  objects: {
    countries: unknown;
  };
};

const countryFeatures = (
  feature(countriesTopology as never, countriesTopology.objects.countries as never) as unknown as {
    features: Array<unknown>;
  }
).features;

function getStatusColor(status: ResolverStatus) {
  switch (status) {
    case "pending":
      return "#7DD3FC";
    case "success":
      return "#53E3A6";
    case "failed":
      return "#FF6B6B";
    case "timeout":
      return "#FBBF24";
    case "idle":
    default:
      return "#7DD3FC";
  }
}

function latLngToVector(lat: number, lng: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  return new Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createWorldTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create world texture canvas.");
  }

  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI));
  const path = geoPath(projection, context);

  const oceanGradient = context.createLinearGradient(0, 0, width, height);
  oceanGradient.addColorStop(0, "#061325");
  oceanGradient.addColorStop(0.4, "#0A2743");
  oceanGradient.addColorStop(1, "#144A74");
  context.fillStyle = oceanGradient;
  context.fillRect(0, 0, width, height);

  const bloomGradient = context.createRadialGradient(
    width * 0.28,
    height * 0.24,
    20,
    width * 0.5,
    height * 0.5,
    width * 0.7
  );
  bloomGradient.addColorStop(0, "rgba(125, 211, 252, 0.26)");
  bloomGradient.addColorStop(1, "rgba(125, 211, 252, 0)");
  context.fillStyle = bloomGradient;
  context.fillRect(0, 0, width, height);

  context.beginPath();
  path(geoGraticule10());
  context.strokeStyle = "rgba(201, 229, 247, 0.08)";
  context.lineWidth = 0.8;
  context.stroke();

  for (const country of countryFeatures) {
    context.beginPath();
    path(country as never);
    context.fillStyle = "#1F4B3B";
    context.fill();
  }

  for (const country of countryFeatures) {
    context.beginPath();
    path(country as never);
    context.strokeStyle = "rgba(238, 248, 231, 0.55)";
    context.lineWidth = 0.65;
    context.stroke();
  }

  const polarGradient = context.createLinearGradient(0, 0, 0, height);
  polarGradient.addColorStop(0, "rgba(255, 255, 255, 0.12)");
  polarGradient.addColorStop(0.12, "rgba(255, 255, 255, 0)");
  polarGradient.addColorStop(0.88, "rgba(255, 255, 255, 0)");
  polarGradient.addColorStop(1, "rgba(255, 255, 255, 0.14)");
  context.fillStyle = polarGradient;
  context.fillRect(0, 0, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  return texture;
}

function GlobeSurface() {
  const worldTexture = useMemo(() => createWorldTexture(), []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={worldTexture}
          color="#9EC8E8"
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>

      <mesh scale={1.02}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.15}
          color="#88DFFF"
          roughness={0.18}
          metalness={0}
          transmission={0.06}
          clearcoat={0.8}
        />
      </mesh>
    </group>
  );
}

function ResolverPin({ resolver, selected, onHoverChange, onSelect }: ResolverPinProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const stemRef = useRef<Mesh>(null);

  const surfacePosition = latLngToVector(
    resolver.coordinates.lat,
    resolver.coordinates.lng,
    GLOBE_RADIUS
  );
  const normal = surfacePosition.clone().normalize();
  const orientation = new Quaternion().setFromUnitVectors(baseVector, normal);

  useFrame((_, delta) => {
    if (!groupRef.current || !headRef.current || !stemRef.current) {
      return;
    }

    const targetScale = selected ? 1.4 : resolver.matched ? 1 : 0.58;
    const nextScale = MathUtils.lerp(
      groupRef.current.scale.x,
      targetScale,
      1 - Math.exp(-6 * delta)
    );
    groupRef.current.scale.setScalar(nextScale);

    const targetOpacity = resolver.matched ? 0.98 : 0.15;
    const headMaterial = headRef.current.material as MeshStandardMaterial;
    const stemMaterial = stemRef.current.material as MeshStandardMaterial;
    const color = new Color(getStatusColor(resolver.status));
    const opacity = MathUtils.lerp(headMaterial.opacity, targetOpacity, 1 - Math.exp(-8 * delta));

    headMaterial.color.lerp(color, 1 - Math.exp(-9 * delta));
    headMaterial.emissive.lerp(color, 1 - Math.exp(-9 * delta));
    headMaterial.emissiveIntensity = selected ? 0.8 : resolver.matched ? 0.36 : 0.12;
    headMaterial.opacity = opacity;

    stemMaterial.color.lerp(color, 1 - Math.exp(-9 * delta));
    stemMaterial.opacity = MathUtils.lerp(
      stemMaterial.opacity,
      resolver.matched ? 0.85 : 0.08,
      1 - Math.exp(-8 * delta)
    );
  });

  return (
    <group ref={groupRef} position={surfacePosition} quaternion={orientation}>
      <mesh ref={stemRef} position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.34, 10]} />
        <meshStandardMaterial transparent color={getStatusColor(resolver.status)} opacity={0.9} />
      </mesh>

      <mesh ref={headRef} position={[0, 0.39, 0]}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshStandardMaterial
          transparent
          color={getStatusColor(resolver.status)}
          emissive={getStatusColor(resolver.status)}
          opacity={0.98}
        />
      </mesh>

      <mesh
        position={[0, 0.39, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHoverChange(resolver.id);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHoverChange(null);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(resolver.id);
        }}
      >
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function GlobeShell() {
  return (
    <group>
      <mesh scale={1.04}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <meshBasicMaterial color="#7DD3FC" transparent opacity={0.05} />
      </mesh>
      <mesh scale={1.065}>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#9FDFFF" transparent opacity={0.03} />
      </mesh>
    </group>
  );
}

export default function ResolverGlobeScene({
  resolvers,
  selectedId,
  onHoverChange,
  onSelect
}: ResolverGlobeSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 38 }}
      dpr={[1, 1.8]}
      className="h-full w-full"
    >
      <color attach="background" args={["#08111F"]} />
      <fog attach="fog" args={["#08111F", 7, 11]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} color="#F5FBFF" />
      <pointLight position={[-5, -3, -4]} intensity={1.1} color="#53E3A6" />
      <pointLight position={[0, 2, 6]} intensity={0.7} color="#7DD3FC" />
      <GlobeSurface />
      <GlobeShell />
      {resolvers.map((resolver) => (
        <ResolverPin
          key={resolver.id}
          resolver={resolver}
          selected={selectedId === resolver.id}
          onHoverChange={onHoverChange}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={8}
        rotateSpeed={0.55}
      />
    </Canvas>
  );
}

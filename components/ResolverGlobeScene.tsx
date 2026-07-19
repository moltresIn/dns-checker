"use client";

import { OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Component, Suspense, useMemo, useRef, type ErrorInfo, type ReactNode } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import countriesAtlas from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import {
  BackSide,
  CanvasTexture,
  Color,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Group
} from "three";
import type { ResolverMapNode, ResolverStatus } from "@/lib/types";
import earthDayUrl from "@/assets/globe/earth-day.jpg";

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
      return "#a3a3a3";
    case "success":
      return "#fafafa";
    case "failed":
      return "#525252";
    case "timeout":
      return "#737373";
    case "idle":
    default:
      return "#404040";
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

function createProceduralEarthTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create earth texture canvas.");
  }

  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI));
  const path = geoPath(projection, context);

  const ocean = context.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, "#0a2a4a");
  ocean.addColorStop(0.35, "#0d4a7a");
  ocean.addColorStop(0.65, "#0c3f6e");
  ocean.addColorStop(1, "#081f38");
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);

  for (const country of countryFeatures) {
    context.beginPath();
    path(country as never);
    context.fillStyle = "#2f6b3a";
    context.fill();
  }

  for (const country of countryFeatures) {
    context.beginPath();
    path(country as never);
    context.strokeStyle = "rgba(20, 40, 20, 0.35)";
    context.lineWidth = 0.6;
    context.stroke();
  }

  const poles = context.createLinearGradient(0, 0, 0, height);
  poles.addColorStop(0, "rgba(235, 245, 255, 0.85)");
  poles.addColorStop(0.08, "rgba(235, 245, 255, 0)");
  poles.addColorStop(0.92, "rgba(235, 245, 255, 0)");
  poles.addColorStop(1, "rgba(235, 245, 255, 0.9)");
  context.fillStyle = poles;
  context.fillRect(0, 0, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
}

function Atmosphere() {
  return (
    <>
      <mesh scale={1.04}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#6eb6ff"
          transparent
          opacity={0.16}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.015}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial color="#9ad0ff" transparent opacity={0.05} depthWrite={false} />
      </mesh>
    </>
  );
}

function ProceduralEarth() {
  const map = useMemo(() => createProceduralEarthTexture(), []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.82} metalness={0.08} />
      </mesh>
      <Atmosphere />
    </group>
  );
}

function TexturedEarth() {
  const dayMap = useTexture(typeof earthDayUrl === "string" ? earthDayUrl : earthDayUrl.src);

  dayMap.colorSpace = SRGBColorSpace;
  dayMap.anisotropy = 8;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial map={dayMap} roughness={0.78} metalness={0.05} />
      </mesh>
      <Atmosphere />
    </group>
  );
}

class GlobeErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Globe texture failed, using procedural Earth.", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
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
    headMaterial.emissiveIntensity = selected ? 1.1 : resolver.matched ? 0.55 : 0.12;
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

export default function ResolverGlobeScene({
  resolvers,
  selectedId,
  onHoverChange,
  onSelect
}: ResolverGlobeSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 6.2], fov: 38 }}
      dpr={[1, 1.8]}
      className="h-full w-full"
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 9, 14]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5.5, 3.2, 2.4]} intensity={1.85} color="#fff6e8" />
      <directionalLight position={[-4, -1.5, -3]} intensity={0.35} color="#7eb6ff" />
      <GlobeErrorBoundary fallback={<ProceduralEarth />}>
        <Suspense fallback={<ProceduralEarth />}>
          <TexturedEarth />
        </Suspense>
      </GlobeErrorBoundary>
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

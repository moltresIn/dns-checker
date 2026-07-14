import { Box } from "@/components/animate-ui/components/layout/box";

export function PlasmaBackground() {
  return (
    <Box
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#030303]"
      aria-hidden
    >
      <Box className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(255,255,255,0.055),transparent_55%)]" />
      <Box className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_100%_0%,rgba(255,255,255,0.03),transparent_50%)]" />
      <Box className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_0%_100%,rgba(255,255,255,0.025),transparent_50%)]" />
      <Box className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#030303] to-[#000000]" />
    </Box>
  );
}

"use client";

import { motion, type HTMLMotionProps, type SVGMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

function ChartSvg({ className, ...props }: SVGMotionProps<SVGSVGElement>) {
  return <motion.svg className={cn(className)} {...props} />;
}

function ChartGroup({ className, ...props }: SVGMotionProps<SVGGElement>) {
  return <motion.g className={cn(className)} {...props} />;
}

function ChartLine({ className, ...props }: SVGMotionProps<SVGLineElement>) {
  return <motion.line className={cn(className)} {...props} />;
}

function ChartPolyline({ className, ...props }: SVGMotionProps<SVGPolylineElement>) {
  return <motion.polyline className={cn(className)} {...props} />;
}

function ChartCircle({ className, ...props }: SVGMotionProps<SVGCircleElement>) {
  return <motion.circle className={cn(className)} {...props} />;
}

function ChartDefs({ ...props }: SVGMotionProps<SVGDefsElement>) {
  return <motion.defs {...props} />;
}

function ChartGradient({ className, ...props }: SVGMotionProps<SVGLinearGradientElement>) {
  return <motion.linearGradient className={cn(className)} {...props} />;
}

function ChartStop({ ...props }: SVGMotionProps<SVGStopElement>) {
  return <motion.stop {...props} />;
}

function ChartContainer({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div className={cn(className)} {...props} />;
}

export {
  ChartSvg,
  ChartGroup,
  ChartLine,
  ChartPolyline,
  ChartCircle,
  ChartDefs,
  ChartGradient,
  ChartStop,
  ChartContainer
};

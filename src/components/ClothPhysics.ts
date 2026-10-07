/**
 * QuanticTube Cloth Physics Engine
 * Generates organic cloth / handkerchief deformation math:
 * - Dynamic Catenary & Bezier drapery curves (no rigid boxes!)
 * - Silk fabric tension creases & specular highlights
 * - Perimeter stitched hem path
 * - Gravity droop, cinching, and flutter undulations
 */

export interface ClothPoint {
  x: number;
  y: number;
}

export interface ClothFold {
  d: string;
  shadowD: string;
  opacity: number;
}

export interface ClothDeformation {
  svgPath: string; // Normalized 0..1 SVG path for clipPath
  hemPath: string; // Perimeter hem path
  folds: ClothFold[]; // Radiation tension creases
  pinchPoint: ClothPoint; // Position of the fingers' grip
  pullFactor: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  isFlinging: boolean;
}

export function computeClothDeformation(
  dx: number,
  dy: number,
  originXPercent: number, // 0..100
  originYPercent: number, // 0..100
  width: number,
  height: number,
  isFlinging: boolean = false
): ClothDeformation {
  const safeW = Math.max(50, width);
  const safeH = Math.max(50, height);

  const ox = Math.max(0, Math.min(1, originXPercent / 100));
  const oy = Math.max(0, Math.min(1, originYPercent / 100));

  const pdx = dx / safeW;
  const pdy = dy / safeH;
  const dist = Math.hypot(pdx, pdy);
  const pullFactor = Math.min(1.8, dist * 3.2);

  // If not dragged or tiny movement, return idle relaxed rectangular cloth with gentle rounded corners
  if (dist < 0.008 && !isFlinging) {
    const idlePath = `
      M 0.015 0 
      H 0.985 
      C 0.995 0, 1 0.005, 1 0.015 
      V 0.985 
      C 1 0.995, 0.995 1, 0.985 1 
      H 0.015 
      C 0.005 1, 0 0.995, 0 0.985 
      V 0.015 
      C 0 0.005, 0.005 0, 0.015 0 
      Z
    `.replace(/\s+/g, ' ').trim();

    return {
      svgPath: idlePath,
      hemPath: idlePath,
      folds: [],
      pinchPoint: { x: ox, y: oy },
      pullFactor: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 1,
      isFlinging: false
    };
  }

  // 1. Compute 4 corner displacements
  // Base corners: Top-Left (0,0), Top-Right (1,0), Bottom-Right (1,1), Bottom-Left (0,1)
  const baseCorners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];

  const corners = baseCorners.map((corner, idx) => {
    const d = Math.hypot(corner.x - ox, corner.y - oy) / Math.SQRT2; // 0 to 1
    // Proximity to the finger grab point
    const proximity = Math.max(0.2, 1 - d * 0.7);
    
    // Gravity droop on trailing fabric (trailing corners hang lower)
    const gravityDroop = (1 - proximity) * Math.min(0.26, pullFactor * 0.22);
    // Subtle flutter wave on loose fabric edges
    const wave = Math.sin(pullFactor * 12 + idx * 2.2) * 0.018 * pullFactor;

    // Displacement
    const cx = corner.x + pdx * proximity * 0.88 + wave;
    const cy = corner.y + pdy * proximity * 0.88 + gravityDroop + wave;

    return { x: cx, y: cy };
  });

  const [c0, c1, c2, c3] = corners; // TL, TR, BR, BL

  // 2. Compute Catenary Drapery Curves for the 4 edges (No rigid straight lines!)
  // Top Edge: c0 -> c1 (drapes downward towards the grab axis)
  const topDrapeSag = Math.min(0.22, pullFactor * 0.18);
  const midTop = {
    x: (c0.x + c1.x) / 2 + pdx * 0.45,
    y: (c0.y + c1.y) / 2 + pdy * 0.45 + topDrapeSag
  };
  const cpTopA = {
    x: c0.x + (midTop.x - c0.x) * 0.65,
    y: c0.y + (midTop.y - c0.y) * 0.85
  };
  const cpTopB = {
    x: c1.x + (midTop.x - c1.x) * 0.65,
    y: c1.y + (midTop.y - c1.y) * 0.85
  };

  // Right Edge: c1 -> c2 (cinches inward towards grab point)
  const cinchRight = -Math.min(0.2, pullFactor * 0.18) * Math.max(0.4, Math.abs(pdx) * 2);
  const midRight = {
    x: (c1.x + c2.x) / 2 + cinchRight + pdx * 0.35,
    y: (c1.y + c2.y) / 2 + pdy * 0.35 + Math.min(0.18, pullFactor * 0.14)
  };
  const cpRightA = {
    x: c1.x + (midRight.x - c1.x) * 0.7,
    y: c1.y + (midRight.y - c1.y) * 0.7
  };
  const cpRightB = {
    x: c2.x + (midRight.x - c2.x) * 0.7,
    y: c2.y + (midRight.y - c2.y) * 0.7
  };

  // Bottom Edge: c2 -> c3 (heavy hanging drapery drape with loose waves)
  const bottomDrapeSag = Math.min(0.28, pullFactor * 0.24);
  const midBottom = {
    x: (c2.x + c3.x) / 2 + pdx * 0.35,
    y: (c2.y + c3.y) / 2 + pdy * 0.35 + bottomDrapeSag
  };
  const cpBottomA = {
    x: c2.x + (midBottom.x - c2.x) * 0.65,
    y: c2.y + (midBottom.y - c2.y) * 0.85
  };
  const cpBottomB = {
    x: c3.x + (midBottom.x - c3.x) * 0.65,
    y: c3.y + (midBottom.y - c3.y) * 0.85
  };

  // Left Edge: c3 -> c0 (cinches inward)
  const cinchLeft = Math.min(0.2, pullFactor * 0.18) * Math.max(0.4, Math.abs(pdx) * 2);
  const midLeft = {
    x: (c3.x + c0.x) / 2 + cinchLeft + pdx * 0.35,
    y: (c3.y + c0.y) / 2 + pdy * 0.35 + Math.min(0.18, pullFactor * 0.14)
  };
  const cpLeftA = {
    x: c3.x + (midLeft.x - c3.x) * 0.7,
    y: c3.y + (midLeft.y - c3.y) * 0.7
  };
  const cpLeftB = {
    x: c0.x + (midLeft.x - c0.x) * 0.7,
    y: c0.y + (midLeft.y - c0.y) * 0.7
  };

  // Assemble dynamic organic cloth silhouette path
  const svgPath = `
    M ${c0.x.toFixed(4)} ${c0.y.toFixed(4)}
    C ${cpTopA.x.toFixed(4)} ${cpTopA.y.toFixed(4)}, ${cpTopB.x.toFixed(4)} ${cpTopB.y.toFixed(4)}, ${c1.x.toFixed(4)} ${c1.y.toFixed(4)}
    C ${cpRightA.x.toFixed(4)} ${cpRightA.y.toFixed(4)}, ${cpRightB.x.toFixed(4)} ${cpRightB.y.toFixed(4)}, ${c2.x.toFixed(4)} ${c2.y.toFixed(4)}
    C ${cpBottomA.x.toFixed(4)} ${cpBottomA.y.toFixed(4)}, ${cpBottomB.x.toFixed(4)} ${cpBottomB.y.toFixed(4)}, ${c3.x.toFixed(4)} ${c3.y.toFixed(4)}
    C ${cpLeftA.x.toFixed(4)} ${cpLeftA.y.toFixed(4)}, ${cpLeftB.x.toFixed(4)} ${cpLeftB.y.toFixed(4)}, ${c0.x.toFixed(4)} ${c0.y.toFixed(4)}
    Z
  `.replace(/\s+/g, ' ').trim();

  // 3. Pinch point where finger holds the cloth
  const pinch = {
    x: ox + pdx * 0.95,
    y: oy + pdy * 0.95
  };

  // 4. Generate Tension Creases / Silk Wrinkles radiating from the pinch point to corners and midpoints
  const targetTargets = [
    c0,
    midTop,
    c1,
    midRight,
    c2,
    midBottom,
    c3,
    midLeft
  ];

  const folds: ClothFold[] = targetTargets.map((target, index) => {
    // Control point for a gentle parabolic curve along the wrinkle
    const curveOffset = Math.sin(index + pullFactor * 4) * 0.04 * pullFactor;
    const midX = (pinch.x + target.x) / 2 + curveOffset;
    const midY = (pinch.y + target.y) / 2 - curveOffset;

    const highlightD = `M ${pinch.x.toFixed(4)} ${pinch.y.toFixed(4)} Q ${midX.toFixed(4)} ${midY.toFixed(4)} ${target.x.toFixed(4)} ${target.y.toFixed(4)}`;
    const shadowD = `M ${(pinch.x + 0.005).toFixed(4)} ${(pinch.y + 0.005).toFixed(4)} Q ${(midX + 0.005).toFixed(4)} ${(midY + 0.005).toFixed(4)} ${(target.x + 0.005).toFixed(4)} ${(target.y + 0.005).toFixed(4)}`;

    return {
      d: highlightD,
      shadowD,
      opacity: Math.min(0.65, 0.15 + pullFactor * 0.35)
    };
  });

  // 3D Angles
  const rotX = Math.max(-28, Math.min(28, -dy * 0.075));
  const rotY = Math.max(-28, Math.min(28, dx * 0.075));
  const rotZ = Math.max(-20, Math.min(20, dx * 0.042));
  const scale = Math.max(0.86, 1 - dist * 0.12);

  return {
    svgPath,
    hemPath: svgPath,
    folds,
    pinchPoint: pinch,
    pullFactor,
    rotX,
    rotY,
    rotZ,
    scale,
    isFlinging
  };
}

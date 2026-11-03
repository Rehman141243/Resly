export const FRAME = { x: -40, y: -10, w: 160, h: 160 };
export const CENTER = { x: FRAME.x + FRAME.w / 2, y: FRAME.y + FRAME.h / 2 };

export const GROUND = 134;
export const BODY_LEFT = 9;
export const BODY_RIGHT = 111;
export const BODY_TOP = 5;

export const SHOULDER_LEFT = { x: 20, y: 86 };
export const SHOULDER_RIGHT = { x: 100, y: 86 };
export const TAIL_PIVOT = { x: 86, y: 97 };
export const EYE_PIVOT_Y = 53;
export const FEET_PIVOT = { x: 60, y: 130 };

export const ARM_POSE = {
  pull: { left: 78, right: 62 },
  folded: { left: -76, right: 76 },
};

export const PULL_LEAN = 8;
export const REST_LEAN = -7;

const FLIPPER_LEN = 40;
const rotPoint = (p: { x: number; y: number }, c: { x: number; y: number }, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return {
    x: c.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: c.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
};
export const HAND_PULL = (() => {
  const tip = rotPoint(
    { x: SHOULDER_LEFT.x, y: SHOULDER_LEFT.y + FLIPPER_LEN },
    SHOULDER_LEFT,
    ARM_POSE.pull.left,
  );
  return rotPoint(tip, FEET_PIVOT, PULL_LEAN);
})();

const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
export const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => hex(v + (pb[i] - v) * t)).join("");
};

export const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FRAME.x} ${FRAME.y} ${FRAME.w} ${FRAME.h}">${inner}</svg>`;

type Opts = { brand?: string; scarf?: boolean };

export function penguinArt(dark: boolean, opts: Opts = {}) {
  const scarfOn = opts.scarf !== false;
  const brand = opts.brand ?? (dark ? "#0A84FF" : "#3B82F6");

  const c = dark
    ? { hi: "#A4ADC2", mid: "#667089", lo: "#3A4156" }
    : { hi: "#6A7287", mid: "#333A4D", lo: "#171B28" };

  const rimA = dark ? 0.5 : 0.26;
  const edge = dark ? `stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1"` : "";

  const sc = {
    hi: mix(brand, "#FFFFFF", 0.32),
    mid: brand,
    lo: mix(brand, "#0B1B4D", 0.42),
  };

  const shCol = dark ? brand : "#000000";
  const sh2Col = dark ? "#FFFFFF" : "#000000";

  const shadow = `
<defs>
<radialGradient id="pg-sh" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="${shCol}" stop-opacity="${dark ? 0.42 : 0.34}"/><stop offset="0.6" stop-color="${shCol}" stop-opacity="${dark ? 0.16 : 0.12}"/><stop offset="1" stop-color="${shCol}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="pg-sh2" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="${sh2Col}" stop-opacity="${dark ? 0.16 : 0.42}"/><stop offset="1" stop-color="${sh2Col}" stop-opacity="0"/>
</radialGradient>
</defs>
<ellipse cx="60" cy="135" rx="58" ry="9.5" fill="url(#pg-sh)"/>
<ellipse cx="60" cy="134" rx="36" ry="4.5" fill="url(#pg-sh2)"/>`;

  const foot = (id: string, cx: number, cy: number) => `
<defs>
<linearGradient id="pg-ft-${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#FFE08A"/><stop offset="0.55" stop-color="#FFB93E"/><stop offset="1" stop-color="#EE8E26"/>
</linearGradient>
</defs>
<ellipse cx="${cx}" cy="${cy + 2}" rx="18.5" ry="7.8" fill="#A85F0C" opacity="0.35"/>
<ellipse cx="${cx}" cy="${cy}" rx="18" ry="7.6" fill="url(#pg-ft-${id})"/>
<circle cx="${cx - 9}" cy="${cy + 3}" r="3.6" fill="#FFC85A" opacity="0.5"/>
<circle cx="${cx}" cy="${cy + 4.2}" r="3.8" fill="#FFC85A" opacity="0.5"/>
<circle cx="${cx + 9}" cy="${cy + 3}" r="3.6" fill="#FFC85A" opacity="0.5"/>
<ellipse cx="${cx - 3}" cy="${cy - 3.6}" rx="10.5" ry="2.1" fill="#fff" opacity="0.5"/>`;

  const footLeft = foot("l", 41, 129.5);
  const footRight = foot("r", 79, 129.5);

  const scarfBand = scarfOn
    ? `
<ellipse cx="60" cy="102" rx="45" ry="7" fill="#000" opacity="0.2"/>
<path d="M12 80 C12 73 22 72 32 76 C46 82 74 82 88 76 C98 72 108 73 108 80 L109 88 C109 97 99 99 91 95 C76 101 44 101 29 95 C21 99 11 97 11 88 Z" fill="url(#pg-sc)"/>
<path d="M12 84 C12 77 21 76 30 79 C46 86 74 86 90 79 C99 76 108 77 108 84 L109 88 C109 97 99 99 91 95 C76 101 44 101 29 95 C21 99 11 97 11 88 Z" fill="url(#pg-sc-lo)" opacity="0.5"/>
<path d="M32 76 C46 82 74 82 88 76" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/>
<path d="M24 89 C36 96 48 97 60 97 M96 89 C84 95 74 96 62 97" fill="none" stroke="${sc.lo}" stroke-opacity="0.3" stroke-width="1.3" stroke-linecap="round"/>
<ellipse cx="86" cy="94" rx="12" ry="9.5" fill="url(#pg-sc)"/>
<ellipse cx="83" cy="90.5" rx="7" ry="3.2" fill="#fff" opacity="0.34"/>
<path d="M79 97 C84 100.5 90 100.5 94 96" fill="none" stroke="${sc.lo}" stroke-opacity="0.4" stroke-width="1.3" stroke-linecap="round"/>`
    : "";

  const BODY =
    "M60 10 C92 10 108 34 108 66 C108 104 92 128 60 128 C28 128 12 104 12 66 C12 34 28 10 60 10 Z";
  const torso = `
<defs>
<radialGradient id="pg-bd" cx="36%" cy="22%" r="90%">
<stop offset="0" stop-color="${c.hi}"/><stop offset="0.5" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.lo}"/>
</radialGradient>
<radialGradient id="pg-ao" cx="50%" cy="46%" r="58%">
<stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.34"/>
</radialGradient>
<linearGradient id="pg-rim" x1="1" y1="0.35" x2="0.1" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.72" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="${rimA}"/>
</linearGradient>
<radialGradient id="pg-hl" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="pg-fc" gradientUnits="userSpaceOnUse" cx="50" cy="28" r="66">
<stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FFF8EA"/><stop offset="1" stop-color="#E9DBBF"/>
</radialGradient>
<radialGradient id="pg-fsh" cx="50%" cy="50%" r="50%">
<stop offset="0.72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/>
</radialGradient>
<radialGradient id="pg-bl" cx="42%" cy="24%" r="82%">
<stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FDF6E6"/><stop offset="1" stop-color="#DECCAA"/>
</radialGradient>
<radialGradient id="pg-bsh" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#6B5636" stop-opacity="0.28"/><stop offset="1" stop-color="#6B5636" stop-opacity="0"/>
</radialGradient>
<radialGradient id="pg-bs" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#FF7F98" stop-opacity="0.72"/><stop offset="1" stop-color="#FF7F98" stop-opacity="0"/>
</radialGradient>
<linearGradient id="pg-bk" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#FFD170"/><stop offset="0.55" stop-color="#FFAA3A"/><stop offset="1" stop-color="#E9801C"/>
</linearGradient>
<linearGradient id="pg-sc" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${sc.hi}"/><stop offset="0.5" stop-color="${sc.mid}"/><stop offset="1" stop-color="${sc.lo}"/>
</linearGradient>
<linearGradient id="pg-sc-lo" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${sc.lo}" stop-opacity="0"/><stop offset="1" stop-color="${sc.lo}" stop-opacity="0.6"/>
</linearGradient>
</defs>
<path d="${BODY}" fill="url(#pg-bd)" ${edge}/>
<path d="${BODY}" fill="url(#pg-ao)"/>
<path d="${BODY}" fill="url(#pg-rim)"/>
<ellipse cx="40" cy="22" rx="22" ry="8.5" fill="url(#pg-hl)" transform="rotate(-26 40 22)"/>
<ellipse cx="60" cy="76" rx="32" ry="7" fill="url(#pg-bsh)"/>
<ellipse cx="60" cy="102" rx="36" ry="26" fill="url(#pg-bl)"/>
<ellipse cx="60" cy="118" rx="26" ry="8" fill="#B9A27A" opacity="0.14"/>
<ellipse cx="41" cy="49" rx="24" ry="25" fill="url(#pg-fc)"/>
<ellipse cx="79" cy="49" rx="24" ry="25" fill="url(#pg-fc)"/>
<ellipse cx="60" cy="56" rx="22" ry="19" fill="url(#pg-fc)"/>
<ellipse cx="41" cy="49" rx="24" ry="25" fill="url(#pg-fsh)"/>
<ellipse cx="79" cy="49" rx="24" ry="25" fill="url(#pg-fsh)"/>
<ellipse cx="27" cy="64" rx="10" ry="6" fill="url(#pg-bs)"/>
<ellipse cx="93" cy="64" rx="10" ry="6" fill="url(#pg-bs)"/>
<ellipse cx="60" cy="72" rx="8" ry="2.4" fill="#8A7650" opacity="0.2"/>
<path d="M52.5 60 C52.5 55.4 67.5 55.4 67.5 60 C67.5 66.5 63 70.6 60 70.6 C57 70.6 52.5 66.5 52.5 60 Z" fill="url(#pg-bk)"/>
<path d="M55 65.5 C57.5 69 62.5 69 65 65.5" fill="none" stroke="#C86A10" stroke-opacity="0.32" stroke-width="1.1" stroke-linecap="round"/>
<ellipse cx="56.6" cy="58.4" rx="4.6" ry="1.9" fill="#fff" opacity="0.6" transform="rotate(-12 56.6 58.4)"/>
<path d="M56.5 74.6 C58.5 76.4 61.5 76.4 63.5 74.6" fill="none" stroke="#7A6240" stroke-opacity="0.45" stroke-width="1.1" stroke-linecap="round"/>
${scarfBand}`;

  const eyes = `
<defs>
<radialGradient id="pg-ey" cx="38%" cy="32%" r="80%">
<stop offset="0" stop-color="#3A3A44"/><stop offset="0.5" stop-color="#14141A"/><stop offset="1" stop-color="#050507"/>
</radialGradient>
</defs>
<ellipse cx="40" cy="53" rx="5.6" ry="6.6" fill="url(#pg-ey)"/>
<ellipse cx="80" cy="53" rx="5.6" ry="6.6" fill="url(#pg-ey)"/>
<ellipse cx="42" cy="50" rx="2.3" ry="2.5" fill="#fff"/>
<ellipse cx="82" cy="50" rx="2.3" ry="2.5" fill="#fff"/>
<circle cx="38.4" cy="56" r="1.1" fill="#fff" opacity="0.75"/>
<circle cx="78.4" cy="56" r="1.1" fill="#fff" opacity="0.75"/>`;

  const flipper = (id: string, sx: number, sy: number, mirror: boolean) => {
    const body = `
<defs><linearGradient id="pg-fl-${id}" x1="${mirror ? 1 : 0}" y1="0" x2="${mirror ? 0 : 1}" y2="0.35">
<stop offset="0" stop-color="${c.hi}"/><stop offset="0.5" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.lo}"/>
</linearGradient></defs>
<ellipse cx="${sx}" cy="${sy + 3}" rx="10.5" ry="5.2" fill="#000" opacity="0.22"/>
<path d="M${sx - 9} ${sy - 2} C${sx - 15} ${sy + 10} ${sx - 13} ${sy + 30} ${sx - 3} ${sy + 38} C${sx + 4} ${sy + 43} ${sx + 12} ${sy + 36} ${sx + 12} ${sy + 24} C${sx + 12} ${sy + 12} ${sx + 9} ${sy + 2} ${sx + 7} ${sy - 2} Z" fill="url(#pg-fl-${id})" ${edge}/>
<path d="M${sx - 7} ${sy + 4} C${sx - 11} ${sy + 14} ${sx - 10} ${sy + 28} ${sx - 3} ${sy + 35}" stroke="#fff" stroke-opacity="0.28" stroke-width="2" stroke-linecap="round" fill="none"/>
<path d="M${sx + 9} ${sy + 18} C${sx + 10} ${sy + 28} ${sx + 6} ${sy + 36} ${sx} ${sy + 39}" stroke="#000" stroke-opacity="0.18" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    return mirror ? `<g transform="translate(${2 * sx} 0) scale(-1 1)">${body}</g>` : body;
  };

  const flipperLeft = flipper("l", SHOULDER_LEFT.x, SHOULDER_LEFT.y, false);
  const flipperRight = flipper("r", SHOULDER_RIGHT.x, SHOULDER_RIGHT.y, true);

  const scarfTail = scarfOn
    ? `
<defs><linearGradient id="pg-sct" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${sc.hi}"/><stop offset="0.5" stop-color="${sc.mid}"/><stop offset="1" stop-color="${sc.lo}"/>
</linearGradient></defs>
<path d="M77 97 C76 106 77 114 79 121 L95 119 C94 111 95 104 94 97 Z" fill="url(#pg-sct)"/>
<path d="M80 99 C79.5 106 80.5 113 82 118" fill="none" stroke="#fff" stroke-opacity="0.32" stroke-width="1.8" stroke-linecap="round"/>
<path d="M82 119.5 L82.6 126 M85 120 L85.4 127 M88 119.8 L88.4 126.4 M91 119.4 L91.4 125.2" stroke="${sc.mid}" stroke-width="1.8" stroke-linecap="round"/>`
    : "";

  return { shadow, footLeft, footRight, torso, eyes, flipperLeft, flipperRight, scarfTail };
}

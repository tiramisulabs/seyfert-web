// Tabler Icons v3.5 (MIT, tabler.io) — the exact glyphs the 2024 site used
// through @tabler/icons-react, inlined so the archive needs no extra package.
import type { CSSProperties } from "react";

type IconProps = { size?: number; className?: string; style?: CSSProperties };

function icon(filled: boolean, paths: string[]) {
  return function TablerIcon({ size = 24, className, style }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? undefined : "currentColor"}
        strokeWidth={filled ? undefined : 2}
        strokeLinecap={filled ? undefined : "round"}
        strokeLinejoin={filled ? undefined : "round"}
        className={className}
        style={style}
        aria-hidden="true"
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const IconRocket = icon(false, ["M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3","M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3","M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"]);
export const IconAt = icon(false, ["M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0","M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0 -5.5 8.28"]);
export const IconFingerprintOff = icon(false, ["M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3","M8 11c0 -.848 .264 -1.634 .713 -2.28m2.4 -1.621a4 4 0 0 1 4.887 3.901l0 1","M12 12v1a14 14 0 0 0 2.5 8","M8 15a18 18 0 0 0 1.8 6","M4.9 19a22 22 0 0 1 -.9 -7v-1a8 8 0 0 1 1.854 -5.143m2.176 -1.825a8 8 0 0 1 7.97 .018","M3 3l18 18"]);
export const IconTrashFilled = icon(true, ["M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z","M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z"]);
export const IconBrandGithubFilled = icon(true, ["M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z"]);
export const IconAlbum = icon(false, ["M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z","M12 4v7l2 -2l2 2v-7"]);
export const IconBubbleFilled = icon(true, ["M12.4 2a6.33 6.33 0 0 1 5.491 3.176l.09 .162l.126 .027a6.335 6.335 0 0 1 4.889 5.934l.004 .234a6.333 6.333 0 0 1 -6.333 6.334l-.035 -.002l-.035 .05a5.26 5.26 0 0 1 -3.958 2.08l-.239 .005q -.722 0 -1.404 -.19l-.047 -.014l-3.434 2.061a1 1 0 0 1 -1.509 -.743l-.006 -.114v-2.434l-.121 -.06a3.67 3.67 0 0 1 -1.94 -3.042l-.006 -.197q 0 -.365 .07 -.717l.013 -.058l-.113 -.09a5.8 5.8 0 0 1 -2.098 -4.218l-.005 -.25a5.8 5.8 0 0 1 5.8 -5.8l.058 .001l.15 -.163a6.32 6.32 0 0 1 4.328 -1.967z"]);
export const IconCheck = icon(false, ["M5 12l5 5l10 -10"]);
export const IconArrowBadgeRightFilled = icon(true, ["M7 6l-.112 .006a1 1 0 0 0 -.669 1.619l3.501 4.375l-3.5 4.375a1 1 0 0 0 .78 1.625h6a1 1 0 0 0 .78 -.375l4 -5a1 1 0 0 0 0 -1.25l-4 -5a1 1 0 0 0 -.78 -.375h-6z"]);
export const IconBrandTypescript = icon(false, ["M15 17.5c.32 .32 .754 .5 1.207 .5h.543c.69 0 1.25 -.56 1.25 -1.25v-.25a1.5 1.5 0 0 0 -1.5 -1.5a1.5 1.5 0 0 1 -1.5 -1.5v-.25c0 -.69 .56 -1.25 1.25 -1.25h.543c.453 0 .887 .18 1.207 .5","M9 12h4","M11 12v6","M21 19v-14a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2z"]);
export const IconChartArrowsVertical = icon(false, ["M18 21v-14","M9 15l3 -3l3 3","M15 10l3 -3l3 3","M3 21l18 0","M12 21l0 -9","M3 6l3 -3l3 3","M6 21v-18"]);
export const IconMoodHappyFilled = icon(true, ["M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-2 9.66h-6a1 1 0 0 0 -1 1v.05a3.975 3.975 0 0 0 3.777 3.97l.227 .005a4.026 4.026 0 0 0 3.99 -3.79l.006 -.206a1 1 0 0 0 -1 -1.029zm-5.99 -5l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993zm6 0l-.127 .007a1 1 0 0 0 .117 1.993l.127 -.007a1 1 0 0 0 -.117 -1.993z"]);
export const IconPalette = icon(false, ["M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25","M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0","M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0","M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"]);

/**
 * @file index.tsx
 * @description Bulut depolama sağlayıcıları ve harici entegrasyon şirket/hizmet logoları asset merkezi.
 */
import React from 'react';
import GoogleDriveLogoSvg from './providers/google-drive.svg';
import OneDriveLogoSvg from './providers/onedrive.svg';
import DropboxLogoSvg from './providers/dropbox.svg';

export {
  GoogleDriveLogoSvg,
  OneDriveLogoSvg,
  DropboxLogoSvg
};

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Google Drive Resmi Renkli Vektör Logosu
 */
export const GoogleDriveLogo: React.FC<LogoProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={`object-contain flex-shrink-0 ${className}`}
    {...props}
  >
    <path d="m38.7 419.3 22.6 39c4.7 8.2 11.4 14.7 19.4 19.4l80.6-139.6H0c0 9.1 2.3 18.2 7 26.4z" fill="#0066da" />
    <path d="M256 173.9 175.4 34.3c-7.9 4.7-14.7 11.1-19.4 19.4L7 311.7c-4.6 8-7 17.1-7 26.4h161.3z" fill="#00ac47" />
    <path d="M431.4 477.7c7.9-4.7 14.7-11.1 19.4-19.4l9.4-16.1 44.9-77.7c4.7-8.2 7-17.3 7-26.4H350.7l34.3 67.4z" fill="#ea4335" />
    <path d="m256 173.9 80.6-139.6c-7.9-4.7-17-7-26.4-7H201.8c-9.4 0-18.5 2.6-26.4 7z" fill="#00832d" />
    <path d="M350.7 338.1H161.3L80.6 477.7c7.9 4.7 17 7 26.4 7h298c9.4 0 18.5-2.6 26.4-7z" fill="#2684fc" />
    <path d="M430.5 182.7 356 53.7c-4.7-8.2-11.4-14.7-19.4-19.4L256 173.9l94.7 164.2h161c0-9.1-2.3-18.2-7-26.4z" fill="#ffba00" />
  </svg>
);

/**
 * Microsoft OneDrive Resmi Fluent Design Vektör Logosu
 */
export const OneDriveLogo: React.FC<LogoProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="35.98 139.2 648.03 430.85"
    width={size}
    height={size}
    className={`object-contain flex-shrink-0 ${className}`}
    {...props}
  >
    <defs>
      <radialGradient id="od_jsx_radial0" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(130.864814,156.804864,-260.089994,217.063603,48.669602,228.766494)">
        <stop offset="0" stopColor="#4894fe" />
        <stop offset="0.695" stopColor="#0934b3" />
      </radialGradient>
      <radialGradient id="od_jsx_radial1" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-575.289668,663.594003,-491.728488,-426.294267,596.956501,-6.380235)">
        <stop offset="0.165" stopColor="#23c0fe" />
        <stop offset="0.534" stopColor="#1c91ff" />
      </radialGradient>
      <radialGradient id="od_jsx_radial2" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-136.753383,-114.806698,262.816935,-313.057562,181.196995,240.395994)">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="0.66" stopColor="#adc0ff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="od_jsx_radial3" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-153.638428,-130.000063,197.433014,-233.332948,375.353994,451.43549)">
        <stop offset="0" stopColor="#033acc" />
        <stop offset="1" stopColor="#368eff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="od_jsx_radial4" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(175.585899,405.198026,-437.434522,189.555055,169.378495,125.589294)">
        <stop offset="0.592" stopColor="#3464e3" stopOpacity="0" />
        <stop offset="1" stopColor="#033acc" stopOpacity="0.6" />
      </radialGradient>
      <radialGradient id="od_jsx_radial5" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-459.329491,459.329491,-719.614455,-719.614455,589.876499,39.484649)">
        <stop offset="0" stopColor="#4bfde8" stopOpacity="0.9" />
        <stop offset="0.544" stopColor="#4bfde8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="od_jsx_linear0" gradientUnits="userSpaceOnUse" x1="449.9955" y1="569.7345" x2="449.9955" y2="275.973">
        <stop offset="0" stopColor="#0086ff" />
        <stop offset="0.49" stopColor="#00bbff" />
      </linearGradient>
      <radialGradient id="od_jsx_radial6" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(273.622108,108.513684,-205.488428,518.148261,296.488495,307.441492)">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="0.785" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="od_jsx_radial7" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-305.683909,263.459223,-264.352324,-306.720147,674.845505,249.378004)">
        <stop offset="0" stopColor="#4bfde8" stopOpacity="0.9" />
        <stop offset="0.585" stopColor="#4bfde8" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g>
      <path fill="url(#od_jsx_radial0)" d="M 215.078 205.09 C 116.012 205.094 41.957 286.188 36.383 376.527 C 39.836 395.992 51.176 434.43 68.941 432.457 C 91.145 429.988 147.066 432.457 194.766 346.105 C 229.609 283.027 301.285 205.086 215.078 205.09 Z" />
      <path fill="url(#od_jsx_radial1)" d="M 192.172 238.812 C 158.871 291.535 114.043 367.086 98.914 390.859 C 80.93 419.121 33.305 407.113 37.25 366.609 C 36.863 369.895 36.562 373.211 36.355 376.547 C 29.844 481.934 113.398 569.453 217.375 569.453 C 331.969 569.453 605.27 426.672 577.609 283.609 C 548.457 199.52 466.523 139.203 373.664 139.203 C 280.809 139.203 221.297 192.699 192.172 238.812 Z" />
      <path fill="url(#od_jsx_radial2)" d="M 192.172 238.812 C 158.871 291.535 114.043 367.086 98.914 390.859 C 80.93 419.121 33.305 407.113 37.25 366.609 C 36.863 369.895 36.562 373.211 36.355 376.547 C 29.844 481.934 113.398 569.453 217.375 569.453 C 331.969 569.453 605.27 426.672 577.609 283.609 C 548.457 199.52 466.523 139.203 373.664 139.203 C 280.809 139.203 221.297 192.699 192.172 238.812 Z" />
      <path fill="url(#od_jsx_radial3)" d="M 192.172 238.812 C 158.871 291.535 114.043 367.086 98.914 390.859 C 80.93 419.121 33.305 407.113 37.25 366.609 C 36.863 369.895 36.562 373.211 36.355 376.547 C 29.844 481.934 113.398 569.453 217.375 569.453 C 331.969 569.453 605.27 426.672 577.609 283.609 C 548.457 199.52 466.523 139.203 373.664 139.203 C 280.809 139.203 221.297 192.699 192.172 238.812 Z" />
      <path fill="url(#od_jsx_radial4)" d="M 192.172 238.812 C 158.871 291.535 114.043 367.086 98.914 390.859 C 80.93 419.121 33.305 407.113 37.25 366.609 C 36.863 369.895 36.562 373.211 36.355 376.547 C 29.844 481.934 113.398 569.453 217.375 569.453 C 331.969 569.453 605.27 426.672 577.609 283.609 C 548.457 199.52 466.523 139.203 373.664 139.203 C 280.809 139.203 221.297 192.699 192.172 238.812 Z" />
      <path fill="url(#od_jsx_radial5)" d="M 192.172 238.812 C 158.871 291.535 114.043 367.086 98.914 390.859 C 80.93 419.121 33.305 407.113 37.25 366.609 C 36.863 369.895 36.562 373.211 36.355 376.547 C 29.844 481.934 113.398 569.453 217.375 569.453 C 331.969 569.453 605.27 426.672 577.609 283.609 C 548.457 199.52 466.523 139.203 373.664 139.203 C 280.809 139.203 221.297 192.699 192.172 238.812 Z" />
      <path fill="url(#od_jsx_linear0)" d="M 215.699 569.496 C 215.699 569.496 489.32 570.035 535.734 570.035 C 619.961 570.035 684 501.273 684 421.031 C 684 340.789 618.672 272.445 535.734 272.445 C 452.793 272.445 405.027 334.492 369.152 402.227 C 327.117 481.594 273.488 568.547 215.699 569.496 Z" />
      <path fill="url(#od_jsx_radial6)" d="M 215.699 569.496 C 215.699 569.496 489.32 570.035 535.734 570.035 C 619.961 570.035 684 501.273 684 421.031 C 684 340.789 618.672 272.445 535.734 272.445 C 452.793 272.445 405.027 334.492 369.152 402.227 C 327.117 481.594 273.488 568.547 215.699 569.496 Z" />
      <path fill="url(#od_jsx_radial7)" d="M 215.699 569.496 C 215.699 569.496 489.32 570.035 535.734 570.035 C 619.961 570.035 684 501.273 684 421.031 C 684 340.789 618.672 272.445 535.734 272.445 C 452.793 272.445 405.027 334.492 369.152 402.227 C 327.117 481.594 273.488 568.547 215.699 569.496 Z" />
    </g>
  </svg>
);

/**
 * Dropbox Resmi Vektör Logosu
 */
export const DropboxLogo: React.FC<LogoProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 17.5 512 477.1"
    width={size}
    height={size}
    className={`object-contain flex-shrink-0 ${className}`}
    {...props}
  >
    <path
      d="M150.9 17.5 0 115.3l105.1 84.5L256 105.7zM0 282l150.9 99L256 292.8l-150.9-93zm256 10.8L362.3 381 512 283.2l-103.8-83.3c0-.1-152.2 92.9-152.2 92.9m256-177.5L362.3 17.5 256 105.7l152.2 94.2zM257.2 312.2l-106.3 88.2-44.7-30.2V404l150.9 90.6L408 404v-33.8l-45.9 30.2c.2-.1-104.9-88.2-104.9-88.2"
      fill="#0061ff"
    />
  </svg>
);

export interface DynamicProviderLogoProps extends LogoProps {
  provider: 'google' | 'onedrive' | 'dropbox' | string;
}

export const ProviderLogo: React.FC<DynamicProviderLogoProps> = ({ provider, ...props }) => {
  switch (provider?.toLowerCase()) {
    case 'google':
    case 'googledrive':
    case 'google-drive':
      return <GoogleDriveLogo {...props} />;
    case 'onedrive':
    case 'microsoft':
    case 'microsoft-onedrive':
      return <OneDriveLogo {...props} />;
    case 'dropbox':
      return <DropboxLogo {...props} />;
    default:
      return null;
  }
};

export default ProviderLogo;

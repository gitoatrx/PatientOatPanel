// Backward-compatible circle logo
export const BimbleLogoIcon = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 60 60"
      fill="none"
    >
      <circle cx="30" cy="30" r="30" fill="#0049F8" />
      <path
        d="M26.2775 43.1386L26.3342 43.0108L26.3271 43.004C28.4808 39.0678 30.6496 34.886 32.7709 30.4889L32.771 30.4888C34.8672 26.1368 36.785 21.91 38.5079 17.8242L38.625 17.5465H38.3236H34.3122H34.1844L34.1307 17.6625C32.9017 20.3205 31.0424 23.6968 28.1972 27.1823C24.7856 31.3561 21.2125 34.201 18.4805 36.0297L18.3648 36.1071L18.3973 36.2425C18.5274 36.7851 18.6615 37.3235 18.7954 37.861L18.7956 37.8615C18.9296 38.3994 19.0633 38.9364 19.193 39.4771L19.2558 39.7386L19.4882 39.6032C20.7617 38.8613 22.1325 37.9619 23.5519 36.8893L23.5524 36.8889C24.4406 36.2134 25.2689 35.5376 26.0247 34.8797L20.8343 44.8019L20.8339 44.8027C20.5066 45.4356 20.2403 46.0294 20.0727 46.5965C19.9067 47.1581 19.8209 47.6646 19.8209 48.0977C19.8209 48.8941 19.989 49.5685 20.3793 50.1003L20.3815 50.1032C20.6235 50.4207 20.9115 50.67 21.2497 50.7972L21.2685 50.8037C21.3406 50.8261 21.3873 50.8392 21.4442 50.8521C21.5572 50.8778 21.7146 50.9041 21.888 50.9042C25.2035 50.9122 28.6137 49.4832 31.1811 48.0668C32.4677 47.3569 33.5487 46.6468 34.3083 46.114C35.193 45.4694 35.5096 45.223 35.5096 45.223C37.3719 43.7226 39.9519 41.3385 42.4173 37.834V34.0762C40.5771 36.9919 38.8063 38.9681 37.6161 40.1188C34.8813 42.763 32.0973 44.0668 29.9488 44.6908C28.8741 45.0029 27.9586 45.1448 27.2884 45.1992C26.481 45.2255 26.1494 45.1942 26.1494 45.1942C25.9916 45.1078 25.8885 45.0168 25.8803 45.0081C25.795 44.8876 25.7425 44.7282 25.7425 44.5335C25.7425 44.4499 25.7776 44.2924 25.8889 44.0309C26.0022 43.765 26.1317 43.4676 26.2775 43.1386Z"
        fill="white"
        stroke="#0049F8"
        strokeWidth="0.4"
      />
      <path
        d="M36.73 16.9014C36.0833 16.9014 35.5627 16.7047 35.1999 16.2949C34.8371 15.9015 34.6478 15.3606 34.6478 14.7213C34.6478 13.4264 35.0421 12.1971 35.8309 11.0333C36.6196 9.86947 37.4872 9.29577 38.4652 9.29577C39.0804 9.29577 39.5852 9.50886 39.9796 9.91864C40.3582 10.3284 40.5633 10.8857 40.5633 11.5742C40.5633 13.033 40.2004 14.2788 39.4748 15.3278C38.7492 16.3769 37.8342 16.9014 36.7458 16.9014H36.73Z"
        fill="white"
      />
    </svg>
  );
};

// New: explicit circle variant (same as BimbleLogoIcon)
export const BimbleLogoCircle = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => <BimbleLogoIcon height={height} width={width} />;

// New: rectangle variant (rounded rectangle background with monogram)
export const BimbleLogoRectangle = ({
  height,
  width,
  radius = 10,
}: {
  height: number;
  width: number;
  radius?: number;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 160 48"
      fill="none"
    >
      <rect x="0" y="0" width="160" height="48" rx={radius} fill="#0049F8" />
      {/* Simple monogram "B" using strokes for clarity */}
      <path
        d="M54 12V36"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle
        cx="68"
        cy="18"
        r="8"
        stroke="white"
        strokeWidth="6"
        fill="none"
      />
      <circle
        cx="68"
        cy="30"
        r="8"
        stroke="white"
        strokeWidth="6"
        fill="none"
      />
    </svg>
  );
};

// WhyChooseUs Icons
export const ConsistentBrandingIcon = ({
  width = 48,
  height = 48,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
  >
    <path
      d="M24 28L2 16L24 4L46 16L24 28ZM24 36L3.15 24.65L7.35 22.35L24 31.45L40.65 22.35L44.85 24.65L24 36ZM24 44L3.15 32.65L7.35 30.35L24 39.45L40.65 30.35L44.85 32.65L24 44ZM24 23.45L37.65 16L24 8.55L10.35 16L24 23.45Z"
      fill="currentColor"
    />
  </svg>
);

export const AutomationPrecisionIcon = ({
  width = 48,
  height = 48,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
  >
    <path
      d="M14.8008 34.5C13.4008 35.6667 11.9424 36.2 10.4258 36.1C8.90909 36 7.58409 35.4833 6.45075 34.55C5.31742 33.6167 4.54242 32.3917 4.12575 30.875C3.70909 29.3583 3.98409 27.8 4.95075 26.2L8.70075 20C7.86742 19.2667 7.20909 18.3833 6.72575 17.35C6.24242 16.3167 6.00075 15.2 6.00075 14C6.00075 11.8 6.78409 9.91667 8.35075 8.35C9.91742 6.78333 11.8008 6 14.0008 6C16.2008 6 18.0841 6.78333 19.6508 8.35C21.2174 9.91667 22.0008 11.8 22.0008 14C22.0008 16.2 21.2174 18.0833 19.6508 19.65C18.0841 21.2167 16.2008 22 14.0008 22C13.7008 22 13.4008 21.9833 13.1008 21.95C12.8008 21.9167 12.5174 21.8667 12.2508 21.8L8.40075 28.3C8.03409 28.9 7.91742 29.4917 8.05075 30.075C8.18409 30.6583 8.46742 31.1333 8.90075 31.5C9.33409 31.8667 9.85075 32.075 10.4508 32.125C11.0508 32.175 11.6341 31.9667 12.2008 31.5L33.2008 13.45C34.6008 12.2833 36.0674 11.7583 37.6008 11.875C39.1341 11.9917 40.4674 12.5167 41.6008 13.45C42.7341 14.3833 43.5008 15.6083 43.9008 17.125C44.3008 18.6417 44.0174 20.2 43.0508 21.8L39.3008 28C40.1341 28.7333 40.7924 29.6167 41.2758 30.65C41.7591 31.6833 42.0008 32.8 42.0008 34C42.0008 36.2 41.2174 38.0833 39.6508 39.65C38.0841 41.2167 36.2008 42 34.0008 42C31.8008 42 29.9174 41.2167 28.3508 39.65C26.7841 38.0833 26.0008 36.2 26.0008 34C26.0008 31.8 26.7841 29.9167 28.3508 28.35C29.9174 26.7833 31.8008 26 34.0008 26C34.3008 26 34.5924 26.0167 34.8758 26.05C35.1591 26.0833 35.4341 26.1333 35.7008 26.2L39.6008 19.7C39.9674 19.1 40.0841 18.5083 39.9508 17.925C39.8174 17.3417 39.5341 16.8667 39.1008 16.5C38.6674 16.1333 38.1508 15.925 37.5508 15.875C36.9508 15.825 36.3674 16.0333 35.8008 16.5L14.8008 34.5ZM34.0008 38C35.1008 38 36.0424 37.6083 36.8258 36.825C37.6091 36.0417 38.0008 35.1 38.0008 34C38.0008 32.9 37.6091 31.9583 36.8258 31.175C36.0424 30.3917 35.1008 30 34.0008 30C32.9008 30 31.9591 30.3917 31.1758 31.175C30.3924 31.9583 30.0008 32.9 30.0008 34C30.0008 35.1 30.3924 36.0417 31.1758 36.825C31.9591 37.6083 32.9008 38 34.0008 38ZM14.0008 18C15.1008 18 16.0424 17.6083 16.8258 16.825C17.6091 16.0417 18.0008 15.1 18.0008 14C18.0008 12.9 17.6091 11.9583 16.8258 11.175C16.0424 10.3917 15.1008 10 14.0008 10C12.9008 10 11.9591 10.3917 11.1758 11.175C10.3924 11.9583 10.0008 12.9 10.0008 14C10.0008 15.1 10.3924 16.0417 11.1758 16.825C11.9591 17.6083 12.9008 18 14.0008 18Z"
      fill="currentColor"
    />
  </svg>
);

export const ScalableSolutionsIcon = ({
  width = 48,
  height = 48,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
  >
    <path
      d="M8 44V40H40V44H8ZM24 38L16 30L18.8 27.2L22 30.3V17.7L18.8 20.8L16 18L24 10L32 18L29.2 20.8L26 17.7V30.3L29.2 27.2L32 30L24 38ZM8 8V4H40V8H8Z"
      fill="currentColor"
    />
  </svg>
);

// Decorative Background SVG
export const DecorativeBackgroundIcon = ({
  width = 410,
  height = 420,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 410 420"
    fill="none"
    className={className}
  >
    <path
      d="M310.909 186.362L309.863 0H0L1.0463 189.861C1.0463 316.97 103.963 420 230.909 420H410V186.362H310.909Z"
      fill="#F0F4F3"
    />
  </svg>
);

// Certification Icons - Updated to match the screenshot
export const ISO27001Icon = ({
  width = 38,
  height = 39,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 38 39"
    fill="none"
    className={className}
  >
    <circle cx="19" cy="19.5" r="19" fill="currentColor" />
    <path
      d="M12 19.5L16 23.5L26 13.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="19"
      y="32"
      textAnchor="middle"
      fontSize="6"
      fill="white"
      fontWeight="bold"
    >
      ISO
    </text>
  </svg>
);

export const CCPAIcon = ({
  width = 27,
  height = 39,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 27 39"
    fill="none"
    className={className}
  >
    <rect x="2" y="2" width="23" height="35" rx="2" fill="currentColor" />
    <path
      d="M8 12L13 17L19 11"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="13.5"
      y="28"
      textAnchor="middle"
      fontSize="6"
      fill="white"
      fontWeight="bold"
    >
      CCPA
    </text>
  </svg>
);

export const GDPRIcon = ({
  width = 28,
  height = 39,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 28 39"
    fill="none"
    className={className}
  >
    <circle cx="14" cy="19.5" r="14" fill="currentColor" />
    <path
      d="M8 19.5L12 23.5L20 15.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="14"
      y="32"
      textAnchor="middle"
      fontSize="6"
      fill="white"
      fontWeight="bold"
    >
      GDPR
    </text>
  </svg>
);

export const HIPAAIcon = ({
  width = 59,
  height = 40,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 59 40"
    fill="none"
    className={className}
  >
    <rect x="2" y="2" width="55" height="36" rx="2" fill="currentColor" />
    <path
      d="M15 20L20 25L25 20"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M30 15L35 20L40 15"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="29.5"
      y="28"
      textAnchor="middle"
      fontSize="6"
      fill="white"
      fontWeight="bold"
    >
      HIPAA
    </text>
  </svg>
);

export const PlusIcon = ({
  width = 24,
  height = 24,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      d="M 12 5 L 12 19 M 5 12 L 19 12"
      fill="transparent"
      strokeWidth="1.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

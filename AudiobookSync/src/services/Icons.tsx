import React from "react";
import Svg, { G, Path } from "react-native-svg";

interface IconProps {
    size?: number;
    color?: string;
}

export const Rewind10Icon = ({ size = 24, stroke = "#FFF" }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <G transform="scale(-1.2, 1.2) translate(-23, 0)" strokeWidth="1">
            <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <Path d="M21 3v5h-5" />
        </G>

        <G transform="translate(1, 2)" strokeWidth="1.5">
            <Path d="M10 9v6" />
            <Path
                d="
          M14 9
          c1.2 0 2 1 2 3
          s-0.8 3-2 3
          c-1.2 0-2-1-2-3
          s0.8-3 2-3
        "
            />
        </G>
    </Svg>
);

export const Forward10Icon = ({ size = 24, stroke = "#FFF" }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <G transform="scale(1.2) translate(-2,0)" strokeWidth="1">
            <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <Path d="M21 3v5h-5" />
        </G>

        <G transform="translate(-1, 2)" strokeWidth="1.5">
            <Path d="M10 9v6" />
            <Path
                d="
          M14 9
          c1.2 0 2 1 2 3
          s-0.8 3-2 3
          c-1.2 0-2-1-2-3
          s0.8-3 2-3
        "
            />
        </G>
    </Svg>
);
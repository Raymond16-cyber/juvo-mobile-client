import { TextStyle } from "react-native";

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 40,
  } satisfies TextStyle,
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 32,
  } satisfies TextStyle,
  heading: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  } satisfies TextStyle,
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 16,
    textTransform: "uppercase",
  } satisfies TextStyle,
  mono: {
    fontSize: 14,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  } satisfies TextStyle,
} as const;

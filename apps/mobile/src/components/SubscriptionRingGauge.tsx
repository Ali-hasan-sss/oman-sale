import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from './AppText';

type SubscriptionRingGaugeProps = {
  title: string;
  used: number;
  total: number;
  usedLabel: string;
  remainingLabel: string;
  centerValue: string;
  centerSub?: string;
  accentColor?: string;
};

const SIZE = 88;
const INNER_RADIUS = 30;
const INNER_STROKE = 6;

export function SubscriptionRingGauge({
  title,
  used,
  total,
  usedLabel,
  remainingLabel,
  centerValue,
  centerSub,
  accentColor = '#16a34a'
}: SubscriptionRingGaugeProps) {
  const safeTotal = Math.max(total, 1);
  const safeUsed = Math.min(Math.max(used, 0), safeTotal);
  const remaining = Math.max(safeTotal - safeUsed, 0);
  const ratio = safeUsed / safeTotal;
  const circumference = 2 * Math.PI * INNER_RADIUS;
  const dash = circumference * ratio;

  return (
    <View style={styles.card}>
      <AppText style={styles.title}>{title}</AppText>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={38}
            stroke="#e5e7eb"
            strokeWidth={5}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={INNER_RADIUS}
            stroke={accentColor}
            strokeWidth={INNER_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.center}>
          <AppText style={styles.centerValue}>{centerValue}</AppText>
          {centerSub ? <AppText style={styles.centerSub}>{centerSub}</AppText> : null}
        </View>
      </View>
      <AppText style={styles.meta}>
        <AppText style={styles.metaBold}>{usedLabel}:</AppText> {safeUsed}
      </AppText>
      <AppText style={styles.meta}>
        <AppText style={styles.metaBold}>{remainingLabel}:</AppText> {remaining}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
    padding: 14
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563'
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  svg: {
    position: 'absolute'
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827'
  },
  centerSub: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280'
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center'
  },
  metaBold: {
    fontWeight: '800',
    color: '#111827'
  }
});

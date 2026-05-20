import { Image, StyleSheet, View } from 'react-native';

type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 42 }: BrandMarkProps) {
  return (
    <View style={[styles.mark, { width: size, height: size }]}>
      <Image source={require('../../assets/logo-symbol.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  logo: {
    width: '88%',
    height: '88%'
  }
});

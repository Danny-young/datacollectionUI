import { View, ViewProps } from 'react-native';

interface HStackProps extends ViewProps {
  space?: number | string;
}

export function HStack({ children, space = 0, style, ...props }: HStackProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: space,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
} 
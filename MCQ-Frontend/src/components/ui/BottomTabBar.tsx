import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '../../theme';

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const tabs: TabItem[] = [
  { name: 'Dashboard', label: 'HOME', icon: 'home' },
  { name: 'Chapters', label: 'CHAPTERS', icon: 'book' },
  { name: 'Tests', label: 'TESTS', icon: 'document-text' },
  { name: 'Leaderboard', label: 'LEADERBOARD', icon: 'trophy' },
  { name: 'Stats', label: 'ANALYTICS', icon: 'bar-chart' },
];

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const iconAnimations = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  const handleTabPress = (route: any, isFocused: boolean, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // Animate icon scale on press
      Animated.sequence([
        Animated.timing(iconAnimations[index], {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(iconAnimations[index], {
          toValue: 1,
          tension: 300,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      if (route.name === 'Chapters') {
        navigation.navigate({
          name: route.name,
          params: { subject: undefined },
          merge: true,
        });
      } else {
        navigation.navigate(route.name);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = tabs.find((t) => t.name === route.name) || tabs[0];

          const onPress = () => handleTabPress(route, isFocused, index);
          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {isFocused ? (
                <Animated.View
                  style={[
                    styles.activeTabContainer,
                    {
                      transform: [{ scale: iconAnimations[index] }],
                    },
                  ]}
                >
                  <View style={styles.activeIndicator} />
                  <Ionicons name={tab.icon} size={26} color={colors.primary} />
                </Animated.View>
              ) : (
                <Animated.View
                  style={{
                    transform: [{ scale: iconAnimations[index] }],
                  }}
                >
                  <Ionicons
                    name={`${tab.icon}-outline` as any}
                    size={24}
                    color={colors.authTextMuted}
                  />
                </Animated.View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
    backgroundColor: colors.authSurface,
    borderTopWidth: 1,
    borderTopColor: colors.authBorder,
    overflow: 'hidden',
    ...shadow.lg,
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: spacing.xs,
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
    borderRadius: radius.md,
  },
  activeTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 36,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
